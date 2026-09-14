// Minimal copy of the concept-id + prereqs edges from src/portal/LearnGraph.jsx's
// CONCEPTS array. Duplicated (not imported) because the server is plain
// Node/Express and doesn't want a JSX parse step just for nine id/prereqs
// pairs — see PROTOTYPE_PLAN.md §1 "The integration insight worth building
// for" for why these edges matter (grounding in the real upstream gap).
export const GRAPH_EDGES = {
  arrays: [],
  linkedlists: ["arrays"],
  recursion: ["arrays"],
  stacks: ["linkedlists"],
  trees: ["recursion"],
  bst: ["stacks", "trees"],
  sorting: ["recursion", "trees"],
  graphs: ["trees", "stacks"],
  dp: ["recursion", "sorting"],
};

export function prereqsOf(conceptId) {
  return GRAPH_EDGES[conceptId] || [];
}
