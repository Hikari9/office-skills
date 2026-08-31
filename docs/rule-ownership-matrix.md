# Rule ownership matrix

## What this is

`codex-office`, `claude-office`, and `agy-office` moved from three standalone skill
bundles into a hub-and-spoke plugin layout over a shared `office-core` protocol. Each
office is now a compact hub (`SKILL.md`) that routes to role spokes (`skills/*/SKILL.md`)
and durable reference material (`references/*.md`), with the genuinely shared rules lifted
into `office-core/protocol/*.md` and `office-core/schemas/*.json`.

This document is the audit trail for that move. It answers two questions: for any given
rule, who owns it now, and did anything get lost on the way over from the old single-file
hubs. Every path cited below exists on disk at the time of writing.

**How to use it when a rule needs to change.** Find the rule's row. Its `Owner class` tells
you the kind of change you're making:

- **`core`**, a change here affects all three offices. Follow the release checklist in
  `office-core/protocol/compatibility.md`: bump `office-core/VERSION`, re-vendor into each
  plugin, validate all three adapters before shipping any of them.
- **`codex adapter` / `claude adapter` / `agy adapter`**, edit the named plugin's file
  directly. Nothing else needs to move.
- **`role spoke`**, edit the spoke; check whether the owning hub's routing table or
  red-flags table needs a matching one-line update.
- **`domain skill`**, not this corpus. Go to the named skill (`agy`, `rock-favor`,
  `vercel-cli`, etc.) instead.
- **`retired`**, don't revive it in place; if the lesson still applies, it re-enters as a
  new rule in the owning file, not as an edit to the historical note.

If you can't find a rule's row, that is itself a finding, file it as a gap, don't assume
it's core by default. Core is the narrow, deliberately short list in
`office-core/protocol/`; everything else defaults to adapter or spoke ownership.

---

## The matrix

### Invocation and roles

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| Explicit invocation only; never self-triggered by task shape | core | `office-core/protocol/roles-and-authority.md` (Invocation §1) | `auto-office/SKILL.md`, `codex-office/SKILL.md`, `agy-office/SKILL.md` (each hub's invocation-gate section); graded by the `expect_skill: false` controls in each `evals/` | Each pre-restructure hub's "Invocation gate" section |
| A dispatched worker/reviewer is not the planner; brief wins over hub for role | core | `office-core/protocol/roles-and-authority.md` (Invocation §2) | All three hubs, opening lines under Invocation | Same |
| Caller overrides: honored, echoed, and cannot skip review / reuse executor as reviewer / downgrade reviewer / remove a phase / widen the ceiling | core | `office-core/protocol/roles-and-authority.md` (Invocation §3–4) | Each hub's "caller tweaks" table | Each pre-restructure hub's "Caller tweaks" section |
| Three standing roles: planner / executor / reviewer, each holds a gate the others cannot | core | `office-core/protocol/roles-and-authority.md` (The three standing roles) | Each hub's role table | Each pre-restructure hub's role table |
| Added roles never absorb an existing role's gate (e.g., Agy's verifier) | core | `office-core/protocol/roles-and-authority.md` | `agy-office/SKILL.md` ("Why five phases, not four") | New in the restructure; anticipates the agy-office exception |
| Agy's mandatory Verifier role, the planner wearing a distinct, non-judging hat | agy adapter | `agy-office/skills/agy-verification/SKILL.md` | `agy-office/SKILL.md` (Phase 2b description) | Pre-restructure `agy-office/SKILL.md` §"Why this office has five phases, not four" |

