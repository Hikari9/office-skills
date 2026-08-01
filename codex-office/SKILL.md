---
name: codex-office
description: Use only when explicitly named for production-facing or irreversible repository work. The active Codex session plans and closes out; fresh Codex CLI sessions execute and adversarially review.
---

# Codex Office

Use this workflow only when the caller explicitly invokes `codex-office`. It is a
strict four-phase delivery process: plan, execute, adversarial review, closeout.

| Role | Owner | Default model | Responsibility |
|---|---|---|---|
| Planner | Active Codex session | current session | scope, plan, escalation, closeout |
| Executor | Fresh `codex exec` session | `gpt-5.6-terra` | implements the approved plan |
| Reviewer | Separate fresh `codex exec` session | `gpt-5.6-sol` high effort | adversarial gate and re-review |

The executor never approves its own work. The planner does not implement the
plan. `codex exec --yolo` has no sandbox or approval stop, so a complete prompt
and a stated blast-radius ceiling are the safety boundary.

## Invocation and caller overrides

Start only after explicit invocation. A caller may set executor/reviewer tier,
skip a phase with an approved plan path, add review rubric items, or skip
closeout. Do not silently skip review or reuse the executor as reviewer.

## Four phases

1. **Plan.** Explore read-only, write an approval-ready plan with context,
   global constraints, a verbatim blast-radius ceiling, numbered tasks with
   dependencies and model strategy, verification, routing, and out-of-scope
   work. Obtain explicit approval before dispatch.
2. **Execute.** Record `BASE=$(git rev-parse HEAD)` and dispatch one executor
   per repository (one working tree per process) using the full contract in
   [references/task-prompt.md](references/task-prompt.md). Read its handoff and
   resolve every Upline item before review.
3. **Review.** Read [references/review-gate.md](references/review-gate.md) and
   dispatch a fresh `gpt-5.6-sol` reviewer using
   [references/reviewer-brief.md](references/reviewer-brief.md). The reviewer
   must return `APPROVED`, `CHANGES REQUIRED`, or `PLAN DEFECT`, backed by actual
   validation output. Fix findings with a fresh scoped executor dispatch, then
   resume the reviewer with the fix diff and fresh gate output; cap at 5 rounds.
4. **Closeout.** Verify the full gate, commit and create/push a PR only when
   authorized, then report the plan, commit range, review rounds, gate result,
   and anything unresolved. Use [references/closeout.md](references/closeout.md).

## Essential operating rules

- Pass `-m` explicitly to every `codex exec`; use `gpt-5.6-terra` for ordinary
  implementation and `gpt-5.6-sol` with high reasoning effort for difficult
  diagnosis or review.
- Never run two Codex processes in one working tree. Parallel work needs
  separate worktrees and disjoint paths.
- Executor authority is local edits and commits only unless the prompt names
  additional actions. Pushes, PRs, deploys, remote configuration, messages and
  credential access are forbidden by default.
- A successful process exit is not evidence. The gate is the repository's full
  validation command(s), with real output in the handoff.
- A deployment/migration is planner-held unless explicitly authorized, and must
  be verified by a read-back of the live artifact and observable behavior.
- Preserve pre-existing dirty worktree changes; name them as protected paths.

## Reference routing

- [Task prompt contract](references/task-prompt.md)
- [Reviewer brief](references/reviewer-brief.md)
- [Review gate](references/review-gate.md)
- [Closeout](references/closeout.md)

