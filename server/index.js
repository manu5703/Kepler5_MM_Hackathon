import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { CopilotRuntime, AnthropicAdapter, copilotRuntimeNodeExpressEndpoint } from "@copilotkit/runtime";

import { SCENARIOS, scenarioById } from "./scenarios.js";
import { runTrigger } from "./pipeline.js";
import { runsFilePath } from "./log.js";
import { retrieve } from "./retrieve.js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;
const isMock = () => process.env.MOCK === "1";
const hasApiKey = () => !!process.env.ANTHROPIC_API_KEY;

// ---- config / health ----
app.get("/api/config", (req, res) => {
  res.json({
    mock: isMock(),
    agentMode: process.env.AGENT_MODE || "B",
    strict: process.env.STRICT_TOOLS === "1",
    diagnoseModel: process.env.DIAGNOSE_MODEL || "claude-sonnet-5",
    generateModel: process.env.GENERATE_MODEL || "claude-haiku-4-5",
    hasApiKey: hasApiKey(),
    // The CopilotKit-powered portal path needs a real key even in mock-ish
    // demos of the Lab — see PROTOTYPE_PLAN.md's CopilotKit integration note
    // in this session's build summary. It is NOT covered by MOCK=1.
    portalReady: hasApiKey(),
  });
});

// Grounding material for one concept + its prereqs — used by the CopilotKit
// portal path to build its own trigger message client-side (single source
// of truth stays server/corpus.js; see src/gen/GenSlot.jsx).
app.get("/api/corpus/:conceptId", (req, res) => {
  res.json(retrieve(req.params.conceptId));
});

// ---- scenarios (Lab) ----
app.get("/api/scenarios", (req, res) => {
  res.json(SCENARIOS);
});

app.post("/api/scenarios/:id/run", async (req, res) => {
  const scenario = scenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ error: "unknown scenario id" });

  const { mode, diagnoseModel, generateModel, strict } = req.body || {};
  try {
    const record = await runTrigger({
      scenario,
      mode,
      diagnoseModel,
      generateModel,
      strict,
    });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Runs one scenario across the full config matrix (PROTOTYPE_PLAN.md §5).
app.post("/api/scenarios/:id/matrix", async (req, res) => {
  const scenario = scenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ error: "unknown scenario id" });
  const reps = Number(req.body?.reps) || 1;

  const configs = [
    { label: "A-haiku", mode: "A", diagnoseModel: "claude-haiku-4-5" },
    { label: "A-sonnet", mode: "A", diagnoseModel: "claude-sonnet-5" },
    { label: "A-opus", mode: "A", diagnoseModel: "claude-opus-5" },
    { label: "B-sonnet-haiku", mode: "B", diagnoseModel: "claude-sonnet-5", generateModel: "claude-haiku-4-5" },
    { label: "B-opus-haiku", mode: "B", diagnoseModel: "claude-opus-5", generateModel: "claude-haiku-4-5" },
  ];

  try {
    const results = [];
    for (const cfg of configs) {
      for (let i = 0; i < reps; i++) {
        const record = await runTrigger({ scenario, strict: false, ...cfg });
        results.push({ config: cfg.label, ...record });
      }
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/runs", (req, res) => {
  const p = runsFilePath();
  if (!existsSync(p)) return res.json([]);
  const lines = readFileSync(p, "utf8").trim().split("\n").filter(Boolean);
  res.json(lines.map((l) => JSON.parse(l)));
});

// ---- portal trigger (free-form conceptId/triggerType/studentAnswer) ----
app.post("/api/generate", async (req, res) => {
  const { conceptId, triggerType, studentAnswer } = req.body || {};
  if (!conceptId || !triggerType) {
    return res.status(400).json({ error: "conceptId and triggerType are required" });
  }
  try {
    const record = await runTrigger({
      scenario: { id: "portal", conceptId, triggerType, studentAnswer: studentAnswer ?? null, expectedTool: null },
    });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- CopilotKit runtime (portal's live gen-UI wiring) ----
// This is a *separate* call surface from the instrumented /api/* routes
// above — see the build summary for why: CopilotKit's AnthropicAdapter
// wraps @ai-sdk/anthropic, which doesn't expose the raw tool_choice/strict/
// usage control the Lab's measurement needs. The portal uses this endpoint
// purely for the "map a tool call straight to a React component" job.
if (hasApiKey()) {
  const serviceAdapter = new AnthropicAdapter({
    anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
    model: process.env.GENERATE_MODEL || "claude-haiku-4-5",
  });
  const runtime = new CopilotRuntime();
  app.use(
    "/api/copilotkit",
    copilotRuntimeNodeExpressEndpoint({ runtime, serviceAdapter, endpoint: "/api/copilotkit" })
  );
} else {
  app.use("/api/copilotkit", (req, res) => {
    res.status(503).json({ error: "ANTHROPIC_API_KEY is not set — the CopilotKit portal path needs a real key even with MOCK=1. The Lab (/lab) still works without one." });
  });
}

// ---- serve the built frontend when running as a single container ----
// In local dev, Vite's own dev server (port 5173) serves the frontend and
// proxies /api here — this block only matters for `npm run build` + Docker.
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}  mock=${isMock()} hasApiKey=${hasApiKey()}`);
});
