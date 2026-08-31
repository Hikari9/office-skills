# Tester worker contract

The **Tester** is an Executor-owned specialized `WORKER`, not a fourth standing role. It exists
when a task has enough behavioral surface that writing tests in parallel buys time or reduces the
Executor's context load. It never owns implementation, approval, review, merge, or deployment.

## Dispatch

The Executor may activate one Tester per task/worktree when the plan or implementation evidence
justifies it. The packet keeps `role: executor` and adds `worker_kind: tester`. The first line still
uses the existing worker form: `[WORKER] <repo> — tester: <task>`.

The Tester packet contains the immutable Kernel plus:

- the task brief, acceptance criteria, and superseding decisions;
- `test_mode`: `test-first`, `implementation-first`, or `hybrid`;
- the Tester-owned `Touches:` paths, including test configuration;
- BASE commit, current checkpoint identity, and available BASE worktree;
- approved test commands and environment notes;
- the parent Executor identity, loop number, and report path.

The Planner sets the initial testing intent. The Executor may activate, defer, or change the mode
with a recorded `[decided]` rationale when implementation evidence changes the useful order.

## Ownership and concurrency

One independent implementation writer remains the default per worktree. The coordinated Tester is
the narrow exception: one Executor and at most one Tester may write in the same worktree when their
declared paths are disjoint.

The Executor owns implementation files. The Tester owns test files, fixtures, test-local helpers,
and test-specific configuration. Shared project, dependency, build, CI, or production configuration
requires an explicit `Touches:` declaration and Executor coordination.

Both workers may stage and commit only explicit owned paths. Git index operations use a shared lock;
each commit verifies its staged paths before committing. `git add -A` and `git commit -a` are never
valid in a shared Executor/Tester worktree. The Executor creates implementation checkpoint commits;
the Tester may create separate test/config commits. A checkpoint records both relevant commit SHAs.

No other peer implementers may share the worktree. Independent parallel tasks still use separate
worktrees, and the Planner's worktree may be reused for BASE only while it is read-only and not
conflicting with Planner work.

## Test modes and execution

In `test-first`, the Tester first derives assertions from the spec and public interface, then reads
implementation details for fixtures and integration. In `implementation-first`, it may inspect the
current implementation before authoring tests. `hybrid` mixes the two per acceptance criterion.

Executor and Tester may author in parallel. The Executor may run a short, deterministic CLI test in
the live worktree when the command is appropriate for that tree. A build or other command that
freezes its own inputs may qualify. Whether a command is safe to run live is decided case by case;
commands with changing external state, file mutation, generation, databases, long-lived processes,
or demonstrated flakiness need extra care and may be routed to Tester.

Live green output is provisional until the relevant checkpoint or final stable run. A live red
result is reported to the Executor, who decides whether to continue, pause implementation, or ask
Tester to rerun against the stable worktree. A paused rerun classifies the result as
`FAIL_IMPLEMENTATION`, `FAIL_TEST`, `BLOCKED_ENV`, or a transient race.

BASE tests may run in a read-only Planner worktree. Evidence identifies the BASE or checkpoint
against which it was produced; evidence from another commit range is stale after a fix.

## Repair loop

Tester reports results in a message as soon as a run finishes and writes the detailed report to a
file. Executor may use the report or its own follow-up test output to fix implementation code.
Tester may repair a test or test configuration when the repair preserves the spec, superseding
decisions, and non-vacuous assertions. A disagreement that changes acceptance criteria is
`SPEC_AMBIGUITY` and a `[needs-planner]` candidate for `PLAN DEFECT` or `BRIEF DEFECT`.

The Tester loop allows two correction rounds. After that, the Executor escalates rather than
funding an unbounded test/fix loop.

## Required evidence

Each meaningful new or amended test has a mutation-table row. The test must go red against BASE,
the pre-regression checkpoint, or a deliberately reverted fix; a test that cannot demonstrate this
is reported as unverified with a reason. Final evidence includes the stable command, output path,
checkpoint identity, mutation result, and changed test/config paths.

Tester statuses are:

| Status | Meaning | Next owner |
|---|---|---|
| `PASS` | Stable required tests pass and evidence is complete | Executor / review gate |
| `FAIL_IMPLEMENTATION` | A test catches an implementation defect | Executor |
| `FAIL_TEST` | Test or harness is wrong and needs repair | Tester |
| `BLOCKED_ENV` | Environment prevents a meaningful run | Executor / Planner |
| `SPEC_AMBIGUITY` | Spec or superseding decision conflicts with the test | Planner |

Tester does not approve the implementation. Verifier and Reviewer remain independent final gates.
