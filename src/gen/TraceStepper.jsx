import { useState } from "react";

// Deliberately plain — spec says visual polish isn't what's being tested
// (PROTOTYPE_PLAN.md §8). This renders whatever validated JSON it's given.
export default function TraceStepper({
  title,
  code_snippet,
  steps = [],
  pause_at_step,
  misconception_label,
  source_citation,
}) {
  const [i, setI] = useState(Math.min(pause_at_step ?? 0, Math.max(steps.length - 1, 0)));
  const step = steps[i];
  const codeLines = String(code_snippet || "").split("\n");

  return (
    <div className="gen-card">
      <span className="gen-badge">Trace stepper</span>
      <h4>{title}</h4>
      <div className="gen-code">
        {codeLines.map((line, idx) => (
          <span key={idx} className={step && step.line_number === idx + 1 ? "hl-line" : ""}>
            {line || " "}
            {"\n"}
          </span>
        ))}
      </div>
      {step && (
        <>
          <div className="gen-vars">
            {Object.entries(step.variables || {}).map(([k, v]) => (
              <span key={k} className="gen-var-chip">{k} = {v}</span>
            ))}
          </div>
          {step.call_stack?.length > 0 && (
            <div className="gen-stack">
              {step.call_stack.map((frame, idx) => (
                <div key={idx} className="gen-stack-frame">{frame}</div>
              ))}
            </div>
          )}
          <div className="gen-annotation">{step.annotation}</div>
        </>
      )}
      <div className="gen-step-nav">
        <button disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>← Prev</button>
        <span>Step {i + 1} of {steps.length}</span>
        <button disabled={i === steps.length - 1} onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}>Next →</button>
        {i === pause_at_step && <span className="gen-pause-flag">⏸ misconception occurs here</span>}
      </div>
      <div className="gen-citation">
        {misconception_label} · grounded in: “{source_citation}”
      </div>
    </div>
  );
}
