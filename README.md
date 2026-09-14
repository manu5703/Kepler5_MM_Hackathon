# Medusa — Gen UI Prototype

Tests one thing (see `PROTOTYPE_PLAN.md` for the full plan): given a concept, a
student's wrong answer, and grounding source material, does Claude pick the
right interaction primitive and fill it with schema-valid, grounded,
pedagogically useful parameters?

Two views, one app:

- **`/` (Portal)** — the LearnGraph concept-graph flow, with two live seams
  wired to real generation via **CopilotKit**: "explain this differently" on
  the teach screen, and the free-text probe answer on the check screen.
- **`/#/lab` (Lab)** — the measurement harness. Runs the 7 hardcoded
  scenarios against the instrumented direct-Anthropic pipeline, shows raw
  tool-call JSON, validation results, and grounding verdicts.

The Portal and the Lab intentionally use **two different call paths** — see
"Two call surfaces" below before changing either one.

## Quick start

```bash
npm install
cp .env.example .env      # already done for you; MOCK=1 by default
npm run dev                # starts Vite (5173) + Express (8787)
```

Open http://localhost:5173 for the Portal, http://localhost:5173/#/lab for
the Lab. In `MOCK=1` mode the Lab works with no API key at all (canned
responses from `server/mock-data.js`). **The Portal's live generation needs a
real key regardless of `MOCK`** — see below.

To use real models: put a key in `.env` as `ANTHROPIC_API_KEY=sk-ant-...`
and set `MOCK=0`.

## Two call surfaces (why, not just what)

- **Lab / matrix (`server/anthropic.js`, `server/pipeline.js`)** — direct
  `@anthropic-ai/sdk` calls with explicit `tool_choice`, `strict`, and raw
  `usage`/latency capture. This is what answers the spec's actual research
  questions (§1, §6) and is what `npm run matrix` exercises.
- **Portal (`server/index.js`'s `/api/copilotkit` mount, `src/gen/GenSlot.jsx`)**
  — [CopilotKit](https://copilotkit.ai) (`@copilotkit/runtime` +
  `@copilotkit/react-core`), chosen over a custom tool-call renderer per this
  session's build decision. CopilotKit's `AnthropicAdapter` wraps
  `@ai-sdk/anthropic` under the hood, which doesn't expose `tool_choice`,
  `strict`, or per-call `usage` the way the raw SDK does — so it's used only
  for the "map a tool call straight to a React component" job in the live
  demo, not for the measurement harness. `GenSlot` registers the three
  primitives as `useCopilotAction`s (via their `handler`, not `render` — the
  Portal has no `<CopilotChat>` surface mounted) and fires one headless
  message per trigger via `useCopilotChat().appendMessage(...)`.

If you change a primitive's schema, update it in **both**
`server/tools.js` (JSON Schema, used by the Lab) and
`src/gen/actionParams.js` (CopilotKit's flatter `Parameter[]` format, used
by the Portal) — they're hand-translated, not generated from one source.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Vite (5173) + Express (8787) with hot reload |
| `npm run build` | Builds the frontend to `dist/` (for Docker / `npm run preview`) |
| `npm run matrix` | Runs the full 5-config x 7-scenario measurement sweep. **Needs `ANTHROPIC_API_KEY` and `MOCK=0`** — refuses to run mocked. |
| `npm run report` | Renders `runs/runs.jsonl` into `test-log.md` (per-config summary + confusion matrix, per `PROTOTYPE_PLAN.md` §5) |

## Docker

No database — this prototype's persistence is `runs/runs.jsonl`
(`PROTOTYPE_PLAN.md` §9 keeps course ingestion, auth, and a real DB out of
scope). `docker-compose.yml` bind-mounts `./runs` so logs survive container
restarts and stay readable on the host.

```bash
cp .env.example .env      # fill in ANTHROPIC_API_KEY, set MOCK=0 for real calls
docker compose up --build
```

Serves the built frontend + API on http://localhost:8787 (single container —
`vite dev`'s proxy isn't used here; `server/index.js` serves `dist/`
directly when it exists).

## What's not wired up

Per `PROTOTYPE_PLAN.md`'s explicit scope cuts:

- The "career" phase placeholder (interview/research walkthrough) is left as
  static text — scoped as a stretch goal, not part of this pass.
- The prereq-gap graph pulse (`onPrereqGap` in `LearnGraph.jsx`) fires from a
  citation-vs-corpus match in `GenSlot`, not from a real second diagnosis
  call — the Portal runs Option A (one call) through CopilotKit, so there's
  no separate diagnosis stage to read `likely_prereq_gap` from live. The Lab
  and `npm run matrix` **do** run true Option B and log `likely_prereq_gap`
  in `diagnosis` on every logged run.
