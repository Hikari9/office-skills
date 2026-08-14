---
name: auto-planning
description: Phase 1 — interview to 95% clarity, probe quota, route by brand, write the plan plus the GOAL and done-criteria file, self-review it, take one adversarial plan-review, and get the single approval that authorizes the whole autonomous run. Loaded by the auto-office hub; not invoked directly.
---

# Auto Planning

Narrows [`office-core/protocol/plan-contract.md`](../../office-core/protocol/plan-contract.md) — the
shared floor every office's plan must clear, including its **Claims discipline** section. Read it;
this file adds the router's specifics (brand per task, the GOAL block, the two plan-review passes)
and never drops a core requirement.

**Entering this phase, re-read the [auto-office hub](../../SKILL.md) and this spoke before acting** —
including after any compaction.

Phase 1 carries more weight here than in the sibling offices, because it is the **last** point at
which the user is asked anything routine. One approval authorizes everything through closeout, so
the plan and the done-criteria have to be good enough to be executed without you asking again.

**The hub's fit test is already settled by the time you are here.** If it has not been run — you
entered this spoke directly, or after a compaction that ate it — run it now, before the interview,
and state the verdict. A run that fails the fit test does not get a plan; it gets done directly.

## Kickoff line

Announce before doing anything else:

```
auto-office · gear: <express|full> (<the fit-test reason, one clause>)
executors: <n> (<brand(s)>, <fit reason>) · milestones: <n>
reviewer: opus high · plan-reviewer: <brand> <model> low   [full only]
headroom: <only if probed — per window, with reset times, UNKNOWN where a probe failed>
loop: on · overrides: <none|…>
```

**The gear line is the important one.** It tells the user what they are about to pay for and is the
cheapest place to overrule it. The headroom line appears only when a probe actually ran; when it
does, report **every window with its reset time** — a single-number delta across a window boundary
is meaningless (one run read `82% → 52% → 85%` and none of it described anything).

## Order of operations

1. **Run the fit test and state the gear** (hub). Express skips steps 2, 6-review, and most of what
   follows; the checklist below is the **full** gear unless a step says otherwise.
2. **File the tracking issue** by default, before exploring.
3. **Interview to clarity.** Ask in batches, not one at a time. The floor below is not optional in
   full; in express, interview only until a remaining unknown would not change the implementation.
4. **Recon with agy scouts, in parallel** — read-only, each returning file paths and line numbers.
   Verify their claims cheaply before building on them. A scout claim you cannot verify is dropped.
5. **Route, fully** ([auto-routing](../auto-routing/SKILL.md)) — **every task's brand**, and how many
   executors the run needs. Model and effort are fixed by role, so they are filled in, not decided.
   Do not leave routing "to be decided during execution"; an unassigned task is an unreviewable cost.
   Probe headroom **only if you have a reason to**; it is no longer a mandatory step.
6. **Write the plan** to `docs/plans/<slug>.md` **in the target repo** — see *Where a run's files
   live* below. The five required sections are core's
   ([`plan-contract.md`](../../office-core/protocol/plan-contract.md)) and none may be dropped:
   - **Context** — why this work exists.
   - **Global Constraints** — verbatim binding values, protected paths, environment target,
     validation commands, and the blast-radius ceiling as its own named block.
   - **Numbered tasks** — each with files touched, exact behavior, verification, strategy tag.
   - **Dependency graph** — every task declares `Depends on:` / `Touches:`, grouped into waves.
   - **Out of scope** — explicit.

   The GOAL block and the task assignment table below are additions to those sections, never
   substitutes for them.
7. **Write the GOAL block** into the plan (below), including its `milestones:` and `named_actions:`.
   This is what the loop is measured against and what authorizes its landings.
7.4 **Self-review the plan** (below). Mandatory in **both** gears, before any hand-off.
7.5 **One adversarial plan-review** (below). Mandatory in **full**; **not run in express**.
8. **Get explicit approval.** Silence is not approval. Say plainly that approval starts an
   end-to-end run which lands each milestone as it goes, executes the `named_actions:` list without
   asking again, and stops only for an external send or a decision the plan did not anticipate.

