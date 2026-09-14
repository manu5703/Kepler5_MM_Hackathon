// The 7 hardcoded test scenarios — spec §5's 6, plus #7 added in
// PROTOTYPE_PLAN.md §3.4 as a second real on-graph step-visualizer case
// (scenario #3, carrying, is off-graph and kept as a lab-only control).
export const SCENARIOS = [
  {
    id: 1,
    conceptId: "recursion",
    title: "Recursive base case",
    triggerType: "wrong_answer",
    studentAnswer: "factorial(0) returns 0, not 1",
    expectedTool: "render_trace_stepper",
  },
  {
    id: 2,
    conceptId: "arrays",
    title: "Array index bounds",
    triggerType: "wrong_answer",
    studentAnswer:
      "My loop `for i in range(0, len(arr) + 1): if arr[i] == target: return i` keeps throwing an IndexError and I don't know why — I thought I needed to check every index up to and including len(arr).",
    expectedTool: "render_trace_stepper",
  },
  {
    id: 3,
    conceptId: "arithmetic",
    title: "Addition with carrying",
    triggerType: "wrong_answer",
    studentAnswer: "47 + 38 = 75 (I added 7+8=15, wrote 5, then just did 4+3=7, forgot the carry)",
    expectedTool: "render_step_visualizer",
    labOnly: true, // off-graph control, see PROTOTYPE_PLAN.md §3.4
  },
  {
    id: 4,
    conceptId: "bst",
    title: "Binary search termination",
    triggerType: "wrong_answer",
    studentAnswer:
      "I predicted the search keeps going and checks index -1 or wraps around after low crosses high, to make sure it didn't miss the target.",
    expectedTool: "render_predict_then_reveal",
  },
  {
    id: 5,
    conceptId: "stacks",
    title: "Stack vs queue ordering",
    triggerType: "wrong_answer",
    studentAnswer:
      "I pushed 1, 2, 3 onto the stack and expected pop() to return 1 first, like the first thing I added should come out first.",
    expectedTool: null, // deliberately ambiguous — see plan §6
    note: "Observe the choice, don't force it. Trace stepper or step visualizer are both defensible.",
  },
  {
    id: 6,
    conceptId: "bst",
    title: "Explain differently (no wrong answer)",
    triggerType: "explain_differently",
    studentAnswer: null,
    expectedTool: null, // weak-signal path — see plan §6
    note: "Mid-learning trigger, no error signal. Any primitive is defensible; judge the choice, don't force it.",
  },
  {
    id: 7,
    conceptId: "sorting",
    title: "Quicksort partition swaps",
    triggerType: "wrong_answer",
    studentAnswer:
      "I said after partitioning around pivot 5 in [3, 7, 5, 1, 9], the whole array [1, 3, 5, 7, 9] is fully sorted, not just correctly partitioned around the pivot.",
    expectedTool: "render_step_visualizer",
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === Number(id));
}
