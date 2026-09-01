# Phase 3 — Adversarial Review (detail)

Announce: `Phase 3: dispatching reviewer (<model>) for final gate.`

Dispatch a **fresh** agent — never reuse the executor, never review it yourself:

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

**Record the returned agent ID/name.** Every subsequent round goes back to that same agent via SendMessage so it keeps the full history of what it already flagged and accepted. A fresh reviewer per round re-litigates settled findings and cannot tell you whether round 2 regressed round 1.

Build the prompt from **[reviewer-brief.md](reviewer-brief.md)**. Hand it: the plan file path, the Global Constraints block copied verbatim, the executor's handoff report path, a diff package file for `BASE..HEAD`, and the validation commands.

**Also hand it the handoff's `## Upline` list** — specifically the `[decided]` entries. Those are the decisions made under uncertainty, and they are the reviewer's highest-yield scrutiny targets. Do not editorialize the list or mark entries as settled; hand it over as written.

**Generate the diff as a file, never as prompt text:**

```bash
{ git log --oneline BASE..HEAD; echo; git diff --stat BASE..HEAD; echo; git diff -U10 BASE..HEAD; } \
  > <workspace>/review-package.md
```

**Do not pre-judge.** Never write "don't flag X", "the plan chose Y", "at most minor" into the reviewer's prompt. If you believe a finding will be a false positive, let it be raised and adjudicate it.

## Build evidence: reuse, don't re-derive

If the repo already runs `pnpm build` as a `Stop` hook (per its `AGENTS.md`/`CLAUDE.md` build gate), that hook's captured output **is** the build evidence for this phase. Hand the reviewer that output directly rather than asking it to trigger its own build — the hook already ran the real gate once; running it again inside the review just pays for the same verification twice. The reviewer's evidence-gate rule (see reviewer-brief.md) still applies in full: it still needs to see real, current output, matching `HEAD`, for whatever the plan's validation commands are — it just doesn't need to be the one who produced it, and it doesn't need to re-run a build that already ran.

**Read the hook before you rely on it — most of them cannot serve as evidence.** Two properties disqualify it, and both are common (observed 2026-08-01, in a repo whose hook had both):

- **It discards passing output.** A hook shaped `if out=$(pnpm build 2>&1); then echo "gate passed"; fi` throws `$out` away on success and prints only the failure path. There is no artifact to hand over — just a sentence asserting green, which is exactly what the evidence rule rejects.
- **It is conditional on uncommitted changes, so it goes silent precisely when the work is done.** A hook gated on `git diff --name-only HEAD -- '*.ts'` fires while you are mid-task and `exit 0`s without building once everything is committed — the state the reviewer actually gates on. Its silence then means "skipped", not "passed", and the two are indistinguishable from the outside.

So: reuse hook output only when you can point at the real output *and* confirm the build ran against `HEAD`. Otherwise the planner runs the build explicitly on the committed tree and captures it. A gate whose quiet turn means both "passed" and "never ran" is not evidence of either — and inferring a build from an uneventful hook is how a green review ships an unbuilt branch.

If the repo has no such hook, or the hook's output is stale (predates `HEAD`) or missing, the reviewer runs the validation commands itself per the standard rule.

## Live systems: evidence is a read-back, not an exit code

If this run **wrote anything to a live system** — a deploy, a migration, a CMS/page/block write, a config push — the writer's exit code is not evidence. A script can report success and leave the live surface running older content: the write went to the wrong row, a cache still serves the previous version, or the platform accepted the call and ignored it.

For every such write, the evidence the reviewer must see is a **re-read of the deployed artifact** proving it matches the committed source, plus a check of the observable behaviour that motivated the change. Name the live surfaces in the reviewer's prompt so it knows what to demand. `Changes: 1` and `exit 0` satisfy nothing on their own.

**Some properties the gate structurally cannot see — name them before approving, not after.** A build-and-test gate verifies what compiles and what the tests assert. It is blind to anything that only exists at runtime: reflection and dynamic-LINQ member binding, type *accessibility* as seen by a compiled lambda, template/markup compilation, framework callbacks a unit test never invokes. Approving such a change on gate evidence alone is approving on the strength of a check that was never able to fail.

So when the diff touches a runtime-resolved surface, do two things. First, ask the reviewer explicitly *what in this diff could only a live exercise establish* — and treat an empty answer as suspicious. Second, prefer converting the property into something the gate **can** fail on rather than relying on a one-off click: a compiled artifact's accessibility, for instance, is assertable by disassembling it and matching the IL. A gate check beats a click, because the click protects this run and the check protects every later one.

Two failure modes travel with that conversion, and both bit on 2026-07-29:

