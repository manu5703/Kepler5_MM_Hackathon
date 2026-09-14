import { useEffect, useRef, useState } from "react";
import { useCopilotAction, useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { TRACE_STEPPER_PARAMS, PREDICT_THEN_REVEAL_PARAMS, STEP_VISUALIZER_PARAMS } from "./actionParams";
import { GEN_UI_SYSTEM_MESSAGE } from "./instructions";
import { clientValidate } from "./clientValidate";
import TraceStepper from "./TraceStepper";
import PredictThenReveal from "./PredictThenReveal";
import StepVisualizer from "./StepVisualizer";
import "./genui.css";

function normalize(text) {
  return String(text || "").toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordOverlap(a, b) {
  const setA = new Set(a.split(" ").filter((w) => w.length > 2));
  const setB = new Set(b.split(" ").filter((w) => w.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return intersection / setA.size;
}

const PRIMITIVE_DESCRIPTIONS = {
  render_trace_stepper:
    "Renders a step-by-step execution trace with variable state and call stack, for concepts involving sequential execution, recursion, or pointer/index movement.",
  render_predict_then_reveal:
    "Presents a scenario, has the student predict an outcome before revealing the actual result, for testing conceptual understanding vs. rote completion.",
  render_step_visualizer:
    "Renders an animated sequence of discrete state changes to a set of visual elements (numbers, array cells, blocks), for concepts involving stepwise transformation.",
};

/**
 * Wires one Claude tool call to one of the three primitive React components,
 * via CopilotKit (per the user's choice in this session — see build notes).
 *
 * `trigger` is { conceptId, triggerType: "wrong_answer" | "explain_differently", studentAnswer }
 * or null/undefined when nothing has fired yet.
 *
 * Uses each action's `handler` (not `render`) to capture the call — there is
 * no <CopilotChat> surface mounted in the portal, so `render` output has
 * nowhere to display; `handler` runs regardless and lets this component own
 * placement, matching where the spec's placeholder text used to sit.
 */
export default function GenSlot({ trigger, onGrounded }) {
  const [status, setStatus] = useState(trigger ? "loading" : "idle");
  const [result, setResult] = useState(null);
  const firedKeyRef = useRef(null);
  const chunksRef = useRef([]);

  function handleResult(toolName, args) {
    setResult({ toolName, args });
    setStatus("done");

    // Demo moment from PROTOTYPE_PLAN.md §1: if the citation actually
    // grounds in a prerequisite concept's chunk (not the concept currently
    // being taught), surface that so the graph can pulse the real gap. This
    // is a citation match against the same chunks the model was given, not
    // a separate diagnosis call — see build notes for why the portal path
    // (Option A via CopilotKit) doesn't run a distinct diagnosis stage.
    if (onGrounded && trigger) {
      const citation = normalize(args.source_citation);
      let best = null;
      for (const chunk of chunksRef.current) {
        const overlap = wordOverlap(citation, normalize(chunk.text));
        if (!best || overlap > best.overlap) best = { conceptId: chunk.conceptId, overlap };
      }
      if (best && best.overlap > 0.3 && best.conceptId !== trigger.conceptId) {
        onGrounded(best.conceptId);
      }
    }

    return `Rendered ${toolName} for the student.`;
  }

  useCopilotAction({
    name: "render_trace_stepper",
    description: PRIMITIVE_DESCRIPTIONS.render_trace_stepper,
    parameters: TRACE_STEPPER_PARAMS,
    handler: (args) => handleResult("render_trace_stepper", args),
  });
  useCopilotAction({
    name: "render_predict_then_reveal",
    description: PRIMITIVE_DESCRIPTIONS.render_predict_then_reveal,
    parameters: PREDICT_THEN_REVEAL_PARAMS,
    handler: (args) => handleResult("render_predict_then_reveal", args),
  });
  useCopilotAction({
    name: "render_step_visualizer",
    description: PRIMITIVE_DESCRIPTIONS.render_step_visualizer,
    parameters: STEP_VISUALIZER_PARAMS,
    handler: (args) => handleResult("render_step_visualizer", args),
  });

  const { appendMessage, isLoading } = useCopilotChat({
    makeSystemMessage: () => GEN_UI_SYSTEM_MESSAGE,
  });

  useEffect(() => {
    if (!trigger) {
      setStatus("idle");
      setResult(null);
      return;
    }
    const key = JSON.stringify(trigger);
    if (firedKeyRef.current === key) return;
    firedKeyRef.current = key;
    setStatus("loading");
    setResult(null);

    (async () => {
      try {
        const res = await fetch(`/api/corpus/${trigger.conceptId}`);
        const chunks = await res.json();
        chunksRef.current = chunks;
        const chunkBlock = chunks.map((c) => `[chunk id="${c.id}"]\n${c.text}`).join("\n\n");
        const triggerLine =
          trigger.triggerType === "explain_differently"
            ? `The student tapped "explain this differently" on the ${trigger.conceptId} material. No specific wrong answer was given.`
            : `The student's wrong answer: "${trigger.studentAnswer}"`;
        const content = `Concept: ${trigger.conceptId}\n${triggerLine}\n\nSource material:\n${chunkBlock}`;
        await appendMessage(new TextMessage({ content, role: Role.User }));
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger && JSON.stringify(trigger)]);

  useEffect(() => {
    if (status === "loading" && !isLoading && !result && firedKeyRef.current) {
      // Completion finished with no action call — Claude declined per spec
      // rule 5 (insufficient grounding), or something else went wrong.
      setStatus("no-tool-call");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (!trigger) return null;

  if (status === "loading") {
    return (
      <div className="gen-loading">
        <span className="gen-spinner" />
        Generating a check for this concept…
      </div>
    );
  }

  if (status === "error" || status === "no-tool-call") {
    return (
      <div className="gen-fallback">
        {status === "error"
          ? "Could not reach the generator. Showing no generated check for now."
          : "The model didn't have enough grounding material to generate a confident check here (spec rule 5) — showing no generated check for now."}
      </div>
    );
  }

  if (status === "done" && result) {
    const validation = clientValidate(result.toolName, result.args);
    if (!validation.ok) {
      return (
        <div className="gen-fallback">
          Generated output failed validation ({validation.errors.join("; ")}) — not rendering it.
        </div>
      );
    }
    if (result.toolName === "render_trace_stepper") return <TraceStepper {...result.args} />;
    if (result.toolName === "render_predict_then_reveal") return <PredictThenReveal {...result.args} />;
    if (result.toolName === "render_step_visualizer") return <StepVisualizer {...result.args} />;
  }

  return null;
}
