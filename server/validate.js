import Ajv from "ajv";
import { PRIMITIVE_TOOLS } from "./tools.js";

const ajv = new Ajv({ allErrors: true, strict: false });
const validators = Object.fromEntries(
  PRIMITIVE_TOOLS.map((t) => [t.name, ajv.compile(t.input_schema)])
);

const LIMITS = {
  title: 120,
  annotation: 300,
  code_snippet: 2000,
  steps: 20,
  payloadBytes: 20 * 1024,
};

function countLines(code) {
  return String(code || "").split("\n").length;
}

// ---- semantic rules (PROTOTYPE_PLAN.md §4, numbered to match) ----

function semanticErrors(toolName, input) {
  const errors = [];
  const steps = input.steps || [];

  // 1. index bounds
  if (toolName === "render_trace_stepper") {
    if (!(input.pause_at_step >= 0 && input.pause_at_step < steps.length)) {
      errors.push(`pause_at_step (${input.pause_at_step}) is out of range [0, ${steps.length})`);
    }
  }
  if (toolName === "render_predict_then_reveal") {
    const opts = input.options || [];
    if (!(input.correct_option_index >= 0 && input.correct_option_index < opts.length)) {
      errors.push(`correct_option_index (${input.correct_option_index}) is out of range [0, ${opts.length})`);
    }
  }

  // 2. minimum step count — trace stepper needs >= 3, others >= 2
  const minSteps = toolName === "render_trace_stepper" ? 3 : 2;
  if (toolName !== "render_predict_then_reveal" && steps.length < minSteps) {
    errors.push(`steps has ${steps.length} entries, need at least ${minSteps} for a real ${toolName === "render_trace_stepper" ? "trace" : "sequence"}`);
  }

  // 3. source_citation non-empty (grounding itself is scored separately)
  if (!input.source_citation || !input.source_citation.trim()) {
    errors.push("source_citation is empty");
  }

  // 4. length caps
  if (input.title && input.title.length > LIMITS.title) errors.push(`title exceeds ${LIMITS.title} chars`);
  if (input.code_snippet && input.code_snippet.length > LIMITS.code_snippet)
    errors.push(`code_snippet exceeds ${LIMITS.code_snippet} chars`);
  if (steps.length > LIMITS.steps) errors.push(`steps has ${steps.length} entries, cap is ${LIMITS.steps}`);
  for (const s of steps) {
    if (s.annotation && s.annotation.length > LIMITS.annotation)
      errors.push(`a step annotation exceeds ${LIMITS.annotation} chars`);
  }
  const payloadSize = Buffer.byteLength(JSON.stringify(input), "utf8");
  if (payloadSize > LIMITS.payloadBytes) errors.push(`payload is ${payloadSize} bytes, cap is ${LIMITS.payloadBytes}`);

  // 5. step visualizer width consistency
  if (toolName === "render_step_visualizer") {
    const initialLen = (input.initial_state || []).length;
    steps.forEach((s, i) => {
      const state = s.state || [];
      if (state.length !== initialLen) {
        errors.push(`steps[${i}].state has ${state.length} entries, expected ${initialLen} to match initial_state`);
      }
      for (const idx of s.highlight_indices || []) {
        if (idx < 0 || idx >= state.length) {
          errors.push(`steps[${i}].highlight_indices contains out-of-range index ${idx}`);
        }
      }
    });
  }

  // 6. trace stepper line numbers in range
  if (toolName === "render_trace_stepper") {
    const lineCount = countLines(input.code_snippet);
    steps.forEach((s, i) => {
      if (s.line_number < 1 || s.line_number > lineCount) {
        errors.push(`steps[${i}].line_number (${s.line_number}) is outside code_snippet's ${lineCount} lines`);
      }
    });
  }

  // 7. misconception_label quality — not just the concept name, short, kebab-ish
  const label = (input.misconception_label || "").trim();
  if (label) {
    const tokenCount = label.split(/[\s_-]+/).filter(Boolean).length;
    if (tokenCount > 5) errors.push(`misconception_label has ${tokenCount} tokens, expected <= 5`);
    if (/^[a-z]+$/i.test(label) && tokenCount <= 1) {
      errors.push(`misconception_label ("${label}") looks like a bare concept name, not a specific misconception`);
    }
  }

  // 8. predict-then-reveal distractor quality
  if (toolName === "render_predict_then_reveal") {
    const opts = (input.options || []).map((o) => o.trim().toLowerCase());
    const uniqueOpts = new Set(opts);
    if (uniqueOpts.size !== opts.length) errors.push("options contains duplicate or near-duplicate entries");
  }

  // 9. call stack monotonicity (trace stepper) — depth changes by at most 1
  if (toolName === "render_trace_stepper") {
    for (let i = 1; i < steps.length; i++) {
      const prevDepth = (steps[i - 1].call_stack || []).length;
      const curDepth = (steps[i].call_stack || []).length;
      if (Math.abs(curDepth - prevDepth) > 1) {
        errors.push(`call_stack depth jumps from ${prevDepth} to ${curDepth} between steps[${i - 1}] and steps[${i}]`);
      }
    }
  }

  return errors;
}

