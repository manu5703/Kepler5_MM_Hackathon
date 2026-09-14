// Pre-recorded tool calls, served when MOCK=1 (no API key required). Two
// jobs (PROTOTYPE_PLAN.md §2 "Mock mode"): the portal stays demoable with no
// network, and this doubles as spec §7's "fall back to a static pre-written
// example" for validation failures.

export const MOCK_DIAGNOSES = {
  1: {
    concept_id: "recursion",
    misconception_label: "base-case-returns-one",
    key_point_to_teach: "factorial(0) must return 1, not 0 — 1 is the multiplicative identity, so the base case has to be a value that leaves the running product unchanged.",
    likely_prereq_gap: null,
    confidence: 0.9,
  },
  2: {
    concept_id: "arrays",
    misconception_label: "off-by-one-loop-bound",
    key_point_to_teach: "Valid indices run from 0 to len(arr) - 1, so the loop condition must be i < len(arr), not i <= len(arr).",
    likely_prereq_gap: null,
    confidence: 0.92,
  },
  3: {
    concept_id: "arithmetic",
    misconception_label: "dropped-carry-digit",
    key_point_to_teach: "When a column's sum reaches 10 or more, only the ones digit is written down for that column — the tens digit must be carried into the next column's sum.",
    likely_prereq_gap: null,
    confidence: 0.88,
  },
  4: {
    concept_id: "bst",
    misconception_label: "search-continues-past-empty-range",
    key_point_to_teach: "Binary search's invariant is that the target, if present, lies within [low, high]. Once low > high that range is empty, so the search must stop — there's nothing left to check.",
    likely_prereq_gap: null,
    confidence: 0.85,
  },
  5: {
    concept_id: "stacks",
    misconception_label: "expects-fifo-from-lifo-structure",
    key_point_to_teach: "A stack is LIFO: pop() returns the most recently pushed item, not the first one — that ordering is what a queue provides instead.",
    likely_prereq_gap: null,
    confidence: 0.8,
  },
  6: {
    concept_id: "bst",
    misconception_label: "no-error-signal-slide-only",
    key_point_to_teach: "Binary search terminates the instant low > high, because the invariant guarantees nothing outside [low, high] can hold the target.",
    likely_prereq_gap: null,
    confidence: 0.55,
  },
  7: {
    concept_id: "sorting",
    misconception_label: "conflates-partitioned-with-fully-sorted",
    key_point_to_teach: "After one partition step around a pivot, only that pivot is in its final position — everything else is merely on the correct side, not sorted yet.",
    likely_prereq_gap: null,
    confidence: 0.87,
  },
};

