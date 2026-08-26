#!/usr/bin/env node
/**
 * Debrief: turn the collected mistakes into changes the offices can absorb.
 *
 * A score tells you a skill is weak. It does not tell you what to edit. This
 * reads the same events and groups them by *failure signature* — the thing that
 * went wrong — then ranks signatures by what they actually cost in rounds,
 * interrupts, and wall clock, and names the file that owns each one.
 *
 * Writes eval/out/DEBRIEF.md (gitignored: lesson text can name real repos).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
const rows = readFileSync(join(outDir, "scored.jsonl"), "utf8")
  .split("\n").filter(Boolean).map(JSON.parse);

const med = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/**
 * Each signature is a predicate over a run plus the file that owns the rule it
 * violated. The owner is what makes this actionable rather than diagnostic.
 */
const SIGNATURES = [
  {
    id: "dispatched-but-never-landed",
    test: (r) => r.parts.landed === 0,
    owner: "auto-office/skills/auto-closeout/SKILL.md",
    reading: "The office was invoked and no PR came out of it. Either the run was abandoned, or closeout never ran.",
  },
  {
    id: "user-interrupted",
    test: (r) => r.interrupts > 0,
    owner: "auto-office/SKILL.md (goal-lock and the no-further-go-aheads claim)",
    reading: "The user stopped the run. The strongest dissatisfaction signal a transcript holds — a goal-locked run that gets interrupted was not actually goal-locked.",
  },
  {
    id: "tool-error-storm",
    test: (r) => r.tool_calls >= 10 && r.tool_errors / r.tool_calls > 0.15,
    owner: "the brand's `*-cli` spoke",
    reading: "More than one call in seven failed. That is a launch-form or flag defect, not a model defect.",
  },
  {
    id: "review-round-burn",
    test: (r) => (r.verdicts?.["CHANGES REQUIRED"] || 0) >= 2,
    owner: "office-core/protocol/review-states.md (the 2-round PLAN DEFECT presumption)",
    reading: "Two or more rounds of findings on one run. Core says that is evidence about the instruction, not the worker — check the presumption actually fired.",
  },
  {
    id: "plan-defect",
    test: (r) => (r.verdicts?.["PLAN DEFECT"] || 0) > 0,
    owner: "auto-office/skills/auto-planning/SKILL.md (Step 7.4 planner self-review)",
    reading: "The plan was wrong and review caught it. Every one of these is a planner self-review that did not find what a fresh reader did.",
  },
  {
    id: "brief-defect",
    test: (r) => (r.verdicts?.["BRIEF DEFECT"] || 0) > 0,
    owner: "office-core/protocol/evidence-and-handoff.md (pin the shape)",
    reading: "The executor returned rather than implementing around a bad pin. This is the system working — a rising count is good news, not bad.",
  },
  {
    id: "no-verdict-at-all",
    test: (r) => Object.keys(r.verdicts || {}).length === 0 && r.attributed_turns > 20,
    owner: "office-core/protocol/review-states.md (the three verdicts)",
    reading: "A substantial run that never produced one of the three literal verdicts. The gate either did not run or did not say so in words the run can act on.",
  },
  {
    id: "compaction-heavy",
    test: (r) => r.session_compactions >= 3,
    owner: "office-core/protocol/evidence-and-handoff.md (compact recommendation)",
    reading: "Three or more compactions in one run. Each one drops state the run then re-reads; the advisor hook exists to make the call earlier.",
  },
];

const hits = SIGNATURES.map((sig) => {
  const matched = rows.filter(sig.test);
  return {
    ...sig,
    n: matched.length,
    share: rows.length ? Math.round((matched.length / rows.length) * 100) : 0,
    skills: Object.entries(
      matched.reduce((acc, r) => ((acc[r.skill] = (acc[r.skill] || 0) + 1), acc), {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 4),
    onCurrent: matched.filter((r) => r.version_is_current).length,
    medWall: med(matched.filter((r) => r.wall_clock_s).map((r) => r.wall_clock_s)),
    tokens: sum(matched.filter((r) => r.tokens_out).map((r) => r.tokens_out)),
  };
}).filter((h) => h.n > 0).sort((a, b) => b.n - a.n);

const L = [];
L.push("# Debrief — what the mistakes are asking you to change");
L.push("");
L.push(`Generated ${new Date().toISOString()} by \`eval/debrief.mjs\` over ${rows.length} scored office runs.`);
L.push("");
L.push("Ranked by frequency. `owner` is the file that holds the rule the run violated — that is");
L.push("where the fix goes, so the lesson persists instead of being relearned.");
L.push("");
L.push("| Signature | runs | share | on current | med wall | owner |");
L.push("|---|---|---|---|---|---|");
for (const h of hits) {
  L.push(`| \`${h.id}\` | ${h.n} | ${h.share}% | ${h.onCurrent || "—"} | ${h.medWall ? h.medWall + "s" : "—"} | \`${h.owner}\` |`);
}
L.push("");
for (const h of hits) {
  L.push(`## \`${h.id}\` — ${h.n} runs (${h.share}%)`);
  L.push("");
  L.push(h.reading);
  L.push("");
  L.push(`**Owner:** \`${h.owner}\``);
  L.push("");
  L.push(`**Concentrated in:** ${h.skills.map(([s, n]) => `\`${s}\` (${n})`).join(" · ")}`);
  if (h.tokens) L.push(`\n**Output tokens spent inside runs carrying this signature:** ${Math.round(h.tokens / 1000)}k`);
  L.push("");
}

L.push("## How to use this");
L.push("");
L.push("A signature with a high share and a named owner is a rule that is not landing. Two ways a");
L.push("rule fails to land, and they need opposite fixes:");
L.push("");
L.push("- **Never read** — the rule sits behind a pointer that does not fire. Sharpen the pointer.");
L.push("- **Read and ignored** — the rule is present and the run went past it. Make the harness");
L.push("  enforce it (a hook, a schema field, a checker) rather than restating it louder.");
L.push("");
L.push("The second is why the telemetry moved into hooks: `run-event.schema.json` was read and");
L.push("ignored for three weeks because obeying it was optional at the moment of dispatch.");

writeFileSync(join(outDir, "DEBRIEF.md"), L.join("\n") + "\n");
console.log(`${hits.length} failure signatures -> eval/out/DEBRIEF.md`);
for (const h of hits) console.log(`  ${String(h.n).padStart(4)}  ${h.share}%  ${h.id}`);
