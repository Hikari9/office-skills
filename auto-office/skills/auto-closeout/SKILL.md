---
name: auto-closeout
description: Phase 4 — verify the GOAL is actually green, commit, PR, sync, close every open loop, and emit the run report with its cost retrospective, per-window headroom, and the Opus-only self-heal gate. Loaded by the auto-office hub; not invoked directly.
---

# Auto Closeout

Planner-only. Runs unless the caller said `skip cleanup`.

Mechanics come from the sibling office of the executor that did the work — see
[delegation-map.md](../../references/delegation-map.md). This spoke adds only what is specific to a
routed, autonomous run.

## Gate before commit

Closeout does not begin because the loop *thinks* it finished.

1. **Re-run every `verify` command in the GOAL block** and paste real output. Not the executor's
   record of having run them. Not the reviewer's summary. The commands, now.
2. **Any red criterion sends you back into the loop**, not forward into a commit.
3. **Confirm nothing outside `blast_radius` was touched** — `git status`, and a diff review against
   the declared repos and file scope.
4. **Confirm every `planner_held` step is either done with explicit approval, or still open and
   named as such.** A `PLANNER-HELD` step must never be quietly absorbed into "done."

## Then, the standard closeout

Per the executor's office closeout spoke: commit with a real message, open the PR, verify the
CI/build gate, automerge if that is the repo's convention, sync main, remove the worktree, and close
every open Upline / escalation entry.

### Closeout lands the work; it does not park it

**Unique to auto-office** — the point of this office is autonomous shipping. An open PR is not a
closed loop. **Merge to the target branch, and continue along the repo's promotion chain to its
final branch, regardless of outcome**, unless the caller said otherwise (`no loop`,
`skip cleanup`, "open a PR and stop", or an explicit hold). Leaving a green, mergeable PR sitting
for the user to click is an **incomplete run**, not a courtesy.

- **Read the chain from the repo, do not assume one.** `git log` the candidate branches and look at
  how previous promotions actually landed — merge commit vs squash, and in what order. In
  `connect.favor.church` that chain is `feature → preview → staging → main`, promoted by merge
  commits from `preview` (see PR #182, #190, #191).
- **Promote in order, verifying each hop before the next.** Confirm the merge actually landed
  (`state: MERGED`, and the branch head contains the commit) before opening the next PR. A `gh`
  call that times out mid-merge is **ambiguous, not failed** — re-read the PR state; it may well
  have succeeded.
- **A promotion PR that sweeps up commits the run did not author is normal, not scope creep** — but
  say so in the PR body and to the user, itemized. Check first whether the target is strictly
  behind: if it has commits the source lacks, that is divergence and it is a stop.
- **This does not lift any other gate.** Everything still applies: no self-approval, the reviewer's
  `APPROVED` before any merge, evidence for every done-criterion, and `PLANNER-HELD` still stops
  the loop. Autonomous shipping means *not asking permission to finish a plan already approved* —
  it does not mean shipping unreviewed or unverified work.
- **Name what you could not verify.** If a hop deploys somewhere you were unable to exercise (no
  browser, no credentials, a manual smoke test), merge if the gates are green **and** state plainly
  in the run report and to the user which verification did not happen. Never let an unrun check
  read as a passed one.

## Run report

An autonomous run must be auditable after the fact, because nobody watched it happen. **The run
report is written into the target repo**, not into this plugin — see the artifact-location rule in
[auto-planning](../auto-planning/SKILL.md). Emit:

| Field | Content |
|---|---|
| Goal | The GOAL sentence, and each done-criterion with its final verify output |
| Executors | How many, which brands, the routing reason, and whether a PM was spawned |
| Plan review | The plan-reviewer's brand/model, findings returned, which were applied, which rejected and why |
| Invocation form | `/auto-office` alone, or `/auto-office` + plugin path (which harness planned) |
| Headroom | **Every window, at start and at end, with reset times** — see below |
| Benchmark snapshot | `captured` date used, and whether it was refreshed mid-run |
| Task ledger | Per task: brand, model, effort, dispatch form, review rounds, tokens where reported, wall clock, verdict, `reroute_from`, `brief_defects` |
| Agy exposure | Which tasks agy touched, and that the miss-list checks were run |
| Stops | Every stop condition hit, what was asked, what was answered |
| Caps | Any cap approached or exhausted — including the 2-round plan-defect presumption |
| **Cost retrospective** | See below. One honest paragraph, not a table restated |
| Still open | `PLANNER-HELD` steps not executed, deferred items, known gaps |

**"Still open" is never empty by default.** If it genuinely is, say so explicitly rather than
omitting the row.

### Cost retrospective

Core 1.2.0 requires this of every office (`office-core/protocol/closeout.md`). Here it means: the
task ledger above, plus **one honest paragraph** naming what was over- or under-provisioned — the
brief that was too thin and bought three review rounds, the dispatch that bought isolation nobody
used, the wall clock spent on a process nobody was watching.

- **agy reports no token counts.** Say so explicitly. Do not print `0`, which reads as a
  measurement; for agy, **wall clock and review rounds are the cost signal**.
- **Wall clock is a line item, not a footnote.** A dispatch that produced nothing for an hour cost the
  run an hour whether or not it burned a token.
- Then append one row per task to
  [routing-outcomes.md](../../references/routing-outcomes.md) — the workspace-local ledger the next
  run's routing reads *before* the benchmark file.

### Headroom

Report **both windows at start and at end, each with its reset time**, for every brand probed.

**Single-number deltas are banned.** `--percent` returns the tightest of two windows, so a run whose
5-hour window resets mid-flight reads as *gaining* headroom: last run logged `82% → 52% → 85%`, which
described nothing that happened. A start-to-end subtraction across a window boundary is not a
measurement.

## Self-heal gate — permitted only when the planner is claude/Opus

Closeout may sharpen these skills, under one condition: **the planner is claude at Opus tier.** A
codex or agy planner writes a **proposal block** into the run report and stops — it does not edit.

Self-healing is authority to change the rules that gate future runs. It is the one place in this
office where reviewer-grade judgment is load-bearing, which is why it is Opus-only.

Even then:

- **Sharpen a rule; never append an anecdote.** A list of past situations does not generalize.
- **Edit the owning file** per the maintenance matrix — routing lessons to `auto-routing`, loop
  lessons to `auto-loop`, CLI lessons to the sibling office that owns that CLI.
- **Never** relax a safety rule, raise a cap, widen a blast radius, or downgrade a reviewer.
- **Never edit a vendored `office-core/` copy.** A shared invariant is a *proposed* core change.
- **Show the diff in the run report** and bump the plugin `CHANGELOG`.

## Feeding the next run

Route each lesson to its owner, and prefer sharpening a rule over appending a scenario. All of this
is subject to the self-heal gate above — an agy or codex planner *proposes* every item below.

- The per-task cost row → [routing-outcomes.md](../../references/routing-outcomes.md), always. This
  one is a record, not a rule change, so it is appended at every closeout.
- A route that was wrong in hindsight → [auto-routing](../auto-routing/SKILL.md), as a rubric
  change, not an anecdote.
- A tool behaving worse or better than its benchmark row → note it in
  [model-benchmarks.md](../../references/model-benchmarks.md) as observed behavior; local
  experience outranks the leaderboard.
- A loop that drifted, stopped too often, or failed to stop → [auto-loop](../auto-loop/SKILL.md).
- A CLI gotcha → the sibling office that owns that CLI, never patched around here.
- A shared invariant → propose a core change; never edit a vendored copy.

Nothing durable to add is a legitimate outcome. Do not manufacture a lesson.
