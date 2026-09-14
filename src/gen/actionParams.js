// CopilotKit `useCopilotAction` parameter definitions for the three
// primitives, hand-translated from the JSON Schemas in server/tools.js.
// CopilotKit's Parameter format is flatter than JSON Schema (arrays are
// `type: "string[]"` etc, not `type: "array", items: {...}`) — verified
// against @copilotkit/shared's actual type declarations before writing this,
// see the build notes in this session for how (no auto JSON-Schema
// converter used, to keep the mapping reviewable).

export const TRACE_STEPPER_PARAMS = [
  { name: "title", type: "string", required: true, description: "Short label for this trace, e.g. 'Recursive factorial(4)'" },
  { name: "code_snippet", type: "string", required: true, description: "The exact code being traced, monospace-ready" },
  { name: "language", type: "string", required: false, enum: ["python", "javascript", "java", "c", "cpp"] },
  {
    name: "steps",
    type: "object[]",
    required: true,
    description: "Ordered list of execution states",
    attributes: [
      { name: "line_number", type: "number", required: true },
      { name: "variables", type: "object", required: true, description: "Variable name to current value, as strings" },
      { name: "call_stack", type: "string[]", required: true, description: "Current call stack, innermost last" },
      { name: "annotation", type: "string", required: true, description: "One sentence explaining what just happened at this step" },
    ],
  },
  { name: "pause_at_step", type: "number", required: true, description: "Index into steps[] where the trace should pause and prompt the student" },
  { name: "misconception_label", type: "string", required: true, description: "Short internal tag, e.g. 'off-by-one-in-base-case'" },
  { name: "source_citation", type: "string", required: true, description: "Exact snippet or slide/section reference this was derived from" },
];

export const PREDICT_THEN_REVEAL_PARAMS = [
  { name: "title", type: "string", required: true },
  { name: "prompt", type: "string", required: true, description: "The scenario/question shown before options" },
  { name: "code_or_context", type: "string", required: false },
  { name: "options", type: "string[]", required: true },
  { name: "correct_option_index", type: "number", required: true },
  { name: "reveal_explanation", type: "string", required: true, description: "Explain WHY, referencing the specific wrong option if it matches a common misconception" },
  { name: "misconception_label", type: "string", required: true },
  { name: "source_citation", type: "string", required: true },
];

export const STEP_VISUALIZER_PARAMS = [
  { name: "title", type: "string", required: true },
  { name: "element_type", type: "string", required: true, enum: ["number_digits", "array_cells", "stack_blocks", "linked_nodes"] },
  { name: "initial_state", type: "string[]", required: true, description: "Starting values, e.g. digits of a number, or array contents" },
  {
    name: "steps",
    type: "object[]",
    required: true,
    attributes: [
      { name: "state", type: "string[]", required: true, description: "Full state at this step" },
      { name: "highlight_indices", type: "number[]", required: true, description: "Which positions to visually emphasize this step" },
      { name: "annotation", type: "string", required: true },
    ],
  },
  { name: "misconception_label", type: "string", required: true },
  { name: "source_citation", type: "string", required: true },
];
