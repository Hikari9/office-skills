# Plan — auto-office v2: mandated executor tier, plan-reviewer, and the death of the tier ladder

Status: **awaiting approval** — self-reviewed, audited by an `opus`-low plan-reviewer, all 12 findings resolved
Author: planner (Opus)
Date: 2026-08-01
Source: retrospective on the auto-office run against a private application repo

---

## Why

The first real auto-office run surfaced five defects, only one of which was about model choice:

| Observed | Root cause |
|---|---|
| Planner put Opus on all six claude executors, against a written rule | No per-task `model`/`effort` field existed anywhere, so a model change was invisible to the deviation discipline that *did* catch tier changes |
| `#165` burned 829k tokens over 3 review rounds — the run's largest line item | `auto-loop`'s "2 same-tool failures → reroute to Decider tier" is a **no-op when already at the top tier**. Nothing presumed the brief was wrong |
| The two most valuable outputs were executors *contradicting their briefs* (`#167`, `#164`) | Reviewers structurally cannot catch a wrong brief. Executors had no return path for "the stated cause is false" |
| Two of three `CHANGES REQUIRED` were tests that passed but could not detect their target bug — **both on Opus** | No brief clause required a test to be shown red at BASE. A bigger model did not fix this |
| Plan said "agy T1" (impossible — agy has no in-session form); `T0` collapsed into `T1`; the role chain silently became Planner→Worker | The tier ladder was unexecutable-plan-permitting, and auto-office's invented "planner never implements at any tier" made `T0` unreachable |
| `1h38m` wall clock lost to a nohup mistake, zero tokens | No liveness check after dispatch. Wall clock was not a first-class cost |
| Headroom read `82% → 52% → 85%` | `--percent` returns the tightest of two windows; the 5-hour window reset mid-run. Single-number deltas are meaningless |

The through-line: **cost and correctness both concentrate in the plan and the brief, not in the executor's model.**

## Decisions locked by the operator

1. **All executors and workers are sonnet-tier, high effort.** claude → `sonnet` high · codex → `codex-terra` high · agy → `agy` high (always). No self-escalation, no exceptions without a caller override.
2. **New role: plan-reviewer, Opus-tier, same brand as the planner.** claude planner → `opus` **low** · codex planner → `codex-sol` **low** · agy planner → `agy` **high**. Its job is to kill plan defects before they are paid for. **It reviews the plan and nothing else** — it does not distribute work, and it never becomes the project manager.
3. **Code reviewers stay `opus` medium.** Unchanged, including the existing `codex-sol` high exception when Codex is the planner.
4. **Every office reports cost retrospectively at closeout**, and cost enters telemetry.
5. **Self-healing the skills is allowed only when the planner is Opus.** Codex and agy planners may propose, never edit.
6. **T0/T1/T2 is discarded.** Dispatch tax is no longer computed. Replaced by a structural rule: planner fans out → **CLI**; executor fans out → **in-session/inline**, unless the worker is a different brand than the executor. **All three brands have a built-in in-session sub-agent mechanism** — the brief *prompts* the executor that it may fan out, and never prescribes how. auto-office owns no CLI mechanics, and that includes sub-agent mechanics.
7. **Near-ties are not deliberated.** If two tools are the same tier and both fit, pick one and move; the reviewer is the safety net.
8. **"Planner cannot implement" is lifted** — the planner may apply inline fixes, which is cache-cheap next to a spawn.
9. **The project manager is a separate role from the plan-reviewer.** For a multi-executor run (multi-issue / multi-repo) the **planner spawns a PM via CLI**, distinct from the plan-reviewer, which has already retired. The PM distributes briefs and collects results. A single-executor run has no PM at all.
10. **Any brand may hold the planner role.** Invocation is forced by sending `/auto-office` **plus the absolute path of the `auto-office` plugin directory** as a fallback, so a non-Claude harness can read the skill files directly rather than relying on plugin loading.
11. **The planner always self-reviews** its own plan before handing it to the plan-reviewer. Cache-warm, therefore nearly free, and it catches a different class of defect: self-review finds what the author knows it hand-waved; the fresh gate finds what the author could not see. Neither substitutes for the other.
12. **Planning is exactly two passes: self-review, then one adversarial plan-review.** There is **no second plan-review round.** The planner applies the findings and proceeds to the executor / PM. A plan-reviewer runs once per run and never returns.

### What Decision 12 lets us delete

An earlier draft had a 2-round plan-review cap, a same-agent continuity rule, and a mid-loop *recall* of the plan-reviewer to adjudicate a suspect brief — with an elaborate bound to stop it defending its own prior approval (audit finding 3). All of that is now removed as unnecessary machinery.

