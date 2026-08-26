#!/usr/bin/env node
/**
 * Score every backfilled run and roll up per skill, per version.
 *
 * The score is assembled only from facts the harness recorded. Nothing here
 * reads the agent's own claim that it succeeded — per office-core's evidence
 * protocol, narration is not evidence.
 *
 * Components are dropped-and-renormalised when they do not apply to a skill, so
 * a read-only skill is not penalised for never opening a PR.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
const THIN = Number(process.env.THIN_N || 15);

// The backfill records every skill; the scorecard reports only the offices.
// A score for someone else's skill is not this plugin's business, and mixing
// them makes the ranking read as a comparison it is not. SCORE_ALL=1 restores
// the wide view for a one-off look.
const scoreAll = process.env.SCORE_ALL === "1";
const allEvents = readFileSync(join(outDir, "run-events.jsonl"), "utf8")
  .split("\n").filter(Boolean).map((l) => JSON.parse(l));
const events = scoreAll ? allEvents : allEvents.filter((e) => e.is_office);

// Fidelity is not uniform across harnesses and the scorecard never hides it.
// Claude Code records a Skill tool call; the others infer a skill from its
// SKILL.md being read. Both are actions, not keyword matches — but a run
// counted one way is not the same measurement as a run counted the other.
const byHarness = (rs) => {
  const m = new Map();
  for (const r of rs) {
    const k = r.harness || "claude";
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
};
const tree = JSON.parse(readFileSync(join(outDir, "version-tree.json"), "utf8"));

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// Does this skill ever ship code? Decided from the corpus, not from a hand list.
const shipsCode = new Set();
const tokensBySkill = new Map();
for (const e of events) {
  if (e.prs.length) shipsCode.add(e.skill);
  if (e.tokens_out) (tokensBySkill.get(e.skill) ?? tokensBySkill.set(e.skill, []).get(e.skill)).push(e.tokens_out);
}
const medTokens = new Map([...tokensBySkill].map(([k, v]) => [k, median(v)]));

const WEIGHTS = { landed: 35, uninterrupted: 25, clean_tools: 20, gate: 10, efficiency: 10 };

function score(e) {
  const parts = {};

  if (shipsCode.has(e.skill)) parts.landed = e.prs.length ? 1 : 0;

  parts.uninterrupted = e.interrupts === 0 ? 1 : Math.max(0, 1 - e.interrupts * 0.5);

  if (e.tool_calls > 0) {
    const rate = e.tool_errors / e.tool_calls;
    parts.clean_tools = Math.max(0, 1 - rate * 5); // 20% error rate scores zero
  }

  const v = e.verdicts || {};
  const hasVerdict = Object.keys(v).length > 0;
  if (hasVerdict) {
    if (v["PLAN DEFECT"] || v["BRIEF DEFECT"]) parts.gate = 0.3;
    else if (v["APPROVED"]) parts.gate = 1;
    else if (v["CHANGES REQUIRED"]) parts.gate = 0.5;
  }

  const med = medTokens.get(e.skill);
  if (med && e.tokens_out) {
    parts.efficiency = Math.max(0, Math.min(1, 2 - e.tokens_out / med));
  }

  let num = 0, den = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    if (parts[k] === undefined) continue;
    num += parts[k] * w; den += w;
  }
  return {
    score: den ? Math.round((num / den) * 100) : null,
    parts,
    applicable: Object.keys(parts),
    review_rounds: v["CHANGES REQUIRED"] || 0,
  };
}

const scored = events.map((e) => ({ ...e, ...score(e) })).filter((e) => e.score !== null);
writeFileSync(join(outDir, "scored.jsonl"), scored.map((e) => JSON.stringify(e)).join("\n") + "\n");

// --- roll-ups -------------------------------------------------------------
const group = (rows, keyFn) => {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
};
const agg = (rows) => {
  const s = rows.map((r) => r.score);
  return {
    n: rows.length,
    score: Math.round(s.reduce((a, b) => a + b, 0) / rows.length),
    interrupts: rows.filter((r) => r.interrupts > 0).length,
    // Distinct PRs. Every skill active in a session sees that session's PR links,
    // so summing per-row would multiply one PR by the number of skills that ran.
    prs: new Set(rows.flatMap((r) => r.prs.map((p) => `${p.repo}#${p.number}`))).size,
    rounds: median(rows.map((r) => r.review_rounds)),
    tokens: median(rows.filter((r) => r.tokens_out).map((r) => r.tokens_out)),
    wall: median(rows.filter((r) => r.wall_clock_s).map((r) => r.wall_clock_s)),
  };
};

const current = scored.filter((r) => r.version_is_current && r.version_boundary !== "fuzzy");
const historical = scored.filter((r) => !r.version_is_current);

const L = [];
L.push("# Skill scorecard (backfilled)");
L.push("");
L.push(`Generated ${new Date().toISOString()} by \`eval/score.mjs\` from ${events.length} backfilled office invocations`);
L.push(`across ${new Set(events.map((e) => e.session.session_id)).size} sessions. Version tree at \`${tree.head}\`.`);
L.push("");
L.push(`Scope: the four offices and their spokes only — ${allEvents.length - events.length} invocations of`);
L.push("skills this plugin does not own were recorded by the backfill and are excluded here.");
L.push("");
L.push("Score is `landed(35) · uninterrupted(25) · clean_tools(20) · gate(10) · efficiency(10)`,");
L.push("renormalised over the components that apply to each skill. **`n` is the number that matters**:");
L.push(`fewer than ${THIN} runs is marked *thin* and the score is noise, not a measurement.`);
L.push("");

L.push(`## Current version (\`${tree.head}\`, from ${tree.intervals[0].effective_from.slice(0, 16).replace("T", " ")})`);
L.push("");
if (!current.length) {
  L.push("**No runs yet on the current version.** Every score below is historical. This is the");
  L.push("expected state right after a release, and it is exactly why the live hook and the eval");
  L.push("suite exist: without them, the current version has no evidence at all until it happens");
  L.push("to be used.");
} else {
  L.push("| Skill | n | score | interrupted | PRs | med rounds | med tok | med wall |");
  L.push("|---|---|---|---|---|---|---|---|");
  const currentRanked = [...group(current, (r) => r.skill)]
    .map(([skill, rows]) => [skill, rows, agg(rows)])
    .sort((x, y) => y[2].score - x[2].score);
  for (const [skill, rows, a] of currentRanked) {
    const thin = a.n < THIN ? " *thin*" : "";
    L.push(`| \`${skill}\`${thin} | ${a.n} | **${a.score}** | ${a.interrupts} | ${a.prs} | ${a.rounds ?? "—"} | ${a.tokens ?? "—"} | ${a.wall ? a.wall + "s" : "—"} |`);
  }
}
L.push("");

L.push("## All versions, by skill");
L.push("");
L.push("Older rows are learnings, not a verdict on shipping code.");
L.push("");
// Highest score first, so the table reads as a ranking rather than a census —
// but a thin skill never outranks a measured one, because a score over 2 runs is
// not a better result than a score over 60, it is a smaller sample.
const bySkill = [...group(scored, (r) => r.skill)]
  .map((e) => [...e, agg(e[1])])
  .sort((x, y) => (y[2].n >= THIN) - (x[2].n >= THIN) || y[2].score - x[2].score);

// Mean of each component where it applied, so a score can be read back to a cause.
const partMeans = (rows) => {
  const out = {};
  for (const k of Object.keys(WEIGHTS)) {
    const a = rows.filter((r) => r.parts[k] !== undefined);
    out[k] = a.length ? Math.round((a.reduce((n, r) => n + r.parts[k], 0) / a.length) * 100) : null;
  }
  return out;
};

const GOAL = Number(process.env.LANDED_GOAL || 80);
const landedRows = scored.filter((r) => r.parts.landed !== undefined);
const landedRate = (rs) =>
  rs.length ? Math.round((rs.filter((r) => r.parts.landed === 1).length / rs.length) * 100) : null;
const recent = landedRows.filter((r) => Date.parse(r.timestamp) > Date.now() - 14 * 864e5);

L.push("## Coverage by harness");
L.push("");
L.push("| Harness | office runs | invocation signal |");
L.push("|---|---|---|");
for (const [h, rs] of [...byHarness(events)].sort((a, b) => b[1].length - a[1].length)) {
  const sig = [...new Set(rs.map((r) => r.signal || "skill-tool"))].join(", ");
  L.push(`| \`${h}\` | ${rs.length} | \`${sig}\` |`);
}
L.push("");
L.push("`skill-tool` is a recorded dispatch — Claude Code is the only harness with a first-class");
L.push("Skill tool and per-turn attribution. `skill-md-read` infers the invocation from the skill's");
L.push("`SKILL.md` being read, which is what Codex, Gemini, and Hermes can offer. Both are actions");
L.push("rather than keyword matches, so both count as invocations; they are **not** the same");
L.push("measurement, and a cross-harness comparison has to say which it is using.");
L.push("");

L.push("## The goal");
L.push("");
L.push(`**Landed rate target: ${GOAL}%** — the share of office runs that open a PR. Checked by`);
L.push("`eval/gate.mjs`, enforced once a scope has 15+ runs and reported below that.");
L.push("");
L.push("| Scope | landed | runs | vs goal |");
L.push("|---|---|---|---|");
for (const [label, rs] of [
  ["Current version", landedRows.filter((r) => r.version_is_current && r.version_boundary !== "fuzzy")],
  ["Last 14 days", recent],
  ["Lifetime", landedRows],
]) {
  const rate = landedRate(rs);
  const verdict = rate === null ? "—" : rs.length < 15 ? `${rate >= GOAL ? "+" : ""}${rate - GOAL} *(reporting only, n<15)*` : rate >= GOAL ? `**+${rate - GOAL} PASS**` : `**${rate - GOAL} FAIL**`;
  L.push(`| ${label} | ${rate === null ? "—" : rate + "%"} | ${rs.length} | ${verdict} |`);
}
L.push("");
L.push("");
const segRate = (rs) => {
  if (!rs.length) return null;
  const l = rs.filter((r) => r.parts.landed === 1).length;
  return { pct: Math.round((l / rs.length) * 100), l, n: rs.length };
};
const comp = segRate(landedRows.filter((r) => r.session_compactions > 0));
const uncomp = segRate(landedRows.filter((r) => !r.session_compactions));
const lg = landedRows.filter((r) => r.attributed_turns >= 40);
const lgC = segRate(lg.filter((r) => r.session_compactions > 0));
const lgU = segRate(lg.filter((r) => !r.session_compactions));
if (comp && uncomp) {
  L.push(`**The best segment measured.** Runs whose session compacted land at **${comp.pct}%**`);
  L.push(`(${comp.l}/${comp.n}) against **${uncomp.pct}%** (${uncomp.l}/${uncomp.n}) for runs that never`);
  if (lgC && lgU) L.push(`compacted; among 40+ turn runs it is ${lgC.pct}% vs ${lgU.pct}%, so it is not just run length.`);
  L.push("Correlational — both are most likely downstream of a run being driven to completion rather");
  L.push("than abandoned.");
  L.push("");
  if (comp.pct >= GOAL) {
    L.push(`That segment clears ${GOAL}%, which is the bar for promoting a warning to a gate.`);
  } else {
    L.push(`**No segment currently clears ${GOAL}%.** The target is set above everything this corpus`);
    L.push("has reached, so treat it as a direction rather than a demonstrated ceiling. It was set when");
    L.push("Claude-only data showed 90%; adding Codex, where most office runs actually happen, moved it.");
  }
}
L.push("");
L.push("The composite score below is deliberately **not** the gated number. `gate` is matched on");
L.push("literal strings and `uninterrupted` sits at 94-100% across every office, so the composite is");
L.push("inflated and cannot carry a threshold honestly. Landed counts an artifact outside the");
L.push("transcript, so it can.");
L.push("");

L.push("## Ranking");
L.push("");
L.push("Components are the mean of each part where it applied, so a score reads back to a cause.");
L.push("");
L.push("| Skill | n | harness | score | landed | uninterr | tools | gate | effic | on current |");
L.push("|---|---|---|---|---|---|---|---|---|---|");
for (const [skill, rows, a] of bySkill) {
  const m = partMeans(rows);
  const pct = (x) => (x === null ? "—" : `${x}%`);
  const thin = a.n < THIN ? " *thin*" : "";
  const cur = rows.filter((r) => r.version_is_current).length || "—";
  const hs = [...new Set(rows.map((r) => r.harness || "claude"))].sort().join("+");
  L.push(`| \`${skill}\`${thin} | ${a.n} | ${hs} | **${a.score}** | ${pct(m.landed)} | ${pct(m.uninterrupted)} | ${pct(m.clean_tools)} | ${pct(m.gate)} | ${pct(m.efficiency)} | ${cur} |`);
}
L.push("");
for (const [skill, rows, a] of bySkill) {
  L.push(`### \`${skill}\` — ${a.n} runs, lifetime score ${a.score}`);
  L.push("");
  L.push("| version sha | core | n | score | interrupted | PRs |");
  L.push("|---|---|---|---|---|---|");
  const byVer = [...group(rows, (r) => r.version_sha)].sort(
    (x, y) => (y[1][0].timestamp || "").localeCompare(x[1][0].timestamp || "")
  );
  for (const [sha, vrows] of byVer) {
    const va = agg(vrows);
    const cur = vrows[0].version_is_current ? " **←current**" : "";
    const label = sha == null ? "_pre-release_" : `\`${sha}\``;
    L.push(`| ${label}${cur} | ${vrows[0].core_version ?? "—"} | ${va.n} | ${va.score} | ${va.interrupts} | ${va.prs} |`);
  }
  L.push("");
}

L.push("## Thin coverage — candidates for a live eval suite");
L.push("");
L.push(`Skills with fewer than ${THIN} lifetime runs cannot be scored from history. These need`);
L.push("purpose-built eval cases in `<office>/evals/`.");
L.push("");
const thin = bySkill.filter(([, r]) => r.length < THIN).map(([s, r]) => `\`${s}\` (${r.length})`);
L.push(thin.join(" · ") || "_none_");
L.push("");

writeFileSync(join(here, "SCORECARD.md"), L.join("\n") + "\n");
console.log(`${scored.length} scored -> eval/SCORECARD.md`);
console.log(`current-version runs: ${current.length}  |  historical: ${historical.length}`);
