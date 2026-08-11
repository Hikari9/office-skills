---
name: auto-closeout
description: Phase 4 — verify the GOAL is actually green, commit, PR, sync, close every open loop, and emit the run report with its cost retrospective, per-window headroom, and the Opus-only self-heal gate. Loaded by the auto-office hub; not invoked directly.
---

# Auto Closeout

Planner-only. Runs unless the caller said `skip cleanup`.

**Entering this phase, re-read the [auto-office hub](../../SKILL.md) and this spoke before acting** —
including after any compaction. Whoever holds the phase re-reads, same agent or fresh.

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
5. **Read the promotion chain out of the repo before opening the PR**, not after. `gh pr list --state
   merged --json number,headRefName,baseRefName` shows where feature branches actually land; a base
   picked from the repo's *default* branch is a guess. Getting this wrong late means merging the
   target back in, which invalidates the run's green gate (see below) and costs more than the lookup.
6. **If the run bumps a version, prove the value is unclaimed across EVERY ref** — by reading the
   file per-ref, **not** with the pickaxe:

   ```bash
   git fetch origin --prune
   for r in $(git for-each-ref --format='%(refname)' refs/remotes/origin | sed 's|refs/remotes/||'); do
     v=$(git show "$r:package.json" 2>/dev/null | grep -m1 '"version"' | sed 's/.*"version": "\([^"]*\)".*/\1/')
     [ "$v" = "X.Y.Z" ] && echo "claims X.Y.Z: $r"
   done
   ```

   `git log --all -S'"version": "X.Y.Z"'` **does not work for this** and will hand you a false all-clear:
   `git log` defaults to `--diff-merges=off`, so the pickaxe never looks inside merge commits — and the
   bump is habitually authored *inside* one, as part of resolving the `package.json` conflict when the
   target branch is merged into the feature branch. Observed 2026-08-11: the pickaxe reported 0 claimants
   for `2.28.4` while three promotion branches were sitting on it. Comparing `>` against the promotion
   branches is **not this check** either: an unmerged branch already holding your value passes it. A version is the one field
   where "both sides agree" is evidence of a bug rather than of safety — matching strings merge with
   **no conflict**, so two changesets ship under one number with zero signal, and the *silent* case is
   a branch that shares no code with yours, because nothing else conflicts to catch your attention.
   Re-run the check immediately before the merge, not only when choosing the number; a claimant can
   land in between.

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

### A branch behind its target must be merged, re-gated, and re-reviewed

Promotion assumes the branch was built against the tree it is landing on. Once it is behind, that
assumption is dead and the run's green gate describes a tree that no longer exists.

- **Re-run the full gate on the MERGED tree.** The pre-merge run is evidence about a different tree.
  This is a *cause* to re-run under any validation budget, not an exception to it.
- **A clean auto-merge is the hazard; a conflict is the reassurance.** A conflict is a question git
  asks out loud. A clean merge of files both sides edited produces a tree nobody has tested, silently.
  Never treat `git merge-tree`'s "no conflict" as clearance — it can simply be wrong.
- **Resolve to the union of intents, never to a redesign.** Where both sides edited one region for
  different reasons, take the other side's *position and structure* with your *content*. Preserve the
  other side's shipped behaviour **verbatim even when it is wrong**, and file the defect: a fix made
  inside a merge is attributed by `git blame` to your PR, sending the next debugger to the wrong one.
- **Diff the result against BOTH parents, TWO-dot, never three-dot** — `git diff <parent> HEAD`, not
  `git diff <parent>...HEAD`. That is the only check that catches a silently dropped hunk, and the
  three-dot form **cannot** find one: it diffs from the merge-base, so content the parent added after
  that base and the merge then dropped reads as "not in scope" rather than as missing. Observed: a
  three-dot diff showed exactly the 6 intended feature files while 47 lines of the target's own test
  mocks had been dropped from a 7th file the branch never touched. The result should differ from the
  target parent by **only** the files the run intended; anything else is a dropped hunk or scope creep.
  To prove completeness rather than infer it, hash every path the parent changed since the merge-base:
  `git diff --name-only <base> <parent> | while read f; do [ "$(git show <parent>:"$f"|shasum)" = \
  "$(git show HEAD:"$f"|shasum)" ] || echo "DIFFERS: $f"; done`
- **Re-review the resolution, and re-run the task's own mutations against the merged file.** Tests
  passing after a merge proves they still run, not that they would still catch the regression they
  were written for.
- **The deploy check is the authority on anything the local toolchain cannot observe.** Install and
  lockfile consistency, route/prerender behaviour, and env-dependent config can all be green locally
  and broken on the platform. If a deploy check fails where every local gate passed, suspect a
  local-toolchain blind spot before suspecting the check.

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

### Close the issue loop — file the carries, close what is actually done

A run report is a record; the issue tracker is what the team reads. Closeout updates both.

**File every deferred carry as a real issue, at closeout, not as a draft file.** A carry that is
neither fixed nor filed has been dropped — the plan doc it lives in is read by nobody after the run
ends. Filing is cheap: an issue costs a minute and buys the finding a name, a URL, and a place in
triage.

- **Filing an issue is not a `PLANNER-HELD` action.** Push, PR, merge, deploy and remote config are
  held because they are irreversible or user-facing. An issue is neither — it is reversible, internal,
  and the alternative is losing the finding. Do not let a hold on *shipping* silently expand into a
  hold on *recording*. (Observed: a planner treated a caller's "you may not push/PR/merge/deploy"
  hold as covering issue creation, and left eight findings in a draft file.)
- **Split by triage destination, not by count.** A defect that needs design work does not belong in
  the same issue as a doc-wording nit — one issue's severity becomes the other's, and the important
  one gets triaged as tidy-up. Two or three focused issues beat one grab-bag and beat one-per-item.
- **Use labels that exist.** `gh label list` first; inventing a label silently fails or creates one.
- **Cross-link both directions** — comment the new issue numbers onto the originating issue, and
  reference the originating issue from each new one.

**Close an issue only when the work is on the branch users actually get.** Not when the branch is
ready, not when the reviewer approved, not when the run report says green.

- **Verify it, do not assume it:** `git merge-base --is-ancestor <sha> origin/<default-branch>`.
- **A promotion-chain merge usually will NOT auto-close it.** `Closes #N` fires only for the default
  branch, so a `preview`- or `staging`-base merge leaves the issue open and it must be closed by hand
  after the final hop.
- **If the run ends with the work unmerged — because a hold stopped it — say so in the report and
  leave the issue open.** Closing it would tell the team a fix has shipped that nobody can use. State
  what would make it closable.
- Close any *dependency* issues the run genuinely resolved, under the same merged-to-default test.

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
