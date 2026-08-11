---
name: auto-loop
description: Phase 2–3 — the goal-locked autonomous loop that runs dispatch → liveness → verify → review → fix per task until every done-criterion is green, with hard caps, the 2-round plan-defect presumption, four stop conditions, and the per-task compaction recommendation. Loaded by the auto-office hub; not invoked directly.
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
        2 CHANGES REQUIRED on this task (total, not consecutive) → presume PLAN DEFECT (below)
    verdict == PLAN DEFECT    → exits the loop for this task, does not consume a round
    verdict == APPROVED       → next task
re-read GOAL:
    all done_criteria green?  → closeout
    a criterion still red?    → new task, back into the loop (counts an iteration)
    caps exhausted?           → stop and report the deadlock
```

## Liveness check after every CLI dispatch

**The window is 25 minutes.** After every CLI launch, confirm the process produced output inside it —
the harness's completion notification, a growing log, or a handoff file whose mtime moved. A dispatch
producing nothing is not a dispatch that is thinking. (One run lost 1h38m of wall clock and zero
tokens to an unwatched dispatch; wall clock is a first-class cost.)

**Silence does not authorize a re-dispatch. Confirm the process is dead first** — `pgrep`, handoff
mtime, or stop it explicitly. A silent-but-live process plus a replacement is **two writers in one
tree**. Kill or confirm exit, *then* re-dispatch.

**A CLI executor has no return channel unless the brief builds one.** A `--bg` agent's final message
dies with the process and its log is raw TTY capture, not a transcript. Every CLI brief names a
**handoff file path** and states that the report is lost without it.

**End the turn on the wait condition: `report-exists OR state=done`.** Never on state alone — an
executor killed mid-round (outage, crash) leaves a report that state polling steps straight past, and
one that dies before writing a report must still wake you rather than hang. Ending the turn *on that
condition* is correct and is what this rule requires; what is forbidden is ending it on a bare live
dispatch with no condition attached, which is waiting for nothing.

**Mechanism is the sibling office's** — `codex-office/skills/codex-cli`,
`claude-office/skills/claude-cli`, `agy-office/skills/agy-cli`. auto-office owns the *check*.

## Every brief carries these

Beyond the plan path, GOAL block, blast-radius ceiling, and file scope:

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` with the evidence — do not implement anyway.
2. **Any task shipping a test must paste that test failing at `BASE`** (or against the reverted fix).
   A green useless test is invisible to review.
   - **Failing at `BASE` is necessary, not sufficient — demand mutation testing too.** A new test file
     "fails" at `BASE` merely by importing a module that does not exist yet. Require the executor to
     break each mechanism its test claims to cover, confirm the test goes red for each, restore, and
     report what it tried.
   - **A guard needs a two-sided assertion:** a guard that never fires and one that always fires must
     *both* turn the test red, or a bailout that silently disables the feature satisfies it.
   - **A mutation that stays green is a claim about the mutation before it is a claim about the gate.**
     Prove the break actually took effect — that the edited file is the one the gate loads, that the
     anchor existed, that the injected code runs in the scope the gate inspects — *then* read the
     verdict. Measured 2026-08-09: three of a planner's own mutations were invalid (one edited the
     generated artifact while the harness loads the authored source; one anchored on a string absent
     from the file; one landed textually correct but inside a click handler, so its element was
     created after the gate had counted elements). All three printed "0 FAILs", and two were within a
     sentence of being reported as "the gate is blind". The asymmetry is the point: a broken mutation
     and a blind gate produce identical output, and the broken mutation is the likelier of the two.
   - Evidence for it being a brief clause, not a review clause: across one nine-task run every
     `CHANGES REQUIRED` verdict was a test defect, never an implementation defect — including a test
     whose condition was a compile-time-constant `false`. Reviewers caught it all by mutation testing,
     at reviewer rates, doing work the brief should have demanded.
3. **Name the OBSERVABLE OUTCOME, and verify the path to it against the graph before writing the
   brief.** A brief that specifies a mechanism is satisfied by fixing that mechanism — which is not
   the same as fixing the symptom. Write the acceptance as what the user sees, then trace, in the
   code, which call site actually produces it.
   - **A data path is not automatically a render path.** Measured across one run: four briefs named a
     function that fed a sort key, a dead fallback branch, or a write half, while the visible value
     came from somewhere else entirely. Each passed review *on the thing the brief named* and left
     the symptom intact. Cost: roughly six review rounds, all of them at reviewer rates.
   - **Enumerate the full lifecycle of any state the task introduces**, not the half in front of you.
     For a cache or overlay that is write / read / **clear**; for a resource it is acquire / use /
     release. A brief naming two of three ships the third as a defect — twice in one run, the missing
     seam was the *clear*, i.e. state that is written and read correctly and then shadows the server
     forever.
   - **Cheapest possible check, and it is a planner check, not an executor one:** grep the plan's
     done-criteria for the field or behaviour the task is about. If no criterion names it, ask whether
     the task should exist before funding a round of it. One run spent three review rounds on a field
     that appeared in no done-criterion; the decisive grep took seconds and was run only after the
     second `CHANGES REQUIRED`.
