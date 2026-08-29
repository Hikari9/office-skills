---
name: auto-closeout
description: Landing a milestone and closing the run — verify the criteria are green, commit, PR, merge the promotion chain, and at the end emit a short run report. Loaded by the auto-office hub; not invoked directly.
---

# Auto Closeout

Planner-only. Runs unless the caller said `skip cleanup`. Runs twice: **milestone landing** (every
green milestone, inside the loop — gate → commit → PR → merge the chain, then back into the loop) and
**final closeout** (once, after the last milestone — the same, plus sync, worktree removal, loop
closure, and the run report). Never batch milestones — a green milestone that doesn't land is a
re-entry point the run threw away.

## Handoff-first waiting

Once executor liveness is established, wait for `handoff exists OR state=done` before closeout
inspection. Read the final handoff/state once and use it as the primary task/commit ledger. Do not
repeatedly recheck intermediate commits, branch logs, or worktree status while the executor is
still running; inspect Git only for a missing handoff, an approved-scope conflict, or contradictory
final evidence.

1. **Gate before landing.** Re-run every criterion's `verify` command and paste real output — not the
   executor's or reviewer's record of having run it. Any red criterion sends the loop back, never
   forward into a commit.
2. **Confirm scope.** `git status`/diff against the declared `blast_radius`; every action about to run
   is in `named_actions:` with its preconditions met (dry run read, revert target present, read-back
   ready). Off-list is a stop, not a silent absorb into "done."
3. **Roles.** The executor commits, pushes its named branch, and opens the PR — it wrote the code and
   holds the evidence for a real description. The planner holds the gate and performs any merge into a
   **deploying** branch; the executor may merge one that doesn't deploy. Never author a commit for
   code you didn't write.
4. **Read the promotion chain from the repo** before opening a PR (`gh pr list --state merged --json
   number,headRefName,baseRefName`) — never assume the default branch. Read once per run, reuse across
   milestones.
5. **Version bumps: prove the value is unclaimed on EVERY ref**, reading the file per-ref — never
   `git log -S` (merge commits hide the bump; observed 2026-08-11: the pickaxe reported 0 claimants
   while three promotion branches sat on the "clear" version):
   ```bash
   git fetch origin --prune
   for r in $(git for-each-ref --format='%(refname)' refs/remotes/origin | sed 's|refs/remotes/||'); do
     v=$(git show "$r:package.json" 2>/dev/null | grep -m1 '"version"' | sed 's/.*"version": "\([^"]*\)".*/\1/')
     [ "$v" = "X.Y.Z" ] && echo "claims X.Y.Z: $r"
   done
   ```
   Re-run immediately before the merge, not only when choosing the number.
6. **Commit and land.** Reuse an existing PR for the branch, or open one with an accurate body and
   issue links. Automerge if that's the repo's convention; merge directly if checks are green and
   automerge isn't available. Don't poll.
7. **Promote along the real chain to its final branch, regardless of outcome**, unless the caller said
   `no loop`/`skip cleanup`/"open a PR and stop." An open, mergeable PR is an incomplete milestone, not
   a courtesy. Verify each hop actually landed (`state: MERGED`, head contains the commit) before the
   next — a timed-out `gh` call is ambiguous, re-read state, don't assume failure. A deploying hop
   still needs the gate green and a read-back of the deployed result; name anything you couldn't
   verify rather than letting it read as passed.
8. **A branch behind its target must be re-merged and re-gated, not fast-forwarded.** Merge the target
   in, resolve to the union of intents (take the other side's structure, your content; never fix their
   bug inside the merge — file it instead), then re-run the full gate on the merged tree. A clean
   auto-merge is the hazard, not the reassurance — diff `git diff <parent> HEAD` (two-dot, never
   three-dot) against **both** parents to catch a silently dropped hunk.
9. **Close issues only once the work reaches the branch users actually get** — verify with
   `git merge-base --is-ancestor <sha> origin/<default-branch>`, don't assume it. `Closes #N` only
   auto-fires on the default branch; after a non-default promotion, close by hand. File every deferred
   carry as a real, labeled issue — filing is not a `PLANNER-HELD` action even under a shipping hold —
   cross-linked both directions.
10. **Final closeout only.** Sync the merged base/final branch with `git pull --ff-only`, verify local
    equals `origin/<branch>`, remove only the worktree/branch your own tooling created — never sweep
    unrelated ones. Leave pending-check worktrees intact. Finalize open review/TODO threads.
11. **Report facts, not implied success.** Seven rows, written into the target repo, not this plugin:
    Goal (with each criterion's final verify output), Landed (PR numbers, merge targets, commit
    ranges), Route, Task ledger, Stops, **Not verified** (never let an unrun check read as passed),
    Still open. Neither of the last two is empty by default — say so explicitly if it genuinely is.
    Express runs emit no report; the PR body is the record.
12. **If the planner is claude at Opus tier**, append one row (two lines max — the columns carry the
    numbers, the `lesson` cell carries one sentence or "as expected") to
    [routing-outcomes.md](../../references/routing-outcomes.md); write a rule change instead of a row
    if the lesson needs more than that. codex/agy planners propose in the run report and stop. Express
    runs append nothing.
