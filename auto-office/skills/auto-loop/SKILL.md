---
name: auto-loop
description: Phase 2–3 — the goal-locked autonomous loop that runs dispatch → liveness → verify → review → fix per task until every done-criterion is green, with hard caps, the 2-round plan-defect presumption, and four stop conditions. Loaded by the auto-office hub; not invoked directly.
---

# Auto Loop

After approval the run is **end-to-end**. No go-aheads, no "shall I continue," no summarizing and
waiting. Report progress and keep moving until closeout or a stop condition.

## The loop

```
before the loop:
    planner self-review of the plan          (auto-planning 7.4)
    one adversarial plan-review, then it retires   (auto-planning 7.5)
    ≥2 executors?  → spawn a PM by CLI to distribute briefs and collect results
    1 executor?    → no PM at all
load GOAL block
for each task in plan order:
    dispatch                  (form derived; sibling office spoke per delegation-map)
    liveness check            (see below — no output means confirm dead before re-dispatch)
    verify independently      (mandatory extra pass if agy executed)
    executor returns BRIEF DEFECT → stop this task, do not implement, do not consume a round
                                    → planner (technical) or user (scope)
    fresh Opus review         (resumed reviewer, same session across rounds)
    while verdict == CHANGES REQUIRED and round <= 5:
        triage → fix → re-review
        2 consecutive CHANGES REQUIRED on this task → presume PLAN DEFECT (below)
    verdict == PLAN DEFECT    → exits the loop for this task, does not consume a round
    verdict == APPROVED       → next task
re-read GOAL:
    all done_criteria green?  → closeout
    a criterion still red?    → new task, back into the loop (counts an iteration)
    caps exhausted?           → stop and report the deadlock
```

## Liveness check after every CLI dispatch

A dispatch that produces nothing is not a dispatch that is thinking. After every CLI launch, confirm
the process is **producing output within a stated window** — the harness's completion notification, a
growing log, a handoff file whose mtime moves.

**No output does not authorize a re-dispatch. Confirm the process is actually dead first** — `pgrep`
it, check the handoff mtime, or stop it explicitly. A silent-but-live process plus a replacement is
**two writers in one tree**, which is the invariant this office exists to protect. Kill or confirm
exit, *then* re-dispatch.

Why this is a rule: one run lost **1h38m of wall clock and zero tokens** to a dispatch nobody was
watching. Wall clock is a first-class cost — an hour of nothing costs the run an hour.

**A CLI executor has no return channel unless the brief builds one.** A `--bg` agent's final message
dies with the process, and its log is raw TTY capture, not a transcript. So every CLI brief must name
a **handoff file path** and state plainly that the report is lost without it. Then wait on
`report-exists OR state=done`, never on state alone — an executor killed mid-round (outage, crash)
leaves a report that state polling would step straight past, and an executor that dies before writing
one must still wake you rather than hang. Verified both halves: a resumed-after-outage executor's
report survived on disk and was the only record of the round. Do not end the turn on a live CLI
dispatch; the planner blocking blind is the same cost as the unwatched dispatch above.

**The mechanism is the sibling office's**, never this one's: launch and polling forms live in
`codex-office/skills/codex-cli`, `claude-office/skills/claude-cli`, and `agy-office/skills/agy-cli`.
auto-office owns the *check*, not the CLI.

## Every brief carries these

