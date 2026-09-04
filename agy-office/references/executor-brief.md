# agy task-prompt contract

Every prompt handed to `agy --print` (Agy Office Phase 2, a Phase 3b fix wave, or any ad hoc agy
delegation) MUST specify all of the following. A prompt missing any of these is not ready to dispatch.

**Load the `agy` skill before your first dispatch.** It is the living record of the CLI's sharp edges —
flag ordering, workspace semantics, model names, quota, live monitoring. This file covers what the
*brief* must say; that one covers how to launch it. Do not reconstruct either from memory.

## Required fields

1. **Workspace root, absolute, stated in the prompt text itself** — plus `--add-dir <same path>`.
   `agy` does **not** inherit your cwd: left to itself it works in `~/.gemini/antigravity-cli/scratch/`
   and reports "no active workspace selected". The flag alone has been observed to be insufficient;
   the prompt must say *"Your workspace root is `<abs path>`. Work ONLY inside it; do not use your
   scratch directory. cd there first."*
2. **Branch** — already checked out by you, named explicitly.
3. **Tracked plan file path** — `docs/plans/<slug>.md`, its contract, an absolute path, to be read
   once, fully; the executor must commit this file alone as its first branch commit.
4. **Workspace scratch dir** — an absolute, git-ignored path where every artifact it writes lives.
5. **Tracking issue and PR bootstrap** — the issue reference, remote, branch, base branch, and
   exact authority to push the named branch, create one draft PR whose body contains an immutable
   plan blob deeplink and references the plan and issue, and post the approved-plan/execution-begins
   comment plus the first-executor-completion comment.
6. **BASE commit** — the tip before its work, so the diff range is unambiguous.
7. **In-scope work** — the precise, numbered set of behaviors/files to implement, in imperative voice.
   Not "could you look at…"; agy has answered questions *about* a task instead of doing it.
8. **Protected / out-of-scope paths** — credentials, generated files, other dispatches' files,
   infrastructure.
9. **A no-front-running clause** — verbatim: *"Implement only the numbered work items. Do not create
   files, stubs, or scaffolding for later tasks, and do not leave untracked placeholder files behind."*
   agy has been observed leaving untracked stubs for work nobody asked for yet.
10. **The real-signature clause** — see below. This is the single highest-value field in the contract.
11. **Blast-radius ceiling**, restated verbatim from the plan's Global Constraints.
12. **Allowed side effects** — local edits/commits plus the explicitly named bootstrap push, draft PR,
   approved-plan/execution-begins comment, and first-executor-completion comment; no ready-for-review,
   plan removal, merge, deployment, or unrelated
   messaging.
13. **Required validation** — the exact command(s) that must pass, plus the requirement that its report
   contain the command *and its actual pasted output*. Treat that output as a claim, not evidence
   (see [verification.md](verification.md)).
14. **Handoff report path and contract** — `<scratch dir>/handoff.md`, in the shape given below.
15. **No-clarifying-question instruction** — verbatim: *"Do not stop to ask questions; make reasonable
   decisions yourself and implement the entire brief."*

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

## The real-signature clause (non-negotiable)

Paste this into every brief that touches a hook, callback, event, external API, or any interface it
does not itself define:

```
Before you write or call anything against an existing interface — a hook, action,
filter, callback, event handler, SDK method, or HTTP endpoint — open the real
definition in the source (or the vendored dependency) and read its actual
signature. Quote the file:line and the signature verbatim in your report for
each one. Do NOT infer a signature from a name, from convention, or from what
would be convenient. Write tests against the real signature only. A test that
passes against a signature you invented is worse than no test.
```

**Why this is field 9 and not a footnote.** The observed failure mode is not sloppiness, it is
*self-consistency*: agy invented a 4-argument filter signature for a documented 3-argument WordPress
action — with the correct signature stated in the prompt — then wrote test stubs matching its own
invention, so the suite went green over code that could never fire in production. Green tests from
this executor prove the tests agree with the implementation, nothing more. The clause forces a
citation you can check in seconds, and Phase 3 checks it.

