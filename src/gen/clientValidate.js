// A light client-side subset of server/validate.js's semantic rules
// (PROTOTYPE_PLAN.md §4) — just enough to keep the portal from rendering
// something that would crash or visibly break, without shipping ajv + the
// full grounding scorer into the browser bundle. The Lab/matrix path runs
// the full server-side validator; this exists only to protect the demo.
export function clientValidate(toolName, args) {
  const errors = [];
  const steps = args.steps || [];

  if (toolName === "render_trace_stepper") {
    if (!(args.pause_at_step >= 0 && args.pause_at_step < steps.length)) {
      errors.push(`pause_at_step out of range`);
    }
    if (steps.length < 3) errors.push("trace has fewer than 3 steps");
  }
  if (toolName === "render_predict_then_reveal") {
    const opts = args.options || [];
    if (!(args.correct_option_index >= 0 && args.correct_option_index < opts.length)) {
      errors.push("correct_option_index out of range");
    }
    if (opts.length < 2) errors.push("fewer than 2 options");
  }
  if (toolName === "render_step_visualizer") {
    if (steps.length < 2) errors.push("fewer than 2 steps");
    const initialLen = (args.initial_state || []).length;
    steps.forEach((s, i) => {
      if ((s.state || []).length !== initialLen) errors.push(`steps[${i}].state length mismatch`);
    });
  }
  if (!args.source_citation || !args.source_citation.trim()) errors.push("source_citation is empty");

  return { ok: errors.length === 0, errors };
}
