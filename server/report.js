// Renders runs/runs.jsonl into test-log.md (PROTOTYPE_PLAN.md §5):
// per-config summary stats, a primitive-choice confusion matrix, and a full
// run listing. Run after `npm run matrix` (or any Lab runs you want folded in).
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { runsFilePath } from "./log.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadRuns() {
  const p = runsFilePath();
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

function pct(n, d) {
  return d === 0 ? "—" : `${Math.round((n / d) * 100)}%`;
}

function avg(nums) {
  const xs = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (xs.length === 0) return null;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

function configLabel(r) {
  if (r.mode === "A") return `A-${(r.models.single || "").replace("claude-", "").replace("-4-5", "")}`;
  const d = (r.models.diagnose || "").replace("claude-", "");
  const g = (r.models.generate || "").replace("claude-", "");
  return `B-${d}->${g}`;
}

function buildReport(runs) {
  const lines = [];
  lines.push("# Test Log");
  lines.push("");
  lines.push(`Generated ${new Date().toISOString()} from ${runs.length} logged run(s) in \`runs/runs.jsonl\`.`);
  lines.push("");

  if (runs.length === 0) {
    lines.push("No runs logged yet. Run `npm run matrix` or use the Lab (`/lab`) first.");
    return lines.join("\n");
  }

  // ---- per-config summary ----
  const byConfig = {};
  for (const r of runs) {
    const key = configLabel(r);
    byConfig[key] ??= [];
    byConfig[key].push(r);
  }

  lines.push("## Per-config summary (spec §6)");
  lines.push("");
  lines.push("| Config | N | Choice match | Valid (1st try) | Grounding: exact / paraphrase / unsupported | Avg latency (ms) |");
  lines.push("|---|---|---|---|---|---|");
  for (const [key, rs] of Object.entries(byConfig)) {
    const withExpected = rs.filter((r) => r.expected_tool);
    const matches = withExpected.filter((r) => r.choice_match).length;
    const valid = rs.filter((r) => r.validation.ok).length;
    const exact = rs.filter((r) => r.grounding?.verdict === "exact").length;
    const paraphrase = rs.filter((r) => r.grounding?.verdict === "paraphrase").length;
    const unsupported = rs.filter((r) => r.grounding?.verdict === "unsupported").length;
    const avgLatency = avg(rs.map((r) => r.latency_ms.total));
    lines.push(
      `| ${key} | ${rs.length} | ${pct(matches, withExpected.length)} (${matches}/${withExpected.length}) | ${pct(valid, rs.length)} (${valid}/${rs.length}) | ${exact} / ${paraphrase} / ${unsupported} | ${avgLatency ?? "—"} |`
    );
  }
  lines.push("");

  // ---- confusion matrix (expected vs chosen), across all runs with an expected tool ----
  const tools = ["render_trace_stepper", "render_predict_then_reveal", "render_step_visualizer"];
  const short = (t) => (t ? t.replace("render_", "") : "(none)");
  const matrix = {};
  for (const t of [...tools, null]) matrix[t] = Object.fromEntries([...tools, null].map((c) => [c, 0]));
  for (const r of runs) {
    if (!r.expected_tool) continue;
    matrix[r.expected_tool][r.chosen_tool] = (matrix[r.expected_tool][r.chosen_tool] || 0) + 1;
  }

  lines.push("## Primitive-choice confusion matrix (expected → chosen)");
  lines.push("");
  lines.push(`| Expected \\ Chosen | ${tools.map(short).join(" | ")} | other/none |`);
  lines.push(`|---|---|---|---|---|`);
  for (const t of tools) {
    const row = tools.map((c) => matrix[t][c] || 0);
    const other = Object.entries(matrix[t]).reduce((sum, [k, v]) => (tools.includes(k) ? sum : sum + v), 0);
    lines.push(`| ${short(t)} | ${row.join(" | ")} | ${other} |`);
  }
  lines.push("");
  lines.push(
    "Scenarios 5 and 6 are excluded from this matrix (no fixed expected tool — see PROTOTYPE_PLAN.md §6); check their runs individually below."
  );
  lines.push("");

  // ---- full run listing ----
  lines.push("## All runs");
  lines.push("");
  lines.push("| Scenario | Config | Chosen | Expected | Match | Valid | Grounding | Latency (ms) | Errors |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const r of runs) {
    const errs = r.validation.errors.length ? r.validation.errors.slice(0, 2).join("; ") : "";
    lines.push(
      `| ${r.scenario_id} | ${configLabel(r)} | ${short(r.chosen_tool)} | ${r.expected_tool ? short(r.expected_tool) : "—"} | ${r.choice_match === null ? "—" : r.choice_match ? "✓" : "✗"} | ${r.validation.ok ? "✓" : "✗"} | ${r.grounding?.verdict ?? "—"} | ${r.latency_ms.total} | ${errs} |`
    );
  }
  lines.push("");

  return lines.join("\n");
}

function main() {
  const runs = loadRuns();
  const report = buildReport(runs);
  const outPath = path.join(__dirname, "..", "test-log.md");
  writeFileSync(outPath, report, "utf8");
  console.log(`Wrote ${outPath} from ${runs.length} run(s).`);
}

main();
