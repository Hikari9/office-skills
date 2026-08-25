---
name: auto-loop
description: Phase 2–3 — the goal-locked autonomous loop that runs dispatch → liveness → verify → review → fix per task, lands each milestone as its criteria go green, and stops for only two things. Hard caps, the 2-round plan-defect presumption, named-action preconditions, and the compaction recommendation. Loaded by the auto-office hub; not invoked directly.
---

# Auto Loop

After approval the run is **end-to-end**. No go-aheads, no "shall I continue," no summarizing and
waiting. Report progress and keep moving until closeout or a stop condition.

## The loop

```
before the loop:
    planner self-review of the plan               (auto-planning 7.4)
    full gear only: one adversarial plan-review, then it retires   (auto-planning 7.5)
    ≥2 executors?  → the planner distributes and monitors. There is no PM.
load GOAL block
dispatch ONE EXECUTOR per repo, with the WHOLE plan   ← the only work launch the planner makes
                          (CLI, own worktree; sibling office spoke per delegation-map)
for each task the executor completes and hands back:
    liveness check            (see below — no output means confirm dead before re-dispatch)
    verify independently      (mandatory extra pass if agy executed)
    executor returns BRIEF DEFECT → stop this task, do not implement, do not consume a round
                                    → planner (technical) or user (scope)
    fresh Opus review         (resumed reviewer, same session across rounds)
    while verdict == CHANGES REQUIRED and round <= cap:
        triage → fix → re-review
        2 CHANGES REQUIRED on this task (total, not consecutive) → presume PLAN DEFECT (below)
    verdict == PLAN DEFECT    → exits the loop for this task, does not consume a round
    verdict == APPROVED       → milestone check, then next task

    milestone check: every done-criterion in this task's milestone green?
        → LAND IT (auto-closeout, milestone pass): gate → commit → PR → merge the chain
        → then continue the loop. Do not batch milestones.
re-read GOAL:
    all done_criteria green?  → final closeout
    a criterion still red?    → new task, back into the loop (counts an iteration)
    caps exhausted?           → stop and report the deadlock
```

**The loop iterates over the executor's returns, not over your dispatches.** You launch the executor
once per repo and then hold the gate — verify, review, triage, answer consults, perform the
planner-held actions. If you find yourself launching a process for task *n*, stop: that is the
executor's job and you have become a scheduler. The exceptions are the code reviewer (which the
executor must never launch for itself) and, in Phase 1 only, read-only scouts.

**The executor is expected to hand back per task, not per run.** Its brief requires it to stop at
each task boundary, write `EXECUTOR-STATE.md`, and wait — so review happens per task, as it always
has. What changed is who launches the next one: the executor resumes itself, or the planner resumes
it with `--continue`. The planner never launches a *different* process for the next task.

**Landing a milestone is part of the loop, not a phase after it.** The loop that reaches the end
with nothing merged has produced one large unreviewable PR and no re-entry point — which is the
failure this shape exists to prevent. If the milestone's gate is red, that milestone does not land
and the loop does not walk past it into the next one.

## Liveness check after every CLI dispatch

**The window is 25 minutes.** After every CLI launch, confirm the process produced output inside it —
the harness's completion notification, a growing log, or a handoff file whose mtime moved. A dispatch
producing nothing is not a dispatch that is thinking. (One run lost 1h38m of wall clock and zero
tokens to an unwatched dispatch; wall clock is a first-class cost.)

**Silence does not authorize a re-dispatch. Confirm the process is dead first** — `pgrep`, handoff
mtime, or stop it explicitly. A silent-but-live process plus a replacement is **two writers in one
tree**. Kill or confirm exit, *then* re-dispatch.

### `EXECUTOR-STATE.md` is mandatory, and the memory cap is the executor's to manage

