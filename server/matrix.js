// Standalone CLI runner for the full measurement matrix (PROTOTYPE_PLAN.md
// §5): 5 configs x 7 scenarios x REPS reps. Requires ANTHROPIC_API_KEY —
// MOCK=1 defeats the point of this script (it measures real model behavior).
//
//   npm run matrix              # 3 reps per cell (default)
//   REPS=1 npm run matrix       # quick smoke pass
import "dotenv/config";
import { SCENARIOS } from "./scenarios.js";
import { runTrigger } from "./pipeline.js";

const REPS = Number(process.env.REPS) || 3;

const CONFIGS = [
  { label: "A-haiku", mode: "A", diagnoseModel: "claude-haiku-4-5" },
  { label: "A-sonnet", mode: "A", diagnoseModel: "claude-sonnet-5" },
  { label: "A-opus", mode: "A", diagnoseModel: "claude-opus-5" },
  { label: "B-sonnet-haiku", mode: "B", diagnoseModel: "claude-sonnet-5", generateModel: "claude-haiku-4-5" },
  { label: "B-opus-haiku", mode: "B", diagnoseModel: "claude-opus-5", generateModel: "claude-haiku-4-5" },
];

async function main() {
  if (process.env.MOCK === "1") {
    console.error("MOCK=1 is set — the matrix measures real model behavior, refusing to run against canned data. Unset MOCK and set ANTHROPIC_API_KEY.");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }

  const total = CONFIGS.length * SCENARIOS.length * REPS;
  let done = 0;
  console.log(`Running ${total} calls (${CONFIGS.length} configs x ${SCENARIOS.length} scenarios x ${REPS} reps)...`);

  for (const scenario of SCENARIOS) {
    for (const cfg of CONFIGS) {
      for (let i = 0; i < REPS; i++) {
        try {
          const record = await runTrigger({ scenario, strict: false, ...cfg });
          done++;
          console.log(
            `[${done}/${total}] scenario=${scenario.id} config=${cfg.label} chosen=${record.chosen_tool} ` +
              `match=${record.choice_match} valid=${record.validation.ok} grounding=${record.grounding?.verdict} ` +
              `latency=${record.latency_ms.total}ms`
          );
        } catch (err) {
          done++;
          console.error(`[${done}/${total}] scenario=${scenario.id} config=${cfg.label} ERROR: ${err.message}`);
        }
      }
    }
  }
  console.log(`\nDone. Run "npm run report" to render runs/runs.jsonl into test-log.md.`);
}

main();
