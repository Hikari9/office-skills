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

## The three verdicts

| Verdict | Meaning | Effect |
|---|---|---|
| `APPROVED` | The work is right, and the reviewer saw real gate output for this `HEAD` | Leaves the review phase. Only this verdict does. |
| `CHANGES REQUIRED` | Numbered findings against the diff | Consumes a round; planner triages and fixes |
| `PLAN DEFECT` | The diff faithfully implements the plan and the **plan** is wrong | **Exits the loop without consuming a round** |

A reviewer that approves without pasted validation output is sent back. Approval is refused, not
assumed, in the absence of evidence.

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
2. **Any task shipping a test must paste that test failing at `BASE`** — or against the reverted
   fix. A test that passes before the change and after it has demonstrated nothing about the
   change. This is a brief clause and not a reviewer heuristic because a green test is invisible
   to review: it looks exactly like a passing test that works.

## The fix loop

The **planner** applies fixes; the reviewer does not fix what it gates.

- **One fix wave per round, all findings together.** Per-finding dispatches each rebuild context
  and re-run the suite.
- **Escalate out of the tool, not up within it.** A failure class the worker just demonstrated —
  an invented interface, a test that will not go red — does not go back to that worker.
- **At 2 consecutive `CHANGES REQUIRED` rounds on one task, the default presumption flips to
  `PLAN DEFECT`.** Re-plan the task instead of funding a third fix wave. Two rounds of findings on
  one task is evidence about the *instruction*, not about the worker's diligence, and "escalate out
  of the tool" has nowhere to go when the tool is already the best fit or already the top tier. The
  presumption is rebuttable — say why in one line if you rebut it — but it is the default.

  **Handling, because this rule binds every office:** it takes the `PLAN DEFECT` route above.
  Technical gap → the planner amends the plan and re-dispatches **only the affected tasks**;
  tradeoff, scope, or cost → the user's call, with the reviewer's reasoning presented. No new
  adjudicator role is introduced, and no agent is recalled to arbitrate.

  **One bound:** a **second amendment to the same task goes to the user.** A planner amending its
  own plan repeatedly is the author clearing their own work, and the second time is where that
  stops being triage and starts being self-approval. The independent review gate still holds on
  whatever the amendment produces, so the amendment itself is never self-approved.
- **Re-run the gate after each wave** and capture the real output. Fix diff + fresh gate output
  go back to the same reviewer.
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