Every executor brief requires a resumable state file at the worktree root, rewritten **after every
task**: tasks complete, evidence, open branch points, plan amendments with their commit hashes, and
any question it needs the planner to answer. It is not a status report — it is the file the executor
**re-briefs itself from**.

- **At its brand's consecutive-task cap the executor relaunches itself from that file**, restating
  full context. The planner does not take tasks back to fit a cap; that is the cap disciplining the
  wrong role. (Agy: 3.)
- **No state file is a stop.** A missing or stale `EXECUTOR-STATE.md` means the run has no re-entry
  point, and that failure must be loud rather than discovered at the cap.
- **It is NEVER committed.** It is a run artifact, not a deliverable: it lives at the worktree root,
  is added to `.git/info/exclude` (never to the repo's `.gitignore` — that *is* a committed file),
  and dies with the worktree. The brief must say so **and must forbid `git add -A` / `git commit -a`**,
  because the executor commits its own work and a blanket add is exactly how a scratch file lands in
  a PR. The durable record is the merged branch plus the amendment commits — not this file.
- **Consultation is not free on every brand, so do not design around it.** A `claude` executor has a
  send-message channel while it is live. **`agy` has no inbound channel to a running `--print`
  process** — `--continue` / `--conversation` only resume it *after* it exits. So an agy consult is:
  write the question into the state file, exit, planner answers, planner resumes with `--continue`.
  That works and it is auditable; it also costs a process cycle, which is precisely why the state
  file is mandatory rather than encouraged.

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
2. **Any task shipping a test pastes that test failing at `BASE`, and mutation-tests it.** Failing at
   `BASE` is necessary and not sufficient — a new test file "fails" merely by importing a module that
   does not exist yet. Break each mechanism the test claims to cover, confirm red for each, restore,
   report what was tried. Four rules that make the mutation real:
   - **Restore by file copy (`cp`), never `git checkout`**, when the change under test is uncommitted:
     `git checkout -- <file>` restores the *committed* version and silently wipes the edits being
     probed. Commit first, or snapshot and restore from the copy.
   - **A guard needs a two-sided assertion.** A guard that never fires and one that always fires must
     *both* turn the test red, or a bailout that silently disables the feature satisfies it.
   - **A mutation that stays green is a claim about the mutation first.** Prove the break took effect
     — right file (authored, not generated), anchor existed, injected code runs in the scope the gate
     inspects — *then* read the verdict. A broken mutation and a blind gate produce identical output,
     and the broken mutation is the likelier of the two.
   - **State the wrong-but-passing implementation the test must exclude.** A test observing a
     consequence reachable by more than one path certifies nothing; naming the failure mode in the
     brief has repeatedly turned multi-round waves into single-round ones.

   This is a *brief* clause, not a review clause, because across one nine-task run every
   `CHANGES REQUIRED` was a test defect — caught by reviewers doing mutation testing at reviewer rates.
3. **Name the OBSERVABLE OUTCOME, and trace the path to it in the code before writing the brief.** A
   brief that specifies a mechanism is satisfied by fixing that mechanism, which is not the same as
   fixing the symptom.
   - **A data path is not automatically a render path.** One run's four briefs each named a function
     feeding a sort key, a dead branch, or a write half while the visible value came from elsewhere;
     each passed review on the thing it named and left the symptom intact. ~6 review rounds.
   - **Enumerate the full lifecycle of state the task introduces** — for a cache that is write / read
     / **clear**, for a resource acquire / use / release. Naming two of three ships the third as a
     defect; twice the missing seam was the *clear*, shadowing the server for a whole session.
   - **Grep the done-criteria for the field the task is about.** If no criterion names it, ask whether
     the task should exist before funding a round of it. Seconds to run; one run reached the second
     `CHANGES REQUIRED` before anyone did.
4. **If the task touches a live system, grant the access and pin the shape.** Enumerate the MCP/API
   tools in the dispatch — **production reads included**, since the true shape often exists nowhere
   else — and state the entity, operation, field names, ID provenance, and expected response envelope.
   The executor pastes back one real record it received. A pinned shape contradicted by reality is a
   `BRIEF DEFECT` and that is the cheap outcome; an unpinned brief has nothing for reality to
   contradict, which converts an early failure into a late one. Core:
   [`evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md) → *Briefs that
   touch a live system*.
5. **You may fan out in-session** using your own harness's built-in sub-agent mechanism, within your
   file scope and under one-writer-per-tree. The brief never prescribes *how* — that is your office's
   mechanism, not this one's.
6. **Self-review your own work — mandatory, and it covers what you implemented inline.** Per task,
   before marking it complete: a spec-compliance verdict and a quality verdict, graded
   Critical / Important / Minor. Then once at Finish, with the gate green, over the cumulative
   `BASE..HEAD` diff, for what only shows across tasks. Record both in the handoff's required
   `## Self-review` section. It is not the gate and never replaces it — self-review finds what the
   author knows it hand-waved, the fresh reviewer finds what the author could not see. A handoff
   arriving without that section goes **back to the executor**; the loop does not dispatch review
   over unreviewed work, and does not copy the executor's findings into the reviewer's brief. Core:
   [`evidence-and-handoff.md`](../../office-core/protocol/evidence-and-handoff.md) → *Executor
   self-review*.

## Top of every iteration — the drift check

Before dispatching anything, re-read the GOAL block and answer these. They take ten seconds and
they are what keeps an autonomous run honest:

1. **Which done-criterion does this task serve?** If none, you have drifted — stop and re-plan.
2. **Is this inside `blast_radius`?** A new repo, a new environment, or a new live system is a
   blast-radius widening. Not the loop's call. Stop.
3. **Is this a `non_goal`?** Then it is not happening, however tempting.
4. **Is this `planner_held`?** Then *you* perform it, never a delegate — and check `named_actions`:
   named with its preconditions met, you execute it and keep going; not named, or a precondition
   failed, you stop for the user.
5. **Which milestone does this task belong to, and did the previous one land?** An unlanded milestone
   behind you is a lost re-entry point.
6. **Agy consecutive-task count** — at 3, re-brief with full context restated or re-route.
7. **`git rev-parse --abbrev-ref HEAD` before every commit and every push.** Read it; do not assume
   the branch you created is still checked out.

## A deploy's targets come from the diff, not from the file you edited

When a task ships a change to a live system, enumerate what must be re-applied from the **diff**, not
from "the script that owns the file I touched." One source file can be instantiated as several live
objects, each provisioned by a *different* apply command — and re-applying only "its own" leaves the
other consumers running an older copy of the same source, silently, with no error and every local
gate green.

- **Before deploying, grep for every consumer of the changed source** (`grep -rn <basename>` across
  the apply scripts) and run all of them. Verifying "the page renders" is not enough — verify every
  host is running the **same build**, by matching a string unique to the new code in the live output.
- **Removing a shared action or field is ordered: sync every consumer first, remove second.**
  Reversing that order breaks whichever consumer is still stale — a live regression the deploying
  agent introduces, not one it inherits.

Evidence (2026-08-12): a `.lava` block shipped as two Rock Block rows via two apply scripts; the loop
re-applied only one after each review round, so the second host silently ran stale code, and then a
commit removed a bridge action the stale host still called — breaking it outright. A full extra
dispatch, a restore, and a re-review to relearn a lesson the target repo's own memory already carried.
The cheap check — "what else consumes this file?" — was one grep.

## The branch you are on is not a fact you may assume

- **Never dispatch a CLI agent into the tree the planner is working in.** Pre-create the agent's
  worktree and point it there, or dispatch from a tree you are not using. One writer per tree covers
  concurrent *edits*, not an agent running `git checkout` en route to its own worktree. A brief saying
  "make your own branch" is a request, not a control.
- **Re-read the branch after any dispatch returns**, not only before committing.
- **The executor owns commits, pushes its own branch, and opens the PR.** The planner never authors a
  commit for code it did not write. **Name the branch:** `git push <remote> <branch-name>`, **never**
  `HEAD` — `HEAD` inherits whatever you are on, so "I only push feature branches" is not true by
  construction, and this is exactly how a deploy has already happened by accident once. This rule
  binds the executor now, so it goes in the brief **verbatim**, not as a paraphrase.
- **Merging splits on whether the branch deploys.** The executor may merge a branch that does **not**
  deploy. **A merge into a deploying branch is planner-held** — irreversible and outward-facing — and
  the plan must state which branches deploy, or the executor must treat every branch as deploying and
  hand the merge back.

Evidence (2026-08-02, reached production): a dispatched agent left the shared checkout on `main`; two
planner commits and a `git push … HEAD` landed there and deployed in 59 seconds.

## Hard caps

| Cap | Value | On exhaustion |
|---|---|---|
| Review rounds per task | **5 full / 2 express** | Full: stop, the failure is structural — report the deadlock with the last verdict. Express: **promote the run to full** and re-plan the task with a plan-review pass. |
| Agy consecutive tasks | 3 | Re-brief from scratch, or re-route the next task. |
| Loop iterations | as set in GOAL | Stop and report which criteria are still red. |
| **`CHANGES REQUIRED` on one task** | **2** (total, not consecutive) | **Declare `PLAN DEFECT`** and take core's existing route. See below. |

**Quota is not a cap.** If the tool the run depends on is draining, re-probe and re-decide the same
way planning did — weigh what remains against what is left to do. Falling back to the named fallback
tool is an in-loop decision, not a stop. Draining a window entirely, when the user was told this run
would not, is worth one line of warning at the next status post; it is still not a stop.

A cap is a signal, not an obstacle. Do not raise a cap to make a run finish.

### Ownership

The planner keeps only what is structurally not the executor's: things the **user** must see, the
**anti-self-gating** gate, and **irreversible outward** actions.

| Planner-held | Executor-owned |
|---|---|
| Interview, plan, GOAL, approval, all `AskUserQuestion` stops | Every numbered task, start to finish, in dependency order |
| Read-only Phase 1 scouts (no plan and no executor exist yet) | Ordering within the graph; when and how to fan out workers |
| **Dispatching the code reviewer**; triaging findings | Resolving branch points the plan already anticipated |
| **Contesting** a review finding on the executor's behalf | **Implementing** every finding the reviewer raises |
| **Production and irreversible applies**; deploys | **All preview/staging writes and all live reads** |
| External sends — never delegable, ever | Commits, pushing its own branch, opening the PR |
| **Merging into a branch that deploys** | Merging a branch that does **not** deploy |
| Accepting or re-revising a plan amendment | Proposing a plan amendment, committed, with its hash |
| Posting the run report | Drafting the run report from its own evidence |

### Who performs a fix

**Every fix goes back to the executor**, including a one-liner. The planner triages — decides what a
finding means and whether to contest it — and the executor implements. Round-trip cost is the only
pivot, and it bites in exactly one place: **the executor has already retired.** Then the planner
discerns — apply it inline (core §35's live range: the brief would exceed the edit), or relaunch an
executor if the fix set is large enough to be worth a process. Either way the fresh reviewer still
gates it.

Contesting a finding is the planner's, not the executor's: an executor arguing a finding down is
arguing about its own work.

### The executor may amend the plan — and must show its work

A plan defect no longer has to bounce off the planner before anything moves. The executor may amend
the **how** — tasks, sequencing, technical approach — **commit the amendment**, and report the
**commit hash plus why** in `EXECUTOR-STATE.md`. The planner then accepts it or re-revises. The hash
is the point: it makes an amendment auditable instead of a claim in prose.

**Five fields it may never touch, because the user approved them and no downstream gate protects
them:** `goal`, `done_criteria`, `blast_radius`, `named_actions`, `non_goals`. A code reviewer reads
a clean diff against an amended contract and cannot tell the contract moved. Any change to those
five **stops** and reaches the user through the planner.

**A second amendment to the same task still stops the loop for the user** (below) — the executor
amending repeatedly is the same self-gate as the planner doing it.

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

## The two stop conditions

The loop returns to the user for exactly these, and nothing else:

1. **An external send** — email, message, public post, bulk outreach. Surface audience and draft; get
   approval in the current session. **A plan can never pre-authorize one of these.**
2. **A genuinely user-owned decision** — a fork the plan did not anticipate where different choices
   produce materially different work. **Ask it as an `AskUserQuestion` with your recommendation as
   the first option, and wait for the answer.** That is the pause; the run resumes on the answer, not
   on your inference. Recommend, never infer.

Everything else the loop decides itself: which tool to use, how to fix a review finding, whether to
re-route, how to sequence remaining tasks, when to fan out scouts.

**Nothing else is a stop.** A failing test is not a stop, it is the next task. An unclear finding is
not a stop, it is a verification. A slow tool is not a stop, it is a reroute.

### Production work runs — under preconditions, not under a pause

**Preview and staging writes are NOT in this category.** They are delegated, with the read-back —
the executor applies, clears cache, re-runs to zero, and reports what it read back. Withholding them
from the executor forces it to guess at ids and action strings, which other rules forbid. Only
**production and irreversible** actions are planner-held.

Deploys, migrations, prod applies, merges to a deploying branch, and production data writes are
still **planner-held**: *you* perform them, never a delegate. They no longer stop the run, because
the approved plan already named them. Before each one:

1. **It is in `named_actions`, verbatim** — exact command, target environment, what it changes. A
   plan saying "deploy when done" has named nothing; that is unauthorized and it *is* a stop.
2. **The dry run ran and was read**, where the tool has one. `--dry-run` output showing unexpected
   changes is a stop, and it is a stop because the precondition failed.
3. **A backup or revert target exists and is named.**
4. **A read-back after** proves what landed matches committed source — plus the observable behaviour
   that motivated the change. An exit code is not a read-back.
5. **Enumerate the targets from the diff, not from the file you edited** (see below). One source file
   is frequently several live objects behind several apply commands.

Any of 1–4 failing turns the action into a stop with a named reason. This is the gate moving earlier
— spent at approval on a list the user read — not the gate disappearing.

## Progress reporting without blocking

Post a one-line status per task completion — task, brand, review rounds, **wall clock**, verdict,
criteria now green, milestone state (`landed → PR #n` or `n/m criteria`), **`compact:`**. It informs;
it does not ask. Never end a status line with a question the run's continuation depends on. Wall
clock goes on the line because it is the cost invisible in a token count and the one a silent
dispatch spends.

## The compaction recommendation, every task boundary

Core owns this rule:
[`evidence-and-handoff.md` § Run-state durability](../../office-core/protocol/evidence-and-handoff.md).
Read it for when `yes` is warranted, what a `no` obliges, and why a live executor never withholds a
`yes`. This office narrows it in exactly two ways:

- **The boundary is a task reaching `APPROVED`**, not merely a phase closing — this office runs a
  loop, so it has more boundaries than a linear office and each one is a real offer. **A landed
  milestone is the strongest boundary there is**: the state that must survive is a branch name and a
  PR number, so recommend `yes` there almost always.
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

**The landed milestones are the resume record.** Read what is merged first — `gh pr list --state
merged`, then the branch — because that is durable in a way a plan file's task notes are not. Then
re-read the GOAL, re-check which done-criteria are green **by running their verify commands** rather
than trusting the prior session's notes, and re-enter the loop at the first red one.

Probe headroom on resume only if the run is long enough for it to matter. Do not re-derive state a
merged PR already proves.
