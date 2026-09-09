---
name: self-review-loop
description: Use when a document will be executed by someone who cannot ask a follow-up — a plan, brief, spec, or set of done-criteria. Re-reviews the document in passes until one pass finds nothing, running every verify command instead of trusting it, and treating each fix pass as a new source of defects.
---

# Self-Review Loop

One self-review pass is not a gate, it is the first pass. This skill is the loop: review, fix,
review the fix, until a pass finds nothing.

It exists because of a measured asymmetry. On the run that produced it, the planner's single
self-review found 8 defects and a fresh adversarial gate found 12 more with near-zero overlap —
the numbers this office already documents. Then the operator asked for another pass, and another.
The passes *after* both gates had already run found **33 more defects**, three of them introduced
by applying the gate's own findings, and three of them criteria that could never have gone green.
The gates were not weak. The assumption that a fix pass is free was.

**Scope.** Any document a routed agent will execute without being able to ask you a question:
a plan and its GOAL block, an executor brief, a spec, a reviewer brief. Not prose whose only
reader is a human who can push back.

## The loop

```
write ─▶ pass N ─▶ defects? ─┬─ yes ─▶ fix ─▶ propagation sweep ─▶ pass N+1
                             └─ no  ─▶ done
```

Three rules make it terminate and make it worth running:

1. **A fix pass is a new draft.** Every applied finding is fresh, unreviewed text. The pass that
   follows a fix pass is not a formality; it is where the fix's own defects live.
2. **A defect is something that changes what an executor would do.** Wording, ordering, and tone
   are not defects. Without this line the loop never ends; with it, it converges in a handful of
   passes.
3. **Stop on a clean pass, not on a quiet one.** "Only minors left" is not a stop condition —
   two of the worst defects on the source run surfaced in passes that opened with minors.

## The six detectors

Run these *as commands*, in this order. Reading finds contradictions; only executing finds
unsatisfiable criteria, and those are the expensive class.

### D1 · Execute every verify command, at `BASE`

The highest-yield detector by a wide margin, and the cheapest. For each done-criterion, run its
command against the tree **before** any change. You are looking for two failures:

- **Vacuous green** — the command passes without observing anything. Source run: the plan's unit
  gate was `python3 -m unittest <file>`, which printed `Ran 0 tests / NO TESTS RAN` and exited
  clean. The module was pytest. The gate would have been green for the whole run.
- **Unsatisfiable** — the command can never pass, so the run stalls at a gate that reads as rigor.
  Three on the source run: `PASS` demanded from a checker that returns `UNAUTHENTICATED` against a
  login-walled page by design; a SHA-256 equality against a file the deploy script transforms
  before writing; and "the set is unchanged" asserted about a set the fix exists to change.

Both failures are invisible to reading and obvious to running. If a command cannot be run yet,
say so in the document and name what will run it.

### D2 · Read every deploy or apply script the plan trusts

A read-back is only a read-back if it compares against what actually gets written. Source run:
the apply script substituted a marker into the markup before writing, so the deployed artifact was
never byte-identical to the repo file and the plan's hash check could not have matched. `grep -n
"read_text\|replace(\|render\|format(" <the apply script>` found it in one call.

### D3 · Sweep for propagation misses

A fix applied to a task's prose does **not** reach the done-criterion that restates it. This is
systematic, not occasional: one pass on the source run found four, and the criteria are the half
that matters, because the criteria are what get checked.

After every fix, grep the whole document for the **old** phrasing — not the new one, and never by
re-reading:

```bash
grep -n "<the phrase you just replaced>" <document>
```

### D4 · Recompute every number from its source

Counts drift as a document is edited, and a wrong count in a criterion is a wrong gate. Source
run: "sixteen closed tickets" in three places against seventeen actual; "this document scores 17
on that grep" when it scored 15; "three gotchas" over a four-row table.

Recompute each figure with the command that produced it, and prefer the command over the number in
the text wherever a reader could re-run it.

### D5 · Verify the reviewer's fix, not just the reviewer's finding

A finding can be right and its `Fix:` wrong. Source run: the gate correctly found the test gate
vacuous, and its recommended replacement was **also** vacuous — both `unittest` invocations run
zero tests, because the module is pytest. Applying the fix on the reviewer's authority would have
kept the defect and added confidence.

Rejecting a finding needs evidence; so does accepting one.

### D6 · Cross-check the document against itself

Cheap structural assertions, run as commands:

- every task id referenced is defined, and every one defined is referenced;
- every done-criterion belongs to **exactly one** milestone, none orphaned, none doubled;
- no path appears in both a protected-paths list and a task's files-touched list — the source run
  froze a directory and then instructed a task to write into it;
- no two rules govern the same gate in opposite directions.

## The defect classes worth naming

Ranked by what they cost when they survive to execution:

| Class | Shape | Detector |
|---|---|---|
| **Unsatisfiable criterion** | A gate that can never go green. Reads as rigor, functions as a stall. | D1 |
| **Vacuous gate** | Passes without observing anything. Worse than no gate — it reports safety. | D1 |
| **Self-contradicting criterion** | Asserts unchanged what the fix is meant to change, or forbids what another task requires. | D1, D6 |
| **Propagation miss** | Fixed in the prose, stale in the criterion. | D3 |
| **Unexecutable assignment** | A command, flag, tool, or skill the assigned agent does not have. Check the *brand*, not just the command. | D2 |
| **Drifted number** | A count that no longer matches its source. | D4 |
| **Missing method** | The task states an outcome that needs a specific technique, and omits it — "show the test red at `BASE`" after the fix is already on disk, with no restore recipe. | D6 |

## Calibration

Observed pass yields on the source run — a 761-line plan, two lanes, nine done-criteria:

| Pass | Defects | Notable |
|---|---|---|
| 1 — self-review, pre-gate | 8 | the author's own hand-waving |
| — fresh adversarial gate | 12 | ~0 overlap with pass 1; 4 blockers |
| 2 — first pass after applying the gate | 11 | **3 introduced by the fix pass itself**; 1 unsatisfiable criterion |
| 3-7 — the loop | 22 combined | falling: ~9, 4, 4, 1, 2. Included 2 more unsatisfiable criteria, 4 propagation misses into criteria, 1 missing method |
| 8 | 0 | stop |

Read two things off it. **The 33 defects found after both formal gates are more than both gates
found together (20)**, so one self-review plus one fresh pass is not the finish line. And the yield
falls monotonically once the loop starts — this converges, it does not oscillate.

**It is not a substitute for a fresh adversarial pass.** Self-review finds what its author knows
it hand-waved; a fresh reader finds what the author could not see. Run both, and run this loop
*after* applying the fresh pass, because that is when the fix-pass defects exist.

## Reporting it

Say what each pass found and which findings were your own doing. On the source run, three of one
pass's eleven came from applying the previous round's fixes, and two false claims were the
planner's own — that is the useful part of the report, not the total.

Report a converted assertion as a **measurement**, with the command's real output. "The gate is
green" is worth nothing; "282 passed in 20.5s across those 19 modules, so a red module at the end
is this run's doing" is a baseline the next agent can use.