4. **You may fan out in-session** using your own harness's built-in sub-agent mechanism, within your
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

- **Never dispatch a CLI agent into the tree the planner is working in.** Pre-create the agent's
  worktree and point it there, or dispatch from a tree you are not using. One writer per tree covers
  concurrent *edits*, not an agent running `git checkout` en route to its own worktree. A brief saying
  "make your own branch" is a request, not a control.
- **Re-read the branch after any dispatch returns**, not only before committing.
- **A push is `planner_held` whenever the target branch deploys.** Name the branch:
  `git push <remote> <branch-name>`, **never** `HEAD` — `HEAD` inherits whatever you are on, so "I
  only push feature branches" is not true by construction.

Evidence (2026-08-02, reached production): a dispatched agent left the shared checkout on `main`; two
planner commits and a `git push … HEAD` landed there and deployed in 59 seconds.

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

At two `CHANGES REQUIRED` rounds on one task — consecutive or not — stop funding fix waves and re-plan the
task. Route per `office-core/protocol/review-states.md`:

- **Technical gap** → the planner amends the plan and re-dispatches **only the affected tasks**.
- **Tradeoff, scope, or cost** → the user's call, with the reviewer's reasoning presented.

- **No agent is recalled.** The plan-reviewer retired after its single pass and never adjudicates work
  it approved.
- **A second amendment to the same task stops the loop for the user.** A planner amending its own plan
  repeatedly is a self-gate. The independent code-review gate still holds on whatever the amendment
  produces, so nothing is self-approved.

Evidence: one task burned 829k tokens over three review rounds. The loop now stops funding at round 2
instead of 5.

## The four stop conditions

The loop returns to the user for exactly these, and nothing else:

1. **A `PLANNER-HELD` step** — deploys, migrations, irreversible writes. Authority never transfers
   to an executor, and autonomy never converts an irreversible action into a routine one.
2. **A destructive or production-facing write** not already approved as part of the GOAL.
3. **An external send** — email, message, public post, bulk outreach. Surface audience and draft;
   get approval in the current session.
4. **A genuinely user-owned decision** — a fork the plan did not anticipate where different choices
   produce materially different work. **Ask it as an `AskUserQuestion` with your recommendation as
   the first option, and wait for the answer.** That is the pause; the run resumes on the answer, not
   on your inference. Recommend, never infer.

Everything else the loop decides itself: which tool to use, how to fix a review finding, whether to
re-route, how to sequence remaining tasks, when to fan out scouts.

**Nothing else is a stop.** A failing test is not a stop, it is the next task. An unclear finding is
not a stop, it is a verification. A slow tool is not a stop, it is a reroute.

## Progress reporting without blocking

Post a one-line status per task completion — task, brand, dispatch form, review rounds, **wall
clock**, verdict, criteria now green, **`compact:`**. It informs; it does not ask. Never end a status
line with a question the run's continuation depends on. Wall clock goes on the line because it is the
cost that is invisible in a token count and the one a silent dispatch spends.

## The compaction recommendation, every task boundary

Core owns this rule:
[`evidence-and-handoff.md` § Run-state durability](../../office-core/protocol/evidence-and-handoff.md).
Read it for when `yes` is warranted, what a `no` obliges, and why a live executor never withholds a
`yes`. This office narrows it in exactly two ways:

- **The boundary is a task reaching `APPROVED`**, not merely a phase closing — this office runs a
  loop, so it has more boundaries than a linear office and each one is a real offer.
- **The field is the last one on the status line above**, so it rides a line the user is already
  reading and never becomes a message of its own.

**A compaction is a protocol boundary, so reload across it.** The first act after any compaction —
and on entering any phase — is to re-read the [auto-office hub](../../SKILL.md) and this phase's
spoke before acting. Compaction at a task boundary is the main way a run loses the protocol while
keeping the run state, and a survivor that remembers the GOAL but not the gates is the exact shape of
the failure. Same agent or fresh agent makes no difference; whoever holds the phase re-reads.

### Brief sizing is the same problem, one level down

Core states the principle; the evidence for it came from this office. A brief spanning ten call
sites across three surfaces returned four, at 329k tokens and 142 tool calls, with a handoff naming
exactly what it skipped. **The executor was correct; the brief was unholdable.** Size a brief to one
surface, and split on surface boundaries, never on file count.

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
- **A mutation-testing reviewer is NOT read-only. Verify the tree after every review, including an
  approved one.** It edits source to prove a test reddens and restores as the *last* step of a
  sequence that can be interrupted — so a killed reviewer leaves the mutation applied, and never
  reaches the "tree is clean" line its own report would have carried. Treat a missing completion
  record as *assume a mutation is applied*, not *assume nothing happened*; the next executor would
  otherwise start from a silently altered file outside its own scope. Every one-writer rule in this
  file points at executors, which is exactly why this gap survives. Require reviewers to apply, run
  and restore each mutation **within a single tool call** with a restore proof, so the window closes
  structurally rather than by discipline.
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
