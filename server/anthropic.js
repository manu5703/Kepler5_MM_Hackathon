import Anthropic from "@anthropic-ai/sdk";
import { PRIMITIVE_TOOLS, DIAGNOSIS_SCHEMA, withStrict } from "./tools.js";
import { SINGLE_CALL_SYSTEM_PROMPT, DIAGNOSE_SYSTEM_PROMPT, GENERATE_SYSTEM_PROMPT } from "./prompts.js";
import { MOCK_DIAGNOSES, MOCK_GENERATIONS } from "./mock-data.js";

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const isMock = () => process.env.MOCK === "1";

function buildTriggerText({ conceptId, triggerType, studentAnswer, chunks, diagnosis }) {
  const chunkBlock = chunks
    .map((c) => `[chunk id="${c.id}" concept="${c.conceptId}"]\n${c.text}`)
    .join("\n\n");

  const triggerLine =
    triggerType === "explain_differently"
      ? `The student tapped "explain this differently" on the ${conceptId} material. No specific wrong answer was given.`
      : `The student's wrong answer: "${studentAnswer}"`;

  const diagnosisBlock = diagnosis
    ? `\n\nDiagnosis from the previous stage:\n${JSON.stringify(diagnosis, null, 2)}`
    : "";

  return `Concept: ${conceptId}\n${triggerLine}${diagnosisBlock}\n\nSource material:\n${chunkBlock}`;
}

function extractToolUse(message) {
  const block = message.content.find((b) => b.type === "tool_use");
  if (!block) return null;
  return { toolName: block.name, input: block.input };
}

function usageOf(message) {
  return {
    input: message.usage?.input_tokens ?? 0,
    output: message.usage?.output_tokens ?? 0,
    cache_read: message.usage?.cache_read_input_tokens ?? 0,
  };
}

// ---- Option B, call #1: diagnosis (structured output, not a tool call) ----
export async function callDiagnose({ model, conceptId, triggerType, studentAnswer, chunks }) {
  if (isMock()) {
    await sleep(150 + Math.random() * 150);
    return {
      diagnosis: MOCK_DIAGNOSES[1] ?? null,
      latencyMs: 200,
      usage: { input: 0, output: 0, cache_read: 0 },
      raw: null,
      mocked: true,
    };
  }

  const start = Date.now();
  const message = await client().messages.create({
    model,
    max_tokens: 1024,
    system: DIAGNOSE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildTriggerText({ conceptId, triggerType, studentAnswer, chunks }) }],
    output_config: { format: { type: "json_schema", schema: DIAGNOSIS_SCHEMA } },
  });
  const latencyMs = Date.now() - start;

  const textBlock = message.content.find((b) => b.type === "text");
  let diagnosis = null;
  try {
    diagnosis = textBlock ? JSON.parse(textBlock.text) : null;
  } catch (e) {
    diagnosis = null;
  }

  return { diagnosis, latencyMs, usage: usageOf(message), raw: message };
}

// ---- Option B, call #2 / Option A's single call: selection + filling ----
async function callWithTools({ model, systemPrompt, userText, strict }) {
  const start = Date.now();
  const message = await client().messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userText }],
    tools: withStrict(PRIMITIVE_TOOLS, strict),
    tool_choice: { type: "any", disable_parallel_tool_use: true },
  });
  const latencyMs = Date.now() - start;
  const toolUse = extractToolUse(message);
  return { toolUse, latencyMs, usage: usageOf(message), raw: message };
}

export async function callGenerate({ model, conceptId, triggerType, studentAnswer, chunks, diagnosis, strict }) {
  if (isMock()) {
    await sleep(300 + Math.random() * 400);
    const mock = MOCK_GENERATIONS[mockKeyFor(conceptId, studentAnswer)] ?? Object.values(MOCK_GENERATIONS)[0];
    return { toolUse: mock, latencyMs: 500, usage: { input: 0, output: 0, cache_read: 0 }, raw: null, mocked: true };
  }
  const userText = buildTriggerText({ conceptId, triggerType, studentAnswer, chunks, diagnosis });
  return callWithTools({ model, systemPrompt: GENERATE_SYSTEM_PROMPT, userText, strict });
}

// ---- Option A: single call does diagnosis + selection + filling ----
export async function callSingle({ model, conceptId, triggerType, studentAnswer, chunks, strict }) {
  if (isMock()) {
    await sleep(300 + Math.random() * 400);
    const mock = MOCK_GENERATIONS[mockKeyFor(conceptId, studentAnswer)] ?? Object.values(MOCK_GENERATIONS)[0];
    return { toolUse: mock, latencyMs: 500, usage: { input: 0, output: 0, cache_read: 0 }, raw: null, mocked: true };
  }
  const userText = buildTriggerText({ conceptId, triggerType, studentAnswer, chunks });
  return callWithTools({ model, systemPrompt: SINGLE_CALL_SYSTEM_PROMPT, userText, strict });
}

// Best-effort match from a live conceptId/studentAnswer back to one of the
// hand-authored scenario ids, for mock mode when called outside the fixed
// scenario runner (e.g. the portal). Falls back to scenario 1's mock.
function mockKeyFor(conceptId, studentAnswer) {
  const map = { recursion: 1, arrays: 2, arithmetic: 3, bst: 4, stacks: 5, sorting: 7 };
  return map[conceptId] ?? 1;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
