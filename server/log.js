import { appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = path.join(__dirname, "..", "runs");
const RUNS_FILE = path.join(RUNS_DIR, "runs.jsonl");

export function logRun(record) {
  mkdirSync(RUNS_DIR, { recursive: true });
  appendFileSync(RUNS_FILE, JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n", "utf8");
}

export function runsFilePath() {
  return RUNS_FILE;
}
