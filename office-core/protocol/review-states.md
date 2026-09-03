# Review states and the fix loop (core protocol)

## The reviewer

Fresh, and never the agent that did the work. The planner is the **worst** available reviewer
for code it has been reading all session, and reviewing your own plan's output is not review.

**Record the reviewer's agent id.** Every later round goes back to that same reviewer so it
keeps what it already flagged and accepted. A fresh reviewer per round re-litigates settled
findings and cannot tell you whether round 2 regressed round 1. If continuity is genuinely
unavailable, carry the previous findings list verbatim and say in the round line that
continuity was lost.

**After any confirmed defect, brief the next round on its *shape*, not its line.** A fixed finding
is a sample of a class, and the class usually has other members the first pass walked past. State
the mechanism in the round brief and instruct the reviewer to hunt more instances of it.

Observed 2026-09-03: round 1 cleared a file that round 2 then found a blocking defect in, because
round 2's brief named the round-1 defect's shape — *two individually-correct changes combining,
invisible to a diff because no single line is wrong* — and told the reviewer to look for more of
it. It found a second instance in a code path the first fix never touched. Round 3, briefed the
same way, found a third residue of the same shape and correctly judged it unreachable rather than
reporting it as a defect.

This costs one paragraph in the round brief and is the cheapest yield in the loop. It also tells
the reviewer what *not* to re-examine, which is how a later round stays inside the cap.

### Resume vs. fresh — a cost decision, not a default

Resume is the default because it preserves what the reviewer already flagged and accepted. It is
not free: each round replays the entire prior transcript, so its cost grows with round count and
accumulated size — a resumed reviewer's later rounds have been measured well into six figures of
tokens, several times the round before it, for the same review. Weigh that against a fresh
reviewer primed with a written digest of what is already settled, on three signals together:

- **Measured cost.** Check the reviewer's own reported context/usage before dispatching the next
  round. When this round's replay cost would exceed a fresh pass plus a digest, go fresh.
- **Round count as an independent signal.** Rounds 1–3 default to resume. By round 4, lean fresh
  unless measured cost still favors resuming — mirroring the same threshold this office already
  applies to a stuck implementer. The round cap is the hard backstop either way, not the trigger.
- **Relatedness.** Resume when this round checks whether a prior fix regressed a prior finding —
  that is the property resume exists to preserve. Go fresh when this round's diff is a
  substantially disjoint slice that does not depend on the reviewer's prior findings.

**Going fresh is not going in blind.** Write down what the new reviewer needs — settled findings,
accepted verdicts, anything fragile — and hand that over instead of the transcript. There is no
fixed template for the digest; its shape is the planner's call, scoped to what this round actually
needs. What is not optional is writing one: a fresh reviewer with nothing handed over silently
drops the regression-detection property resume exists for.

**Declare the choice.** State `resume` or `fresh` and the one-line reason in the round line, the
same as any other dispatch-form decision this office requires declared rather than assumed.

**Do not pre-judge.** Never write "don't flag X", "the plan chose Y", or "at most minor" into a
reviewer's prompt. A finding you expect to be a false positive is one to adjudicate after it is
raised.

**Hand over the diff as a file**, never as prompt text.

## PR comment policy

The PR is a concise run marker, not the complete review log. Preserve every reviewer verdict,
finding, disposition, fix wave, and gate result in the review files and planner run state. The
planner posts to the PR only at these three events:

1. **Approved plan / execution begins.** The executor's bootstrap comment records the branch,
   plan path, issue, plan commit, and next resume point.
2. **First executor completion.** The first executor's completion comment records its status,
   handoff, commit range, final `HEAD`, gate evidence, and next resume point. Follow-up fix
   executors do not add PR comments.
3. **Final `APPROVED`.** After the reviewer returns `APPROVED`, post one short summary with the
   reviewer id, final `HEAD`, review rounds, the total number of changes required across those
   rounds, and a brief reason for each change — or why none were required. Use
   `gh pr comment <number> --body-file <approval-summary-file>` and read the comment back.

Do not post `CHANGES REQUIRED`, `PLAN DEFECT`, intermediate verdicts, or fix-resolution comments
to the PR. A `VERDICT: PENDING` file, a killed/incomplete review, or a review without its required
internal evidence is not a completed review and does not consume a round. If one of the three
allowed comments or its read-back fails, stop with the draft PR intact.

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
recorded in the review files and planner run state and includes:

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
