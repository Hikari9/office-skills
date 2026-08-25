# Closeout (core protocol)

Run by the **planner**, after the reviewer returns `APPROVED` — or invoked directly, standalone
(see below), when there is no planner and no reviewer round to wait on. Self-contained: it loads
no other skill.

Each office narrows this with an adapter file naming its own gate command, its report fields,
and where it records durable lessons. An adapter may add a step; it may not drop one.

## Standalone invocation

This file also runs with no planner, no Office Kernel packet, and no plan file — when an
office's closeout skill is invoked directly to finish work that never went through the full
pipeline (a quick fix, a one-off task, resuming a branch after the session that started it is
gone). Nothing below changes: confirm target, commit, gate, PR, document, sync, cleanup, close
loops all still apply exactly as written.

What standalone invocation drops, because there is nothing to drop them from:

- **Milestones.** There is one milestone — the current state of the worktree — so steps 0–6 run
  in a single pass rather than splitting "every milestone" from "the last milestone only."
- **The Office Kernel and `plan-contract.md`.** No milestone list, no `named_actions:`, no role
  split from `roles-and-authority.md` to invoke — the session running this file holds whatever
  authority a local commit-and-ship already implies, the same as any other direct push.

What it keeps: **step 6 still closes every open Upline entry that actually exists.** If this
branch carries a handoff file with open `[needs-user]` or `[needs-planner]` items — left by an
earlier session on the same work — close them per step 6 exactly as in a full run. If no handoff
file exists, there is nothing to close; don't invent one to satisfy the step.

## Closeout runs per milestone, not once per run

A plan declares milestones ([`plan-contract.md`](plan-contract.md)). **Every milestone whose
done-criteria are green runs this file** — commit, gate, PR, land — and then the run continues
into the next one. The last milestone additionally runs steps 5 and 6.

- **Steps 0–4 run at every milestone.** Commit, gate, PR, document.
- **Steps 5 and 6 run once, at the end** — syncing main, removing the worktree, and closing loops
  are terminal acts. Removing a worktree at milestone 1 of 3 destroys the run.
  (Standalone invocation has no milestone list to split against — see *Standalone invocation*
  above; run every step in one pass.)
- **A red gate stops that milestone, not silently the next one.** Commit and document, do not
  open the PR, and report — the run does not walk past a red milestone into the following one.
- **The landed milestone is the resume record.** A run interrupted after milestone 2 resumes by
  reading what is merged, not by re-deriving state from a plan file's task notes.

## 0. Confirm target

`git rev-parse --is-inside-work-tree`. If that fails, you were invoked from outside any repo (a
home directory, say). Stop and say so. Do not guess which repo to target, and do not accept a
path argument as a substitute for actually running from inside the worktree.

## 1. Commit

`git status`. Stage and commit anything outstanding, with a message describing **why**, not
what. If the tree is clean, skip.

## 2. Verify the gate

Run the project's real gate: its CI config, a `Stop` hook, whatever `AGENTS.md` / `CLAUDE.md`
mandates. Run the full gate, not the cheap subset of it. Whole classes of defect exist that only
a real build surfaces and a linter never will.

Don't invent a gate the project doesn't define; don't skip one it does.

**If the gate is red: stop here.** Step 1 (commit) and step 4 (document) still run so nothing is
lost, but do not open or arm a PR on red. Report the failure and end the run.

## 3. PR

`gh pr list --head <branch>` first. Never open a duplicate.

- **No PR:** `gh pr create` with a body that actually describes the change, followed by
  `gh pr merge --auto`.
- **PR exists but not armed:** arm it now with `gh pr merge --auto`.

Push, PR, and merge remain planner-held actions under
[`roles-and-authority.md`](roles-and-authority.md) — the **planner** performs them, never a
delegate. An approved plan carrying this milestone is the authority to land it, so landing does
not stop for a fresh go-ahead; see *Planner-held names the actor, not a pause*. What is still
forbidden is landing something the plan does not cover, or landing on red.

**Read the promotion chain out of the repo, do not assume it.** `gh pr list --state merged --json
number,headRefName,baseRefName` shows where feature branches actually land. A base picked from the
repo's default branch is a guess, and correcting it after the fact means merging the target back
in — which invalidates the gate output this milestone just produced.

## 4. Document

Update only what the repo already maintains for this kind of change: CHANGELOG, README, doc
comments. Do not invent a new doc file for the occasion. Make sure the PR body is real, not a
placeholder.