### Approval and planning

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| Interview to 95% clear before writing the plan | core | `office-core/protocol/plan-contract.md` (Interview floor) | `auto-office/skills/claude-planning/SKILL.md`, `agy-office/skills/agy-planning/SKILL.md`, `codex-office/SKILL.md` Phase 1 | Each pre-restructure hub's Phase 1 |
| Explicit approval before dispatch; silence is not approval | core | `office-core/protocol/roles-and-authority.md` (Approval) | `claude-planning/SKILL.md`, `agy-planning/SKILL.md`, `codex-office/SKILL.md` | Each pre-restructure hub's Phase 1 close |
| Five required plan sections (Context, Global Constraints, Numbered tasks, Dependency graph, Out of scope) | core | `office-core/protocol/plan-contract.md` (Required sections) | `claude-planning/SKILL.md`, `agy-planning/SKILL.md`, `codex-office/SKILL.md` Phase 1 | Each pre-restructure hub's Phase 1 |
| Claims discipline: existence ≠ provenance; an explorer's example is not an observation; derivation inherits correctness, never creates it; a restructuring's invariant must hold by construction | core | `office-core/protocol/plan-contract.md` (Claims discipline) | `claude-planning/SKILL.md` (near-verbatim), `agy-planning/SKILL.md` (cross-references, doesn't restate in full) | Pre-restructure `claude-office/SKILL.md` Phase 1, dated 2026-07-30 / 2026-08-01 |
| Deploy/apply tasks scope from the diff, not the motivating feature | core | `office-core/protocol/plan-contract.md` (Deploy/apply task scoping) | `claude-planning/SKILL.md`, `agy-planning/SKILL.md` | Pre-restructure `claude-office/SKILL.md` and `agy-office/SKILL.md` Phase 1, dependency-graph subsection |
| Presenting the plan: state routing/worker count/waves, one clause per delegation | core | `office-core/protocol/plan-contract.md` (Presenting the plan) | `claude-planning/SKILL.md`, `agy-planning/SKILL.md`, `auto-office/references/fan-out.md`, `agy-office/references/routing.md` | Each pre-restructure hub's plan-presentation paragraph |
| Tracking issue is identified before plan approval and referenced by the draft PR | core | `office-core/protocol/plan-contract.md` (Run metadata and tracking issue) | `auto-office/skills/auto-planning/SKILL.md`, `agy-office/skills/agy-planning/SKILL.md`, `codex-office/SKILL.md` | User-directed core 5.0.0 lifecycle change; Agy/Auto retain automatic issue creation |
| Strategy/effort tags INLINE/HAIKU/SONNET/OPUS, with justification ≤8 words | claude adapter | `auto-office/skills/claude-planning/SKILL.md` | `auto-office/references/discernment.md` (model matrix) | Pre-restructure `claude-office/SKILL.md` Phase 1 |
| Strategy tags INLINE/FLASH/PRO/ELSEWHERE/PLANNER-HELD, both paid tiers resolve to one model | agy adapter | `agy-office/skills/agy-planning/SKILL.md` | `agy-office/references/routing.md` (model tiers) | Pre-restructure `agy-office/SKILL.md` Phase 1 |
| Codex worker routing: same-brand Codex planner/assignee uses in-session subagents; cross-brand assignments use the assignee CLI; Codex CLI uses `gpt-5.6-luna` high by default and xhigh for review/hard diagnosis | codex adapter | `codex-office/SKILL.md` (Dispatch routing and role table); `codex-office/skills/codex-cli/SKILL.md` | `codex-office/references/reviewer-brief.md` | Pre-restructure `codex-office/SKILL.md` role table and "Essential operating rules" |
| Pin every touched interface verbatim (file:line) during planning | agy adapter | `agy-office/skills/agy-planning/SKILL.md` | `agy-office/references/executor-brief.md`, `agy-office/references/verification.md`, `agy-office/references/reviewer-brief.md` | Pre-restructure `agy-office/SKILL.md` Phase 1 |

### Blast radius and authority

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| Blast-radius ceiling: declared once verbatim, restated in every downstream brief, narrows going down only, backed by mechanism where possible | core | `office-core/protocol/roles-and-authority.md` (Blast-radius ceiling) | `auto-office/references/escalation.md`, `agy-office/references/escalation.md`, `codex-office/skills/codex-cli/SKILL.md` (safety boundary), all three hubs' non-bypassable-rules lists | Each pre-restructure hub's Phase 1 and escalation material |
| Planner-held by default: ready-for-review, plan removal, merges, deploys, migrations, remote/DNS/config, credentials, outbound messages; executor bootstrap is the named exception for push, draft PR, and milestone comments | core | `office-core/protocol/roles-and-authority.md` (Blast-radius ceiling and Executor-owned draft-PR bootstrap); `office-core/protocol/executor-bootstrap.md` | All three executor spokes and briefs; all three closeout spokes; all three hubs | User-directed core 5.0.0 lifecycle change |
| Executor bootstrap: plan-only first commit, named-branch push, one draft PR, initial comment, fail-closed verification | core | `office-core/protocol/executor-bootstrap.md` | `codex-office/skills/codex-executor/SKILL.md`, `agy-office/skills/agy-executor/SKILL.md`, `agy-office/references/executor-brief.md`, `auto-office/skills/auto-loop/SKILL.md` | User-directed core 5.0.0 lifecycle change |
| Milestones are committed and commented on one draft PR; final closeout removes the plan, marks ready, and merges | core | `office-core/protocol/plan-contract.md`, `office-core/protocol/closeout.md` | All three hubs and closeout spokes; `auto-office/skills/auto-loop/SKILL.md` | User-directed core 5.0.0 lifecycle change |
| One writer per working tree, always; parallel work needs separate worktrees and disjoint `Touches:` | core | `office-core/protocol/roles-and-authority.md` (One writer per working tree) | `auto-office/skills/claude-cli/SKILL.md` (session/worktree identity), `codex-office/skills/codex-cli/SKILL.md`, `agy-office/skills/agy-executor/SKILL.md`, `agy-office/references/routing.md` | Each pre-restructure hub |
| Delegation test: a delegation must buy tier, isolation, or parallelism, or it's `INLINE` | core | `office-core/protocol/roles-and-authority.md` (Delegation test) | `auto-office/references/fan-out.md`, `agy-office/references/routing.md` (both restate in full); no equivalent routing reference exists in `codex-office` (see note below) | Pre-restructure `claude-office/SKILL.md` and `agy-office/SKILL.md` Phase 1 |
| Never collapse the task carrying the run's main correctness/security risk | core | `office-core/protocol/roles-and-authority.md` (Delegation test, counterweight) | `auto-office/references/fan-out.md`, `agy-office/references/routing.md` | Pre-restructure `claude-office/SKILL.md` and `agy-office/SKILL.md` Phase 1 |
| Escalation ownership: `[needs-planner]` / `[needs-user]` / `[decided]`, batched with a recommendation, never inferred | core | `office-core/protocol/roles-and-authority.md` (Escalation ownership) | `auto-office/references/escalation.md`, `agy-office/references/escalation.md`, `codex-office/skills/codex-executor/SKILL.md` (Upline resolution, condensed) | Each pre-restructure hub's escalation material |
| Pre-existing dirty changes are protected paths, never touched or reverted | core | `office-core/protocol/roles-and-authority.md` (One writer per working tree) | `codex-office/skills/codex-cli/SKILL.md`, `auto-office/references/discernment.md` | Pre-restructure `codex-office/SKILL.md` "Essential operating rules" |

*Note on the routing shape:* `codex-office` keeps its brand-routing rule in the hub rather than a
separate `references/routing.md`. Same-brand Codex workers use in-session subagents; cross-brand
assignments use the assignee's CLI adapter. The executor still remains one writer per repository.

### Dispatch and runtime

See the dedicated adapter table below; this subject area is almost entirely
client-specific by design. The one shared piece:

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| The Office Kernel is the only material every role receives verbatim; everything else is selected | core | `office-core/protocol/evidence-and-handoff.md` (The Office Kernel); `office-core/schemas/office-kernel.schema.json` | All three hubs' routing-table preambles ("never load the whole corpus") | New in the restructure, the pre-restructure hubs had no formal packet header, just prose briefs |
| Run telemetry: one event per explicit dispatch, matched on session/worktree identity, never a display label | core | `office-core/schemas/run-event.schema.json` | Each hub's "Run telemetry" section; `codex-office/skills/codex-cli/SKILL.md`, `agy-office/skills/agy-cli/SKILL.md` | New in the restructure, no pre-restructure hub had a formal telemetry schema |

### Evidence and handoff

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| What is not evidence: exit 0, narration, an unattributed pasted block, a green suite alone, a quiet gate hook | core | `office-core/protocol/evidence-and-handoff.md` (What is not evidence) | `auto-office/references/review-gate.md`, `agy-office/references/review-gate.md`, `codex-office/references/review-gate.md`, every hub's non-bypassable-rules list | Each pre-restructure hub's Phase 3 material |
| What is evidence: real pasted gate output, a test observed failing, a read-back for live writes, a control run for a checking tool | core | `office-core/protocol/evidence-and-handoff.md` (What is evidence) | `auto-office/references/review-gate.md`, `agy-office/references/review-gate.md`, `auto-office/references/reviewer-brief.md`, `agy-office/references/reviewer-brief.md` | Pre-restructure `claude-office/SKILL.md` Phase 3, dated 2026-07-29 / 2026-08-01 |
| Handoff is a file at the Kernel's handoff path, never a chat summary | core | `office-core/protocol/evidence-and-handoff.md` (Handoff report contract); `office-core/schemas/handoff.schema.json` | `auto-office/skills/claude-executor/SKILL.md`, `codex-office/skills/codex-executor/SKILL.md`, `agy-office/skills/agy-executor/SKILL.md` | Each pre-restructure hub's executor-brief template |
| Handoff required sections: work items, commits, interfaces verified, validation, mutation table, unrequested files, `## Upline` | core | `office-core/protocol/evidence-and-handoff.md`; `office-core/schemas/handoff.schema.json` | `auto-office/references/executor-brief.md`, `codex-office/references/task-prompt.md`, `agy-office/references/executor-brief.md` | Each pre-restructure hub's handoff template |
| Agy's handoff adds two mandatory sections beyond the core schema: Interfaces-verified table, Files-created-outside-work-items | agy adapter | `agy-office/references/executor-brief.md` (Handoff report contract) | `agy-office/skills/agy-verification/SKILL.md` (checks 2–3) | Pre-restructure `agy-office/SKILL.md` executor-brief template |
| Capability manifest replaces a catalog dump; `catalog_injected` is always `false` | core | `office-core/schemas/capability-manifest.schema.json` | Implicit in each hub's "never load the whole corpus" routing-table preamble; no hub names the manifest mechanism explicitly | New in the restructure; thin restatement everywhere, worth tightening (see Unaccounted note) |
| Evidence is valid only for the commit range it was produced against; every fix wave invalidates prior output | core | `office-core/protocol/evidence-and-handoff.md` (Evidence reuse and freshness) | `auto-office/references/review-gate.md` Phase 3b, `agy-office/references/review-gate.md` Phase 3b | Pre-restructure `claude-office/SKILL.md` Phase 3b |

### Verification

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| A verification tool's PASS is a claim until a control run proves it can fail | core | `office-core/protocol/evidence-and-handoff.md` (What is evidence) | `auto-office/references/review-gate.md`, `agy-office/references/review-gate.md` | Pre-restructure `claude-office/SKILL.md` Phase 3, dated 2026-07-29 |
| A gate structurally blind to a runtime-only surface must be named before approving, not after | core | `office-core/protocol/evidence-and-handoff.md` (What is evidence) | `auto-office/references/review-gate.md`, `agy-office/references/review-gate.md` | Same |
| Agy's mandatory Phase 2b: seven independent checks before the reviewer is dispatched | agy adapter | `agy-office/skills/agy-verification/SKILL.md`; `agy-office/references/verification.md` | `agy-office/SKILL.md` ("Why five phases, not four"), `agy-office/COMPATIBILITY.md` (exception `agy-phase-2b`) | Pre-restructure `agy-office/SKILL.md`, "Why this office has five phases, not four" and Phase 2b section |
| Phase 2b is not review: no spec judgement, no approving, doesn't license a lighter Phase 3 | agy adapter | `agy-office/skills/agy-verification/SKILL.md` (What this pass is not) | `agy-office/skills/agy-reviewer/SKILL.md`, `agy-office/references/review-gate.md` | Same |

### Review and the fix loop

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| Reviewer is fresh, never the executor, never the planner reviewing its own plan | core | `office-core/protocol/review-states.md` (The reviewer) | `auto-office/skills/claude-reviewer/SKILL.md`, `codex-office/skills/codex-reviewer/SKILL.md`, `agy-office/skills/agy-reviewer/SKILL.md` | Each pre-restructure hub's Phase 3 |
| Record the reviewer's agent id; resume the same one every round | core | `office-core/protocol/review-states.md` (The reviewer) | Same three reviewer spokes, plus each office's `review-gate.md` | Each pre-restructure hub's Phase 3 |
| Do not pre-judge the reviewer's prompt | core | `office-core/protocol/review-states.md` (The reviewer) | `auto-office/references/review-gate.md`, `agy-office/references/review-gate.md` | Same |
| Hand the diff over as a file, never as prompt text | core | `office-core/protocol/review-states.md` (The reviewer) | `auto-office/references/review-gate.md`, `codex-office/references/reviewer-brief.md`, `agy-office/references/review-gate.md` | Same |
| Three verdicts: `APPROVED` / `CHANGES REQUIRED` / `PLAN DEFECT`, with each verdict's effect on the loop | core | `office-core/protocol/review-states.md` (The three verdicts) | All three reviewer spokes and reviewer-brief templates | Each pre-restructure hub's Phase 3 |
| `PLAN DEFECT` exits the fix loop instead of consuming a round; routed by owner (planner for technical gaps, user for tradeoffs) | core | `office-core/protocol/review-states.md` (`PLAN DEFECT`) | `auto-office/references/escalation.md`, `agy-office/references/escalation.md`, all three `review-gate.md` files | Each pre-restructure hub's escalation and Phase 3 material |
| Fix loop: one fix wave per round, all findings together; planner applies fixes, reviewer never fixes what it gates | core | `office-core/protocol/review-states.md` (The fix loop) | `auto-office/references/review-gate.md`, `codex-office/references/review-gate.md`, `agy-office/references/review-gate.md` | Each pre-restructure hub's Phase 3b |
| Escalate a failure class out of the tool that just demonstrated it, not back to that tool | core | `office-core/protocol/review-states.md` (The fix loop) | `agy-office/skills/agy-reviewer/SKILL.md`, `agy-office/references/review-gate.md` (sharpest restatement) | Pre-restructure `agy-office/SKILL.md` Phase 3 |
| 5-round cap; report the deadlock, never self-approve past it | core | `office-core/protocol/review-states.md` (The fix loop) | All three reviewer spokes and `review-gate.md` files | Each pre-restructure hub's Phase 3b |
| Claude fix-triage matrix: INLINE / delegate sonnet / opus / haiku by finding shape | claude adapter | `auto-office/references/review-gate.md` (Phase 3b) | `auto-office/skills/claude-reviewer/SKILL.md` | Pre-restructure `claude-office/SKILL.md` Phase 3 |
| Agy fix-triage matrix: INLINE / Flash / Pro / Claude subagent, with the "never back to agy" row | agy adapter | `agy-office/references/review-gate.md` (Phase 3b) | `agy-office/skills/agy-reviewer/SKILL.md` | Pre-restructure `agy-office/SKILL.md` Phase 3 |
| Codex fix dispatch: fresh scoped executor, findings-only prompt | codex adapter | `codex-office/references/review-gate.md` | `codex-office/skills/codex-reviewer/SKILL.md` | Pre-restructure `codex-office/SKILL.md` Phase 3 |
| Agy reviewer is always a Claude subagent, never `agy`, no caller override | agy adapter | `agy-office/skills/agy-reviewer/SKILL.md` (Always a Claude subagent) | `agy-office/SKILL.md`, `agy-office/COMPATIBILITY.md` (exception `agy-non-agy-reviewer`), `agy-office/references/review-gate.md` | Pre-restructure `agy-office/SKILL.md` Phase 3 |
| Build evidence reuse: hand over an existing gate-hook's real output only if it's attributable to `HEAD`; a hook that discards passing output or is conditional on dirty state is not reusable | core | `office-core/protocol/evidence-and-handoff.md` ("Reuse, do not re-derive") | `auto-office/references/review-gate.md` (fullest treatment), `agy-office/references/review-gate.md` | Pre-restructure `claude-office/SKILL.md` Phase 3, dated 2026-08-01 |

### Closeout

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| Sequence: confirm target → commit → verify the real gate → PR/automerge only if authorized → document only what the repo already maintains → sync main, then remove the worktree → close loops | core (since core `1.1.0`) | `office-core/protocol/closeout.md` | All three `references/closeout.md` adapters and all three closeout spokes | Pre-restructure `claude-office/SKILL.md` and `agy-office/SKILL.md` Phase 4 |
| Gate red stops the run: commit and document still run, no PR is opened or armed | core | `office-core/protocol/closeout.md` (step 2) | The three closeout spokes | Same |
| Claude's gate addition: a real Next.js build, not just lint | claude adapter | `auto-office/references/closeout.md` | `auto-office/skills/claude-closeout/SKILL.md` | Pre-restructure `auto-office/references/closeout.md` step 2 |
| Agy's gate addition: run the gate yourself, since an agy run does not fire the Stop hook | agy adapter | `agy-office/references/closeout.md` | `agy-office/skills/agy-closeout/SKILL.md` | Pre-restructure `agy-office/references/verification.md` check 5 |
| Codex's addition: push and PR only if the caller authorized it; reviewer model and round count in the report | codex adapter | `codex-office/references/closeout.md` | `codex-office/skills/codex-closeout/SKILL.md` | Pre-restructure `codex-office/references/closeout.md` |
| Where a durable lesson gets recorded after a run | per-office adapter | Each `references/closeout.md` | Each closeout spoke | Pre-restructure hubs' "make the skill better than you found it" sections |
| Every open `## Upline` entry is closed at closeout, answered, filed, or explicitly ruled irrelevant | core (procedural echo of Escalation ownership) | `office-core/protocol/roles-and-authority.md` (Escalation ownership) | `auto-office/skills/claude-closeout/SKILL.md`, `agy-office/skills/agy-closeout/SKILL.md`, `codex-office/skills/codex-closeout/SKILL.md` | Each pre-restructure hub's Phase 4 |
| Deployment/migration closeout requires a live read-back, never a writer's exit status | core | `office-core/protocol/evidence-and-handoff.md` (What is evidence) | `codex-office/skills/codex-closeout/SKILL.md` (fullest restatement), `auto-office/references/closeout.md`, `agy-office/references/closeout.md` | Each pre-restructure hub's Phase 4 / gate step |

**Resolved in core `1.1.0`.** The audit found `auto-office/references/closeout.md` and
`agy-office/references/closeout.md` verbatim identical except for one phrase ("the handoff"
versus "the agy handoff"), so the same text was being kept in sync by hand across 2 plugins
without living in core. The procedure was promoted to `office-core/protocol/closeout.md`, and
each office now keeps a thin adapter holding only its own additions. Codex adopted the full
procedure it had previously described in summary, which gained it the confirm-target step, the
gate-red stop rule, and the worktree and loop-closing steps. No step was dropped anywhere.

### Telemetry

| Rule | Owner class | Canonical location | Restated in | Source |
|---|---|---|---|---|
| `run-event` schema: one event per explicit dispatch, redacted labels only, no prompts/secrets/credentials | core | `office-core/schemas/run-event.schema.json` | Each hub's "Run telemetry" section | New in the restructure, no pre-restructure hub had a formal event schema, only prose instructions to "record" launch/session facts |
| A transcript keyword match is a catalog mention, never an invocation, and never produces a telemetry event | core | `office-core/schemas/run-event.schema.json` (description) | All three hubs' "Run telemetry" sections | Same |
| Codex per-launch telemetry fields (launch id, worktree id, BASE, spokes, model/effort, review round) | codex adapter | `codex-office/skills/codex-cli/SKILL.md` | `codex-office/SKILL.md` (Run telemetry) | Pre-restructure `codex-office/SKILL.md` had no equivalent, new in the restructure |
| Claude per-launch telemetry fields (launch id, session id, worktree id/path, role, model/effort, fork id+reason) | claude adapter | `auto-office/skills/claude-cli/SKILL.md` | `claude-office/SKILL.md` (Run telemetry) | Pre-restructure `claude-office/SKILL.md` had no equivalent, new in the restructure |
| Agy per-launch telemetry fields (launch id, model display name, workspace path, BASE, print-timeout, stall/swallow/completion state) | agy adapter | `agy-office/skills/agy-cli/SKILL.md` | `agy-office/SKILL.md` (Run telemetry) | Pre-restructure `agy-office/SKILL.md` had no equivalent, new in the restructure |

---
| **Self-review before handoff, every role** — planner, executor, worker, verifier, reviewer; per artifact and once in aggregate; graded Critical/Important/Minor | core (since `4.0.0`) | `office-core/protocol/evidence-and-handoff.md` (Self-review before handoff) | Every executor, reviewer, and verification spoke; `handoff.schema.json` and `review-verdict.schema.json` both require it | Generalised from core `3.0.0`'s executor-only rule |
| **Self-review is not self-approval** — any text reading "never self-review" means never self-approve | core (since `4.0.0`) | `office-core/protocol/evidence-and-handoff.md` | All three reviewer spokes' section headings | New in `4.0.0`; the old wording contradicted the mandate |
| **The receiver rejects a missing `## Self-review`** and returns the artifact before spending anything else on it; a verdict returned for this does not re-consume the round | core (since `4.0.0`) | `office-core/protocol/evidence-and-handoff.md` (Who rejects a missing self-review) | `review-states.md`; all reviewer and executor spokes | New in `4.0.0` |
| **Run telemetry is emitted by the harness, never by a role** | core (since `4.0.0`) | `docs/telemetry-event-model.md`; `eval/hooks/session-end.mjs` | Each hub's "Run telemetry" section, reduced to a pointer | Replaces core `3.0.0`'s prose instruction, which produced zero records in three weeks |
| **`compact:` recommendation is computed at every lull by a `Stop` hook**, not remembered by the planner | core (since `4.0.0`) | `eval/hooks/compact-advisor.mjs` | `office-core/protocol/evidence-and-handoff.md` (Run-state durability) states when it is `yes` | The rule existed since core `2.0.0` and was rarely followed |
| **Run state survives compaction** via a `PreCompact` scratchpad written outside the repo | core (since `4.0.0`) | `eval/hooks/pre-compact.mjs` | `evidence-and-handoff.md` (a `no` is a defect report) | New in `4.0.0` |
| **Landed rate ≥ 80%**, enforced at n≥15; eval pass rate ≥ 80% per office in CI | core (since `4.0.0`) | `eval/gate.mjs`; `.github/workflows/skill-eval.yml` | `docs/telemetry-event-model.md` (The goal) | New in `4.0.0` |
| **agy model slugs resolve at dispatch, never pinned in prose** | agy adapter | `agy-office/scripts/agy-model.sh` | `agy-cli`, `agy-planning`, `agy` routing and review-gate references; `auto-routing` | New in agy `3.0.0`; four files had named four different Gemini versions |
| **The claude route ships inside `auto-office`** — its reviewer is the default code-review gate for every route | auto adapter | `auto-office/references/delegation-map.md` | `auto-office/skills/claude-*`; `README.md` | New in auto `4.0.0`; `claude-office` retired |

## Client-specific rules with a named adapter owner

Each row below is runtime mechanics for exactly one CLI. None of it belongs in
`office-core`, and none of it is duplicated into another plugin's files, each plugin's
`COMPATIBILITY.md` records the plugin as the sole owner where the rule narrows a core gate
(e.g., `claude-cli-default-execution`, `agy-phase-2b`).

| CLI behavior | Owner | Canonical location |
|---|---|---|
| `-m <model>` **and** `-c model_reasoning_effort="<effort>"` passed explicitly on every `codex exec` call; effort read back from the launch banner | codex adapter | `codex-office/skills/codex-cli/SKILL.md` (Model and effort selection) |
| `codex exec --yolo` has no sandbox or approval stop; prompt + ceiling are the entire boundary | codex adapter | `codex-office/skills/codex-cli/SKILL.md` (The safety boundary) |
| `--cli` (background `claude --bg --remote-control`) vs. `--in-session` (Agent-tool subagent); `--cli` is the default, reviewer is always in-session | claude adapter | `auto-office/skills/claude-cli/SKILL.md`; `auto-office/COMPATIBILITY.md` (exception `claude-cli-default-execution`) |
| The fork gotcha: `--resume <id> --bg` forks unconditionally regardless of `busy`/`blocked` state; never use it to steer, only to genuinely branch | claude adapter | `auto-office/skills/claude-cli/SKILL.md` (The fork gotcha, in full); full pitfall detail in `auto-office/references/discernment.md` |
| `cli-response`: answering a blocked `--cli` agent's menu or free-text question in place via `claude attach`, without forking | claude adapter | `auto-office/skills/claude-cli-send-message/SKILL.md` (frontmatter name: `cli-response`); `auto-office/COMPATIBILITY.md` (exception `claude-cli-response-channel`) |
| `--print` must be the last flag, immediately before the prompt, or the prompt is silently swallowed | agy adapter | `agy-office/skills/agy-cli/SKILL.md` (Launch form); `agy-office/references/executor-brief.md` |
| `--print-timeout` defaults to 5m; always raise it (45m typical) or the run dies mid-task | agy adapter | `agy-office/skills/agy-cli/SKILL.md` (Launch form) |
| `--add-dir` does not reliably set the workspace; the prompt text itself must state the absolute workspace root | agy adapter | `agy-office/skills/agy-cli/SKILL.md` (Launch form); `agy-office/references/executor-brief.md` (Required field 1) |
| Quota is a live, shared risk; a stall after a few narration lines is quota, not slowness, confirm quota before a long plan, keep Claude subagents as fallback | agy adapter | `agy-office/skills/agy-cli/SKILL.md` (Quota and stall detection); `agy-office/references/routing.md` |
| Pinned interface signatures, cited `file:line`, required in every brief and checked in Phase 2b | agy adapter | `agy-office/references/executor-brief.md` (The real-signature clause); `agy-office/skills/agy-verification/SKILL.md` (check 3) |
| Phase 2b, the mandatory seven-check independent verification pass between execution and review | agy adapter | `agy-office/skills/agy-verification/SKILL.md`; `agy-office/references/verification.md`; `agy-office/COMPATIBILITY.md` (exception `agy-phase-2b`) |

**A naming note.** The optimization plan names the runtime spokes `codex-runtime`,
`claude-runtime`, and `agy-runtime`, and names claude's answer-in-place spoke
`cli-response`. Those were renamed during implementation, at the operator's request, to
`codex-cli`, `claude-cli`, `agy-cli`, and `claude-cli-send-message`. The plan document is
left at the original names on purpose, since it is the record of what was approved.
Directories, frontmatter `name:` fields, and every link were renamed together, and
`scripts/check-plugins.sh` verifies that all of them resolve on disk.

---

## Migration completeness check

Every rule found in the three pre-restructure hubs (`git show HEAD:claude-office/SKILL.md`,
`git show HEAD:codex-office/SKILL.md`, `git show HEAD:agy-office/SKILL.md`), and where it
lives now.

| Pre-restructure rule (hub, section) | Now lives at |
|---|---|
| Claude: office-of-three-roles table, core principle | `claude-office/SKILL.md` role table (kept, tightened) |
| Claude: invocation gate, "not the planner" note | `claude-office/SKILL.md` (Invocation gate); core: `roles-and-authority.md` |
| Claude: caller-tweaks table | `claude-office/SKILL.md` (Invocation gate and caller overrides) |
| Claude: `--cli` default / `--in-session` opt-out | `auto-office/skills/claude-cli/SKILL.md` |
| Claude: fork gotcha (`--resume`/`--bg`) | `auto-office/skills/claude-cli/SKILL.md`; full pitfall list `auto-office/references/discernment.md` |
| Claude: `cli-response` cheap-reply mechanism | `auto-office/skills/claude-cli-send-message/SKILL.md` (name: `cli-response`) |
| Claude: automatic `gh issue create` | `auto-office/skills/claude-planning/SKILL.md` |
| Claude: routing table (spoke pointers) | `claude-office/SKILL.md` (Routing table) |
| Claude: Phase 1, issue tracking, interview, explorer dispatch, plan sections, blast-radius ceiling, strategy/effort table, dependency graph, deploy-scoping rule, claims discipline, both 2026-08-01 plan-defect anecdotes, invariant-by-construction rule, presenting-the-plan, approval | `auto-office/skills/claude-planning/SKILL.md`; core: `office-core/protocol/plan-contract.md` |
| Claude: Phase 2, one executor per repo, `--cli`/`--in-session` dispatch, non-conflicting prep, handoff-file reading, Upline handling | `auto-office/skills/claude-executor/SKILL.md`; core: `office-core/protocol/evidence-and-handoff.md` |
| Claude: Phase 3, fresh reviewer, build-evidence reuse, live-write read-back, `PLAN DEFECT`, fix-triage matrix, 5-round cap | `auto-office/skills/claude-reviewer/SKILL.md` + `auto-office/references/review-gate.md`; core: `review-states.md` |
| Claude: Phase 4, final plan removal/ready/merge, document/sync/close-loops sequence, ≤6-line report, "make the skill better" routing | `auto-office/skills/claude-closeout/SKILL.md` + `auto-office/references/closeout.md` |
| Claude: composing-with-other-skills paragraph | `claude-office/SKILL.md` (Composing with other skills) |
| Claude: Red Flags table (19 rows) | `claude-office/SKILL.md` (the "Red Flags" table); individual rows also echoed inside the owning spoke where relevant |
| Codex: role table, executor-never-approves-own-work | `codex-office/SKILL.md` role table |
| Codex: invocation and caller-override rules | `codex-office/SKILL.md` (Invocation gate and caller overrides) |
| Codex: four phases (plan/execute/review/closeout), one line each | `codex-office/SKILL.md` (The four phases); detail in `codex-office/skills/codex-executor/SKILL.md`, `codex-reviewer/SKILL.md`, `codex-closeout/SKILL.md` |
| Codex: `-m` explicit, model choice by task | `codex-office/skills/codex-cli/SKILL.md` |
| Codex: one writer per tree | `codex-office/skills/codex-cli/SKILL.md`; core: `roles-and-authority.md` |
| Codex: executor authority (local edits/commits only) | `codex-office/skills/codex-executor/SKILL.md` |
| Codex: successful exit ≠ evidence | `codex-office/skills/codex-cli/SKILL.md`; core: `evidence-and-handoff.md` |
| Codex: deployment/migration planner-held, read-back required | `codex-office/skills/codex-closeout/SKILL.md` |
| Codex: preserve dirty worktree changes | `codex-office/skills/codex-cli/SKILL.md` |
| Codex: reference routing list (task-prompt, reviewer-brief, review-gate, closeout) | `codex-office/SKILL.md` (Routing table) |
| Agy: same-as-Claude role table plus independent-verification line | `agy-office/SKILL.md` role table |
| Agy: "why five phases, not four" (three failure properties, quota risk) | `agy-office/SKILL.md`; detail in `agy-office/skills/agy-verification/SKILL.md` |
| Agy: `agy` skill required-background note | `agy-office/SKILL.md`; `agy-office/skills/agy-cli/SKILL.md` |
| Agy: invocation gate, caller-tweaks table, Phase 2b non-skippable note | `agy-office/SKILL.md` (Invocation gate and caller overrides) |
| Agy: routing table (spoke pointers) | `agy-office/SKILL.md` (Routing table) |
| Agy: Phase 1, issue tracking, interview, explorer dispatch, pinned-signature requirement, plan sections, blast-radius ceiling (unsandboxed caveat), strategy table, Flash-family caveat, dependency graph, deploy-scoping rule, presenting the plan, approval | `agy-office/skills/agy-planning/SKILL.md`; core: `plan-contract.md` |
| Agy: Phase 2, one executor per repo, launch form, `--print` ordering, background/no-pipe watching, exit-0 caveat, commit boundary, Upline handling | `agy-office/skills/agy-executor/SKILL.md` + `agy-office/skills/agy-cli/SKILL.md` + `agy-office/references/executor-brief.md` |
| Agy: Phase 2b, seven (documented as "six" in one pre-restructure heading, "seven" in body) independent checks | `agy-office/skills/agy-verification/SKILL.md` + `agy-office/references/verification.md` |
| Agy: Phase 3, always-Claude reviewer, uncompressed rubric, build evidence is the planner's not the executor's, live-write read-back, `PLAN DEFECT`, fix-triage matrix (with "never back to agy" row), 5-round cap | `agy-office/skills/agy-reviewer/SKILL.md` + `agy-office/references/review-gate.md` |
| Agy: Phase 4, commit/gate/PR/document/sync/close-loops sequence, ≤6-line report with Phase 2b line, two-skill lesson-routing split | `agy-office/skills/agy-closeout/SKILL.md` + `agy-office/references/closeout.md` |
| Agy: composing-with-other-skills paragraph (incl. "`agy` skill is not a competing orchestrator") | `agy-office/SKILL.md` (Composing with other skills) |
| Agy: Red Flags table (24 rows) | `agy-office/SKILL.md` (the "Red Flags" table) |

### Unaccounted

None. Every rule traced from the three pre-restructure hubs resolves to a specific file in
the current layout, either verbatim, narrowed into a spoke, or lifted into
`office-core/protocol/`. Two things came up during the trace that are not omissions but are
worth recording so they don't get mistaken for one later:

- **A Phase 2b count mismatch, found and fixed.** The pre-restructure `agy-office/SKILL.md`
  called Phase 2b "seven checks" in one place, "the six-check verification pass" in its
  routing table, and listed 7 in the body. `agy-office/references/verification.md` carried
  the same slip, telling the reader to "run all six" above a list of 7. That one mattered,
  because a planner who counts 6 and stops skips check 7, the vacuous-test check. The
  reference now says "run all seven", and hub, spoke, and reference agree.
- **`closeout.md` was a core invariant living outside core, now fixed.**
  `auto-office/references/closeout.md` and `agy-office/references/closeout.md` were
  effectively identical, kept in sync by hand across 2 plugins. Core `1.1.0` promotes the
  procedure to `office-core/protocol/closeout.md`, and each office keeps a thin adapter for
  its own additions. See the closeout subject area above.

---

## Retired

Nothing was retired in this pass. Every dated anecdote found in the pre-restructure hubs
(the 2026-07-28 through 2026-08-01 observations about `--resume --bg` forking, the
name-parsing plan defect, the stale-constant derivation defect, the vacuous-test example,
the four-task agy dispatch ceiling, etc.) is still live routing behavior in the
post-restructure files, each one is cited above as the **Source** for a rule that is still
enforced today, not archived as history. If a future run supersedes one of these with a
newer, more general principle, that anecdote moves here with its date and a one-line reason
it no longer drives behavior.

### Retired in `4.0.0`

| What | Why |
|---|---|
| `claude-office` as a standalone plugin | Absorbed into `auto-office`. Its reviewer gates every route, so it could not depend on a separate install. `claude-planning` was dropped outright — `auto-planning` owns the planner role and `claude-planning` scored lowest of any office skill (58 over 5 runs). |
| "Record an event per `run-event.schema.json` at each dispatch" | Read and ignored for three weeks. Replaced by `eval/hooks/`. |
| "Do not call `agy models` dynamically; it hangs" | Measured: it returns in well under a second. |
| `docs/plans/` | Both plans shipped. |
| `runs/` | One orphan retro; its durable lessons now live in `auto-office/references/red-flags.md`. |