The 2-consecutive-`CHANGES REQUIRED` cost fix survives intact, because **core already has the mechanism** and it needs no extra agent. `review-states.md` routes `PLAN DEFECT` by owner: a **technical gap** → the planner amends the plan and re-dispatches only the affected tasks; a **tradeoff, scope, or cost call** → the user's, with the reviewer's reasoning presented. So at 2 rounds the loop declares `PLAN DEFECT` and takes core's existing route. One bound is retained, because a planner amending its own plan is a self-gate: **a second amendment to the same task stops the loop for the user.** The independent code-review gate still holds on whatever the amendment produces, so the amendment is never self-approved.

This is strictly simpler *and* strictly cheaper than the recall, and audit finding 3 dissolves structurally rather than being bounded — the plan-reviewer cannot gate its own approval if it never returns.

## Findings that reshape the above

- **Decision 8 is largely already core-legal.** `office-core/protocol/review-states.md` states *"The planner applies fixes; the reviewer does not fix what it gates."* auto-office invented a stricter rule ("the planner does not write the plan's code at any tier"). Lifting it for **review fixes** requires no core change — only deleting auto-office's over-tightening. Lifting it for **implementing a plan task inline** does touch `roles-and-authority.md` ("Never does: implement the approved plan"), and is handled in Phase 0.
- **Decision 6 lands on an existing core rule.** Core's *Delegation test* already says a delegation must buy **tier, isolation, or parallelism** or be done inline — with the counterweight *never collapse the task carrying the run's main correctness or security risk.* The new dispatch rule is expressed as a narrowing of that, not as a new scheme. This also resolves a latent contradiction in core between the delegation test and the roles table.
- **Decision 4 cannot be adapter-local.** It binds all four offices, so it is a core amendment: `office-core` 1.1.0 → **1.2.0**, re-vendored into all four plugins.
- **Decision 2 is adapter-local and legal.** Core permits added roles that add rather than absorb a gate.
- **Decision 1 kills the old escalation path.** With executors pinned to sonnet-tier, "escalate to the Decider tier on repeat failure" has nowhere to go. Its replacement is the fresh plan-reviewer recall in Phase 2 — which is what the `#165` evidence argues for anyway.
- **Decision 10 makes three model-table rows reachable.** Without the forced-path invocation, the agy-planner and codex-planner rows would have been unreachable rules of exactly the kind this plan indicts, and Decision 5's Opus-only self-heal gate would have restricted nothing.

## Audit record

The plan was self-reviewed by the planner, then audited by an `opus`-low plan-reviewer, which returned **`PLAN CHANGES REQUIRED`** with 12 findings. The self-review found 10; the two lists overlapped on 4. Every finding below is resolved in the phases as written.

| # | Finding | Resolution |
|---|---|---|
| 1 | The new dispatch rule reproduces the "agy T1" bug class: same-brand in-session fan-out was said to be impossible for `codex exec` / `agy` | **Rejected on the facts.** All three brands *do* have built-in in-session sub-agents. The real gap was that the sibling `*-executor` spokes never mention fan-out — fixed in Phase 4 by *prompting* for it without prescribing mechanics |
| 2 | `agy-office/skills/agy-reviewer` forbids agy holding a review gate, so an agy planner had no reachable plan-review gate | Phase 4 distinguishes the two gates: agy may hold **plan** review (short, single-shot — its documented strength), and remains barred from **code** review (long, adversarial — its documented weakness) |
| 3 | The plan-reviewer approved the plan, distributed its briefs as PM, then adjudicated whether those briefs were defective — self-gating | **Dissolved structurally.** Decisions 2 and 9 separate the roles; Decision 12 retires the plan-reviewer after one pass, so it never returns to gate its own approval. No recall, no bound, no extra machinery |
| 4 | Planner inline writes were newly legal but nothing forbade them while a CLI executor was live in the same tree | Phase 2.2 adds the precondition core already requires |
| 5 | Phase 1.1 overruns the 9000-byte hub budget by ~600–700 bytes; "the tier removal pays for most of it" was asserted, not budgeted | Phase 1.1 now assigns the Red Flags rows and dispatch prose to `auto-routing`, with a measured budget |
| 6 | Core 0.3's 2-round `PLAN DEFECT` presumption binds all four offices, but its adjudicator exists only in auto-office | Phase 0.3 names the sibling handler explicitly |
| 7 | The `never implements` grep gate could not pass — the phrase lives in two sibling hubs no phase authorized editing | Phase 5 scopes the gate to `auto-office/`; siblings keep the stricter rule as a legal narrowing |
| 8 | The `\bT[012]\b` gate false-positives on sibling files where `T1`/`T2` are **task numbers** | Phase 5 scopes and anchors the pattern |
| 9 | Plan-review at `opus` low collides with the `opus` medium reviewer floor via "stricter rule wins" | Phase 0.1 and 1.2 state that the medium floor binds the **code**-review gate only |
| 10 | Phase 5 removed a COMPATIBILITY exception that never existed, while also saying "drop nothing" | Reworded to a confirmation step |
| 11 | The ledger's repo-citing traceability rule contradicted the whitelabel ban, and deferred the decision | Decided in 3.2: opaque slugs committed, mapping gitignored |
| 12 | Three model-table rows were unreachable without a cross-brand invocation path | Decision 10 |