## Interview floor — 95% clear

"95%" is not a feeling: it is core's standard — clear enough that a stranger with no access to this
conversation could build the right thing from the plan alone. Here that stranger is literal and
routed, in a separate process, unable to ask a follow-up mid-run. The checklist below is the test;
do not write a plan until every item is answered or explicitly deferred by the user:

- **Outcome** — what is true when this is done, in the user's words.
- **Done-criteria** — the exact commands, reads, or observations that prove it. If you cannot name
  a verification for a requirement, the requirement is not yet specified.
- **Blast radius** — which repos, environments, and live systems. Production named explicitly or
  excluded explicitly. Never inferred.
- **Irreversible steps** — deploys, migrations, prod applies, deletions. Each one becomes
  `PLANNER-HELD` **and gets a `named_actions:` entry**, because that entry is what lets the run
  perform it without stopping. An irreversible step you cannot yet write out exactly is one the
  interview is not finished on. External sends are the exception: they never go in the list.
- **Milestones** — which done-criteria group into a shippable landing, and in what order. Ask the
  user if the natural grouping is not obvious; this is what they will see arrive as PRs.
- **Interfaces** — the signatures, schemas, routes, or file boundaries that tasks must agree on.
  Pin these now; a routed executor cannot invent them consistently.
- **Constraints** — stack, conventions, domain skills that must load, things not to touch.
- **Speed vs correctness** — which one the user is buying here. This directly moves the route.
- **Other work queued** — only if a probe came back thin and this run might drain a window the user
  needs later. Otherwise do not ask; weigh it yourself and state the call.
- **How many executors this run needs** — one repo or several, one slice or several. More than one
  also promotes an express run to full.
- **User-owned decisions** — anything you would otherwise guess. Recommend, never infer.

## The task assignment table

Goes in the plan, next to the tasks. The planner fills every cell before approval:

| # | Task | Brand | Model+effort | Dispatch | Diagnosis | Why |
|---|---|---|---|---|---|---|
| 1 | Locate every call site of `sendReceipt` | agy | `agy` high | in-session ×3 | settled | Read-only recon, breadth over depth |
| 2 | Add the queue column + migration | codex | `codex-terra` high | cli | settled | Backend; own worktree |
| 3 | Wire the retry flag through the config | codex | `codex-terra` high | in-session | settled | Executor has the file loaded already |
| 4 | Reconcile the two conflicting invariants | claude | `opus` high — **worker upgrade** | cli | **unverified** | Arbitration, not implementation: a different *kind* of question. Declared here, recorded in telemetry |
| 5 | Apply reviewer finding 2 (one-line guard) | — | planner inline | inline | settled | A dispatch buys nothing; still goes back to the reviewer |

- **`Model+effort` is pre-filled** from [auto-routing](../auto-routing/SKILL.md)'s table. The
  **executor's** cell is fixed at sonnet-tier high; a non-default value there is a **caller override**
  and must be labelled as one, in the cell.
- **A worker's cell is a real decision, and this table is where it is made.** The default is the
  executor's tier, but the planner may assign a higher tier or a different brand when the sub-task is
  a *different kind* of question — a judgement call, an arbitration, an unconfirmed diagnosis — not
  merely a harder-looking one. Write the reason in `Why`. An above-default worker that is not
  declared here is the defect this office was revised to fix; note that the defect was the
  *invisibility*, not the bigger model. Declared is fine, undeclared is not.
- **`Dispatch` is derived, not chosen** — `cli` / `in-session` / `inline`, per the dispatch-form table.
  There is no tax to compute and no tier to pick.
- **`Diagnosis` is `settled` or `unverified`.** `unverified` **no longer buys a bigger executor.** It
  obliges the brief to carry the reproduce-at-`BASE` clause and makes the task a first-class
  `BRIEF DEFECT` candidate — the executor is expected to come back and say the cause is wrong, and
  that return costs one read instead of a whole implementation.