If the run surfaced a durable fact worth keeping past the PR (a project decision, a non-obvious
gotcha, a correction to how you should work), record it where this office records such things.
Skip anything already derivable from the diff, the commit log, or existing docs.

## 5. Sync local main, then remove the worktree

Scope is **this worktree only**. Never sweep the repo for other stale worktrees.

Check merge state once with `gh pr view <n> --json state,mergedAt`. Do not poll.

- **Merged:** sync local main first, because a PR merge lands only on the remote.

  ```bash
  git checkout main && git pull --ff-only origin main
  git rev-parse main origin/main   # must match
  ```

  Then remove the worktree **only if your tooling created it** (under `.worktrees/` or
  `worktrees/`), and delete the local branch. "Merged to main" is not done until both remote and
  local `main` point at the merge commit. Never report the merge complete on the GitHub-side
  merge alone.
- **Checks still pending:** leave the worktree. `--auto` completes the merge on its own. Say so
  and stop, or re-run closeout later. Don't block, don't poll.

## 6. Close loops

- Todo/task items tied to this work: mark done or drop.
- Issues this resolves: `Closes #N` in the PR body, so GitHub closes them on merge rather than
  you closing them by hand.
- Unresolved PR review threads.
- Scratch files created this session outside the repo: remove the ones you created and no longer
  need. The plan's workspace directory (ledger, briefs, reports, diff packages) goes now, because
  git history is the record.
- Any question you asked the user that never got an answer: surface it now rather than let it
  drop.
- **Every open `## Upline` entry** from the handoff. A `[needs-user]` item that never got
  surfaced, or a non-blocking `[needs-planner]` item you deferred to keep moving, dies here
  unless you act. Each one either gets answered, filed as a follow-up issue, or explicitly ruled
  irrelevant with a reason — and the `[decided]` entries the reviewer judged merely *defensible*
  rather than correct are exactly the ones worth filing. Deleting the workspace is what makes
  this irreversible, so do it before step 5.

## Quick reference

| Situation | Action |
|---|---|
| Not inside a git worktree | Stop, say so — don't guess (step 0) |
| Uncommitted changes | Commit, why-focused message |
| Gate red | Commit + document only; no PR |
| No PR for this branch | Create + `--auto` |
| PR exists, unarmed | `gh pr merge --auto` |
| PR merged | Sync local main, verify `main` == `origin/main`, then worktree + branch |
| PR pending | Leave worktree, don't poll, report status |
| Worktree not under `.worktrees/`/`worktrees/` | Not yours — don't remove it |
| Other stale worktrees | Out of scope |

## Common mistakes

- **Removing the worktree before the merge lands** — breaks iteration if a check fails after you
  deleted the workspace.
- **Polling `gh pr checks --watch`** — `--auto` doesn't need a babysitter.
- **Cleaning up a worktree you didn't create** — check provenance first.
- **Writing a docs update nobody asked for.**
- **Deleting the plan workspace before the PR is open** — the handoff report may still be needed
  for the PR body.

## Final report

Close with the office's run report, and keep it short enough to be read. Every office reports at
minimum:

| Field | Content |
|---|---|
| Goal | The outcome, and each done-criterion with its final verify output |
| Landed | Per milestone: the PR, where it merged to, and the commit range |
| Rounds | Review rounds used per task, and any cap approached |
| Stops | Every stop the run hit, what was asked, what was answered |
| Not verified | Every check that did not happen, named. **Never let an unrun check read as a passed one.** |
| Still open | Deferred items and known gaps. If genuinely empty, say so rather than omitting the row. |

**Standalone invocation** (see above) drops `Rounds` — there is no plan and no reviewer round
count to report — but keeps `Goal`, `Landed`, `Not verified`, and `Still open`.

An office may add fields; it may not drop one otherwise. **It may not turn the report into an essay** — a
record nobody finishes reading is a record that does not exist, and the accumulated habit of
writing the run's whole biography into a ledger is a cost the run pays and the next run does not
recover. State a durable lesson as a rule change in the file that owns the rule, or not at all.

Where a harness reports no token counts, say so explicitly rather than reporting zero — an absent
measurement and a measurement of zero are different facts. The same holds for any headroom figure
that does get reported: give the window and its reset time, never a single-number delta, because a
probe returning the tightest of two windows appears to *gain* headroom when the short one resets
mid-run.
