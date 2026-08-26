#!/usr/bin/env node
/**
 * The 80% goal, as a check rather than an aspiration.
 *
 * Two numbers, both set to 80%:
 *   landed rate  — share of office runs that opened a PR (this file)
 *   eval pass    — skill-eval's pass-threshold in CI (.github/workflows/skill-eval.yml)
 *
 * Deliberately *not* gated on the composite score: `gate` is string-matched and
 * `uninterrupted` sits at 94-100% across every office, so the composite is
 * inflated and cannot carry a threshold honestly. Landed is a count of an
 * artifact outside the transcript, which can.
 *
 * Below MIN_N the goal reports and does not fail. A threshold enforced on four
 * runs measures the sample, not the office.
 *
 * **On the 80% figure.** It was set from Claude-only data, where runs whose
 * session compacted landed at 90%. The Codex backfill moved that segment to
 * ~74%, so 80% now sits above everything this corpus has reached: a direction,
 * not a demonstrated ceiling. The segment printed below is computed, never
 * hardcoded — the first version of this comment pasted in 90% and was wrong
 * within a day.
 *
 * The compacted/uncompacted gap itself survived, and holds after controlling
 * for length. It is correlational: both are most likely downstream of a run
 * being driven to completion rather than abandoned, which is why the segment is
 * reported beside the goal rather than becoming a rule that says "compact more".
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const GOAL = Number(process.env.LANDED_GOAL || 80);
const MIN_N = Number(process.env.GOAL_MIN_N || 15);

const rows = readFileSync(join(here, "out/scored.jsonl"), "utf8")
  .split("\n").filter(Boolean).map(JSON.parse)
  // `landed` is dropped for skills that have never shipped a PR, so a run
  // without the component is a read-only skill and not a miss.
  .filter((r) => r.parts.landed !== undefined);

const scopes = [
  ["current version", rows.filter((r) => r.version_is_current && r.version_boundary !== "fuzzy")],
  ["last 14 days", rows.filter((r) => Date.parse(r.timestamp) > Date.now() - 14 * 864e5)],
  ["lifetime", rows],
];

let failed = 0;
console.log(`landed-rate goal: ${GOAL}%  (enforced at n >= ${MIN_N})\n`);
for (const [label, rs] of scopes) {
  if (!rs.length) { console.log(`  ${label.padEnd(16)} no runs`); continue; }
  const landed = rs.filter((r) => r.parts.landed === 1).length;
  const rate = Math.round((landed / rs.length) * 100);
  const enforced = rs.length >= MIN_N;
  const pass = rate >= GOAL;
  const mark = !enforced ? "report" : pass ? "PASS" : "FAIL";
  console.log(`  ${label.padEnd(16)} ${String(rate).padStart(3)}%  (${landed}/${rs.length})  ${mark}`);
  if (enforced && !pass) failed++;
}

// The segment that shows the goal is reachable, and where the misses concentrate.
const seg = (rs) => {
  if (!rs.length) return "—";
  const landed = rs.filter((r) => r.parts.landed === 1).length;
  return `${Math.round((landed / rs.length) * 100)}% (${landed}/${rs.length})`;
};
const compacted = rows.filter((r) => r.session_compactions > 0);
const uncompacted = rows.filter((r) => !r.session_compactions);
const longRuns = rows.filter((r) => r.attributed_turns >= 40);
console.log("\nsegment (lifetime):");
console.log(`  session compacted      ${seg(compacted)}`);
console.log(`  never compacted        ${seg(uncompacted)}`);
console.log(`  40+ turns, compacted   ${seg(longRuns.filter((r) => r.session_compactions > 0))}`);
console.log(`  40+ turns, not         ${seg(longRuns.filter((r) => !r.session_compactions))}`);

if (failed) {
  console.log(`\n${failed} scope(s) below the ${GOAL}% goal.`);
  console.log("See eval/out/DEBRIEF.md — `dispatched-but-never-landed` names the owning file.");
}
process.exit(failed ? 1 : 0);