Two self-review findings the audit did not raise, also resolved: the liveness check could create a second writer by re-dispatching a silent-but-live process (Phase 2.2), and the near-tie tiebreak ladder did not disqualify agy when its 3-task cap was already spent (Phase 1.2).

---

## Phase 0 — `office-core` 1.1.0 → 1.2.0

Shared invariants only. Never edit a vendored copy.

**0.1 `office-core/protocol/roles-and-authority.md`**
- Resolve the roles-table / delegation-test contradiction. Planner's "Never does" changes from `implement the approved plan` to `**take the executor's task away from independent review**`. New prose: the planner may implement inline when the delegation test buys nothing — *and inline work is still gated by a fresh reviewer.* Restate the counterweight: never collapse the task carrying the run's main correctness or security risk.
- Add one sentence permitting an office to add a **plan-review gate** before user approval, and one permitting a **coordinator** role that distributes briefs on the planner's behalf while holding no planner-held action.
- State that the reviewer floor an office declares binds its **code**-review gate. A plan-review gate carries its own, separately declared floor. Without this, `delegation-map`'s "stricter rule wins" silently promotes plan review to the code-review floor.

**0.2 `office-core/protocol/closeout.md`**
- In `## Final report`, add to the minimum-every-office set: **cost retrospective** — per-task actuals (brand, model, effort, dispatch form, review rounds, tokens where the harness reports them, wall clock) and one honest paragraph on what was over- or under-provisioned.
- Add: **headroom is reported per window with reset times, never as a single-number delta.**

**0.3 `office-core/protocol/review-states.md`**
- Add the **`BRIEF DEFECT`** executor return: the executor asserts the brief's stated cause is false, with evidence at BASE, and stops without implementing. Routes to the planner (technical) or the user (scope). **Does not consume a review round** — same treatment as `PLAN DEFECT`, which it is the upstream twin of.
- Add the standing brief clauses: (a) verify the stated cause reproduces at BASE before implementing; (b) **any task shipping a test must paste that test failing at BASE** (or against the reverted fix).
- Amend the fix loop: **at 2 consecutive `CHANGES REQUIRED` rounds on one task, the default presumption flips to `PLAN DEFECT`** — re-plan the task rather than fund a third fix wave. Replaces "escalate out of the tool" where no higher tier exists.
- **Name the handling, because this rule binds all four offices.** It takes the `PLAN DEFECT` route this file already defines: technical gap → the planner amends and re-dispatches the affected tasks; tradeoff / scope / cost → the user's call. No new adjudicator role is introduced in core. Add one bound: **a second amendment to the same task goes to the user**, because a planner amending its own plan repeatedly is the author clearing their own work.

**0.4 `office-core/schemas/run-event.schema.json`**
- Add: `brand`, `model`, `effort`, `dispatch_form` (`cli` | `in-session` | `inline`), `review_rounds`, `tokens_out`, `wall_clock_s`, `plan_review_rounds`, `brief_defects`.
- Keep the `executor` role id. No role renaming.

**0.4b Reconcile the schema `$id` version.** All four schemas declare `urn:office-core:1.0.0:…` while `VERSION` already reads `1.1.0` — a pre-existing mismatch, surfaced while whitelabeling the namespace off a private domain. Phase 0 must bring the `$id` version in line with `VERSION` (`1.2.0`) across all four schemas, then re-vendor. Doing it here rather than piecemeal keeps schema identity changing exactly once, alongside the version bump that justifies it.

**0.5** `office-core/VERSION` → `1.2.0`; core changelog entry; `./scripts/vendor-core.sh` into all four plugins; `./scripts/check-plugins.sh`.

---

## Phase 1 — `auto-office` roles and routing

**1.1 `auto-office/SKILL.md` (hub)** — **hard budget: 9000 bytes; currently 8987.** The audit measured the first draft of this phase at roughly +600–700 bytes net, i.e. ~9600. So the split below is not stylistic, it is what makes Phase 5 pass. Re-measure with `wc -c` after each edit, not at the end.

Stays in the hub (it is the always-loaded file, so it carries only role identity and gates):

- Replace the chain diagram:

  ```
  Planner ──▶ Plan-reviewer ──▶ retires │ Planner ──▶ PM ──▶ Executor(s) ──▶ Worker | inline
  (self-reviews,  (Opus-tier, planner's │  (only when >1 executor;    (sonnet-tier, high)
   plans, fixes)   brand, low effort)   │   a separate CLI subagent)
  ```
