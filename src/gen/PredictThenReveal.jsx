import { useState } from "react";

export default function PredictThenReveal({
  title,
  prompt,
  code_or_context,
  options = [],
  correct_option_index,
  reveal_explanation,
  misconception_label,
  source_citation,
}) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="gen-card">
      <span className="gen-badge">Predict then reveal</span>
      <h4>{title}</h4>
      <p style={{ margin: "0 0 10px", color: "#333" }}>{prompt}</p>
      {code_or_context && <div className="gen-code">{code_or_context}</div>}
      <div className="gen-options">
        {options.map((opt, idx) => {
          let cls = "gen-option";
          if (revealed && idx === correct_option_index) cls += " correct";
          else if (revealed && idx === selected) cls += " incorrect";
          else if (!revealed && idx === selected) cls += " selected";
          return (
            <div key={idx} className={cls} onClick={() => !revealed && setSelected(idx)}>
              {opt}
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <button
          disabled={selected === null}
          onClick={() => setRevealed(true)}
          style={{ border: "none", background: "#1a1a1a", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: selected === null ? "not-allowed" : "pointer", opacity: selected === null ? 0.4 : 1 }}
        >
          Reveal
        </button>
      ) : (
        <div className="gen-reveal">{reveal_explanation}</div>
      )}
      <div className="gen-citation">
        {misconception_label} · grounded in: “{source_citation}”
      </div>
    </div>
  );
}