## Bootstrap authority (non-negotiable)

The prompt authorizes exactly this startup sequence before implementation: plan-only first commit,
named-branch push, one draft PR whose body contains the immutable plan blob deeplink and references
the tracking issue, and the approved-plan/execution-begins and first-executor-completion comments. If any action cannot be verified, stop and report a blocked
handoff. The prompt must say that the plan remains tracked until planner closeout removes it.

After bootstrap, agy may commit **only** to the designated branch/worktree named in the prompt. It must not:

- mark the PR ready, remove the plan, merge, or deploy
- change remote configuration
- send messages outside PR bookkeeping
- touch credentials

...unless the prompt explicitly authorizes that specific action. Silence on any of these means "not
authorized" — do not infer permission from the task's broader goal. Closeout owns plan removal,
ready-for-review, merge, and cleanup.

`--dangerously-skip-permissions` is required for unattended work, and it removes every approval stop.
Like `codex --yolo`, that makes the prompt the only guardrail there is.

## One independent agy process per tree

Never run two independent `agy` processes against the same working tree. Parallel dispatches get
separate worktrees, each with its own branch, BASE, scratch dir, and report path. The coordinated
Executor-owned Tester is the only in-tree exception and follows
`office-core/protocol/tester-worker.md`; unrelated writers in one tree still stage and commit half
of each other's changes.

## Ledger and resumability

For a multi-task plan, tell agy to keep a ledger at `<scratch dir>/progress.md`, first line
`# Agy Office ledger — plan: <plan file path>`, appending `Task <N>: complete (commits <a7>..<b7>)` as
it goes. This matters more here than for other executors: **agy runs die on quota mid-orchestration**,
stalling after a few narration lines. When that happens the ledger plus `git log` tell you where the
run actually got to, and `agy --conversation <id>` (or `--continue`) can pick up from there instead of
redoing completed tasks.

## Template

```
Your workspace root is <absolute repo/worktree path>. Work ONLY inside it; do not
use your scratch directory. cd there first. You are on branch `<branch>`
(already checked out). <Runtime/tooling facts: package manager, validate
commands, conventions file to read.>

Plan (your contract, read it once fully): <absolute plan file path>
Scratch dir (every artifact you write goes here): <absolute git-ignored path>
BASE commit (the tip before your work): <sha>

## Background
<Why + verified facts the agent can't easily discover.>

## Work items
<Numbered, specific, imperative, with absolute file paths and exact behaviors.
 Follow the plan's dependency order; never run two writers over the same file.>

## Operating guardrails
- Work only in <absolute repo/worktree path> on branch <branch>.
- In scope: <specific files, behaviors, and task boundaries>.
- Do not modify: <protected paths, credentials, generated files, infrastructure>.
- Not your work at all: <every PLANNER-HELD task, named>. Do not "finish" these.
- Implement only the numbered work items. Do not create files, stubs, or
  scaffolding for later tasks, and do not leave untracked placeholder files
  behind.
- Before you write or call anything against an existing interface — a hook,
  action, filter, callback, event handler, SDK method, or HTTP endpoint — open
  the real definition in the source and read its actual signature. Quote the
  file:line and the signature verbatim in your report for each one. Do NOT infer
  a signature from a name, from convention, or from what would be convenient.
  Write tests against the real signature only.
- Do not narrow a guard, conditional, or asset enqueue further than the work item
  requires; if you think a narrower scope is right, implement the stated scope and
  log the disagreement as [decided].
- Blast-radius ceiling (do not cross, and do not decide that crossing is fine
  this once — stop and report instead):
  <paste the plan's ceiling block verbatim>
- Allowed side effects: <local edits and commits plus the explicitly named bootstrap
  push, draft PR, approved-plan/execution-begins comment, and first-executor-completion comment>.
- You may commit only to the designated branch/worktree. You may perform the named
  bootstrap push, draft PR, and the two named executor-event comments; do not mark ready, remove the plan, merge,
  deploy, alter remote configuration, send messages outside PR bookkeeping, or touch
  credentials.
- Keep a ledger at <scratch dir>/progress.md, appending
  `Task <N>: complete (commits <a7>..<b7>)` as you finish each task.
- Validate with <commands>; they must pass before you finish, and your handoff
  must contain the command you ran and its actual output.
- Write your handoff report to <scratch dir>/handoff.md in the shape below. Print
  files changed, test results, and commit hashes when you finish.
- Never block on a tool call that may not return (a browser screenshot capture, a
  network wait). If it has not returned in about a minute, record that item as
  measured-not-captured and move on. Nobody can interrupt a --print run for you.
- Do not stop to ask questions; make reasonable decisions yourself and implement
  the entire brief.
```

