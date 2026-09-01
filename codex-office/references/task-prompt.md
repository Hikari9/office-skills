# Executor prompt contract

Every executor packet includes: absolute repo/worktree path; branch; tracked plan path;
tracking issue;
git-ignored workspace path; BASE SHA; exact in-scope work; protected and
out-of-scope paths; the blast-radius ceiling copied verbatim; allowed side
effects; full validation commands; and a handoff path. For a CLI executor, its
`codex exec` prompt carries this packet. It must also say:

> Do not stop to ask questions; make reasonable decisions yourself and implement the entire brief.

Require a ledger at `<workspace>/progress.md` and a handoff at
`<workspace>/handoff.md` containing these sections:

## Optional Tester worker

For a task with meaningful behavioral test surface, the Executor may dispatch one specialized
Tester worker. The Tester keeps `role: executor` and adds `worker_kind: tester`; it owns only the
declared test files, fixtures, test-local helpers, and test-specific configuration. The Executor
owns implementation files. They may author concurrently in one worktree only when `Touches:` paths
are disjoint. Both workers use a shared Git-operation lock, explicit pathspecs, and staged-path
audits; `git add -A` and `git commit -a` are forbidden. The Executor makes implementation checkpoint
commits, while Tester may commit its test/config paths separately.

Use `test_mode` `test-first`, `implementation-first`, or `hybrid`. Planner sets the initial intent;
Executor may activate, defer, or change it with a `[decided]` rationale. Tester may run BASE in a
read-only Planner worktree and may test the live worktree while Executor continues coding. Live
green output is provisional; Executor decides whether a red result needs a paused stable rerun.
Executor may run simple CLI tests itself to keep the fix loop moving. Tester sends a concise result
message and writes the detailed report to the workspace, using statuses `PASS`, `FAIL_IMPLEMENTATION`,
`FAIL_TEST`, `BLOCKED_ENV`, or `SPEC_AMBIGUITY`. Tester does not approve implementation; the
independent review gate remains authoritative.

```markdown
# Codex handoff — <plan slug>
## Commits
<git log --oneline BASE..HEAD>
## Tasks
<completion by task>
## Deviations from the plan
<or None>
## Upline
- [decided] <ambiguity> -> <choice> — <why>
- [needs-planner] <question> — blocking | non-blocking
- [needs-user] <question + recommendation> — blocking | non-blocking
## Deferred minors
<or none>
## Self-review (required — see core `evidence-and-handoff.md`)
Per task, before marking it complete: spec-compliance verdict + quality verdict,
graded Critical / Important / Minor — including work you implemented inline.
Then once over the whole `BASE..HEAD` diff after the gate is green.
<one line per finding: grade — what — fixed (<commit>) | deferred (minor) | parked (<ruling>)>
<"none" is a valid finding list; an absent or empty section is not.>
## Gate evidence
$ <full command>
<actual output>
## Known risks for the reviewer
<or none>
```

The packet explicitly authorizes the core executor bootstrap: commit the tracked plan file alone as
the branch's first commit, push the named branch, create one draft PR whose body contains an
immutable plan blob deeplink and references the plan and tracking issue, and post the approved-plan/
execution-begins comment. The first completed executor handoff also posts the executor-completion
comment; milestones and later fix handoffs stay in local run state. The executor must
stop before implementation if any bootstrap action cannot be verified. It may not mark the PR ready,
remove the plan, merge, deploy, alter remotes, message anyone outside PR bookkeeping, or touch
credentials. See `office-core/protocol/executor-bootstrap.md`.