- Role table: add **Plan-reviewer** (reviews the plan, then retires; recallable fresh) and **PM** (`Never does`: **holds no planner-held action; distributes and collects only**). Amend **Planner** to permit inline implementation and fixes, and to require self-review. Amend **Executor** to state the mandated tier.
- Replace "the planner never implements" with the surviving invariant: **no one gates their own work, and inline work is still reviewed.**
- Delete every `T0`/`T1`/`T2` reference and the dispatch-tax block; replace with a **one-line** pointer to the dispatch rule in `auto-routing`.
- Routing table: delete the `dispatch-cost.md` row; add rows for the plan-review gate and the outcomes ledger.
- Red Flags: delete the three tier rows and "It's a T0 task, I'll just edit it myself". Add only these two, the two that guard newly-lifted rules:

  | Thought | Reality |
  |---|---|
  | "This task is hard, I'll use Opus for the executor" | Executors are sonnet-tier, full stop. Hard tasks get a better *plan*, not a bigger executor. |
  | "I fixed it inline, so it's mine to approve" | Lifting planner-implements did not lift planner-never-approves. Fresh reviewer, every time. |

**Moved to `auto-routing` (1.2) to stay inside the budget** — these three Red Flags rows guard routing decisions, which is where a planner reads them anyway:

  | Thought | Reality |
  |---|---|
  | "The plan looks fine, straight to the user" | Self-review, then the plan-reviewer. User approval is never spent on an unreviewed plan. |
  | "One executor, so I'll spawn a PM to coordinate" | No PM below two executors. A PM with one executor is pure overhead. |
  | "codex or claude, let me think it through" | Same tier, both fit: pick one and move. One line of reasoning, maximum. |

**1.2 `auto-office/skills/auto-routing/SKILL.md`** — the largest edit.

- Reduce the three decisions to **two**: which brand owns each unit of work, and how it is dispatched (which is now derived, not chosen).
- Replace the model+effort table:

  | Role | claude | codex | agy |
  |---|---|---|---|
  | Planner | `opus` (the session) | `codex-sol` | `agy` |
  | **Plan-reviewer** | `opus` **low** | `codex-sol` **low** | `agy` **high** |
  | **PM** (≥2 executors) | `sonnet` **high** | `codex-terra` **high** | `agy` **high** |
  | Executor | `sonnet` **high** | `codex-terra` **high** | `agy` **high** |
  | Worker | `sonnet` **high** | `codex-terra` **high** | `agy` **high** |
  | Reviewer (code) | `opus` **medium** | `codex-sol` high *(only when codex is planner)* | never reviews |

  The plan-reviewer's brand is **always the planner's brand** — it is not routed by fit. Executor/worker brand *is* routed by fit.

  **The PM sits at executor tier, not Opus tier, and this is a deliberate call to state in the file:** the plan already assigned brand and dispatch per task, so the PM's job is distribution and collection, not judgment. Paying Opus rates to hand out briefs the plan already wrote is the same over-provisioning this whole revision exists to stop. If a PM finds itself making routing decisions, the plan was incomplete — that is a `PLAN DEFECT`, not a reason to upgrade the PM.

  **Two floors, not one:** `opus` medium is the floor for the **code**-review gate. The **plan**-review gate's floor is `opus` low. Say both explicitly, because `delegation-map`'s "stricter rule wins" would otherwise promote plan review to medium and quietly double its cost.
- New section **Dispatch form (replaces the tier ladder)**:
  - Planner fans out an executor → **CLI, own worktree.** Isolation and unattended running are what the delegation buys.
  - Planner spawns a PM (≥2 executors only) → **CLI.**
  - Executor fans out a worker → **in-session/inline**, because the executor's context is the value being reused. **Every brand has a built-in in-session sub-agent mechanism.** The brief *prompts* the executor that it may fan out; it never prescribes how. Sub-agent mechanics belong to the sibling office, exactly like CLI mechanics.
  - **Exception, and the only one:** the worker's brand differs from the executor's → CLI, necessarily.
  - Planner applies a review fix or a change the delegation test says buys nothing → **inline.**
  - **No tax arithmetic.** The form follows from who is dispatching whom; there is nothing to compute.
- New section **Near-ties are not worth reasoning about**: if two brands are the same tier and both fit, spend at most one line. Tiebreak ladder, cheapest first: (1) live headroom, (2) the operator's standing preference for codex, (3) spread across brands to avoid draining one window. Then commit. Rationale to state in the file: a suboptimal-but-fitting brand costs at most one extra review round; deliberation costs planner tokens on every task.
  - **Disqualifier before the ladder runs:** agy is not a near-tie candidate if its 3-consecutive-task cap is already spent, or if the task is a long chain. A tiebreak that ignores a cap is how a cap gets broken by accident.
