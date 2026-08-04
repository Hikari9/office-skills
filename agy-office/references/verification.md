# Phase 2b — Independent verification (mandatory)

Between the executor finishing and the reviewer being dispatched, the planner runs this pass. **It is
not optional diligence and it is not review.** It answers one question: *did anything actually happen,
and is what happened what the diff appears to say?*

This phase exists in `agy-office` and in neither of its siblings, for one reason: **agy's self-report
is not a signal.** It exits 0 having done nothing. It writes green tests over interfaces it invented.
It leaves stubs for work nobody asked for. Every other executor's report is a claim you can discount;
this one's is a claim you must independently replace.

Announce: `Phase 2b: verifying executor output.`

## The pass

Run all seven. None is skippable, none takes long, and each one has caught a real failure.

**1. Did it write anything?**

```bash
git -C <repo> log --oneline BASE..HEAD
git -C <repo> status --short
```

An empty range with an exit-0 run means the prompt was swallowed (a flag between `--print` and the
prompt) or quota died mid-run. Nothing was done; relaunch, don't review. A dirty tree means it left
work uncommitted — read it before deciding whether that's a mistake or a stub.

**2. Is there anything untracked that no work item asked for?**

```bash
git -C <repo> status --porcelain --untracked-files=all
```

Cross-check against the handoff's "Files created that are not in the work items" section. Front-run
stubs for later tasks get deleted now, not merged and rediscovered in three tasks' time. A file present
in the tree but absent from that section means the section is unreliable — say so in the reviewer's
brief.

**3. Does every interface it touched actually have that signature?**

Take the handoff's **Interfaces verified** table and check each row against the source yourself. Open
the file:line it cites and read the real definition. This is the single highest-yield check in the
office and it costs one read per row.

- Row cites a real file:line and the signature matches → fine.
- Row's signature does not match the source → **the implementation is wrong and its tests are wrong
  together.** Do not send this to the reviewer as-is; it is a confirmed defect, so fix it first
  (Phase 3b matrix, one tier up) and re-verify.
- Table is empty but the diff touches a hook, callback, event, or SDK call → the clause was ignored.
  Verify the signatures yourself and treat the omission as a red flag on the whole run.

**4. Do the tests fail when they should?**

For each new or amended test covering an interface, break the thing it tests — flip a condition, change
an argument — and confirm the test goes red. A test written against an invented signature passes
against the invented implementation and keeps passing when the real behaviour is broken. **A test you
haven't seen fail has told you nothing**, and with this executor that is the norm rather than the edge
case.

**5. Run the gate yourself.**

```bash
<the plan's validation commands>
```

Capture the real output. This becomes the reviewer's gate evidence — not the handoff's pasted block,
which you have no way to attribute to this HEAD. If the repo has a `Stop` hook that already ran on your
own commit, that output is reusable; an `agy` run does not fire it, so usually there is nothing to
reuse.

**6. Are the guards as wide as the work item asked?**

agy scopes conditionals conservatively — an asset enqueue gated to one template when the feature needs
three, a guard narrower than the spec. Read every conditional the diff added or changed against the
plan text. This one is quiet: nothing fails, the feature simply doesn't appear where it should.

**7. Read the assertions, not the pass count.**

Open every test the run added and ask, per test: *what does this actually assert,
and could it fail for the reason it exists?* A green suite is compatible with
tests that assert nothing relevant.

Observed 2026-08-01: two tests written to prove a form selection survives a
refetch consisted, after the rerender, of exactly

```js
expect(screen.getByText(/NEW CONNECT GROUP/i)).toBeInTheDocument();
```

— an assertion that the modal's *title* was on screen. Both passed. Both were
worthless, and worse than absent, because they converted an unverified claim
into a green checkmark that a reviewer counting suites would have accepted.

Two cheap tells, both faster than reasoning about the test:

- **The assertion doesn't name the thing under test.** A pinning test that never
  reads the selection, a permission test that never checks the affordance.
- **The mutation table is missing, thin, or its rows don't map 1:1 to the tests.**
  That table is the deliverable; treat a test with no row as unverified.

If check 4 (each new test fails when its fix is reverted) genuinely ran per test,
it catches this — a vacuous test passes against reverted code. So a *complete*
mutation table subsumes this check. Do this one anyway when the table is absent,
summarized, or reports fewer rows than there are tests, which is exactly when the
executor is telling you it skipped the work.

**Discard vacuous tests; do not repair them.** Rewriting someone else's empty
assertion inside their scaffolding tends to preserve whatever misunderstanding
produced it. Delete the file, keep a copy for its fixtures and mocking setup, and
re-dispatch the task with the specific failure named.

## What you do with the result

| Result | Action |
|---|---|
| All seven clean | Proceed to Phase 3. Hand the reviewer *your* gate output, and say the pass ran clean. |
| Empty diff / quota stall | Relaunch or fall back to a Claude executor. No review of nothing. |
| Signature mismatch, or a test that won't go red | Confirmed defect. Fix via the Phase 3b matrix (one tier up, or INLINE) and re-run this pass before Phase 3. |
| Untracked front-run files | Delete them, note it in the reviewer's brief as a scope-discipline signal. |
| Narrowed guard | Fix it, or list it for the reviewer if the correct width is genuinely ambiguous. |
| Vacuous test | Discard the file (keep a copy for its fixtures) and re-dispatch that task naming the failure. Never hand a vacuous test to the reviewer as coverage. |

**Report the pass in the reviewer's brief, in one line per check.** The reviewer needs to know which
claims you replaced with your own evidence and which you are passing through unverified — that changes
where it looks. Do not present your verification as review: you planned this work, so you are the wrong
agent to judge whether it is correct. You are only establishing that it is *real*.

## What this pass is not

- **Not a review.** No spec-compliance judgement, no quality findings, no approving anything. Phase 3
  is still the only independent review, and it still sees every line.
- **Not a reason to compress Phase 3.** A clean pass means the diff is real, not that it is right.
- **Not delegatable to the executor.** Asking agy to verify agy is the failure mode, restated.
