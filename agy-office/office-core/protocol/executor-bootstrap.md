# Executor bootstrap and draft PR (core protocol)

This procedure binds every executor launch. It makes the run externally visible before implementation
and leaves a durable re-entry point if the executor, session, or context window disappears.

## Preconditions

The planner has explicit approval for the plan, and the executor packet names:

- the designated worktree and already checked-out branch;
- `BASE`, the branch tip before the run;
- the tracked plan at `docs/plans/<slug>.md`, including its tracking issue reference;
- the exact remote and named branch allowed for the bootstrap;
- the GitHub repository's base branch and the PR body fields.

The plan file is copied from planner scratch into the designated worktree before dispatch. A plan in
scratch alone is not a dispatchable plan.

## Startup sequence

The executor performs these actions in order, before implementing any numbered task:

1. Confirm it is in the designated worktree, on the named branch, and at `BASE` with no earlier
   branch commits. Preserve any protected dirty paths and leave them unstaged.
2. Confirm `docs/plans/<slug>.md` exists, is tracked, and matches the approved plan version. Stage
   that file alone and commit it as the branch's first commit with a why-focused message.
3. Push the named branch explicitly (`git push <remote> <branch>`). Never push `HEAD`.
4. Create exactly one GitHub draft PR for the branch. The body links the plan path, references the
   tracking issue, states that the PR is draft, and records the plan commit SHA. Reuse an existing
   PR for the branch only when it is the same run's PR.
5. Comment on the PR with the branch, plan path, issue, plan commit, and the next resume point.
6. Begin the numbered implementation tasks.

The first commit may contain only the plan file. The executor must not combine implementation,
state files, generated output, or protected changes with that commit.

## Milestone comments

Every approved milestone is a why-focused implementation commit or commit range on the same branch.
After its gate is green, the executor comments on the draft PR with:

- milestone name and done-criteria status;
- commit range and current branch SHA;
- the exact validation commands and their relevant output;
- the next task or resume point.

The planner independently verifies and the reviewer gates the work. A milestone comment is evidence
for resumption, never approval and never a substitute for the reviewer.

## Fail closed

If worktree, branch, `BASE`, plan tracking, plan-only commit, push, PR creation, or the initial PR
comment cannot be verified, stop before implementation and return a blocked handoff naming the failed
precondition. Do not continue locally and promise to publish later. If a later milestone comment
fails, stop before advancing to the next milestone and report the exact commit and missing comment.

## Closeout boundary

The PR remains draft through implementation, verification, and review. After the final reviewer
returns `APPROVED` and the final gate is green, the planner performs closeout: remove the tracked
plan in a dedicated pre-merge commit, push that commit, confirm the deletion and all milestone
comments, mark the PR ready, and merge it under the approved plan's authority. The plan is removed
from the branch before it is merged to the base branch; its first commit remains in history.