- Receives the three Red Flags rows relocated from the hub in 1.1.
- **Delete** the diagnosis-confidence escalation idea and every "substitute a bigger model" path. Decision 1 supersedes both. Keep the `xhigh`/`ultra`/`max` ban verbatim.
- Keep unchanged: the capability-role table, the agy 3-consecutive cap, the agy miss-list, reviewer selection, the benchmark refresh procedure. Add one line to the benchmark section: **the snapshot now selects brand only — never model or effort, both of which are fixed by the table above.**
- New closing section: **read `references/routing-outcomes.md` before the benchmark file.** Local outcomes outrank the leaderboard.

**1.3 `auto-office/references/dispatch-cost.md` → delete.** Salvage into `auto-routing`: brief quality is the real tax; batch adjacent cheap edits; **never batch across the review gate**; a supervised sub-delegation is still one writer. Everything tier-arithmetic dies with the file.

**1.4 `auto-office/references/delegation-map.md`**
- Add a **Plan-reviewer** row: claude → `claude-office/skills/claude-reviewer` at `opus` low with a plan-review rubric; codex → `codex-office/skills/codex-reviewer` at `codex-sol` low; agy → `agy-office/skills/agy-reviewer` at `agy` high **(requires the Phase 4 amendment — see below)**.
- Add a **PM** row: the planner's brand at executor tier, dispatched by CLI, per that office's `*-cli` spoke.
- Note the two-floor rule from 1.2 explicitly here, since this is the file whose "stricter rule wins" clause would otherwise override it.
- Add the brand-match dispatch rule and drop tier language.
- Keep: agy Phase 2b is structural; stricter rule wins; missing sibling plugin is a hard re-route.
- **Add the forced-invocation path (Decision 10):** a non-Claude planner is invoked with `/auto-office` **plus the absolute path of the `auto-office` plugin directory**, so it can read the spokes and references directly instead of depending on plugin loading. Record which form was used, because "the skill was not loaded" and "the skill was loaded and ignored" are different defects.

---

## Phase 2 — `auto-office/skills/auto-planning` and `auto-loop`

**2.1 `auto-planning/SKILL.md`**
- Insert **step 7.4: planner self-review** — mandatory, before any hand-off. The planner re-reads its own plan hunting contradictions, unexecutable assignments, rules its own changes made dead, and anything it hand-waved. Cache-warm, so nearly free. **It is not a substitute for step 7.5** and may not be used to skip it: measured on this plan, self-review found 10 findings and the fresh gate found 12, overlapping on only 4. State that number in the file as the reason both exist.
- Insert **step 7.5: one adversarial plan-review**, between self-review and user approval. The plan-reviewer receives the plan file path, the GOAL block, and the task table; it returns numbered findings. **One pass, no rounds.** The planner applies the findings, records which it rejected and why, and moves on. Rationale in the file: user approval is the scarcest thing in the run — do not spend it on an unreviewed plan; and a plan-review loop is itself a cost the plan-review exists to prevent.
- **Do not pre-judge the plan-reviewer.** Per `office-core/protocol/review-states.md`, the planner does not pass its own self-review findings into the plan-reviewer's brief — that anchors the gate and converts an independent pass into a confirming one. Merge the two lists *after* the verdict returns.
- The plan-reviewer **retires permanently** after its single pass. It is never recalled, never distributes work, and holds no further gate. Distribution is the PM's job, and the PM is a different agent spawned only at ≥2 executors.
- Task assignment table columns become `# · Task · Brand · Model+effort · Dispatch · Diagnosis · Why`.
  - `Model+effort` is pre-filled from the Phase-1 table and is expected to be uniform; a non-default value is a caller override and must be labelled as one.
  - `Dispatch` is derived (`cli` / `in-session` / `inline`), not chosen.
  - `Diagnosis` is `settled` | `unverified`. **`unverified` no longer buys a bigger executor** — it obliges the brief to carry the reproduce-at-BASE clause and makes the task a first-class `BRIEF DEFECT` candidate.
- Add to the interview floor: **how many executors this run needs** — which decides whether the plan-reviewer becomes PM or retires.
- Kickoff line gains `plan-reviewer:` and `executors:`; `headroom:` reports **both windows with reset times**.
- Delete the worked-example tier rows and the "T0 is a real answer" section; replace with the dispatch rule and one worked table using the new columns.