- **An inline row is a real row.** The planner may hold it, and it is still reviewed like every other
  row. What the planner may never do is take a row out of review.

## The GOAL block

The loop's contract. Written into the plan, restated in every executor brief, and checked at the
top of every iteration.

```yaml
goal: <one sentence — the outcome, not the activity>
done_criteria:            # each independently verifiable, each with a real command
  - id: dc1
    statement: <what must be true>
    verify: <exact command or read-back>
  - id: dc2
    ...
milestones:               # each a shippable landing; every dc belongs to exactly one
  - id: m1
    criteria: [dc1, dc2]
    lands_on: <branch>    # first hop of the repo's real promotion chain, read from the repo
  - id: m2
    criteria: [dc3]
    lands_on: <branch>
named_actions:            # planner-held steps the run may perform WITHOUT stopping
  - action: <the exact command or write, verbatim>
    target: <environment / host / record>
    changes: <what it changes>
    dry_run: <the command that previews it, or "none available">
    revert: <backup path, prior version, or revert command>
    read_back: <the command or read proving what landed>
non_goals:                # what the loop may NOT expand into
  - ...
blast_radius:
  repos: [...]
  environments: [...]     # name production or say "none"
caps:
  review_rounds_per_task: 5   # 2 in express, and a 2nd CHANGES REQUIRED promotes to full
  agy_consecutive_tasks: 3
  loop_iterations: <n>
```

**`named_actions:` replaces the old `planner_held:` list, and the replacement is not cosmetic.** The
old list said *stop here*; this one says *you may do this, here is how you prove it went right*.
Every entry still names a planner-held action — the planner performs it, never a delegate — and an
action absent from this list is unauthorized, which is the stop. A vague entry (`deploy to prod`)
authorizes nothing and will stop the run; write the command.

**Milestone rules:** every done-criterion belongs to exactly one milestone; a milestone that leaves
the tree broken without the next one is not a milestone, it is half of one; and `lands_on` comes from
reading the repo's merged PRs, never from its default branch. One milestone is a legitimate plan.

**A named hazard your gates cannot detect is a TASK, not a caveat.** If the plan writes down that
its validation cannot see its worst failure mode — "nothing in this repo executes Lava", "the tests
can't reach the deploy path", "only a human can check this" — then closing that gap is a numbered
task with an owner, or the plan is defective. Stating a risk honestly and mitigating nothing reads
as diligence and functions as none: every executor after that point works blind in exactly the
place the plan already identified as most dangerous. Measured 2026-08-08: a plan named this hazard
in its constraints, shipped no gate for it, and the fix loop then rewrote T-SQL with zero runtime
feedback for four review rounds — producing an invalid-column defect that aborts the batch and
blanks the page at HTTP 200. Ask of every such sentence: *is there a cheap check that would have
caught this, and is it in the task list?*

Rules for done-criteria:

- **Verifiable by command or read-back, never by assertion.** "Build passes" needs the build
  command. A live-system change needs a read-back, not an exit code.
- **Binary.** No "mostly working." A criterion that cannot be red or green is not a criterion.
- **Complete.** The loop exits when all of them are green — so anything missing here will not get
  done, and anything vague here will get argued about at 2am with no one to ask.
- **State the PROPERTY, never the vivid instance.** A criterion naming one case a bug could take is
  satisfiable by an implementation broken in every *other* case. Ask: *is my wording the general
  property, or one example of it?* Observed three times in one run — "no-op when `sections` is empty"
  should have been "pruning must never be driven by a filtered view"; the shipped code wiped user data
  on every search keystroke while the criterion read green.
- **Require at least one N → N transition with a changed value, and one N → fewer.** If every case
  goes 0 → N, any comparison that only looks at *size* passes all of them, so the update path is
  untested.
- **Never make the agent's own identity a discriminator.** A verify command filtering on comment
  author, commit author, or reviewer login is unsatisfiable when the agent acts under the user's
  credentials — the normal case for `gh`, `git`, and every MCP write. Discriminate on *content* only
  real work produces: a millisecond figure, a SHA, pasted command output.

