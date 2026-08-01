# Reviewer prompt contract

Use a fresh `codex exec -m gpt-5.6-sol` session with high reasoning effort.
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

