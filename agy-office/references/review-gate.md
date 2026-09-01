# Phase 3 — Adversarial Review (detail)

Announce: `Phase 3: dispatching reviewer (<model>) for final gate.`

**Do not enter this phase until Phase 2b passed.** [verification.md](verification.md) establishes that
the diff is real and its interface claims are true. Dispatching a reviewer at an empty diff, or at code
whose tests were written against an invented signature, wastes a round on something you could have
caught in the Phase 2b checks.

Dispatch a **fresh** agent that did not do the work — never agy, never yourself:

```
Agent(
  description: "Final review <slug>",
  subagent_type: "general-purpose",
  model: "opus",
  run_in_background: false,
  prompt: <the reviewer brief>
)
```

**The code-review floor is `opus` low.** The gate's strength is independence, freshness, and a
pointed brief — not effort tier. In-session dispatch has no `effort` parameter, so the brief still
carries the rigor as stated instruction: open it with *"Do not stop at the first defect you find."*
A CLI-launched reviewer passes `--effort low` explicitly, and a missing `--effort` is a dispatch
defect in either direction.

**Before you dispatch: the handoff must carry a `## Self-review` section.** Core requires the
executor to review its own work per task and once over the cumulative diff. If that section is
missing or empty, return the handoff to the executor and do not dispatch review — the gate is not
the place to catch what the author could have found for free. Read the section, then leave it in the
handoff: **do not** copy its findings into the reviewer's brief. Handing a reviewer the author's own
list anchors it and converts an independent pass into a verification of someone else's work.

**The reviewer is always a Claude subagent here.** Unlike `codex-office`, there is no caller tweak that
routes review through the executor CLI: an agy run reviewing an agy diff shares the blind spots that
produced it, and this executor's characteristic failure — self-consistent wrong work that passes its own
tests — is precisely the one a same-family reviewer cannot see. If the user asks for a second opinion
from a different model, run a second *Claude* reviewer at a different tier, or note that `claude-office`
is the office for that.

**Record the returned agent ID/name.** Every subsequent round goes back to that same agent via
SendMessage so it keeps the full history of what it already flagged and accepted. A fresh reviewer per
round re-litigates settled findings and cannot tell you whether round 2 regressed round 1.

Build the prompt from **[reviewer-brief.md](reviewer-brief.md)**. Hand it: the plan file path, the Global
Constraints block copied verbatim, agy's handoff report path, a diff package file for `BASE..HEAD`, the
validation commands, **your own gate output from Phase 2b**, and a one-line-per-check summary of what
the verification pass found.

**Also hand it the handoff's `## Upline` list** — specifically the `[decided]` entries, and say whether
the list looked complete against the diff. Those are the decisions made under uncertainty and the
reviewer's highest-yield scrutiny targets. Do not editorialize the entries themselves.

**Generate the diff as a file, never as prompt text:**

```bash
{ git log --oneline BASE..HEAD; echo; git diff --stat BASE..HEAD; echo; git diff -U10 BASE..HEAD; } \
  > <workspace>/review-package.md
```

**Do not pre-judge.** Never write "don't flag X", "the plan chose Y", "at most minor" into the reviewer's
prompt. If you believe a finding will be a false positive, let it be raised and adjudicate it.

## agy reviewed nothing — the gate carries more weight here

In `claude-office` the executor reviews each task before you ever see it, so Phase 3 is the *second*
review. An `agy` run has no subagents and reviews nothing: **Phase 3 is the first and only independent
review of every line.** Your verification pass does not change that — it established that the work is
real, not that it is right. Two consequences:

- Do not compress the reviewer's rubric to save tokens. It is the whole quality system.
- Read the diff yourself before dispatching, enough to know what the run actually did. Not to review it —
  to write a brief that names the real live surfaces, the interfaces at risk, and what your pass already
  verified.

## Build evidence: yours, not the executor's

The handoff's pasted gate output is a claim you cannot attribute to this HEAD, from an executor that has
written green tests over invented interfaces. **Use the output you captured in Phase 2b** and tell the
reviewer it is yours.

A repo `Stop` hook's captured output is reusable when it exists and matches `HEAD` — but an `agy` run
does not trigger the harness's hook, so usually there is nothing to reuse and Phase 2b's run is the only
real gate output in existence.

## Live systems: evidence is a read-back, not an exit code

If this run **wrote anything to a live system** — a deploy, a migration, a CMS/page/block write, a config
push — the writer's exit code is not evidence. A script can report success and leave the live surface
running older content: the write went to the wrong row, a cache still serves the previous version, or the
platform accepted the call and ignored it. With this executor, an exit code is not evidence of anything
at all.

For every such write, the evidence the reviewer must see is a **re-read of the deployed artifact** proving
it matches the committed source, plus a check of the observable behaviour that motivated the change. Name
the live surfaces in the reviewer's prompt. (Most live writes should have been `PLANNER-HELD` and run by
you, not by agy — see [routing.md](routing.md).)

The reviewer returns one of three verdicts: `APPROVED`, `CHANGES REQUIRED` with numbered findings, or
`PLAN DEFECT`. It is instructed to refuse approval without pasted command output for the build/test gate
— if it approves without that evidence, send it back.

