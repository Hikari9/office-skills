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
the branch's first commit, push the named branch, create one draft PR whose body references the plan
and tracking issue, and post the initial and milestone resumability comments. The executor must
stop before implementation if any bootstrap action cannot be verified. It may not mark the PR ready,
remove the plan, merge, deploy, alter remotes, message anyone outside PR bookkeeping, or touch
credentials. See `office-core/protocol/executor-bootstrap.md`.
