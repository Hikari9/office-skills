#!/usr/bin/env node
/**
 * Brand-agnostic emitter. Emits run events for every session in a harness's
 * store that is newer than the last watermark, then advances the watermark.
 *
 * Usage: catch-up.mjs --brand <claude|codex|gemini|hermes>
 *
 * Why a watermark instead of one-hook-one-session: the four harnesses do not
 * agree on lifecycle events. Claude and Gemini have `SessionEnd`; Codex has
 * none; Hermes has `on_session_end` but only for gateway sessions. A hook that
 * only works where `SessionEnd` exists would go silent on Codex — which is
 * where most office runs actually happen — and silence that reads as "no runs"
 * is the exact failure this project was built to stop.
 *
 * So this can be wired to *any* event a harness does offer (SessionStart works
 * fine: it catches up the previous session), and it is idempotent — a session
 * already emitted is skipped by id.
 *
 * Never blocks. Never writes stdout. Always exits 0.
 */
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SINK = process.env.OFFICE_TELEMETRY_DIR || join(homedir(), ".claude", "office-skills-telemetry");
const MAX_PER_RUN = Number(process.env.OFFICE_CATCHUP_MAX || 40);

try {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "../..");
  const flag = process.argv.indexOf("--brand");
  const brand = flag >= 0 ? process.argv[flag + 1] : "claude";

  const { ADAPTERS } = await import("../lib/adapters/index.mjs");
  const { toEvent } = await import("../lib/event.mjs");
  const { buildVersionTree } = await import("../lib/version-tree.mjs");
  const adapter = ADAPTERS[brand];
  if (!adapter) process.exit(0);

  mkdirSync(SINK, { recursive: true });
  const statePath = join(SINK, `watermark-${brand}.json`);
  const state = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, "utf8"))
    : { since: 0, seen: [] };
  const seen = new Set(state.seen || []);

  let files = [];
  try { files = adapter.listSessions() || []; } catch { process.exit(0); }

  // Newest first, so a busy store still emits the runs that just happened even
  // if it exceeds MAX_PER_RUN. A hook must never become the slow step.
  const withTime = files.map((f) => {
    let mtime = 0;
    try { mtime = statSync(f).mtimeMs; } catch { mtime = Date.now(); }
    return { f, mtime };
  }).sort((a, b) => b.mtime - a.mtime);

  const tree = buildVersionTree(repoRoot);
  const repoMap = new Map();
  const mapPath = join(SINK, "repo-map.local.json");
  if (existsSync(mapPath)) {
    for (const [slug, cwd] of Object.entries(JSON.parse(readFileSync(mapPath, "utf8")))) repoMap.set(cwd, slug);
  }

  const out = [];
  let emitted = 0;
  for (const { f, mtime } of withTime) {
    if (emitted >= MAX_PER_RUN) break;
    if (mtime <= state.since) break;              // sorted: everything past here is older
    let parsed;
    try { parsed = await adapter.parseSession(f, repoMap); } catch { continue; }
    const { session, skills } = parsed || {};
    if (!session || !skills?.length) continue;
    if (session.session_id && seen.has(session.session_id)) continue;
    if (session.session_id) seen.add(session.session_id);
    for (const skill of skills) out.push(toEvent({ session, skill, tree, source: "catch-up-hook", brand }));
    emitted++;
  }

  if (out.length) appendFileSync(join(SINK, "run-events.jsonl"), out.map((e) => JSON.stringify(e)).join("\n") + "\n");

  writeFileSync(statePath, JSON.stringify({
    since: withTime.length ? withTime[0].mtime : state.since,
    // Bounded: the watermark does the real work, the id set only guards the edge.
    seen: [...seen].slice(-500),
    updated: new Date().toISOString(),
  }, null, 2));
  writeFileSync(mapPath, JSON.stringify(Object.fromEntries([...repoMap].map(([k, v]) => [v, k])), null, 2));
} catch {
  // Swallow.
}
process.exit(0);
