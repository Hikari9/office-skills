# Plan: Record Review Feedback in the PR

## Context

The executor draft-PR lifecycle gives each run one durable PR and comments bootstrap and
milestone state there. Reviewer verdicts and `CHANGES REQUIRED` findings still live only in
handoffs, so a paused or resumed run cannot reconstruct the review history from GitHub.

## Goal

During every office run with an existing draft PR, record every reviewer verdict in that PR.
For every `CHANGES REQUIRED` verdict, copy every numbered finding and its review context into a
PR comment before triage or fixes continue.

## Global Constraints

- Scope is the root `office-core` protocol plus aligned Codex, Agy, and Auto Office adapters.
- Preserve unrelated pre-existing edits in `auto-office/references/routing-outcomes.md`,
  `auto-office/skills/claude-cli-send-message/SKILL.md`, and `auto-office/skills/claude-cli/SKILL.md`.
- The existing draft PR is the single durable run record; do not create a second PR for a review
  round.
- Review comments are GitHub bookkeeping inside the approved PR lifecycle, not external outreach.
- Every reviewer verdict must be posted before the planner triages it, fixes it, re-dispatches the
  reviewer, or advances closeout.
- Every `CHANGES REQUIRED` comment must preserve all numbered findings verbatim, including severity,
  failure, expected behavior, fix recommendation, location, and rejected alternative when present.
- A `PENDING` or incomplete review file is not a verdict and must not be posted as one.
- Validation: `scripts/check-plugins.sh`, `node eval/validate-cases.mjs`, and `git diff --check`.

## Numbered tasks

### 1. Define the core PR review record

Depends on: none  
Touches: `office-core/protocol/review-states.md`, `office-core/protocol/plan-contract.md`,
`office-core/protocol/closeout.md`, `docs/rule-ownership-matrix.md`

Add the authoritative review-comment protocol: verdict comments, complete `CHANGES REQUIRED`
findings, round identity, reviewer continuity, triage/fix status, and read-back. Define that review
comments are posted before any follow-up action and that all verdicts—not only rejection—are recorded.

### 2. Align each adapter's review route

Depends on: task 1  
Touches: Codex, Agy, and Auto Office reviewer gates, reviewer briefs, and hubs where needed

Point every adapter at the core record rule and make its reviewer/fix-loop instructions require the
same PR comment timing and completeness.

### 3. Package and validate

Depends on: tasks 1–2  
Touches: vendored `office-core` snapshots, plugin changelogs/versions, and adapter evals

Vendor the updated core, add focused positive/negative eval coverage for review comments, and run
all required validation commands.

## Milestones

- M1 — Core review record: the core requires every verdict and complete `CHANGES REQUIRED` findings
  to be commented on the existing PR before follow-up actions.
- M2 — Adapter alignment: all three adapters carry the same operational rule and no route can skip
  the PR record.
- M3 — Packaged and validated: vendored snapshots, evals, plugin checks, and diff hygiene pass.

## Named actions

- `git push origin feat/office-core-review-pr-comments`: push the named branch after the plan-only
  first commit and after implementation commits; verify the remote branch SHA.
- `gh pr create --draft --base main --head feat/office-core-review-pr-comments`: create exactly one
  draft PR referencing this plan and tracking issue `#1`; verify its URL, head, base, and draft state.
- `gh pr comment <number> --body-file <file>`: post the bootstrap, milestone, finalized-verdict,
  and fix-resolution comments to the existing PR; verify each comment is present and attributed to
  the current run before continuing.

## Out of scope

- Changing GitHub Actions or repository settings.
- Changing reviewer verdict semantics, reviewer independence, or round caps.
- Marking the PR ready or merging it; those remain final closeout actions after approval.
