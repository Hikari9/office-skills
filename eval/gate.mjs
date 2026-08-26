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

if (failed) {
  console.log(`\n${failed} scope(s) below the ${GOAL}% goal.`);
  console.log("See eval/out/DEBRIEF.md — `dispatched-but-never-landed` names the owning file.");
}
process.exit(failed ? 1 : 0);