After every complete verdict, the planner must post the reviewer's finalized verdict to the
existing draft PR before triage, fixes, another review round, or closeout. The comment must carry
the round, reviewer id, `HEAD`/range, complete verdict and self-review; for `CHANGES REQUIRED`,
copy every numbered finding verbatim. After each fix wave, post a finding-by-finding
`ADDRESSED`/`NOT ADDRESSED` resolution comment with evidence, fix range, and next resume point,
then read both comments back. A `PENDING` or incomplete review is not posted or counted.

Before triage or a follow-up, the planner also records a disposition for every finding: accepted,
contested, deferred, or escalated; a recommendation of `FIX_AND_REVIEW`, `REPLAN`, `WAIVE_AND_STOP`,
or `STOP`; the concrete failure scenario and expected outcome; and a pre-fix reflection. If the fix
changes assumptions, scope, or risk, the planner pauses for a mid-fix checkpoint. The planner may
decline to fund another round, but an accepted change to a gated surface requires independent
re-review and an unresolved finding cannot be treated as approval.

## `PLAN DEFECT` — the reviewer's upline path

Sometimes the diff faithfully implements the plan and the **plan** is what's wrong. Treating that as
`CHANGES REQUIRED` cannot converge: you would be asking agy to fix a correct implementation, and the loop
burns its rounds getting nowhere.

`PLAN DEFECT` **exits the fix loop instead of consuming a round.** Route it by owner (see
[escalation.md](escalation.md)):

- **Technical plan gap** — the plan assumed a structure that doesn't exist, or two constraints conflict.
  Yours to amend: revise the plan file, then re-dispatch only the affected tasks.
- **Tradeoff, scope, cost, or business call** — the user's. Present the reviewer's reasoning, the plan
  text, and your recommendation, then wait.

Never answer a `PLAN DEFECT` by pressuring the reviewer to downgrade it, and never quietly implement your
own preference instead. If you believe the reviewer is wrong on the merits, argue it on the merits in the
same conversation — it will concede if you're right.

## Phase 3b — The fix loop

Triage each finding with this matrix before touching anything:

| Finding shape | Mode | Why |
|---|---|---|
| Deterministic, zero ambiguity, and the finding text *is* the brief — typo, import, off-by-one, missing constant, copy fix | **INLINE** (you edit) | Brief + dispatch + verification costs far more than the edit |
| Bulk mechanical repetition across many files — renames, codemods | **agy, Flash latest `medium`/`high`** | Cheapest tier, and the diff is trivially checkable |
| Real volume, a refactor, or a fix whose correct shape is not obvious from the finding text | **agy, Flash latest `high`** | Default tier; volume is a purchase and doesn't belong in your context |
| An invented signature, a test that wouldn't go red, or a defect the reviewer calls subtle/security-relevant | **Claude subagent (`opus`), or INLINE** | This is the failure class agy produced. Do not hand it back to the same tool that created it. |

Announce the mode in one terse line per fix wave: `Mode: <INLINE|flash|pro|claude-opus> — Why: <≤8 words>`.

**That last row is the one that matters.** Re-dispatching a self-consistency failure to the executor that
made it is how a fix loop burns five rounds producing five internally-consistent wrong answers. Escalate
out of the tool, not up within it.

Rules for the loop:

- **Every agy fix dispatch is a full task prompt.** The contract in
  [executor-brief.md](executor-brief.md) has no optional fields for fixes either — workspace root,
  scope, protected paths, real-signature clause, commit boundary, validation, and the
  no-clarifying-question line all still apply.
- **Resume rather than re-prime when the fix belongs to work agy just did:** `agy --continue` or
  `--conversation <id>`, with the same flag-ordering rules. Its context is intact, which is cheaper than
  re-deriving intent from a diff. Start fresh when changing model or when the conversation is gone.
- **One fix wave per round, all findings together.** Not one dispatch per finding.
- **Re-run the verification pass, scoped to the fix**, then re-run the gate yourself and capture real
  output. Both, every round. Signature checks and the fail-the-test check apply to fix diffs exactly as
  they applied to the original.
- **A finding that contradicts the approved plan is the user's call**, not yours. Present the finding
  beside the plan text and ask which governs. Do not fix against the plan, and do not dismiss the finding
  because the plan mandated it.
- **Send the same reviewer** the fix diff package (`git diff PREV_HEAD..HEAD` to a new file), a
  per-finding note of what you did, and your gate output — via SendMessage to the recorded agent ID. If
  SendMessage is unavailable, dispatch a fresh reviewer carrying the previous findings list verbatim and
  say in the round line that continuity was lost.
- **Cap: 5 rounds.** At round 5 with findings still open, stop dispatching. Report to the user: each open
  finding, the reviewer's reasoning, your counter-reasoning, and the fix history. Do not self-approve
  past the cap and do not park a load-bearing finding to escape the loop.
- **Quota can end the loop for you.** A fix wave that stalls after a few narration lines is quota, not a
  hard problem — say so, and switch the remaining fixes to INLINE or a Claude subagent rather than
  retrying into an empty tank.

Only `APPROVED` from the reviewer leaves this phase.