**2.2 `auto-loop/SKILL.md`**
- Loop pseudocode: self-review then plan-review before the loop; PM distribution only when ≥2 executors; add the `BRIEF DEFECT` branch alongside `PLAN DEFECT`.
- **Replace** the dead cap row "same-tool repeat failures on one task: 2 → reroute to Decider tier" with: **2 consecutive `CHANGES REQUIRED` on one task → declare `PLAN DEFECT` and take core's existing route** (`review-states.md`): technical gap → the planner amends the plan and re-dispatches only the affected tasks; tradeoff / scope / cost → the user's call, with the reviewer's reasoning presented. No agent is recalled. **Bound: a second amendment to the same task stops the loop for the user** — a planner amending its own plan is a self-gate, and the bound is what keeps it honest. The independent code-review gate still holds on whatever the amendment produces, so nothing is self-approved. This is the direct fix for the 829k blowup: it stops funding fix waves at round 2 instead of round 5.
- Add **liveness check**: after every CLI dispatch, confirm the process is producing output within a stated window. **No output → confirm the process is actually dead before re-dispatching.** A silent-but-live process plus a replacement is two writers in one tree — the invariant this office exists to protect. Kill or confirm exit first, then re-dispatch. Names last run's 1h38m loss as the reason.

  **Correction to an earlier draft of this plan:** the nohup gotcha was attributed to `claude-office/skills/claude-cli`. It was a `codex exec` dispatch, and the fix has **already landed** in `codex-office/skills/codex-cli/SKILL.md` (currently uncommitted) — launch through the harness's background mechanism so a completion notification fires, and poll `pgrep` plus the handoff mtime if one was already launched detached. Phase 4 should check whether `claude-office/skills/claude-cli` needs the parallel note for `claude --bg`; do not duplicate the codex text there speculatively. auto-office still owns only the liveness check, never the CLI mechanics.
- Add the two standing brief clauses (reproduce-at-BASE; test must be shown red at BASE) to what every brief carries, plus the line prompting the executor that it may fan out in-session using its own brand's mechanism.
- Amend the safety rules: planner may implement and fix inline; **it still never approves its own work**, and one writer per tree is unchanged — ≥2 executors means ≥2 worktrees, always.
- **New precondition on the newly-legal planner inline write:** no executor may be live in that tree. Core already requires the planner to confirm no other writer is live before dispatch; lifting planner-implements makes the *reverse* direction possible for the first time, so state it both ways. Planner inline work happens before dispatch or after the handoff, never alongside a running executor.
- Add wall clock to per-task progress lines.
- Drop all tier language from the drift check; keep the other four questions and the agy count.

---

## Phase 3 — closeout, telemetry, self-heal, ledger

**3.1 `auto-office/skills/auto-closeout/SKILL.md`**
- Run report gains a **cost retrospective**: per-task actuals (brand, model, effort, dispatch form, review rounds, tokens where reported, wall clock, verdict, `reroute_from`, `brief_defects`) plus one honest paragraph on what was over- or under-provisioned. Explicitly: **agy reports no tokens** — say so rather than implying zero.
- Headroom row: **both windows at start and end with reset times**, and a ban on single-number deltas, citing last run's `82 → 52 → 85`.
- Rename `Codex headroom` → `Headroom`, covering all three brands.

**3.2 New `auto-office/references/routing-outcomes.md`** — the local ledger, appended at every closeout, consulted at routing **before** the benchmark file. One row per task: date · repo-slug · task · brand · model · effort · dispatch · rounds · tokens · wall clock · verdict · one-line lesson. Seed it with the first production run so it is not born empty. This is the self-learning loop that actually reflects this workspace; the benchmark file only ever reflected the public leaderboard.

**Repo identity — decided here, not deferred (audit finding 11).** The committed ledger records an **opaque slug** (`repo-a`, `repo-b`), never a real repo or host name, because this plugin ships publicly. A local `routing-outcomes.local.md` maps slug → real repo and plan path, and is **gitignored**. That keeps the traceability corollary in 3.2b true for the operator and keeps the whitelabel gate in 5b passing for everyone else. Seed rows use a slug, so the ledger is born whitelabel-clean rather than needing a scrub later.

**3.2b Artifact location — where a run's files live.** State this explicitly in `auto-planning`, `auto-closeout`, and this reference, because 3.2 introduces the one file that breaks the pattern:

- **Everything belonging to a specific run lives in that run's target repo and worktree** — the plan file (`docs/plans/<slug>.md`), the GOAL block inside it, briefs, diff packages, evidence, and the run report. The planner writes them where the work is, never into `office-skills`.
- **`routing-outcomes.md` is the sole exception**: it is cross-run, workspace-local, and lives in this plugin because it must survive any single target repo. Closeout appends a summary row to it *in addition to* writing the full run report into the target repo.
- Corollary: rows in the ledger cite the target repo and the plan path, so a row is traceable back to artifacts that live elsewhere.
- Corollary: a run whose target repo *is* `office-skills` (like this plan) puts its plan and report here as normal — because that is the target, not because this is home.

**3.3 Self-heal gate** — new section in `auto-closeout`:
- Permitted **only when the planner is claude/Opus.** codex and agy planners write a proposal block into the run report and stop.
- Even then: sharpen a rule, never append an anecdote; edit the owning file per the maintenance matrix; **never** relax a safety rule, raise a cap, widen a blast radius, or downgrade a reviewer; **never** edit a vendored `office-core/` copy — a shared invariant is a proposed core change; show the diff in the run report and bump the plugin `CHANGELOG`.
- Rationale to state: self-healing is authority to change the rules that gate future runs. It is the one place where reviewer-grade judgment is load-bearing, which is why it is Opus-only.

