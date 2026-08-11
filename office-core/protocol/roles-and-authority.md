# Roles and authority (core protocol)

Binding on every office. An adapter may **narrow** these rules or add office-specific
obligations; it may never widen authority, remove a gate, or reassign a role.

## The three standing roles

| Role | Held by | Owns | Never does |
|---|---|---|---|
| **Planner** | the invoking session | interview, plan, approval, escalation, fix triage, closeout, all planner-held actions | **take the executor's task away from independent review**; approve the work |
| **Executor** | a fresh worker process/subagent | implementing the approved plan inside its stated scope; the handoff report | approve its own work; act outside the blast-radius ceiling |
| **Reviewer** | a fresh agent that did not do the work | the approval gate, numbered findings, the review verdict | write the fix it is gating; approve without evidence |

A finding **recommends** a fix; it never writes one. A `Fix:` line is a hypothesis the implementer
may reject with evidence, and on follow-up rounds the reviewer judges the result on correctness,
never on whether its own suggestion was followed.

Offices may add roles (Agy's mandatory independent **verifier** is the planner wearing a
distinct, non-judging hat). An added role never absorbs an existing role's gate.

### Every dispatch announces its role in its first line

A spawned session's first brief line is `[ROLE] <repo> — <task>`, with `ROLE` one of `PLANNER`,
`PM`, `EXECUTOR`, `WORKER`, `REVIEW`, `PLAN-REVIEW`. The repo is named because executors are one per
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
  Commit, PR, merge, deploy, escalation, and closeout stay with the planner.
- The two must be **separate roles.** A gate-holder that then distributes the work it approved,
  and later adjudicates whether that work's brief was defective, is gating itself.

### Reviewer floors bind the gate they were declared for

An office that declares a reviewer floor (a model tier, an effort level) declares it for its
**code**-review gate. A plan-review gate carries **its own, separately declared floor.** Two
floors, neither overriding the other. Without this, a "stricter rule wins" clause silently
promotes plan review to the code-review floor and doubles its cost for no gate strength.

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

**Planner-held by default**, regardless of office: pushes, PRs, merges, deploys, migrations,
remote/DNS/config changes, credential access or creation, production data writes, and any
outbound message. An executor gains one of these only when the brief names that exact action;
silence means not authorized.

## One writer per working tree

One writing process per tree, always. Parallel work requires separate worktrees **and**
disjoint `Touches:` sets. Before dispatch the planner confirms no other writer is live in that
tree; a newer overlapping writer is stopped before it can edit.

Pre-existing dirty changes are preserved and named as **protected paths** in the plan.

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
