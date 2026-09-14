import { useEffect, useState } from "react";

// The measurement harness from PROTOTYPE_PLAN.md §2/§5/§6. This is where
// the prototype's actual research question gets answered — raw JSON, chosen
// vs expected primitive, validation result, grounding verdict, latency —
// independent of any renderer. Talks directly to the instrumented /api/*
// endpoints (server/pipeline.js), not through CopilotKit.
export default function Lab() {
  const [config, setConfig] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [runs, setRuns] = useState({}); // scenarioId -> record (single run) or array (matrix)
  const [loading, setLoading] = useState({}); // scenarioId -> bool
  const [openRaw, setOpenRaw] = useState({});

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig);
    fetch("/api/scenarios").then((r) => r.json()).then(setScenarios);
  }, []);

  async function runOne(scenario, mode) {
    setLoading((l) => ({ ...l, [scenario.id]: true }));
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const record = await res.json();
      setRuns((r) => ({ ...r, [scenario.id]: record }));
    } finally {
      setLoading((l) => ({ ...l, [scenario.id]: false }));
    }
  }

  async function runMatrix(scenario) {
    setLoading((l) => ({ ...l, [scenario.id]: true }));
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/matrix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps: 1 }),
      });
      const records = await res.json();
      setRuns((r) => ({ ...r, [scenario.id]: records }));
    } finally {
      setLoading((l) => ({ ...l, [scenario.id]: false }));
    }
  }

  const short = (t) => (t ? t.replace("render_", "") : "—");

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "1.5rem" }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px" }}>Gen-UI Lab</h2>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>
        Raw tool-call output per scenario — primitive choice, schema + semantic validation, grounding, latency.
        Run <code>npm run matrix && npm run report</code> for the full 5-config x 7-scenario sweep as{" "}
        <code>test-log.md</code>.
      </p>

      {config && (
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888", marginBottom: 20, flexWrap: "wrap" }}>
          <span>mock: <b>{String(config.mock)}</b></span>
          <span>agent mode: <b>{config.agentMode}</b></span>
          <span>strict tools: <b>{String(config.strict)}</b></span>
          <span>diagnose model: <b>{config.diagnoseModel}</b></span>
          <span>generate model: <b>{config.generateModel}</b></span>
          <span>API key set: <b>{String(config.hasApiKey)}</b></span>
        </div>
      )}

      {!config?.hasApiKey && !config?.mock && (
        <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          No ANTHROPIC_API_KEY and MOCK is off — runs will fail. Set MOCK=1 in .env for canned responses, or add a key.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {scenarios.map((s) => {
          const run = runs[s.id];
          const isMatrix = Array.isArray(run);
          return (
            <div key={s.id} style={{ border: "0.5px solid #ddd", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    #{s.id} {s.title} {s.labOnly && <span style={{ fontSize: 11, color: "#aaa" }}>(lab-only control)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    concept: {s.conceptId} · trigger: {s.triggerType} · expected:{" "}
                    {s.expectedTool ? short(s.expectedTool) : "— (ambiguous, see note)"}
                  </div>
                  {s.studentAnswer && <div style={{ fontSize: 12, color: "#555", marginTop: 4, fontStyle: "italic" }}>"{s.studentAnswer}"</div>}
                  {s.note && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{s.note}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => runOne(s, "A")} disabled={loading[s.id]} style={btnStyle}>Run A</button>
                  <button onClick={() => runOne(s, "B")} disabled={loading[s.id]} style={btnStyle}>Run B</button>
                  <button onClick={() => runMatrix(s)} disabled={loading[s.id]} style={{ ...btnStyle, background: "#1a1a1a", color: "#fff" }}>Run matrix</button>
                </div>
              </div>

              {loading[s.id] && <div style={{ fontSize: 12, color: "#888", marginTop: 10 }}>running…</div>}

              {run && !isMatrix && <RunRow record={run} short={short} openRaw={openRaw} setOpenRaw={setOpenRaw} rowKey={`${s.id}-single`} />}

              {run && isMatrix && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {run.map((rec, i) => (
                    <RunRow key={i} record={rec} short={short} label={rec.config} openRaw={openRaw} setOpenRaw={setOpenRaw} rowKey={`${s.id}-${i}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = {
  border: "0.5px solid #ccc",
  background: "#fff",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
};

function RunRow({ record, short, label, openRaw, setOpenRaw, rowKey }) {
  const isOpen = !!openRaw[rowKey];
  return (
    <div style={{ background: "#fafaf9", borderRadius: 8, padding: "10px 12px", fontSize: 12.5 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        {label && <b>{label}</b>}
        <span>chosen: <b>{short(record.chosen_tool)}</b></span>
        {record.expected_tool && (
          <span style={{ color: record.choice_match ? "#0F6E56" : "#791F1F" }}>
            {record.choice_match ? "✓ matches expected" : `✗ expected ${short(record.expected_tool)}`}
          </span>
        )}
        <span style={{ color: record.validation.ok ? "#0F6E56" : "#791F1F" }}>
          {record.validation.ok ? "✓ valid" : `✗ invalid (${record.validation.errors.length})`}
        </span>
        <span>
          grounding:{" "}
          <b style={{ color: record.grounding?.verdict === "exact" ? "#0F6E56" : record.grounding?.verdict === "paraphrase" ? "#854F0B" : "#791F1F" }}>
            {record.grounding?.verdict ?? "—"}
          </b>
        </span>
        <span>{record.latency_ms.total}ms</span>
        {record.mocked && <span style={{ color: "#aaa" }}>(mock)</span>}
        <button onClick={() => setOpenRaw((o) => ({ ...o, [rowKey]: !o[rowKey] }))} style={{ ...btnStyle, marginLeft: "auto" }}>
          {isOpen ? "hide JSON" : "raw JSON"}
        </button>
      </div>
      {!record.validation.ok && (
        <div style={{ color: "#791F1F", marginTop: 6 }}>{record.validation.errors.join("; ")}</div>
      )}
      {isOpen && (
        <pre style={{ marginTop: 8, padding: 10, background: "#1a1a1a", color: "#e8e8e0", borderRadius: 6, overflowX: "auto", fontSize: 11 }}>
          {JSON.stringify(record, null, 2)}
        </pre>
      )}
    </div>
  );
}