**3.4 `auto-office/references/quota-probe.md`** — document `--json`'s two windows plus `resets_at`; state that `--percent` is a routing convenience and **not** valid for deltas; add the mid-run reset failure mode.

**3.5 `auto-office/references/model-benchmarks.md`** — one added paragraph: the snapshot selects **brand only**; model and effort are fixed by `auto-routing` and are not benchmark-derived.

---

## Phase 4 — sibling offices (Decision 4)

Per-office closeout narrowing of core 0.2. Each office adds the cost retrospective to its own run report in its own idiom; no office drops a core step.

- `codex-office/skills/codex-closeout/SKILL.md`
- `claude-office/skills/claude-closeout/SKILL.md`
- `agy-office/skills/agy-closeout/SKILL.md` — must state that agy reports no token counts, so wall clock and review rounds are the cost signal.

Each of the three also gains the `BRIEF DEFECT` return and the two standing brief clauses in its `*-executor` spoke, inherited from core 0.3.

**4b In-session fan-out, prompted not prescribed (audit finding 1).** No `*-executor` spoke currently mentions sub-delegation at all — grep for `subagent` / `fan-out` / `worker` in `codex-office/skills/codex-executor` and `agy-office/skills/agy-executor` returns nothing. Each of the three gains one short section: **the executor may fan out in-session using its own harness's built-in sub-agent mechanism**, subject to the brief's file scope and the one-writer-per-tree rule. Do **not** document the mechanism — each brand knows its own, and auto-office owns no CLI or sub-agent mechanics. What the spoke adds is the *permission and its limits*, which is the part an executor cannot infer.

**4c `agy-office/skills/agy-reviewer/SKILL.md` — split the two gates (audit finding 2).** The spoke currently states "The reviewer is always a Claude subagent. No caller tweak routes review through `agy`", which made the agy-planner plan-review row unreachable. Amend it to distinguish:

- **Code review stays barred to agy**, unchanged. It is long, adversarial, multi-round work against a diff — precisely agy's documented weakness, and the reason the miss-list exists.
- **Plan review is permitted to agy** at `agy` high, when agy is the planner. It is short, single-shot, breadth-first reading of one document — agy's documented *strength* per the capability-role table.

State that distinction as the reason, so a future reader does not "fix" the inconsistency by re-barring it or by opening code review. Also keep `agy` in the code-Reviewer row of 1.2's table as **never reviews**, which is now accurate rather than contradictory.

---

## Phase 5 — metadata and validation

- `auto-office/COMPATIBILITY.md`: add exceptions `auto-plan-review-gate`, `auto-pm-fanout`, `auto-mandated-executor-tier`, `auto-opus-only-self-heal`; drop nothing. Re-audit all four existing `widens_core_authority` flags against core 1.2.0. **Confirm** — do not hunt for — that no existing exception covered planner-implements: the four declared are `auto-orchestrator-selection`, `auto-task-subdelegation`, `auto-goal-locked-autonomy`, `auto-opus-reviewer-floor`, none of which does, because planner-implements was a *narrowing* and narrowings need no exception. (An earlier draft said to remove that exception; it has no referent, and the instruction risked deleting an adjacent real one.)
- Versions: `auto-office` → **2.0.0**, `office-core` → **1.2.0**, and a patch/minor bump plus `CHANGELOG.md` entry for `codex-office`, `claude-office`, and `agy-office` (Phase 4 changes their closeout contract).
- `.claude-plugin/marketplace.json` metadata version.
- `README.md`: the routing description references the tier ladder — update.
- Run `./scripts/vendor-core.sh` then `./scripts/check-plugins.sh`; **the hub must stay under 9000 bytes with zero warnings.**
- Grep gates. Each must return nothing outside CHANGELOG history, and each is **scoped**, because the audit found two that could never have passed as originally written:
  - `dispatch-cost` — repo-wide.
  - `T[012] ` used as a *tier* — **scoped to `auto-office/`**, and anchored (e.g. `T[012] (inline|in-session|CLI|tier)`). An unanchored `\bT[012]\b` false-positives on `claude-office/references/routing.md` and `agy-office/references/routing.md`, where `T1→T2→T4` are **task numbers**. The naive gate would have sent an implementer to edit sibling task-numbering examples for no reason.
  - `never implements` — **scoped to `auto-office/`**. The phrase legitimately lives in `agy-office/SKILL.md` and `claude-office/SKILL.md`, which no phase authorizes editing; those offices keep the stricter rule as a legal narrowing of core.
  - `sub-executor` — repo-wide.
  - `Rico|rico|favor\.church|techteam` — repo-wide **excluding `docs/plans/`**, because this plan states the pattern itself and would otherwise match its own gate definition. Third instance of a gate that could not pass as first written; check every gate against itself before trusting it.

