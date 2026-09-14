// The three interaction primitives from the Medusa gen-UI spec (§3), as
// Anthropic Messages API tool definitions. Kept as plain JSON so the exact
// same object can be:
//   - passed to `tools` in a direct Anthropic call (server/anthropic.js)
//   - hand-translated to CopilotKit's Parameter[] shape for the portal
//     (src/portal/actionParams.js) — see PROTOTYPE_PLAN.md §2 for why the
//     portal and the measurement path use two different call surfaces.

export const RENDER_TRACE_STEPPER = {
  name: "render_trace_stepper",
  description:
    "Renders a step-by-step execution trace with variable state and call stack, for concepts involving sequential execution, recursion, or pointer/index movement.",
  input_schema: {
    type: "object",
    required: [
      "title",
      "code_snippet",
      "steps",
      "pause_at_step",
      "misconception_label",
      "source_citation",
    ],
    properties: {
      title: {
        type: "string",
        description: "Short label for this trace, e.g. 'Recursive factorial(4)'",
      },
      code_snippet: {
        type: "string",
        description: "The exact code being traced, monospace-ready",
      },
      language: {
        type: "string",
        enum: ["python", "javascript", "java", "c", "cpp"],
      },
      steps: {
        type: "array",
        description: "Ordered list of execution states",
        items: {
          type: "object",
          required: ["line_number", "variables", "call_stack", "annotation"],
          properties: {
            line_number: { type: "integer" },
            variables: {
              type: "object",
              description: "Variable name to current value, as strings",
              additionalProperties: { type: "string" },
            },
            call_stack: {
              type: "array",
              items: { type: "string" },
              description: "Current call stack, innermost last",
            },
            annotation: {
              type: "string",
              description: "One sentence explaining what just happened at this step",
            },
          },
        },
      },
      pause_at_step: {
        type: "integer",
        description:
          "Index into steps[] where the trace should pause and prompt the student, typically the step where their misconception occurs",
      },
      misconception_label: {
        type: "string",
        description: "Short internal tag for what's being corrected, e.g. 'off-by-one-in-base-case'",
      },
      source_citation: {
        type: "string",
        description: "Exact snippet or slide/section reference from the grounding material this was derived from",
      },
    },
  },
};

export const RENDER_PREDICT_THEN_REVEAL = {
  name: "render_predict_then_reveal",
  description:
    "Presents a scenario, has the student predict an outcome before revealing the actual result, for testing conceptual understanding vs. rote completion.",
  input_schema: {
    type: "object",
    required: [
      "title",
      "prompt",
      "options",
      "correct_option_index",
      "reveal_explanation",
      "misconception_label",
      "source_citation",
    ],
    properties: {
      title: { type: "string" },
      prompt: { type: "string", description: "The scenario/question shown before options" },
      code_or_context: {
        type: "string",
        description: "Optional code snippet or diagram description supporting the prompt",
      },
      options: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 5,
      },
      correct_option_index: { type: "integer" },
      reveal_explanation: {
        type: "string",
        description:
          "What's shown after the student commits — should explain WHY, referencing the specific wrong option if it matches a common misconception",
      },
      misconception_label: { type: "string" },
      source_citation: { type: "string" },
    },
  },
};

export const RENDER_STEP_VISUALIZER = {
  name: "render_step_visualizer",
  description:
    "Renders an animated sequence of discrete state changes to a set of visual elements (numbers, array cells, blocks), for concepts involving stepwise transformation.",
  input_schema: {
    type: "object",
    required: ["title", "element_type", "initial_state", "steps", "misconception_label", "source_citation"],
    properties: {
      title: { type: "string" },
      element_type: {
        type: "string",
        enum: ["number_digits", "array_cells", "stack_blocks", "linked_nodes"],
        description: "What kind of visual element is being animated",
      },
      initial_state: {
        type: "array",
        items: { type: "string" },
        description: "Starting values, e.g. digits of a number, or array contents",
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          required: ["state", "highlight_indices", "annotation"],
          properties: {
            state: {
              type: "array",
              items: { type: "string" },
              description: "Full state at this step",
            },
            highlight_indices: {
              type: "array",
              items: { type: "integer" },
              description: "Which positions to visually emphasize this step",
            },
            annotation: { type: "string" },
          },
        },
      },
      misconception_label: { type: "string" },
      source_citation: { type: "string" },
    },
  },
};

export const PRIMITIVE_TOOLS = [RENDER_TRACE_STEPPER, RENDER_PREDICT_THEN_REVEAL, RENDER_STEP_VISUALIZER];

// The diagnosis step (Option B, call #1) returns this shape via
// output_config.format — a typed value, not an action, so it's structured
// output rather than a tool call. See PROTOTYPE_PLAN.md §2.
export const DIAGNOSIS_SCHEMA = {
  type: "object",
  required: ["concept_id", "misconception_label", "key_point_to_teach", "confidence"],
  properties: {
    concept_id: { type: "string" },
    misconception_label: {
      type: "string",
      description: "Short internal tag, not a restatement of the concept name",
    },
    key_point_to_teach: {
      type: "string",
      description: "The one thing the student needs to understand to close this gap",
    },
    likely_prereq_gap: {
      type: ["string", "null"],
      description:
        "If the real gap is upstream of concept_id (a prerequisite concept id from the graph), name it here so retrieval can ground there instead. Null if the gap is in concept_id itself.",
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
};

// Applies strict:true (schema-guaranteed valid arguments) to a tool list.
// Kept as a toggle, not the default — see PROTOTYPE_PLAN.md §3.2: running
// the matrix with strict:false is what measures the real validation-failure
// rate; strict is meant for the portal path once prompts are tuned.
export function withStrict(tools, strict) {
  if (!strict) return tools;
  return tools.map((t) => ({
    ...t,
    strict: true,
    input_schema: { ...t.input_schema, additionalProperties: false },
  }));
}
