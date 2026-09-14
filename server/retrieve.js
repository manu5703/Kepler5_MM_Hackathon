import { chunksFor } from "./corpus.js";
import { prereqsOf } from "./graph-edges.js";

// Fake retrieval: concept id + prereq walk -> chunks. Stands in for the real
// KB lookup — see PROTOTYPE_PLAN.md §1. Prereq chunks are included so the
// diagnosis step (or, in Option A, the single call) can name a prereq gap
// and still have grounding material for it in the same request.
export function retrieve(conceptId) {
  const own = chunksFor(conceptId);
  const prereqChunks = prereqsOf(conceptId).flatMap((p) => chunksFor(p));
  return [...own, ...prereqChunks];
}

// Second-pass retrieval once a diagnosis names a specific prereq gap —
// grounds the generation call in that concept's material instead of (or in
// addition to) the originally-triggered concept's.
export function retrieveForGap(conceptId, likelyPrereqGap) {
  if (!likelyPrereqGap || likelyPrereqGap === conceptId) return retrieve(conceptId);
  const gapChunks = chunksFor(likelyPrereqGap);
  if (gapChunks.length === 0) return retrieve(conceptId);
  return [...gapChunks, ...chunksFor(conceptId)];
}
