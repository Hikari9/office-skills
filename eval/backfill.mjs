#!/usr/bin/env node
/**
 * Retro-emit run events from Claude Code transcripts, attributed to the plugin
 * version that was live when each run executed.
 *
 * Reads  ~/.claude/projects/<slug>/<session>.jsonl  (never modified)
 * Writes eval/out/run-events.jsonl       one record per skill invocation
 *        eval/out/sessions.jsonl         one record per session that used a skill
 *        eval/out/repo-map.local.json    slug -> real cwd (gitignored)
 *
 * Privacy: no prompt text, no tool arguments, no file contents. Prompts are
 * reduced to a length and a truncated sha256. Repos are opaque slugs, matching
 * the convention the routing ledger already uses.
 */
import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVersionTree } from "./lib/version-tree.mjs";
import { parseSession } from "./lib/transcript.mjs";
import { toEvent } from "./lib/event.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const outDir = resolve(here, "out");
const projectsDir = process.env.CC_PROJECTS_DIR || join(homedir(), ".claude", "projects");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

const tree = buildVersionTree(repoRoot);
mkdirSync(outDir, { recursive: true });

if (!existsSync(projectsDir)) {
  console.error(`No transcripts at ${projectsDir}. Set CC_PROJECTS_DIR.`);
  process.exit(1);
}

const files = walk(projectsDir);
const repoMap = new Map();
const events = [];
const sessions = [];
let scanned = 0;

for (const file of files) {
  scanned++;
  if (scanned % 100 === 0) process.stderr.write(`  ${scanned}/${files.length}\r`);
  let parsed;
  try { parsed = await parseSession(file, repoMap); } catch { continue; }
  const { session, skills } = parsed;
  if (!skills.length) continue;
  sessions.push(session);
  for (const skill of skills) events.push(toEvent({ session, skill, tree, source: "backfill" }));
}

process.stderr.write("\n");
writeFileSync(join(outDir, "run-events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
writeFileSync(join(outDir, "sessions.jsonl"), sessions.map((s) => JSON.stringify(s)).join("\n") + "\n");
writeFileSync(
  join(outDir, "repo-map.local.json"),
  JSON.stringify(Object.fromEntries([...repoMap].map(([k, v]) => [v, k])), null, 2)
);

console.log(`scanned ${files.length} transcripts`);
console.log(`${sessions.length} sessions used a skill`);
console.log(`${events.length} skill-invocation events -> eval/out/run-events.jsonl`);