export const MOCK_GENERATIONS = {
  1: {
    toolName: "render_trace_stepper",
    input: {
      title: "Tracing factorial(3)",
      code_snippet: "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)",
      language: "python",
      steps: [
        { line_number: 1, variables: { n: "3" }, call_stack: ["factorial(3)"], annotation: "factorial(3) is called; n is 3, not the base case." },
        { line_number: 4, variables: { n: "3" }, call_stack: ["factorial(3)", "factorial(2)"], annotation: "factorial(3) calls factorial(2) before it can return anything." },
        { line_number: 4, variables: { n: "2" }, call_stack: ["factorial(3)", "factorial(2)", "factorial(1)"], annotation: "factorial(2) calls factorial(1)." },
        { line_number: 2, variables: { n: "1" }, call_stack: ["factorial(3)", "factorial(2)", "factorial(1)", "factorial(0)"], annotation: "factorial(1) calls factorial(0), reaching the base case check." },
        { line_number: 3, variables: { n: "0" }, call_stack: ["factorial(3)", "factorial(2)", "factorial(1)", "factorial(0)"], annotation: "n == 0 is true, so factorial(0) returns 1 — not 0." },
      ],
      pause_at_step: 4,
      misconception_label: "base-case-returns-one",
      source_citation: "factorial(0) = 1 (base case), and factorial(n) = n * factorial(n - 1) for n > 0",
    },
  },
  2: {
    toolName: "render_trace_stepper",
    input: {
      title: "Tracing an off-by-one loop bound",
      code_snippet: "arr = [10, 20, 30]\nfor i in range(0, len(arr) + 1):\n    if arr[i] == target:\n        return i",
      language: "python",
      steps: [
        { line_number: 2, variables: { i: "0", "len(arr)": "3" }, call_stack: [], annotation: "i starts at 0, a valid index." },
        { line_number: 2, variables: { i: "1", "len(arr)": "3" }, call_stack: [], annotation: "i is 1, still valid." },
        { line_number: 2, variables: { i: "2", "len(arr)": "3" }, call_stack: [], annotation: "i is 2, the last valid index (len(arr) - 1)." },
        { line_number: 2, variables: { i: "3", "len(arr)": "3" }, call_stack: [], annotation: "The range(0, len(arr) + 1) bound lets i reach 3, which is out of bounds." },
        { line_number: 3, variables: { i: "3", "len(arr)": "3" }, call_stack: [], annotation: "arr[3] raises IndexError — index 3 does not exist in a length-3 array." },
      ],
      pause_at_step: 3,
      misconception_label: "off-by-one-loop-bound",
      source_citation: "Using `i <= len(arr)` reads one past the last element, which is out of bounds and raises an IndexError",
    },
  },
  3: {
    toolName: "render_step_visualizer",
    input: {
      title: "47 + 38 with carrying",
      element_type: "number_digits",
      // Fixed width throughout (8 cells: digits + "=" + two result slots) —
      // result slots start as placeholders and fill in, rather than the
      // array growing, to satisfy the step-visualizer width-consistency
      // rule in server/validate.js (a real bug this check caught in an
      // earlier draft of this mock).
      initial_state: ["4", "7", "+", "3", "8", "=", "_", "_"],
      steps: [
        { state: ["4", "7", "+", "3", "8", "=", "_", "_"], highlight_indices: [1, 4], annotation: "Start with the ones column: 7 + 8." },
        { state: ["4", "7", "+", "3", "8", "=", "_", "5"], highlight_indices: [7], annotation: "7 + 8 = 15. Write down the 5, carry the 1." },
        { state: ["4", "7", "+", "3", "8", "=", "_", "5"], highlight_indices: [0, 3], annotation: "Move to the tens column: 4 + 3, plus the carried 1." },
        { state: ["4", "7", "+", "3", "8", "=", "8", "5"], highlight_indices: [6], annotation: "4 + 3 + 1 (carry) = 8. Final answer: 85, not 75 — the carry from the ones column was dropped in the wrong answer." },
      ],
      misconception_label: "dropped-carry-digit",
      source_citation: "When a column's sum is 10 or more, write down only the ones digit of that sum and carry the tens digit into the next column",
    },
  },
  4: {
    toolName: "render_predict_then_reveal",
    input: {
      title: "Does binary search keep going past low > high?",
      prompt: "Searching for 42 in a sorted array, low and high have just crossed: low = 5, high = 4. What does the search do next?",
      code_or_context: "while low <= high:\n    mid = (low + high) // 2\n    ...",
      options: [
        "Stop — the target isn't in the array",
        "Check index -1 in case it wrapped around",
        "Keep narrowing by averaging low and high again",
        "Restart the search from the full array",
      ],
      correct_option_index: 0,
      reveal_explanation: "The loop invariant is that if the target exists, it's within [low, high]. Once low > high, that range is empty — there's nothing left to check, wrapping to -1 or restarting would only re-examine indices already ruled out.",
      misconception_label: "search-continues-past-empty-range",
      source_citation: "The search terminates the moment low > high — at that point the region is empty and the target is not present.",
    },
  },
  5: {
    toolName: "render_trace_stepper",
    input: {
      title: "Tracing push(1), push(2), push(3), pop()",
      code_snippet: "stack = []\nstack.push(1)\nstack.push(2)\nstack.push(3)\nstack.pop()",
      language: "javascript",
      steps: [
        { line_number: 2, variables: { stack: "[1]" }, call_stack: [], annotation: "1 is pushed onto the stack." },
        { line_number: 3, variables: { stack: "[1, 2]" }, call_stack: [], annotation: "2 is pushed on top of 1." },
        { line_number: 4, variables: { stack: "[1, 2, 3]" }, call_stack: [], annotation: "3 is pushed on top — it is now the top of the stack." },
        { line_number: 5, variables: { stack: "[1, 2]" }, call_stack: [], annotation: "pop() removes and returns 3 — the most recently pushed item, not 1." },
      ],
      pause_at_step: 3,
      misconception_label: "expects-fifo-from-lifo-structure",
      source_citation: "A stack is LIFO — last in, first out. push() adds to the top; pop() removes from the top.",
    },
  },
  6: {
    toolName: "render_predict_then_reveal",
    input: {
      title: "Binary search: what happens when low crosses high?",
      prompt: "Same binary search you just saw — before the reveal, predict: once low > high in the loop condition, what should the code do?",
      code_or_context: "while low <= high:\n    mid = (low + high) // 2\n    ...",
      options: [
        "Exit the loop — the target isn't present",
        "Keep looping with mid clamped to a valid index",
        "Swap low and high and try once more",
      ],
      correct_option_index: 0,
      reveal_explanation: "low > high means the search region [low, high] is empty, so the invariant (the target is within that region, if present) tells us the target can't be found — the loop condition low <= high exists exactly to stop here.",
      misconception_label: "no-error-signal-slide-only",
      source_citation: "The search terminates the moment low > high — at that point the region is empty and the target is not present.",
    },
  },
  7: {
    toolName: "render_step_visualizer",
    input: {
      title: "Partitioning [3, 7, 5, 1, 9] around pivot 5",
      element_type: "array_cells",
      initial_state: ["3", "7", "5", "1", "9"],
      steps: [
        { state: ["3", "7", "5", "1", "9"], highlight_indices: [2], annotation: "Pivot chosen: 5, at index 2." },
        { state: ["3", "1", "5", "7", "9"], highlight_indices: [1, 3], annotation: "1 (less than 5) is swapped toward the left; 7 (greater than 5) moves toward the right." },
        { state: ["3", "1", "5", "7", "9"], highlight_indices: [2], annotation: "Partition done: everything left of index 2 is < 5, everything right is > 5. Only the pivot (5) is in its final sorted position." },
      ],
      misconception_label: "conflates-partitioned-with-fully-sorted",
      source_citation: "after partitioning, the pivot sits at its final sorted position, but everything else is only partially ordered until their own sub-partitions are sorted",
    },
  },
};
