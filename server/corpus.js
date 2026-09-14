// The fake knowledge base (PROTOTYPE_PLAN.md §1: "stands in for course
// ingestion / Bedrock KB with zero extra work"). Each chunk is keyed by the
// concept id it grounds. Text is intentionally short and slide/snippet-like,
// mirroring what the spec's test table describes as source material.

export const CORPUS = [
  {
    id: "cs201-recursion-01",
    conceptId: "recursion",
    text:
      "A recursive function is defined by a base case and a recursive case. " +
      "For factorial: factorial(0) = 1 (base case), and factorial(n) = n * " +
      "factorial(n - 1) for n > 0 (recursive case). The base case is not an " +
      "edge case to handle separately — it is the value the whole recursion " +
      "is built to bottom out at.",
  },
  {
    id: "cs201-recursion-02",
    conceptId: "recursion",
    text:
      "Tracing a recursive call: each call pushes a new frame onto the call " +
      "stack with its own copy of the parameters. The stack only starts " +
      "unwinding — returning values back up — once a call hits the base case " +
      "and returns without making another recursive call.",
  },
  {
    id: "cs201-arrays-01",
    conceptId: "arrays",
    text:
      "An array of length n has valid indices 0 through n - 1. The loop " +
      "condition `i < len(arr)` visits every valid index exactly once. Using " +
      "`i <= len(arr)` reads one past the last element, which is out of " +
      "bounds and raises an IndexError (Python) or reads garbage / undefined " +
      "memory in languages without bounds checking.",
  },
  {
    id: "cs201-stacks-01",
    conceptId: "stacks",
    text:
      "A stack is LIFO — last in, first out. push() adds to the top; pop() " +
      "removes from the top. A queue is FIFO — first in, first out. " +
      "enqueue() adds to the back; dequeue() removes from the front. Using a " +
      "stack where FIFO order is required (e.g. BFS) produces the wrong " +
      "traversal order.",
  },
  {
    id: "cs201-bst-01",
    conceptId: "bst",
    text:
      "Binary search maintains two pointers, low and high, bounding the " +
      "region that could still contain the target. Each step checks the " +
      "midpoint and narrows low or high accordingly. The loop invariant is: " +
      "if the target exists, it is within [low, high]. The search terminates " +
      "the moment low > high — at that point the region is empty and the " +
      "target is not present. Continuing past low > high does not find " +
      "anything new because there is nothing left to check.",
  },
  {
    id: "cs201-sorting-01",
    conceptId: "sorting",
    text:
      "Quicksort's partition step picks a pivot, then rearranges the subarray " +
      "so every element less than the pivot ends up to its left and every " +
      "element greater ends up to its right. Elements are moved by swapping, " +
      "not by copying into a new array — after partitioning, the pivot sits " +
      "at its final sorted position, but everything else is only partially " +
      "ordered until their own sub-partitions are sorted.",
  },
  // Off-graph control chunk for the lab-only carrying scenario (plan §3.4) —
  // CS 201 has no arithmetic node, so this concept id never appears on the
  // portal graph and only the Lab can trigger it.
  {
    id: "arith-carrying-01",
    conceptId: "arithmetic",
    text:
      "Column addition adds digits place by place, starting from the ones " +
      "place. When a column's sum is 10 or more, write down only the ones " +
      "digit of that sum and carry the tens digit into the next column to " +
      "the left, adding it into that column's sum. A column sum is never " +
      "written down uncarried once it reaches double digits.",
  },
];

export function chunksFor(conceptId) {
  return CORPUS.filter((c) => c.conceptId === conceptId);
}