Beyond the plan path, GOAL block, blast-radius ceiling, and file scope:

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` with the evidence — do not implement anyway.
2. **Any task shipping a test must paste that test failing at `BASE`** (or against the reverted fix).
   A test that was green before the change proves nothing about the change, and a green useless test
   is invisible to review.
   - **Failing at `BASE` is necessary and NOT sufficient — the brief must demand mutation testing
     too.** A new test file "fails" at `BASE` merely by importing a module that does not exist yet;
     that proves the file is new, not that it detects anything. Require the executor to break each
     mechanism its test claims to cover, confirm the test goes red for each, restore, and report
     what it tried. Where the change is a *guard*, require a two-sided assertion: a guard that never
     fires and a guard that always fires must both turn it red, or the test is satisfied by a bailout
     that silently disables the feature.
   - Why this is a brief clause and not a review clause: across one nine-task run, **every single
     `CHANGES REQUIRED` verdict was a test defect, never an implementation defect** — including a
     test whose condition was a compile-time-constant `false`, so its setter never ran and it could
     not fail for any implementation of anything. Reviewers found all of it by mutation testing, at
     reviewer rates, doing work the brief should have demanded up front.
3. **You may fan out in-session** using your own harness's built-in sub-agent mechanism, within your
   file scope and under one-writer-per-tree. The brief never prescribes *how* — that is your office's
   mechanism, not this one's.

## Top of every iteration — the drift check

Before dispatching anything, re-read the GOAL block and answer these. They take ten seconds and
they are what keeps an autonomous run honest:

1. **Which done-criterion does this task serve?** If none, you have drifted — stop and re-plan.
2. **Is this inside `blast_radius`?** A new repo, a new environment, or a new live system is a
   blast-radius widening. Not the loop's call. Stop.
3. **Is this a `non_goal`?** Then it is not happening, however tempting.
4. **Is this `planner_held`?** Stop for the user.
5. **Agy consecutive-task count** — at 3, re-brief with full context restated or re-route.
6. **`git rev-parse --abbrev-ref HEAD` before every commit and every push.** Read it; do not assume
   the branch you created is still checked out.

## The branch you are on is not a fact you may assume

**Observed 2026-08-02, and it reached production.** The planner created a feature branch, worked on
it for two hours, and then — after dispatching a CLI agent that needed a branch off `main` — kept
committing without re-checking. The dispatched agent had switched the *shared* checkout to `main` on
its way to building its own worktree. Two planner commits and a `git push … HEAD` therefore landed on
`main`, which is a production deploy on that project. Vercel shipped it 59 seconds later.

The content happened to be reviewed, approved, and wanted, so nothing broke. That is luck, not a
control.

- **Never dispatch a CLI agent into the tree the planner is working in.** One writer per tree covers
  concurrent *edits*; it did not cover an agent running `git checkout` on the way to somewhere else.
  Pre-create the agent's worktree yourself and point it there, or dispatch from a tree you are not
  using. The brief saying "make your own branch" is not a control — it is a request the agent
  satisfies however it likes.
- **Re-read the branch after any dispatch returns**, not only before committing. A dispatch is a
  point at which the tree may have moved under you.
- **A push is `planner_held` whenever the target branch deploys.** `git push … HEAD` inherits
  whatever branch you are on, so "I only push feature branches" is not true by construction — make
  it true by naming the branch explicitly: `git push <remote> <branch-name>`, never `HEAD`.

## Hard caps

| Cap | Value | On exhaustion |
|---|---|---|
| Review rounds per task | 5 | Stop. Past the cap the failure is structural, not another round's work. Report the deadlock with the last verdict. |
| Agy consecutive tasks | 3 | Re-brief from scratch, or re-route the next task. |
| Loop iterations | as set in GOAL | Stop and report which criteria are still red. |
| **Consecutive `CHANGES REQUIRED` on one task** | **2** | **Declare `PLAN DEFECT`** and take core's existing route. See below. |

**Quota is not a cap.** If the tool the run depends on is draining, re-probe and re-decide the same
way planning did — weigh what remains against what is left to do. Falling back to the named fallback
tool is an in-loop decision, not a stop. Draining a window entirely, when the user was told this run
would not, is worth one line of warning at the next status post; it is still not a stop.

A cap is a signal, not an obstacle. Do not raise a cap to make a run finish.

### The 2-round plan-defect presumption

At two consecutive `CHANGES REQUIRED` rounds on one task, stop funding fix waves and re-plan the
task. Route per `office-core/protocol/review-states.md`:

- **Technical gap** → the planner amends the plan and re-dispatches **only the affected tasks**.
- **Tradeoff, scope, or cost** → the user's call, with the reviewer's reasoning presented.

**No agent is recalled.** The plan-reviewer retired after its single pass and does not come back to
adjudicate work it approved. **Bound: a second amendment to the same task stops the loop for the
user** — a planner amending its own plan is a self-gate, and that bound is what keeps it honest. The
independent code-review gate still holds on whatever the amendment produces, so nothing is
self-approved.

This replaced a dead rule ("2 same-tool failures → reroute to the Decider tier"), which was a no-op
once the executor was already at the tier it was going to be at. It is the direct fix for the run
where one task burned 829k tokens over three review rounds: **the loop stops funding at round 2
instead of round 5.**

## The four stop conditions

The loop returns to the user for exactly these, and nothing else:

1. **A `PLANNER-HELD` step** — deploys, migrations, irreversible writes. Authority never transfers
   to an executor, and autonomy never converts an irreversible action into a routine one.
2. **A destructive or production-facing write** not already approved as part of the GOAL.
3. **An external send** — email, message, public post, bulk outreach. Surface audience and draft;
   get approval in the current session.
4. **A genuinely user-owned decision** — a fork the plan did not anticipate where different choices
   produce materially different work. Recommend, do not infer. Then continue.

Everything else the loop decides itself: which tool to use, how to fix a review finding, whether to
re-route, how to sequence remaining tasks, when to fan out scouts.

**Nothing else is a stop.** A failing test is not a stop, it is the next task. An unclear finding is
not a stop, it is a verification. A slow tool is not a stop, it is a reroute.

## Progress reporting without blocking

Post a one-line status per task completion — task, brand, dispatch form, review rounds, **wall
clock**, verdict, criteria now green. It informs; it does not ask. Never end a status line with a
question the run's continuation depends on. Wall clock goes on the line because it is the cost that
is invisible in a token count and the one a silent dispatch spends.

## Safety rules the loop cannot relax

- One writer per working tree, ever. Sub-delegation is a tool call under the executor's supervision,
  not a second writer. **≥2 executors means ≥2 worktrees, always.**
- **The planner may implement and fix inline** — and it **still never approves its own work**. An
  inline fix goes back through the same fresh reviewer as everything else.
- **Precondition on a planner inline write: no executor may be live in that tree.** Core already
  requires the planner to confirm no other writer is live before dispatching; making planner
  implementation legal creates the *reverse* direction for the first time, so it is stated both ways.
  Planner inline work happens **before dispatch or after the handoff**, never alongside a running
  executor.
- The executor never approves its own work — not on the last task, not on a one-line fix, not
  because it is 3am and the reviewer costs money.
- A successful exit is not evidence. The gate is the plan's validation commands with real pasted
  output. Live-system writes need a read-back.
- If agy executed, the mandatory verification pass runs before review. It exits 0 having done
  nothing often enough that this is structural.
- No cap raised, no phase removed, no reviewer downgraded, mid-run.

## Resuming an interrupted run

The GOAL block plus the plan's task states is the whole resume record. On resume: re-read the GOAL,
re-probe all three tools' headroom (a long run may have crossed a window boundary), re-check which done-criteria are
green **by running their verify commands** — not by trusting the prior session's notes — and
re-enter the loop at the first red one.
