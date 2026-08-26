# Telemetry Event Model

How an office run gets measured. **The harness records it; no role emits anything.**

## Why this was rewritten

The first version of this document told each hub to record an event at every explicit dispatch, and
`run-event.schema.json` has defined ten event types since core `3.0.0`. It produced **zero records
in three weeks.**

The failure was structural, not sloppy. Emitting an event was an instruction *to the model*, carried
as prose in a hub — so the measurement depended on the thing being measured choosing to cooperate,
at exactly the moment its context was fullest. That is the defect
[`evidence-and-handoff.md`](../office-core/protocol/evidence-and-handoff.md) already names about
self-reported success, one level up.

**A rule that is read and ignored does not need to be restated louder. It needs the harness to
enforce it.** Everything below reads Claude Code's own transcripts.

## What collects it

| Hook | Event | What it writes |
|---|---|---|
| `SessionEnd` | session ends | one run event per skill the session used |
| `PreCompact` | before a compaction | run-state scratchpad + a `run.compacted` continuity marker |
| `Stop` | every lull | the `compact: yes\|no — <driver>` recommendation |

Install: `node eval/hooks/install.mjs`. Remove: `--uninstall`. Sink:
`~/.claude/office-skills-telemetry/`, outside any repo, because committing run state beside a live
executor orphaned two commits in one run.

## What counts as an invocation

Session logs repeat the whole skills catalog at startup, and planning text quotes commands verbatim,
so a text match on `/auto-office` counts mentions rather than runs. Two signals are real:

- **A `Skill` tool call** — explicit dispatch.
- **`attributionSkill` on a turn** — the harness's own attribution, which also catches a skill that
  was followed without a tool call.

A keyword match in prose is neither, and never produces an event.

## The schema

[`run-event.schema.json`](../office-core/schemas/run-event.schema.json). Every event carries plugin
id and version, core version, invocation id, and timestamp, so a measurement attributes to the exact
code that produced it. Backfilled records are tagged `source: "backfill"` and live ones
`source: "session-end-hook"` — the same code path shapes both, so a retro number and a live number
are the same measurement.

**Privacy: counts and redacted labels only.** No prompt text, no tool arguments, no file contents.
Prompts reduce to a length and a truncated hash; repos to opaque slugs, with the slug map gitignored.

## Version attribution

The offices are symlinked into `~/.claude/skills`, not installed from a marketplace cache, so the
version live at any instant is the working tree at that instant.
[`../eval/VERSION-TREE.md`](../eval/VERSION-TREE.md) maps any timestamp to one version vector.

Its soft edge: development happens in that same tree, so content runs live before the commit that
records it. A run inside 6 hours before a bump is stamped `fuzzy` and excluded from current-version
scoring — evidence about neither version rather than wrong evidence about the older one. Old
transcripts predate this and carry no version of their own, which is the whole reason the stamp
exists.

## The goal

**Landed rate ≥ 80%** — the share of office runs that open a PR. Checked by `eval/gate.mjs`,
enforced once a scope holds 15+ runs, reported below that.

**80% is not aspirational; this corpus already reaches it in one segment.** Office runs whose
session compacted land at **90%** (112/125). Runs that never compacted land at **30%** (82/271). The
gap survives controlling for length — among runs of 40+ turns it is still **90% vs 32%** — so it is
not simply that long runs compact.

That is the bar this document sets before a warning becomes a gate: a threshold is realistic when
something already clears it. The relationship is correlational, and the likeliest reading is that
both are downstream of a run being *actively driven to completion* rather than abandoned. So the
segment is reported beside the goal rather than turned into a rule that says "compact more" —
`dispatched-but-never-landed` in the debrief is where the other 70% actually lives.

Landed is the gated number because it counts an artifact **outside** the transcript. The composite
score in [`../eval/SCORECARD.md`](../eval/SCORECARD.md) is not gated: its `gate` component is matched
on literal strings, and `uninterrupted` sits at 94–100% across every office, so the composite is
inflated and cannot carry a threshold honestly.

The second 80% is skill-eval's `pass-threshold` in
[`../.github/workflows/skill-eval.yml`](../.github/workflows/skill-eval.yml), which grades the
current version on every PR — the only number that exists before a version has been used.

## Scorecard

Warnings, not gates, until a baseline shows a threshold is realistic and you know what a violation
costs.

| Metric | Measure | Target |
|---|---|---|
| Landed rate | Office runs opening a PR | **≥ 80%** (gated) |
| Eval pass rate | skill-eval criteria passing per office | **≥ 80%** (gated in CI) |
| Hub payload | Hub plus mandatory core | ≤ 12,000 bytes, per `check-plugins.sh` |
| Role packet | Kernel, adapter, selected spokes | ≤ 20K tokens absent a documented exception |
| Unselected office material | Bytes in a worker packet | 0 |
| Invocation attribution | Runs carrying an event id | 100% of runs after hook install |
| Duplicate writers | Overlapping sessions in one worktree | 0 |
| Required proof | Final gates showing real output | 100% |
| Escaped defects | Reviewer or post-merge findings | No regression |

## The baseline window

Recent evidence beats old evidence: these skills change often. Rolling **14 days**, newest 7 weighted
4× days 8–14. Anything older is qualitative history, labelled with the office version it came from.

## Turning mistakes into changes

`eval/debrief.mjs` groups runs by **failure signature** and names the file that owns the violated
rule, so a lesson lands in the skill rather than being relearned. A signature fails to land in one of
two ways, and they need opposite fixes:

- **Never read** — the pointer to the rule does not fire. Sharpen the pointer.
- **Read and ignored** — the run went straight past it. Make the harness enforce it.

This document is an instance of the second.
