# Roles and authority (core protocol)

Binding on every office. An adapter may **narrow** these rules or add office-specific
obligations; it may never widen authority, remove a gate, or reassign a role.

## The three standing roles

| Role | Held by | Owns | Never does |
|---|---|---|---|
| **Planner** | the invoking session | interview, plan, approval, escalation, fix triage, review gate, review state, final approval summary, closeout, ready-for-review, merge, plan removal, all planner-held actions | **take the executor's task away from independent review**; approve the work |
| **Executor** | a fresh worker process/subagent | draft-PR bootstrap, implementing the approved plan inside its stated scope, first-completion comment, the handoff report | approve its own work; act outside the blast-radius ceiling |
| **Reviewer** | a fresh agent that did not do the work | the approval gate, numbered findings, the review verdict | write the fix it is gating; approve without evidence |

A finding **recommends** a fix; it never writes one. A `Fix:` line is a hypothesis the implementer
may reject with evidence, and on follow-up rounds the reviewer judges the result on correctness,
never on whether its own suggestion was followed.

Offices may add roles (Agy's mandatory independent **verifier** is the planner wearing a
distinct, non-judging hat). An added role never absorbs an existing role's gate. An Executor-owned
specialized worker such as **Tester** is not a standing role and keeps the Executor's authority.

### Every dispatch announces its role in its first line

A spawned session's first brief line is `[ROLE] <repo> — <task>`, with `ROLE` one of `PLANNER`,
`PM`, `EXECUTOR`, `WORKER`, `REVIEW`, `PLAN-REVIEW`. A specialized worker names its kind in the
task, for example `[WORKER] repo — tester: task`. The repo is named because executors are one per
repo, so the role alone does not identify a parallel run. Where a brand also exposes a label flag
(`--remote-control` / `--name`), pass the same string; where it does not, the brief's first line is
the whole mechanism.

This is for a human reading a job list. **It is never an identifier**: match on session or worktree
identity, never on a display label.

**Every gate is held by someone who did not do the work being gated.** That single sentence
generates the rest of this file; when a novel situation is not covered, decide by it.

### The planner may implement inline; it may never gate what it wrote

