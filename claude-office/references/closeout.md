# Phase 4 — Closeout

Run by the planner after the Reviewer returns APPROVED. Self-contained; loads no other skill.

## 0. Confirm target

`git rev-parse --is-inside-work-tree`. If this fails — you were invoked from outside any repo (a home directory, say) — stop and say so. Do not guess which repo to target, and do not accept a path argument as a substitute for actually running from inside the worktree.

## 1. Commit

`git status`. Stage and commit anything outstanding, with a message describing **why**, not what. If the tree is clean, skip.

## 2. Verify the gate

Run the project's real gate — CI config, a `Stop` hook, whatever `AGENTS.md`/`CLAUDE.md` mandates. For Next.js work that means `pnpm build`, not just lint: route config, caching-API incompatibilities, and env-reading routes getting force-prerendered surface only in a real build.

Don't invent a gate the project doesn't define; don't skip one it does.

**If the gate is red: stop here.** Step 1 (commit) and Step 4 (document) still run so nothing is lost, but do not open or arm a PR on red. Report the failure and end the run.

## 3. PR

`gh pr list --head <branch>` first — never open a duplicate.

- **No PR:** confirm with the user that shipping is wanted (an explicit "ship it" earlier counts), then `gh pr create` with a body that actually describes the change, followed by `gh pr merge --auto`.
- **PR exists but not armed:** arm it now with `gh pr merge --auto`.

## 4. Document

Update only what the repo already maintains for this kind of change — CHANGELOG, README, doc comments. Do not invent a new doc file for the occasion. Make sure the PR body is real, not a placeholder.

If the run surfaced a durable fact worth keeping past the PR — a project decision, a non-obvious gotcha, a correction to how you should work — save it to memory. Skip anything already derivable from the diff, the commit log, or existing docs.

## 5. Sync local main, then remove the worktree

Scope is **this worktree only**. Never sweep the repo for other stale worktrees.

Check merge state once — `gh pr view <n> --json state,mergedAt`. Do not poll.

- **Merged:** sync local main first; a PR merge lands only on the remote.
  ```bash
  git checkout main && git pull --ff-only origin main
  git rev-parse main origin/main   # must match
  ```
  Then remove the worktree **only if your tooling created it** (under `.worktrees/` or `worktrees/`), and delete the local branch. "Merged to main" is not done until both remote and local `main` point at the merge commit — never report the merge complete on the GitHub-side merge alone.
- **Checks still pending:** leave the worktree. `--auto` completes the merge on its own. Say so and stop, or re-run closeout later. Don't block, don't poll.

## 6. Close loops

- Todo/task items tied to this work — mark done or drop.
- Issues this resolves — `Closes #N` in the PR body so GitHub closes them on merge, rather than closing them by hand.
- Unresolved PR review threads.
- Scratch files created this session outside the repo — remove the ones you created and no longer need. The plan's workspace directory (ledger, briefs, reports, diff packages) goes now: git history is the record.
- Any question you asked the user that never got an answer — surface it now rather than let it drop.
- **Every open `## Upline` entry** from the handoff. A `[needs-user]` item that never got surfaced, or a non-blocking `[needs-planner]` item you deferred to keep moving, dies here unless you act. Each one either gets answered, filed as a follow-up issue, or explicitly ruled irrelevant with a reason — and the `[decided]` entries the reviewer judged merely *defensible* rather than correct are exactly the ones worth filing. Deleting the workspace is what makes this irreversible, so do it before step 5.

## Quick reference

| Situation | Action |
|---|---|
| Not inside a git worktree | Stop, say so — don't guess (Step 0) |
| Uncommitted changes | Commit, why-focused message |
| Gate red | Commit + document only; no PR |
| No PR for this branch | Create + `--auto` |
| PR exists, unarmed | `gh pr merge --auto` |
| PR merged | Sync local main, verify `main`==`origin/main`, then worktree + branch |
| PR pending | Leave worktree, don't poll, report status |
| Worktree not under `.worktrees/`/`worktrees/` | Not yours — don't remove it |
| Other stale worktrees | Out of scope |

## Common mistakes

- **Removing the worktree before the merge lands** — breaks iteration if a check fails after you deleted the workspace.
- **Polling `gh pr checks --watch`** — `--auto` doesn't need a babysitter.
- **Cleaning up a worktree you didn't create** — check provenance first.
- **Writing a docs update nobody asked for.**
- **Deleting the plan workspace before the PR is open** — the handoff report may still be needed for the PR body.
