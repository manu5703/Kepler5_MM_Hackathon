import { retrieve, retrieveForGap } from "./retrieve.js";
import { validate } from "./validate.js";
import { callDiagnose, callGenerate, callSingle } from "./anthropic.js";
import { logRun } from "./log.js";

// The full generate -> validate -> log loop (PROTOTYPE_PLAN.md §2), usable
// from both the single-shot /api/generate endpoint and the matrix runner.
//
// mode "A": one call (diagnoseModel doubles as the single-call model).
// mode "B": diagnoseModel diagnoses, generateModel fills the tool.
export async function runTrigger({
  scenario,
  mode = process.env.AGENT_MODE || "B",
  diagnoseModel = process.env.DIAGNOSE_MODEL || "claude-sonnet-5",
  generateModel = process.env.GENERATE_MODEL || "claude-haiku-4-5",
  strict = process.env.STRICT_TOOLS === "1",
  log = true,
}) {
  const { conceptId, triggerType, studentAnswer, id: scenarioId, expectedTool } = scenario;
  const initialChunks = retrieve(conceptId);

  let diagnosis = null;
  let diagnoseLatencyMs = 0;
  let diagnoseUsage = { input: 0, output: 0, cache_read: 0 };
  let generation;
  let ttftNote = "not measured (non-streaming request)";

  if (mode === "A") {
    generation = await callSingle({
      model: diagnoseModel,
      conceptId,
      triggerType,
      studentAnswer,
      chunks: initialChunks,
      strict,
    });
  } else {
    const diag = await callDiagnose({ model: diagnoseModel, conceptId, triggerType, studentAnswer, chunks: initialChunks });
    diagnosis = diag.diagnosis;
    diagnoseLatencyMs = diag.latencyMs;
    diagnoseUsage = diag.usage;

    const gapChunks = diagnosis?.likely_prereq_gap
      ? retrieveForGap(conceptId, diagnosis.likely_prereq_gap)
      : initialChunks;

    generation = await callGenerate({
      model: generateModel,
      conceptId,
      triggerType,
      studentAnswer,
      chunks: gapChunks,
      diagnosis,
      strict,
    });
  }

  const { toolUse, latencyMs: generateLatencyMs, usage: generateUsage, raw, mocked } = generation;

  let validation = { ok: false, errors: ["no tool call returned"], grounding: null };
  if (toolUse) {
    const chunksUsed = diagnosis?.likely_prereq_gap ? retrieveForGap(conceptId, diagnosis.likely_prereq_gap) : initialChunks;
    validation = validate(toolUse.toolName, toolUse.input, { chunks: chunksUsed });
  }

  const record = {
    scenario_id: scenarioId,
    mode,
    models: mode === "A" ? { single: diagnoseModel } : { diagnose: diagnoseModel, generate: generateModel },
    strict,
    latency_ms: {
      diagnose: diagnoseLatencyMs,
      generate: generateLatencyMs,
      ttft: null,
      total: diagnoseLatencyMs + generateLatencyMs,
    },
    usage: {
      input: diagnoseUsage.input + generateUsage.input,
      output: diagnoseUsage.output + generateUsage.output,
      cache_read: diagnoseUsage.cache_read + generateUsage.cache_read,
    },
    diagnosis,
    chosen_tool: toolUse?.toolName ?? null,
    expected_tool: expectedTool,
    choice_match: expectedTool ? toolUse?.toolName === expectedTool : null,
    validation: { ok: validation.ok, errors: validation.errors },
    grounding: validation.grounding,
    mocked: !!mocked,
    input: toolUse?.input ?? null,
  };

  if (log) logRun(record);

  return record;
}