The planner's forbidden act is removing work from independent review, **not** typing. When the
[delegation test](#delegation-test) buys nothing — no tier, no isolation, no parallelism, no price — the
planner does the work inline, and **that inline work is still gated by a fresh reviewer.** An
office that made this an absolute prohibition was narrowing core, and the narrowing cost more
than it bought: a dispatch written to avoid touching a file is a brief, a spawn, and a round-trip
paid to move one line.

The counterweight is unchanged and it is the real limit: **never collapse the task carrying the
run's main correctness or security risk** into inline work, because inline work gets no per-task
independent review of its own.

### Added gates and added coordinators

- An office **may add a plan-review gate** ahead of user approval — an independent reader of the
  plan itself, held by an agent that did not write it. It adds a gate rather than absorbing one,
  so it is legal; and because user approval is the scarcest thing in a run, it is usually cheap.
- An office **may add a coordinator** role that distributes briefs and collects results on the
  planner's behalf. A coordinator **holds no planner-held action and no gate of any kind.**
  Merge, ready-for-review, deploy, escalation, and closeout stay with the planner; the executor's
  draft-PR bootstrap is the explicit core exception below.
- The two must be **separate roles.** A gate-holder that then distributes the work it approved,
  and later adjudicates whether that work's brief was defective, is gating itself.

### Reviewer floors bind the gate they were declared for

An office that declares a reviewer floor (a model tier, an effort level) declares it for its
**code**-review gate. A plan-review gate carries **its own, separately declared floor.** Two
floors, neither overriding the other. Without this, a "stricter rule wins" clause silently
promotes plan review to the code-review floor and doubles its cost for no gate strength.

## Herdr dispatch override

When `test "${HERDR_ENV:-}" = 1` succeeds, the run is inside a Herdr-managed pane. Load the
[Herdr skill](../skills/herdr/SKILL.md) and use its CLI as the dispatch surface for every real
delegation across every office — executor, reviewer, plan-reviewer, verifier, scout, worker, and
Tester. This overrides the normal brand-matching dispatch form: same-brand work does **not** use an
in-session Agent/Task subagent while Herdr is detected.

The direct child of the calling agent is shown in a sibling pane to the **right**. A child spawned
by that agent is shown in a pane **below** its parent. Preserve the caller's focus with `--no-focus`,
read pane IDs from Herdr JSON responses, and send the approved brief with `herdr agent prompt`.
After reading the final handoff/output and observing the role's final completion state, close only
the pane created for that dispatch; keep a reviewer pane open while another review round is needed.
Inline work remains inline. If `HERDR_ENV` is not `1`, the existing office
routing — including in-session subagents where currently allowed — is unchanged. If Herdr is
detected but its command fails, do not silently fall back to an in-session child; use an authorized
CLI route or surface the blocked dispatch.

The selected dispatch form is recorded as `herdr` in plans and telemetry.

## Invocation

1. An office runs **only** on explicit invocation by name. It is never self-triggered because
   a task "looks like office work," and no other skill may invoke one on the user's behalf.
2. A dispatched worker or reviewer is **not** the planner. If a brief and a hub disagree about
   the reader's role, the brief wins for that reader.
3. Caller overrides after the invocation are honored, echoed back in the kickoff line, and
   change nothing else. Only a caller may change a default.
4. **No caller override may** skip an independent review, reuse the executor as its own
   reviewer, downgrade the reviewer below the office's stated floor, remove a structural phase,
   or widen the blast-radius ceiling implicitly.

## Approval

- The planner obtains **explicit** approval of a written plan before any dispatch. "Looks
  good" / "go" / "approved" counts; silence does not.
- Approval attaches to a **plan file at a path**, not to a conversation. Downstream briefs cite
  that path and version.
- A plan changed after approval is re-approved before the changed part is dispatched.

## Blast-radius ceiling

Declared once, verbatim, in the plan's Global Constraints, and restated verbatim in every
downstream brief. It names environments, credentials, remotes, external services, and
irreversible operations the run may and may not touch.

- **Ceilings narrow going down. No agent may widen its own.**
- State exclusions explicitly. An unstated exclusion is one a helpful agent will "finish."
- Back it with mechanism where mechanism exists — a scoped tool allowlist, a deny hook, a
  dedicated worktree, credentials absent from the environment — not prose alone.

**Planner-held by default**, regardless of office: merges, ready-for-review, deploys, migrations,
remote/DNS/config changes, credential access or creation, production data writes, and any outbound
message. Pushes and PR creation are planner-held outside the required executor bootstrap. An
executor gains an outward action only when the brief names that exact action; silence means not
authorized.

### Executor-owned draft-PR bootstrap

Every executor launch follows [`executor-bootstrap.md`](executor-bootstrap.md). The approved plan
and brief grant the executor exactly these startup actions: commit the tracked plan file as the
branch's first commit, push the named branch, create one draft PR whose body contains a clickable
plan blob deeplink anchored to that first commit and references the tracking issue, and post the
initial and first-completion resumability comments. The executor must verify each action and stop before
implementation if any bootstrap precondition fails.

This exception transfers neither the review gate nor closeout. The PR remains draft until reviewer
approval; the planner removes the plan in the final pre-merge commit, marks the PR ready, and merges.

### Planner-held names the actor, not a pause

Two different things wore one label and the conflation cost whole runs. **Planner-held** means
*the planner performs this action, never a delegate.* It does **not**, on its own, mean the run
stops and asks again — a plan the user approved is authority the run already holds.

A planner-held action executes **without a new go-ahead** when both hold:

1. **The approved plan names that exact action**, verbatim, in a `named_actions:` block — the
   target environment, the command or write, and what it changes. A general permission ("deploy
   when done") does not name an action; `apply_form_insights_pages.py --yes-prod` does.
2. **Its preconditions are met and stated**: a dry run reviewed first where the tool offers one,
   a named backup or revert target, and a **read-back after** proving what landed. An office may
   add preconditions; none may drop one.

Anything **not** named in the approved plan is unauthorized, and that is what the standing stop
protects. So the gate moved earlier rather than disappearing: it is spent at approval, on a list
the user read, instead of mid-run on a decision they have already made once.

**Two things stop the run regardless of what the plan says:**

- **Outbound messages** — email, chat, public post, bulk outreach. Audience and draft surfaced,
  approval taken in the current session, every time. A plan cannot pre-authorize these. The required
  GitHub PR body and the three allowed PR comments are the PR-bookkeeping exceptions and must be
  named in the approved plan.
- **A genuinely user-owned decision** the plan did not anticipate — a fork where different
  choices produce materially different work. Recommend first, then ask; never infer.

**A named action whose preconditions fail is not a named action.** The dry run showing unexpected
changes, a missing backup path, a read-back that does not match — each of those is a stop, and it
is a stop *because the precondition failed*, not because the run lost its nerve.

## One independent writer per working tree

One independent implementation writer per tree remains the default. Parallel independent work
requires separate worktrees **and** disjoint `Touches:` sets. The only coordinated exception is one
Executor plus at most one Executor-owned Tester in the same worktree, with disjoint declared paths.

The Executor owns implementation paths. Tester owns tests, fixtures, test-local helpers, and
test-specific configuration. Both may author concurrently, but Git index operations are serialized
under a shared lock and every commit uses explicit pathspecs plus a staged-path audit. `git add -A`
and `git commit -a` are invalid in this arrangement. Live test execution is allowed case by case;
green live output is provisional, and the Executor decides whether a red result needs a paused
stable retest. No other peer writers share the tree.

The Planner's worktree may be reused for BASE testing only while it is read-only and non-conflicting.

Before dispatch the planner confirms that no uncoordinated writer is live in that tree; a newer
overlapping writer is stopped before it can edit.

Pre-existing dirty changes are preserved and named as **protected paths** in the plan.

**The planner works in the run's worktree too, and its scratch lives there.** Plans, briefs, review
rounds, and state files go in the run's worktree — never the target repo's primary checkout. A
shared checkout is not durable: a concurrent agent advanced `main` and deleted a live run's brief
directory out from under it mid-run. Create the worktree before the first artifact; the approved plan
must be copied into tracked `docs/plans/<slug>.md` before dispatch. Working directly in the primary
checkout requires the **user** naming that checkout — a planner never defaults to it.

## Fit test — before the office runs at all

The delegation test below prices one task. The **fit test** prices the whole run, and it comes
first: **the very first thing an invoked office does, before interviewing, before planning, before
any dispatch.** An office is machinery — interview, plan, plan-review, brief, dispatch, verify,
review, closeout — and that machinery has a price in tokens, wall-clock, and the user's attention.
It is worth paying when it buys something, and it is pure overhead when it does not.

Ask, in one pass over the request as stated:

1. **Risk.** Is anything here irreversible, production-facing, or externally visible? Would a wrong
   result be expensive or hard to notice?
2. **Size and shape.** Is there real implementation volume, or parallelizable breadth, or a
   genuinely uncertain design — versus a known, bounded edit?
3. **Ambiguity.** Does the request need an interview to reach 95% clarity, or is the target already
   unambiguous?
4. **Independent review.** Would a fresh adversarial reader plausibly catch something the doer
   would not?

The answers select one of **three gears**:

| Answers | Gear | What runs |
|---|---|---|
| Any yes to **(1)** | **full** | Every phase the office declares. One-way door — never downgraded. |
| No to (1), **two or more** yeses across (2)–(4) | **express** | The express phase set below |
| No to (1), **one or none** | **direct** | No office. Do the work under normal working rules. |

**Express promotes to full** — before dispatch, not mid-flight — if the run turns out to need more
than one executor, more than one repo, or more than roughly three tasks. Size is what makes a
single review round defensible; a run that outgrows the gear says so and changes gear.

**State the gear out loud before proceeding**, in two or three sentences at most: the call, the one
or two reasons behind it, and what the other gears would have cost. Then proceed without asking
again — the fit test is a discernment step, not a new approval gate. A user who typed the office's
name gets an explanation of the gear, never a request for permission to think.

### The express phase set

Express is a **declared** shape, not an improvised one. An office running express runs exactly
these, in order, and may not thin them further:

1. **A short plan, written to a file.** Outcome, done-criteria with real verify commands, the task
   list, and the blast-radius ceiling. Approval still attaches to a path, not to a conversation.
   Interview only to the point where a remaining unknown would change the implementation.
   **No plan-review gate**, no coordinator, no quota probe, no benchmark read.
2. **Implement** — delegated or inline per the delegation test.
3. **One independent code review** by a fresh agent that did not do the work, on real evidence,
   at the office's stated code-review floor. `CHANGES REQUIRED` goes to the planner's disposition
   checkpoint; it does not automatically re-enter the fix loop.
4. **Commit, PR, and land it** per the office's closeout.

**Cap: two review rounds.** A second `CHANGES REQUIRED` forces the planner to record a disposition
before any third review. If the planner recommends another round, express promotes the run to full
and re-plans the task with the full office's plan-review gate. If it recommends no further round,
the run preserves the open finding and stops or escalates; it never self-approves or lowers a bar to
finish. Express degrades into full only when the planner elects to continue.

Express drops **phases**, never **floors**. Everything in this file that is not a phase still
binds: no self-approval, every gate held by someone who did not do the work, evidence over exit
codes, read-backs for live-system writes, one independent writer per tree (with the coordinated
Tester exception), the blast-radius ceiling, and the
planner-held rules above.

### What the fit test may and may not do

It chooses **only** among the three declared gears. It may not invent a fourth shape: a run that
proceeds in a gear runs every phase that gear declares.

It may **never** downgrade a run that is irreversible, production-facing, or externally visible —
question (1) is a one-way door, and it selects **full**, never express. Nor may it downgrade
because quota is short, an executor brand is unavailable, or the office feels slow; those are
routing and scheduling problems, and the answer to them is the routing table, not less review.

An explicit caller override outranks the fit test in every direction: `plan approved: <path>` or a
named executor means the user has already decided the office runs, `express` and `full` name a gear
outright, and `just do it directly` means they have already decided against an office. A caller may
name a gear; a caller may not name express for a run that answered yes to (1).

Direct work is not unreviewed work. It follows the same non-bypassable rules — no unverified
external mutation, read-backs over exit codes, planner-held actions still planner-held — it simply
does not pay for phases nothing in the request justifies.

## Delegation test

A delegation must buy **tier, isolation, parallelism, or price**. If it buys none of the four, do
the work inline. Task count is never a reason to delegate, and a linear dependency chain cannot be
parallelized however many tasks it holds.

**Price is why the executor exists.** The planner is the office's most expensive writer and the
executor is sonnet-tier by fixture, so implementation *volume* is itself a purchase — two to six
times cheaper per output token, in parallel, at the same gated quality. Task count is still never
the reason to delegate; the tokens those tasks would cost at planner rates are. The planner types
when a brief would cost more thought than the edit — not when there is simply a lot to type.

The counterweight: inline work gets no independent per-task review, so **never collapse the
task carrying the run's main correctness or security risk.**

## Escalation ownership

Every unresolved question is labelled by owner and travels up, never sideways:

| Label | Owner | Handling |
|---|---|---|
| `[needs-planner]` | planner | answered before review |
| `[needs-user]` | user | surfaced **batched, with a recommendation attached** — never resolved by inferring intent |
| `[decided]` | the deciding agent | recorded in the handoff **file**, one line, and carried into the reviewer's packet as a scrutiny target |

A decision made under uncertainty that lives only in a chat summary does not survive
compaction. It goes in the file.
