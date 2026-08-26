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

Four harnesses, which agree on almost nothing — different config files, different event names,
different formats. Each gets only the events it actually has:

| Harness | Config | Events used |
|---|---|---|
| Claude Code | `~/.claude/settings.json` | `SessionEnd`, `PreCompact`, `Stop` |
| Codex | `~/.codex/hooks.json` | `SessionStart`, `PreCompact` — it has no `SessionEnd` |
| Gemini CLI | `~/.gemini/config/hooks.json` | `SessionEnd`, `Stop` (namespaced under `office-skills`) |
| Hermes | `~/.hermes/profiles/<active>/config.yaml` | `on_session_end`, `on_session_finalize` |

**Nothing is wired to an event a harness does not have.** A hook that goes silent because its event
never fires is indistinguishable from "no runs happened", which is the failure this whole system
exists to stop.

Because Codex has no `SessionEnd`, the emitter is **watermark-based** rather than per-session:
`catch-up.mjs` emits every session newer than the last watermark and is idempotent by session id, so
it can hang off whatever event a harness does offer — `SessionStart` catches up the previous run.

Install: `node eval/hooks/install.mjs`. Remove: `--uninstall`. Scope with `--brand`. Sink:
`~/.claude/office-skills-telemetry/`, outside any repo, because committing run state beside a live
executor orphaned two commits in one run.

Two harness-specific traps, both found the hard way: Hermes reads the **active profile's** config,
so writing to `~/.hermes/config.yaml` installs nothing and reports success. And its shell hooks need
first-use consent — a newly installed hook shows `✗ not allowlisted` until it is approved once.

## What counts as an invocation

Session logs repeat the whole skills catalog at startup, and planning text quotes commands verbatim,
so a text match on `/auto-office` counts mentions rather than runs. Two signals are real:

- **A `Skill` tool call** — explicit dispatch. Claude Code only.
- **`attributionSkill` on a turn** — the harness's own attribution, which also catches a skill that
  was followed without a tool call. Claude Code only.
- **A `SKILL.md` read** — Codex, Gemini, and Hermes have no Skill tool, so a skill enters those runs
  by its file being read. That read is an action, not a mention, so it counts.

A keyword match in prose is none of these, and never produces an event.

**The two signals are not interchangeable and events say which they are.** `signal: "skill-tool"` is
a recorded dispatch; `signal: "skill-md-read"` is inferred, and it cannot see a skill already in
context or bill turns the way per-turn attribution does. The scorecard segments by harness so a
cross-harness comparison always states which measurement it is using.

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

**80% is a direction, not a demonstrated ceiling — and that is a correction.** It was set when the
only data was Claude Code's, where runs whose session compacted landed at 90%. Adding the Codex
backfill — 4,193 events, and where most office runs actually happen — moved the best segment to
**74%**. Nothing in this corpus currently clears 80%.

The segment itself survived: compacted runs land far better than uncompacted ones, and the gap holds
after controlling for length. The relationship is correlational, and the likeliest reading is that
both are downstream of a run being *actively driven to completion* rather than abandoned. So it is
reported beside the goal rather than turned into a rule that says "compact more" —
`dispatched-but-never-landed` is where the missing runs actually live.

**The live figures are computed by `eval/score.mjs`, never written into this file.** A measurement
pasted into prose is a cache of a lookup, and this paragraph is the reason that rule exists: the
first version of it hardcoded 90% and was wrong within a day.

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
