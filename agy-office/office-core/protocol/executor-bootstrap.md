# Executor bootstrap and draft PR (core protocol)

This procedure binds every executor launch. It makes the run externally visible before implementation
and leaves a durable re-entry point if the executor, session, or context window disappears.

## Preconditions

The planner has explicit approval for the plan, and the executor packet names:

- the designated worktree and already checked-out branch;
- `BASE`, the branch tip before the run;
- the tracked plan at `docs/plans/<slug>.md`, including its tracking issue reference;
- the exact remote and named branch allowed for the bootstrap;
- the GitHub repository's base branch and the PR body fields, including the plan's absolute blob
  deeplink.

The plan file is copied from planner scratch into the designated worktree before dispatch. A plan in
scratch alone is not a dispatchable plan.

## Startup sequence

The executor performs these actions in order, before implementing any numbered task:

1. Confirm it is in the designated worktree, on the named branch, and at `BASE` with no earlier
   branch commits. Preserve any protected dirty paths and leave them unstaged.
2. Confirm `docs/plans/<slug>.md` exists, is tracked, and matches the approved plan version. Stage
   that file alone and commit it as the branch's first commit with a why-focused message.
3. Push the named branch explicitly (`git push <remote> <branch>`). Never push `HEAD`.
4. Create exactly one GitHub draft PR for the branch. The body includes a clickable plan blob
   deeplink in this form — `[docs/plans/<slug>.md](https://github.com/<owner>/<repo>/blob/<plan-commit-sha>/docs/plans/<slug>.md)` —
   where `<plan-commit-sha>` is the full SHA of the plan-only first commit. It also references the
   tracking issue, states that the PR is draft, and records the plan commit SHA. The immutable
   commit anchor keeps the link valid after final closeout removes the plan from the branch. Reuse
   an existing PR for the branch only when it is the same run's PR.
5. Post the **approved-plan / execution-begins** comment with the branch, plan path, issue, plan
   commit, and the next resume point. Read it back before continuing.
6. Begin the numbered implementation tasks.

The first commit may contain only the plan file. The executor must not combine implementation,
state files, generated output, or protected changes with that commit.

## First executor completion comment

When the first executor returns its completed handoff, it posts one **executor-completion** comment
to the draft PR and reads it back before ending. Include:

- executor identity and completion status;
- the handoff path, commit range, and current branch SHA;
- the exact validation commands and relevant output; and
- the next resume point, including any open Upline item.

Later fix executors write their handoffs and local run state but do not add PR comments. Milestones
remain internal commit/checkpoint boundaries; they are not PR-comment events.

## Fail closed

If worktree, branch, `BASE`, plan tracking, plan-only commit, push, PR creation, or the initial PR
comment cannot be verified, stop before implementation and return a blocked handoff naming the failed
precondition. Do not continue locally and promise to publish later. If the first executor-completion
comment cannot be posted or read back, stop before ending that executor and report the exact commit
and missing comment.

## Closeout boundary

The PR remains draft through implementation, verification, and review. After the final reviewer
returns `APPROVED` and the final gate is green, the planner posts the final approval summary, then
performs closeout: remove the tracked plan in a dedicated pre-merge commit, push that commit,
confirm the deletion and approval summary, mark the PR ready, and merge it under the approved plan's
authority. The plan is removed
from the branch before it is merged to the base branch; its first commit remains in history.
