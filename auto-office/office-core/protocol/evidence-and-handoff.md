# Evidence and handoff (core protocol)

## What is not evidence

- **A successful process exit.** Exit 0 is compatible with having done nothing at all.
- **Narration.** "Implemented and verified" is a claim about the claimant's own work.
- **A handoff's pasted output block, unattributed.** Output you cannot tie to the current `HEAD`
  proves nothing about the current `HEAD`.
- **A green suite, on its own.** Green means the tests agree with the implementation. Tests
  written against an invented interface pass against the invented implementation.
- **A quiet gate hook.** A hook that discards passing output, or that is conditional on
  uncommitted changes, goes silent exactly when the work is done — its silence means "skipped"
  and "passed" indistinguishably.

## What is evidence

| Claim | Required proof |
|---|---|
| The gate passes | Real, pasted output of the plan's validation commands, produced against the reviewed `HEAD` |
| A test covers the change | The test observed **failing** when the behavior it covers is broken |
| A verification tool says PASS | A control run against a case that *should* fail, proving the tool can fail at all |
| Something was written to a live system | A **read-back of the deployed artifact** matching committed source, plus the observable behavior that motivated the change |
| An interface was used correctly | The real signature at `file:line`, read from source |

**A verification tool's PASS is a claim until a control run proves the tool can fail.** If the
control comes back identical, the tool measured nothing: it answered a question adjacent to the
one asked and reported success in the vocabulary of the question you meant. That is a second
defect — fix the tool, then report the original claim honestly as *unverified* and name who can
obtain the proof.

**Name what the gate structurally cannot see, before approving.** Build-and-test gates are blind
to runtime-only surfaces — reflection, dynamic member binding, accessibility as seen by a
compiled lambda, template compilation, framework callbacks no unit test invokes. Approving such
a change on gate evidence alone is approving on the strength of a check that was never able to
fail. Prefer converting the property into something the gate *can* fail on over a one-off manual
click: the click protects this run, the check protects every later one. A check on a build
artifact must **skip with a stated reason** when the artifact is missing or older than its
sources — verify stale → skip, fresh+good → pass, fresh+defective → fail.

**Reuse, do not re-derive.** If a repo gate hook already produced real output against `HEAD`,
hand that output over rather than paying twice — but read the hook first and confirm both that
the output exists and that it ran against `HEAD`.

## Evidence reuse and freshness

Evidence is valid for the commit range it was produced against. Every fix wave invalidates the
prior gate output; capture fresh output before returning to the reviewer.

## The Office Kernel

The immutable per-run packet header. Every worker and reviewer packet opens with it, verbatim
and unedited. Schema: [`../schemas/office-kernel.schema.json`](../schemas/office-kernel.schema.json).

Fields: approved plan path and version · repository, worktree, and branch · base commit ·
numbered work items in scope for this packet · protected paths · blast-radius ceiling
(verbatim) · permitted side effects · validation commands · required evidence · handoff path ·
office plugin id/version and core protocol version · invocation id.

The Kernel is the only office material every role receives. Everything else is selected.

## Handoff report contract

The executor writes a **file** at the Kernel's handoff path — not a chat summary, which
compacts. Schema: [`../schemas/handoff.schema.json`](../schemas/handoff.schema.json).

Required sections:

- **Work items** — each numbered item, its status, and the files it touched.
- **Commits** — the commit range this run produced.
- **Interfaces verified** — every hook, callback, event, SDK method, or endpoint touched, with
  its real signature and the `file:line` it was read from. Empty is only valid when the diff
  touches none.
- **Validation** — command run and its real output.
- **Mutation table** — one row per new or amended test: what was broken, and that the test went
  red. Rows map 1:1 to tests.
- **Files created that are not in the work items** — front-run or scratch output, listed.
- **`## Upline`** — every unresolved or self-resolved question, labelled `[needs-planner]`,
  `[needs-user]`, or `[decided]` per
  [`roles-and-authority.md`](roles-and-authority.md).

The planner resolves every Upline item before dispatching review, and carries the `[decided]`
list into the reviewer's packet **as written** — no editorializing, no marking entries settled.

## Capability manifest instead of a catalog

Packets carry a generated manifest of the skills actually selected for the run — name, purpose,
source path, load trigger, selected/not-selected — never a copy of the available-skills catalog
or the bodies of task skills. Schema:
[`../schemas/capability-manifest.schema.json`](../schemas/capability-manifest.schema.json).