## Handoff report contract

Append this to the prompt verbatim. Note the two extra sections this executor owes you that others
don't.

```markdown
# agy handoff — <plan slug>

## Commits
<git log --oneline BASE..HEAD>

## Tasks
Task 1: complete (<commits>) — <one line>
...

## Interfaces verified (required — one row per external interface touched)
| Interface | Real signature, quoted | Read at file:line |
|---|---|---|

## Deviations from the plan
<Anything you did differently, and why. "None" if none.>

## Upline
<One line per entry. Write "none" only if genuinely nothing was decided under
 ambiguity.
 - [decided] <what was ambiguous> -> <what you chose> — <why, <=10 words>
 - [needs-planner] <question> — <plan text it collides with> — blocking | non-blocking
 - [needs-user] <question> — <the tradeoff + your recommendation> — blocking | non-blocking>

## Files created that are not in the work items
<Every untracked or added file no work item asked for, or "none". Be exhaustive.>

## Self-review (required — see core `evidence-and-handoff.md`)
Per task, before marking it complete: spec-compliance verdict + quality verdict,
graded Critical / Important / Minor — including work you implemented inline.
Then once over the whole `BASE..HEAD` diff after the gate is green.
<one line per finding: grade — what — fixed (<commit>) | deferred (minor) | parked (<ruling>)>
<"none" is a valid finding list; an absent or empty section is not.>

## Gate evidence
$ <command>
<actual pasted output>

## Known risks for the reviewer
<Where you'd look first if something is wrong.>
```

The **Interfaces verified** table and the **Files created that are not in the work items** section
exist because those are this executor's two documented failure modes. An empty or missing table on a
task that touched a hook is itself a finding — treat it as unverified work, not as "no interfaces".

## Reading the result

**Exit code 0 means nothing here.** agy exits 0 having done nothing at all. Never trust its completion
summary. Before Phase 3, run the independent verification pass in
**[verification.md](verification.md)** — it is mandatory in this office, not optional diligence.

- A **stall after a few narration lines** is the quota symptom, not slowness. Check `git status` /
  `git log`; usually it died before writing anything. Have Claude subagents ready as the fallback
  worker, and confirm quota with the user before a long session.
- **A ledger row is a claim, not evidence.** Observed 2026-09-03: a `--print` run's ledger recorded
  its handoff as written while the process spent its remaining 45 minutes re-issuing a browser
  screenshot call that never returned, then died without writing it. Check the handoff file's
  existence and mtime and `git log` before believing any ledger row, and put the never-block
  guardrail above in every brief that drives a browser.
- A **greeting or banner instead of work** is the swallowed-prompt bug: a flag ended up between
  `--print` and the prompt. Fix the ordering and relaunch; nothing was done.
- **Handle the `## Upline` section before Phase 3.** Answer everything `[needs-planner]`. Surface every
  `[needs-user]` item to the user **batched, with your recommendation attached** — never resolve a
  user-owned question by inferring what they'd want. Carry the `[decided]` list into the reviewer's
  packet. See [escalation.md](escalation.md).

## Why this is strict

`agy --dangerously-skip-permissions` runs unsandboxed with full local command access and no approval
stop, it does not review anything it writes, and it has a demonstrated habit of producing work that
*looks* verified — green tests over an invented interface, an exit code over an empty diff. The prompt
is the only guardrail, and the verification pass is the only thing standing between that and a merge.
Treat every field above as required, not advisory.
