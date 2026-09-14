import { useEffect, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import Portal from "./portal/LearnGraph";
import Lab from "./lab/Lab";

// Hash-based routing (no router dependency needed for two views, and it
// works identically in dev, `vite preview`, and the Docker static serve —
// no server-side catch-all rewrite required).
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function NavBar({ route }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 16px", borderBottom: "0.5px solid #eee", fontSize: 13 }}>
      <a href="#/" style={{ padding: "4px 10px", borderRadius: 6, color: route !== "#/lab" ? "#1a1a1a" : "#888", fontWeight: route !== "#/lab" ? 600 : 400, textDecoration: "none" }}>Portal</a>
      <a href="#/lab" style={{ padding: "4px 10px", borderRadius: 6, color: route === "#/lab" ? "#1a1a1a" : "#888", fontWeight: route === "#/lab" ? 600 : 400, textDecoration: "none" }}>Lab</a>
    </div>
  );
}

// The CopilotKit-powered portal path lives behind /api/copilotkit, which
// server/index.js only mounts when ANTHROPIC_API_KEY is set — see
// PROTOTYPE_PLAN.md's "Mock mode" note and the build summary for why MOCK=1
// does not cover this path. The Lab (/lab) works fully offline via MOCK=1.
export default function App() {
  const route = useHashRoute();

  return (
    <div>
      <NavBar route={route} />
      {route === "#/lab" ? (
        <Lab />
      ) : (
        <CopilotKit runtimeUrl="/api/copilotkit">
          <Portal />
        </CopilotKit>
      )}
    </div>
  );
}