**5b Whitelabel — this repo is going open source.** Completed 2026-08-01, ahead of this plan: personal name, email, account identifier, private repo name, and the `favor.church` schema namespace are all removed; metadata attributes to `office-skills`; schema `$id`s are vendor-neutral URNs. Two obligations follow for every edit in Phases 0–4:

- **Write for an unknown operator.** No personal names, emails, account identifiers, private repo or host names, or absolute home paths in shipped skill content. Preferences are attributed to **"the operator"** — the standing defaults are still binding, they are just no longer signed.
- **Grep gate, added to Phase 5:** `Rico|rico|favor\.church|techteam` must return nothing repo-wide. The `routing-outcomes.md` ledger is the highest-risk file for regression, since it records real runs against real repos — **resolved in 3.2**: committed rows carry opaque slugs, and the slug → real-repo mapping lives in a gitignored `routing-outcomes.local.md`.
- Not changed, and outside this repo's control: the local git identity still authors commits. Flag it rather than silently rewriting a global config.

---

## Trap register — invariants that must survive the simplification

Simplifying dispatch must not simplify safety. Each of these is re-verified at Phase 5:

1. One writer per tree, always. >1 executor ⇒ >1 worktree.
2. Nobody gates their own work — including the planner on its own inline fixes.
3. Fresh **code** reviewer, resumed across rounds, `opus` medium floor. No caller override drops below it. The **plan**-review gate is a separate gate with its own `opus` low floor — two floors, neither one overriding the other.
4. No approval without pasted validation output. A successful exit is not evidence.
5. Live-system writes need a read-back.
6. `PLANNER-HELD` irreversible work stops the loop; blast radius never self-widens.
7. Agy's Phase 2b verification is mandatory whenever agy executed — it exits 0 having done nothing.
8. The agy miss-list is appended to the reviewer rubric whenever agy touched a task; 3-consecutive cap holds.
9. 5 review rounds per task remains the hard cap, now with the 2-round plan-defect presumption in front of it.
10. `xhigh` / `ultra` / `max` and any model substitution stay user-invoked only.
11. Never collapse the task carrying the run's main correctness or security risk into inline work — core's counterweight, and the real limit on Decision 8.
12. UNKNOWN headroom means *unavailable*, not *low*.
13. The plan-reviewer never distributes work, and the PM never holds a gate. Separating them is what keeps trap #2 true once a plan-review gate exists.
14. Planning is two passes, never a loop: self-review, then one adversarial plan-review. A second amendment to the same task mid-loop stops the run for the user.
15. Planner inline writes never overlap a live executor in the same tree — trap #1 read in the direction that Decision 8 newly made possible.
16. A brief prompts in-session fan-out; it never prescribes the mechanism. Sub-agent mechanics belong to the sibling office, exactly like CLI mechanics.

## Explicitly not changing

- Reviewer at `opus` medium, and the `codex-sol` high exception when codex plans.
- The `executor` role id in every schema. Prose says Executor; the wire stays compatible.
- The capability-role routing model (Decider / Backend builder / Fast scout) and the benchmark refresh procedure.
- Review funding. 24% of last run's tokens bought 11 passes and 3 legitimate catches, two of them green-but-useless tests. That is the cheapest quality in the run and it stays.

## Decisions resolved (operator default, 2026-08-01)

1. **Version: `auto-office` 2.0.0.** The tier ladder is removed and roles are added; the previous run's report references v1 semantics, so the break is real and should be visible.
2. **The PM holds no planner-held actions.** It distributes briefs and collects results. Commit, PR, merge, deploy, and closeout stay with the planner. It holds no gate of any kind — which, combined with its full separation from the plan-reviewer (Decision 9), is what keeps trap #2 true now that a plan-review gate exists.
3. **`routing-outcomes.md` lives in this plugin**, marked workspace-local. See the artifact-location rule in 3.2 — the ledger is the only cross-run file that lives here; everything belonging to a specific run lives in that run's target repo.
4. **Phase 4 ships in this pass.** All three siblings get the cost retrospective now, so no office is left reporting cost in an idiom the others dropped.

## Verification

- `./scripts/check-plugins.sh` → all checks passed, 0 warnings; hub < 9000 bytes.
- All four grep gates clean.
- Both live probes still run: `codex-usage.py` and `claude-usage.py` exit 0; `agy-usage.py` exits 2.
- `SNAPSHOT.json` in all four plugins records core `1.2.0` with a matching hash.
- Read `auto-routing/SKILL.md` end-to-end as if planning a run: the two decisions must be answerable without arithmetic, and every model/effort cell must be readable in one lookup.