// ---- grounding check (PROTOTYPE_PLAN.md §4, deterministic, no second model call) ----

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "of", "to", "and", "or", "in", "on", "at",
  "for", "with", "as", "by", "this", "that", "it", "be", "was", "were",
]);

function contentWords(text) {
  return new Set(normalize(text).split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

function longestCommonSubstringLength(a, b) {
  if (!a || !b) return 0;
  // Simple O(n*m) DP — inputs here are short (citations + chunk text), fine for a prototype.
  const dp = new Array(b.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : 0;
      if (dp[j] > best) best = dp[j];
      prev = temp;
    }
  }
  return best;
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function scoreGrounding(sourceCitation, chunks) {
  const citationNorm = normalize(sourceCitation);
  const citationWords = contentWords(sourceCitation);
  let best = { chunkId: null, lcs: 0, jaccard: 0 };

  for (const chunk of chunks) {
    const chunkNorm = normalize(chunk.text);
    const lcs = longestCommonSubstringLength(citationNorm, chunkNorm);
    const jac = jaccard(citationWords, contentWords(chunk.text));
    // Rank chunks by whichever signal is stronger for that chunk.
    const score = Math.max(lcs / 40, jac / 0.5);
    const bestScore = Math.max(best.lcs / 40, best.jaccard / 0.5);
    if (score > bestScore) best = { chunkId: chunk.id, lcs, jaccard: jac };
  }

  let verdict = "unsupported";
  if (best.lcs >= 40) verdict = "exact";
  else if (best.jaccard >= 0.5) verdict = "paraphrase";

  return {
    verdict,
    best_chunk_id: best.chunkId,
    overlap_score: Number(Math.max(best.lcs / 40, best.jaccard / 0.5).toFixed(3)),
  };
}

// ---- top-level entry point ----

export function validate(toolName, input, { chunks = [] } = {}) {
  const structuralValidator = validators[toolName];
  if (!structuralValidator) {
    return { ok: false, errors: [`unknown tool "${toolName}"`], grounding: null };
  }

  const structurallyValid = structuralValidator(input);
  const structuralErrors = structurallyValid
    ? []
    : structuralValidator.errors.map((e) => `${e.instancePath || "(root)"} ${e.message}`);

  const semantic = semanticErrors(toolName, input);
  const grounding = input.source_citation ? scoreGrounding(input.source_citation, chunks) : null;
  const groundingErrors = grounding && grounding.verdict === "unsupported" ? ["source_citation does not match any served chunk (unsupported)"] : [];

  const errors = [...structuralErrors, ...semantic, ...groundingErrors];
  return { ok: errors.length === 0, errors, grounding };
}
