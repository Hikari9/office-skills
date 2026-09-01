# Review states and the fix loop (core protocol)

## The reviewer

Fresh, and never the agent that did the work. The planner is the **worst** available reviewer
for code it has been reading all session, and reviewing your own plan's output is not review.

**Record the reviewer's agent id.** Every later round goes back to that same reviewer so it
keeps what it already flagged and accepted. A fresh reviewer per round re-litigates settled
findings and cannot tell you whether round 2 regressed round 1. If continuity is genuinely
unavailable, carry the previous findings list verbatim and say in the round line that
continuity was lost.

**Do not pre-judge.** Never write "don't flag X", "the plan chose Y", or "at most minor" into a
reviewer's prompt. A finding you expect to be a false positive is one to adjudicate after it is
raised.

**Hand over the diff as a file**, never as prompt text.

## The PR review record

The existing draft PR is the run's durable review log. The planner posts **every complete
reviewer verdict** to that same PR before triaging it, applying a fix, dispatching a follow-up
round, or advancing closeout. Review feedback that exists only in a handoff or chat is not a
resumeable run record.

For each verdict, create one comment with:

- the review round, reviewer agent id, `HEAD` SHA, and commit range;
- the reviewer's complete finalized verdict, including its `## Self-review`, gate evidence,
  deferrals, and Upline decisions; and
- for `CHANGES REQUIRED`, **every numbered finding verbatim**, including severity, failure,
  expected behavior, fix recommendation, location, and rejected alternative when present.

Post it with `gh pr comment <number> --body-file <verdict-file>` and read the comment back. A
`VERDICT: PENDING` file, a killed/incomplete review, or a comment that omits any finding is not a
review record and does not consume a round.

After triage and each fix wave, post a second comment before re-dispatching the reviewer. It maps
every prior finding to `ADDRESSED` or `NOT ADDRESSED`, gives the planner's evidence and any
counter-reasoning, names the fix commit/range, and states the next resume point. The next verdict
comment then carries the reviewer's complete follow-up response and all prior-finding statuses.
If either comment or its read-back fails, stop with the draft PR intact; do not continue the loop
on an unrecorded review.

## The three verdicts

| Verdict | Meaning | Effect |
|---|---|---|
| `APPROVED` | The work is right, and the reviewer saw real gate output for this `HEAD` | Leaves the review phase. Only this verdict does. |
| `CHANGES REQUIRED` | Numbered findings against the diff | Planner records a disposition; a follow-up round is conditional |
| `PLAN DEFECT` | The diff faithfully implements the plan and the **plan** is wrong | **Exits the loop without consuming a round** |

A reviewer that approves without pasted validation output is sent back. Approval is refused, not
assumed, in the absence of evidence.

