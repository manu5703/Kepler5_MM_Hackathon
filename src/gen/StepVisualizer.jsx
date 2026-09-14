import { useState } from "react";

export default function StepVisualizer({
  title,
  element_type,
  initial_state = [],
  steps = [],
  misconception_label,
  source_citation,
}) {
  const [i, setI] = useState(0);
  const step = steps[i] || { state: initial_state, highlight_indices: [] };

  return (
    <div className="gen-card">
      <span className="gen-badge">Step visualizer · {element_type}</span>
      <h4>{title}</h4>
      <div className="gen-cells">
        {(step.state || []).map((val, idx) => (
          <div key={idx} className={`gen-cell${(step.highlight_indices || []).includes(idx) ? " hl" : ""}`}>
            {val}
          </div>
        ))}
      </div>
      <div className="gen-annotation">{step.annotation}</div>
      <div className="gen-step-nav">
        <button disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>← Prev</button>
        <span>Step {i + 1} of {steps.length}</span>
        <button disabled={i === steps.length - 1} onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}>Next →</button>
      </div>
      <div className="gen-citation">
        {misconception_label} · grounded in: “{source_citation}”
      </div>
    </div>
  );
}