## Step 7.4 — planner self-review (mandatory)

Before any hand-off, re-read your own plan hunting for:

- **contradictions** — two rules that cannot both hold;
- **unexecutable assignments** — a form, flag, or tier the named brand does not have;
- **rules your own changes made dead** — an escalation path whose destination you just deleted, a
  gate that can no longer be reached, a budget you asserted instead of measuring;
- **anything you hand-waved** — every "should be fine", "roughly", and "pays for itself".

You are cache-warm on this document, so the pass is nearly free. **It is not a substitute for step 7.5
and may not be used to skip it.** Measured: self-review found 10 findings, the fresh gate 12,
overlapping on only 4. Self-review finds what the author knows it hand-waved; the fresh gate finds what
the author could not see.

## Step 7.5 — one adversarial plan-review (full gear only)

**Express does not run this gate**, which is most of what makes express cheap. Everything below is
the full gear.

Between self-review and user approval. The plan-reviewer is a **fresh agent of the planner's own
brand**, at that brand's plan-review row in [auto-routing](../auto-routing/SKILL.md) — Opus-tier,
**low** effort. Spoke paths: [delegation-map.md](../../references/delegation-map.md).

**This gate stays because it is the best-value item in every run that has recorded one** — 14 vs 4,
22 vs 8, 24 vs 6 findings against self-review, overlap near zero each time, blockers that were real.
When the fit test picks express it is betting the run is small enough not to need it; a second
`CHANGES REQUIRED` is that bet losing, and the run promotes to full and runs this pass.

It receives: the **plan file path**, the GOAL block, and the task assignment table. It returns
**numbered findings**. **One pass, no rounds.** The planner applies the findings, records which it
rejected and why, and moves on.

Each finding carries `Fix:` (the plan change, 1–2 sentences), `Where:` (the plan line or task row),
and `Rejected:` (the plausible-but-wrong change and why it fails) — free at `low` effort, and it is
what stops the planner from guessing. A recommendation is not a rewrite: the plan-reviewer never
edits the plan, and the planner may reject a `Fix:` on the record.

- **Do not pre-judge it.** Per `office-core/protocol/review-states.md`, do **not** pass your own
  self-review findings into its brief. That anchors the gate and converts an independent pass into a
  confirming one. Merge the two lists *after* the verdict returns.
- **It retires permanently** after that single pass. It is never recalled, never distributes work,
  and holds no later gate. Distribution is the planner's.
- Why one pass and not a loop: user approval is the scarcest thing in the run and must not be spent
  on an unreviewed plan — but a plan-review *loop* is itself the kind of cost the plan-review exists
  to prevent.

## Where a run's files live

**Everything belonging to a specific run lives in that run's target repo and worktree** — the plan
file (`docs/plans/<slug>.md`), the GOAL block inside it, the briefs, diff packages, evidence, and the
run report. The planner writes them where the work is, **never** into the `office-skills` workspace.

**`references/routing-outcomes.md` is the sole exception** — cross-run and workspace-local, so it must
survive any single target repo. Closeout appends a summary row there *in addition to* writing the full
run report into the target repo.

- A ledger row cites the target repo (opaque slug) and plan path, staying traceable to artifacts held
  elsewhere.
- A run whose target repo *is* `office-skills` puts its plan and report here as normal — because that
  is the target, not because this is home.

## Approval

Present: the gear and why, the route, the plan, the GOAL block, **the milestones as the PRs they will
become**, **the `named_actions:` list read out plainly** — this is the moment the user authorizes
every production step the run will take, so it is the one list they must actually read — the two stop
conditions, and (full only) the plan-review findings and what you did with each. Then take an
explicit yes. After that, run — see [auto-loop](../auto-loop/SKILL.md).

If the user's approval carries a change ("yes but use claude"), treat it as a caller override:
re-route, echo the new kickoff line, and proceed without a second approval round.