- **A swallowed exception makes a broken fix indistinguishable from a working one.** A bare `catch` that degrades to a fallback turns a runtime failure into a plausible-looking result: green build, green tests, two approving reviews, and the feature silently not working. A "minor: unlogged catch" finding sitting next to a correctness finding on the same code is not a minor — it is the thing that will hide whether the correctness fix worked. Grade it accordingly.
- **A check on a build artifact must detect a stale artifact.** An assertion about a compiled DLL is an assertion about whatever is on disk. Against a stale build it either passes (false clear) or fails while accusing correct source — the latter turned a suite red minutes after merge. Make it **skip** with a stated reason when the artifact is missing or older than its sources, and verify all three states: stale → skip, fresh+good → pass, fresh+defective → fail.

**A verification tool's PASS is a claim, not evidence, until a control run proves the tool can fail.** Before treating a checker's green output as proof, run it against a case whose answer you already know — ideally one that *should* fail. If both come back identical, the tool measured nothing and the PASS is an artifact of its own blind spot: it answered a question adjacent to the one you asked (it authenticated nobody, it hit a cache, it skipped the assertion) and reported success in the vocabulary of the question you meant. Skipping the control is most tempting exactly when the tool agrees with you.

When the control shows the tool is blind, you have found a second defect — fix the tool so the next agent cannot be fooled, then report the original claim honestly as **unverified**: say "runtime confirmation outstanding" and name who can obtain it. Never let a lower-layer proof (a row read-back, a config diff) quietly stand in for the behavioural check you could not run. A caveat already recorded in the docs is evidence the trap recurs — fix the tool rather than re-documenting the workaround.

**Then scope the correction to what you measured.** "X never works" contradicts every past success on record, and a live doc that contradicts itself gets one of its halves believed at random. Look for the discriminating variable before generalizing — it turns a blanket dismissal that would retire a working tool into a precise rule that keeps it.

The reviewer returns one of three verdicts: `APPROVED`, `CHANGES REQUIRED` with numbered findings, or `PLAN DEFECT`. It is instructed to refuse approval without pasted command output for the build/test gate — if it approves without that evidence, send it back.

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

Sometimes the diff faithfully implements the plan and the **plan** is what's wrong. Treating that as `CHANGES REQUIRED` cannot converge: you would be asking the executor to fix a correct implementation, and the loop burns its rounds getting nowhere.

`PLAN DEFECT` **exits the fix loop instead of consuming a round.** Route it by owner (see [escalation.md](escalation.md)):

- **Technical plan gap** — the plan assumed a structure that doesn't exist, or two constraints conflict. Yours to amend: revise the plan file, then re-dispatch only the affected tasks.
- **Tradeoff, scope, cost, or business call** — the user's. Present the reviewer's reasoning, the plan text, and your recommendation, then wait.

Never answer a `PLAN DEFECT` by pressuring the reviewer to downgrade it, and never quietly implement your own preference instead. If you believe the reviewer is simply wrong on the merits, argue it on the merits in the same conversation — that's legitimate, and it will concede if you're right.

## Phase 3b — The fix loop (Planner fixes)

You apply the fixes. Triage each finding with this matrix before touching anything:

| Finding shape | Mode | Why |
|---|---|---|
| Deterministic, zero ambiguity, and the finding text *is* the brief — typo, import, off-by-one, missing constant, copy fix | **INLINE** (you edit) | Brief + dispatch + handoff costs more than the edit |
| Real volume, a refactor, or a fix whose correct shape is not obvious from the finding text | **Delegate `sonnet`** | Volume is a purchase: cheaper per output token, and it stays out of your coordination context |
| Subtle correctness, concurrency, security, or cross-cutting design; or a `sonnet` fix attempt already drifted | **Delegate `opus`** | Needs the higher reasoning tier |
| Bulk mechanical repetition across many files — renames, codemods | **Delegate `haiku`** | Cheapest tier handles deterministic edits |

Announce the mode in one terse line per fix wave: `Mode: <INLINE|sonnet|opus|haiku> — Why: <≤8 words>`.

Rules for the loop:

- **One fix wave per round, all findings together.** Not one dispatch per finding — per-finding agents each rebuild context and re-run the suite.
- **Re-run the gate yourself** after each wave (or, per the reuse rule above, pull the fresh Stop-hook output if the wave's commit already triggered it). Capture the real command output; you will paste it to the reviewer.
- **A finding that contradicts the approved plan is the user's call**, not yours. Present the finding beside the plan text and ask which governs. Do not fix against the plan, and do not dismiss the finding because the plan mandated it.
- **Send the same reviewer** the fix diff package (`git diff PREV_HEAD..HEAD` to a new file), a per-finding note of what you did, and the gate output — via SendMessage to the recorded agent ID. If SendMessage is unavailable, dispatch a fresh reviewer carrying the previous findings list verbatim and say in the round line that continuity was lost.
- **Cap: 5 rounds.** At round 5 with findings still open, stop dispatching. Report to the user: each open finding, the reviewer's reasoning, your counter-reasoning, and the fix history. Do not self-approve past the cap and do not park a load-bearing finding to escape the loop.

Only `APPROVED` from the reviewer leaves this phase.
