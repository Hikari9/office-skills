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

## Run-state durability and the compaction recommendation

The handoff contract above protects the *executor's* report. The same failure mode applies one
level up, to the planner's own context — and nothing in the run protects it, because **the planner
cannot compact itself.** Only the user can invoke a compaction, and a window boundary or a crash
does not ask first.

So at **every phase or task boundary**, the planner surfaces a recommendation — `compact: yes | no
— <reason>` — on a line the user is already reading. It is a recommendation, never an action, and
**never a question the run's continuation depends on.** Offices define where the field goes; this
file defines when it is `yes` and what a `no` obliges.

A clean boundary makes compaction **safe**. It does not make it **worth it** — those are two
separate tests, and both must pass.

**Safe** requires all three:

1. A clean boundary was just reached — a phase closed or a task approved, no half-verified state
   in flight.
2. Its evidence is **on disk**: handoff file, verdict record, plan amendment. Not only in chat.
3. What comes next is a file, not a memory.

**Worth it** is arithmetic, not vibes. Compaction is not free: the summary itself costs tokens, and
the agent then **re-reads** the files, plans, and outputs it just dropped — at the *current* model's
input rate, which is where the real bill lands. Estimate before recommending:

```
saving  ≈ (context tokens dropped) × (turns remaining before the next natural boundary)
cost    ≈ summary tokens + (tokens re-read afterward × current model rate)
```

Two consequences worth stating outright, because both invert the naive answer:

- **A small context at a clean boundary is a `no`.** Dropping 30k tokens you will re-read within
  two turns is a net loss, however tidy the boundary. Compaction earns its cost when the context is
  **large relative to the window** and the state that must come back is **small** — a plan path and
  a handoff path, not a re-read of the whole diff.
- **The model tier moves the break-even.** The same re-read costs several times more on an
  Opus-tier planner than a Sonnet-tier one, so a heavy planner should compact *earlier and harder*
  than a light one carrying the identical context.

State the driver in the reason field — `compact: yes — 180k held, next brief is 2 file paths` says
something; `compact: yes — clean boundary` does not.

Recommend **no** while mid-review (the reviewer's findings live in the planner's context until
triaged), mid-conflict-resolution, or while holding an empirical result — a measured baseline, a
decision rationale — that is not yet written down.

**A live executor is not a reason to withhold a `yes`.** A dispatched agent has its own context
window, so planner compaction is invisible to it. A dispatch is the *ideal* compaction window,
since the planner is otherwise idle-waiting.

**A `no` is a defect report, not a wait instruction.** It means something real exists only in a
context window. The correct response is *write that state to a file now*, which turns the answer
into `yes`. Two constraints on where it goes:

- **Outside the repo while an executor is live in that tree.** Committing run state alongside a
  running executor orphaned two commits in one run. A session scratchpad survives compaction just
  as well and races nothing.
- **Only what the plan and the handoffs do not already hold** — what is in flight and from which
  base commit, standing tooling rules, remaining headroom, the stop conditions.

### The same problem, one level down

A subagent cannot ask to be compacted either, and an oversized packet does not fail loudly — it
returns **partial**, which reads as an executor shortfall and is not one. Size a packet to one
surface, and split on surface boundaries rather than file count. A partial return with a clean
handoff resumes as a scoped continuation: not a review round, and it consumes none.

## Capability manifest instead of a catalog

Packets carry a generated manifest of the skills actually selected for the run — name, purpose,
source path, load trigger, selected/not-selected — never a copy of the available-skills catalog
or the bodies of task skills. Schema:
[`../schemas/capability-manifest.schema.json`](../schemas/capability-manifest.schema.json).