**Every verdict carries the reviewer's own `## Self-review`**, per
[`evidence-and-handoff.md`](evidence-and-handoff.md#self-review-before-handoff-mandatory-every-role).
Before returning, the reviewer re-reads its findings and asks the two questions that find real
defects: *which finding can I not state a concrete failure scenario for*, and *which surface did I
not open at all*. Surfaces it did not open are listed — a partial review that says so is honest;
one that does not is silently narrow.

**The self-review may sharpen or add findings; it may never quietly drop one.** A withdrawn finding
is recorded as withdrawn with its reason, so a softened gate is visible. **Every round self-reviews,
not only the first** — round 3 is where fatigue lands.

A verdict returned with no self-review goes back to the reviewer to complete, and **does not
re-consume the round.** Schema:
[`../schemas/review-verdict.schema.json`](../schemas/review-verdict.schema.json).

## Planner disposition after `CHANGES REQUIRED`

`CHANGES REQUIRED` is the reviewer's gate state, not an instruction to launch another fix wave.
The planner owns the next transition and must pause for a written disposition before fixing,
re-dispatching the reviewer, or deciding that no further round is warranted. The disposition is
recorded in the durable review log (the PR comment when a draft PR exists) and includes:

- each finding's status: accepted, contested, deferred, or escalated;
- the planner's recommendation: `FIX_AND_REVIEW`, `REPLAN`, `WAIVE_AND_STOP`, or `STOP`;
- the concrete failure scenario and expected outcome that justify the choice;
- a **pre-fix reflection**: whether the finding is material, whether the plan is at fault, and
  what another round would buy;
- a **mid-fix checkpoint** when the fix changes shape: whether the finding still holds, whether
  the scope or risk changed, and whether to continue, revise, or stop; and
- the evidence and next resume point.

The planner may decide that another round is not worth funding. That decision preserves the open
`CHANGES REQUIRED` state and routes to `WAIVE_AND_STOP` or `STOP`; it never authorizes closeout or
turns the verdict into `APPROVED`. A finding that the planner contests is recorded with
counter-reasoning rather than silently dropped.

If an accepted fix changes executable behavior, security, data handling, runtime configuration, or
another surface covered by the gate, the planner must choose `FIX_AND_REVIEW`. The same independent
reviewer then reviews the new `HEAD`. A follow-up review may be skipped only when no gated artifact
changed; the run still cannot leave review with unresolved findings without an `APPROVED` verdict.

The round cap is a maximum, not a quota. The planner may continue only when the disposition explains
why the expected value of another round justifies its cost. At every round, including rounds 3–5,
the planner reflects before and during the fix wave instead of mechanically funding the next one.

### `PLAN DEFECT`

Treating a wrong plan as `CHANGES REQUIRED` cannot converge — it asks the executor to fix a
correct implementation and burns rounds getting nowhere. Route by owner:

- **Technical gap** (the plan assumed a structure that does not exist; two constraints conflict)
  → the planner amends the plan, then re-dispatches only the affected tasks.
- **Tradeoff, scope, cost, or business call** → the user's. Present the reviewer's reasoning, the
  plan text, and a recommendation, then wait.

Never answer a `PLAN DEFECT` by pressuring the reviewer to downgrade it, and never quietly
implement your own preference instead. Arguing it on the merits in the same conversation is
legitimate; a correct reviewer will concede when it is wrong.

## `BRIEF DEFECT` — the executor's return

A reviewer structurally cannot catch a wrong brief: it gates a diff against a plan, and a diff
that faithfully implements a false premise looks correct. The executor is the only role positioned
to notice, because it is the one that goes and looks. So it gets a return path.

`BRIEF DEFECT` is the executor asserting that **the brief's stated cause is false** — the bug does
not reproduce at `BASE`, the named function is not on the code path, the described structure does
not exist. It carries **evidence gathered at `BASE`** and it **stops without implementing.** An
executor that "fixes it anyway, just in case" has spent the run's budget on a change nobody can
evaluate.

- Routes to the **planner** when the gap is technical (the cause is misidentified, the file moved),
  and to the **user** when it is scope (the thing described is not the thing wanted).
- **Does not consume a review round.** Same treatment as `PLAN DEFECT`, of which it is the upstream
  twin: both say the instruction was wrong, not the work.
- A `BRIEF DEFECT` that turns out to be mistaken is cheap — one read at `BASE` to disprove it. A
  suppressed one is a whole task implemented against a false premise, plus the review rounds spent
  discovering that the implementation was faithful.

## Standing brief clauses (every executor brief carries both)

1. **Verify the stated cause reproduces at `BASE` before implementing.** If it does not, return
   `BRIEF DEFECT` with what you found instead.
2. **Any task shipping a test must record that test failing against `BASE`, the pre-regression
   checkpoint, or a deliberately reverted fix.** The Tester may run BASE in the read-only Planner
   worktree while the Executor continues coding. A test that passes before the change and after it
   has demonstrated nothing about the change. This is a brief clause and not a reviewer heuristic
   because a green test is invisible to review: it looks exactly like a passing test that works.

## The fix loop

The **planner** applies fixes; the reviewer does not fix what it gates.

- **One fix wave per round, all findings together.** Per-finding dispatches each rebuild context
  and re-run the suite.
- **Escalate out of the tool, not up within it.** A failure class the worker just demonstrated —
  an invented interface, a test that will not go red — does not go back to that worker.
- **At 2 `CHANGES REQUIRED` rounds on one task — consecutive or not — force a fresh planner
  disposition checkpoint.** The planner records whether the next action is another fix and review,
  a plan amendment, a waiver/escalation, or a stop. Two rounds are evidence to weigh, not an
  automatic `PLAN DEFECT`; the planner must explain why another round is or is not expected to
  converge. A technical plan gap still takes the `PLAN DEFECT` route above, and a tradeoff, scope,
  or cost decision still goes to the user.
- **Re-run the gate after each accepted wave that changes a gated surface** and capture the real
  output. The fix diff + fresh gate output go back to the same reviewer when the planner's
  disposition is `FIX_AND_REVIEW`.
- **A finding that contradicts the approved plan is the user's call.** Present the finding beside
  the plan text and ask which governs. Do not fix against the plan; do not dismiss the finding
  because the plan mandated it.
- **Cap: 5 rounds.** At the cap with findings open, stop dispatching and report the deadlock —
  each open finding, the reviewer's reasoning, your counter-reasoning, and the fix history. Do
  not self-approve past the cap and do not park a load-bearing finding to escape the loop.

## Scoping a correction

When a run discovers that a rule or tool is wrong, scope the correction to what was actually
measured. "X never works" contradicts every past success on record, and a live document that
contradicts itself gets one of its halves believed at random. Find the discriminating variable
before generalizing.
