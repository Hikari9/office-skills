# Reviewer prompt contract

Use a fresh, separate Codex reviewer identity at `gpt-5.6-luna` high effort. When the planner is
Codex, this is a fresh in-session subagent; when the planner is another brand, use
`codex exec -m gpt-5.6-luna -c model_reasoning_effort="high"`. Both CLI flags are required:
`-m` alone runs at the operator's configured default, not at high.
Give it the absolute repo path, branch, plan path, BASE..HEAD range, diff
package, executor handoff, copied global constraints and blast-radius ceiling,
the Upline `[decided]` entries, protected paths, and the complete validation
output. Tell it to read the plan, handoff, diff, and surrounding callers;
verify scope containment; and treat missing gate evidence as blocking.

The reviewer must return exactly one first-line verdict:

```text
VERDICT: APPROVED
```

or `VERDICT: CHANGES REQUIRED` with numbered Critical/Important findings,
concrete failure cases, expected behavior, deferral/Upline triage, scope result,
and gate evidence; or `VERDICT: PLAN DEFECT` where faithful implementation of
the plan is itself wrong. It cannot approve without actual command output.

Every numbered finding carries three more lines so the planner does not have to guess the fix:

```text
1. [Critical] <file>:<line> — <one-sentence defect>
   Failure: <concrete inputs/state → wrong result>
   Expected: <what the plan or correctness requires>
   Fix: <the approach, 1-2 sentences — not a patch>
   Where: <exact file:line or symbol to change>
   Rejected: <the plausible-but-wrong fix, and why it fails>
```

`Rejected:` earns its keep: a finding whose obvious fix targets the wrong term ships a freeze as a
fix for a lag. The reviewer still **never writes the fix** — `Fix:` is a recommendation the
implementer may reject with evidence — and on follow-up rounds it judges the result on correctness,
never on whether its own suggestion was followed.

## `VERDICT: PENDING` while the review file is incomplete

Reviewers are told to write their verdict file **early** and update it as they go, because a killed
reviewer otherwise loses everything. That instruction collides with the single-verdict-line rule: a
reviewer killed mid-run leaves a stub whose verdict line is already stamped, and a stub reading
`CHANGES REQUIRED` with no findings behind it is indistinguishable from a real rejection.

That matters because of the escalation rule — two `CHANGES REQUIRED` (total) presume a **plan
defect**. A placeholder can therefore trigger a plan re-examination that nothing actually justifies,
or (stamped `APPROVED`) close a wave that was never reviewed.

So require: **while the review is incomplete, the last line must read exactly `VERDICT: PENDING`.** It
is replaced with the real verdict only once the review is genuinely complete. Any verdict line other
than `PENDING` is then a positive claim that the work behind it was done.

Corollary for the planner: on any killed reviewer, read the partial file before counting its verdict.
A `PENDING` stub — or a stamped verdict with an empty findings section — is **not** a round. Do not
advance the round counter or the rejection counter for it. Re-dispatch instead.
