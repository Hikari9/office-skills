#!/usr/bin/env node
/**
 * Retro-emit run events from every installed harness's own session store,
 * attributed to the plugin version that was live when each run executed.
 *
 * Reads (never modifies):
 *   claude  ~/.claude/projects/<slug>/<session>.jsonl
 *   codex   ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl
 *   gemini  ~/.gemini/tmp/<project>/chats/**\/*.jsonl
 *   hermes  ~/.hermes/state.db  (SQLite)
 *
 * Writes eval/out/run-events.jsonl, sessions.jsonl, repo-map.local.json
 *
 * `--brand claude,codex` limits the scan. Default is every harness present.
 *
 * Fidelity is not uniform and every event says so. Only Claude Code has a
 * first-class Skill tool, so its events carry `signal: "skill-tool"`. The other
 * three record a skill by its `SKILL.md` being read — `signal:
 * "skill-md-read"`. Both are actions rather than keyword matches, so both
 * satisfy the invocation rule; they are not interchangeable and the scorer
 * never mixes them silently.
 *
 * Privacy: no prompt text, no tool arguments, no file contents. Prompts reduce
 * to a length and a truncated sha256; repos to opaque slugs.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVersionTree } from "./lib/version-tree.mjs";
import { ADAPTERS, BRANDS } from "./lib/adapters/index.mjs";
import { toEvent } from "./lib/event.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const outDir = resolve(here, "out");

const tree = buildVersionTree(repoRoot);
mkdirSync(outDir, { recursive: true });

const flag = process.argv.indexOf("--brand");
const wanted =
  flag >= 0 ? (process.argv[flag + 1] || "").split(",").filter(Boolean) : BRANDS;

const repoMap = new Map();
const events = [];
const sessions = [];
const perBrand = {};

for (const brand of BRANDS) {
  if (!wanted.includes(brand)) continue;
  const adapter = ADAPTERS[brand];
  let files = [];
  try { files = adapter.listSessions() || []; } catch { files = []; }
  perBrand[brand] = { found: files.length, parsed: 0, events: 0 };

  let n = 0;
  for (const file of files) {
    n++;
    if (n % 200 === 0) process.stderr.write(`  ${brand} ${n}/${files.length}\r`);
    let parsed;
    try { parsed = await adapter.parseSession(file, repoMap); } catch { continue; }
    const { session, skills } = parsed || {};
    if (!session || !skills?.length) continue;
    perBrand[brand].parsed++;
    sessions.push(session);
    for (const skill of skills) {
      events.push(toEvent({ session, skill, tree, source: "backfill", brand }));
      perBrand[brand].events++;
    }
  }
  process.stderr.write(
    `  ${brand.padEnd(7)} ${String(perBrand[brand].events).padStart(5)} events  ` +
    `${perBrand[brand].parsed}/${files.length} sessions\n`
  );
}

writeFileSync(join(outDir, "run-events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
writeFileSync(join(outDir, "sessions.jsonl"), sessions.map((s) => JSON.stringify(s)).join("\n") + "\n");
writeFileSync(
  join(outDir, "repo-map.local.json"),
  JSON.stringify(Object.fromEntries([...repoMap].map(([k, v]) => [v, k])), null, 2)
);

console.log(`${sessions.length} sessions used a skill, across ${Object.keys(perBrand).length} harnesses`);
console.log(`${events.length} skill-invocation events -> eval/out/run-events.jsonl`);
