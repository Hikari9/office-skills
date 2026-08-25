---
name: agy-office
description: Use ONLY when explicitly invoked via /agy-office, for irreversible or production-facing work. Five-phase office — planner interviews to 95% clarity, the agy CLI executes, planner independently verifies, fresh Opus reviewer adversarially gates, planner closes loop. Never self-triggered.
---

# Agy Office

Same discipline as `claude-office`, with the `agy` CLI (Antigravity/Gemini) as Executor.
**Plan → Execute → Verify (2b) → Review → Closeout.**

| Role | Who | Model | Job |
|---|---|---|---|
| **Planner** | The current agent (you) | session's own | Plan → approval; **independently verify**; fix/close out |
| **Executor** | `agy --print`, unsandboxed | `gemini-3.7-flash-high` | Implement ≤3 tasks; commit; write handoff |
| **Reviewer** | One fresh Claude subagent | `opus`, low | Adversarial review each round; holds the gate |

**Core principle:** the planner never implements the plan; the executor never approves its own
work. Each gate is held by whoever did not do the work.

**REQUIRED BACKGROUND:** load the **`agy` skill** before your first dispatch — the living record
of the CLI's sharp edges (flags, workspace, timeout, models, quota). Don't reconstruct it from
memory; append what you learn there.

## Why five phases, not four

Siblings run four. Phase 2b (verification) is mandatory: **(1)** exit 0 means nothing — agy exits
0 having done nothing; **(2)** self-consistently wrong work — it invented a 4-argument filter for
a documented 3-argument action (correct signature in its own prompt), then wrote tests matching
its own invention, so green tests only prove the tests agree with the code; **(3)** the prompt is
the only guardrail — `--dangerously-skip-permissions` removes every approval stop, no sandbox
catches a scope violation. See [`agy-verification`](skills/agy-verification/SKILL.md).

**Quota is a live risk** — agy has died mid-orchestration; a stall after narration lines is the
symptom. Confirm quota before a long plan; keep Claude subagents as fallback.

## Invocation gate and caller overrides

Runs **only** on explicit `/agy-office` invocation, never because a task "looks like office
work." Dispatched reviewer reading this? **You are not the planner** — follow your brief.

Anything after `/agy-office` overrides one default; honor it, echo it, keep the rest:

| Tweak | Example | Effect |
|---|---|---|
| Executor model | `use gemini-3.1-pro-high` | Change `--model` |
| Reviewer model | `reviewer: sonnet` | Change reviewer model |
| Skip a phase | `plan already approved: <path>` | Start at Phase 2 |
| No closeout | `skip cleanup` | Stop after approval |
| Extra gates | `reviewer must check a11y` | Add to rubric |

**Only a caller tweak may change a default. Phase 2b is structural, not a default.** No caller may
skip it, downgrade/bypass the reviewer, route review through `agy`, remove a phase, or widen the
blast-radius ceiling implicitly.

## Fit test — first, before anything, and it picks a gear

Before interviewing or planning, price the run. Ask: (1) irreversible, production-facing, or
externally visible? (2) real volume or parallel breadth? (3) needs an interview? (4) would an
adversarial reader plausibly catch something?

| Answers | Gear | What runs |
|---|---|---|
| Any yes to **(1)** | **full** | All five phases. One-way door — never downgraded. |
| No to (1), **2+** yeses across (2)–(4) | **express** | Short plan → execute → **Phase 2b** → **one** Claude review → land it. **Cap 2 review rounds**; a second `CHANGES REQUIRED` promotes the run to full. |
| No to (1), **≤1** yes | **direct** | No office. Do the work under the normal safety rules, then stop. |

**Phase 2b survives express.** It is not a review phase, it is the reason an agy executor's report is
believable at all — exit 0 here means nothing. Express drops **phases, never floors**, and 2b is a
floor. Never downgrade because agy quota is short either: that is a routing problem, and the answer
is a fallback executor, not less review. Say the gear in two or three sentences and proceed. Full
rule: `office-core/protocol/roles-and-authority.md` → *Fit test*.

## Non-bypassable safety rules

- Explicit `/agy-office` only, never self-triggered; load the `agy` skill first.
- Planner never implements the plan; executor never approves its own work.
- Phase 2b never skipped, not review — a clean pass ≠ a lighter Phase 3.
- Exit 0 means nothing; green tests only prove tests agree with the implementation.
- `--print` last or prompt is swallowed; always pass `--model`; raise `--print-timeout`.
- Every touched interface pinned verbatim, `file:line`; executor cites real signatures.
- One tree, one agy process; run in an isolated git worktree (`.worktrees/<branch>` or `worktrees/<branch>`), never directly in the primary repo checkout.
- Commit boundary: no push/PR/deploy/remote-config/message/credentials unless authorized. Those are
  the **planner's** to perform, and they run without a fresh go-ahead only when the plan's
  `named_actions:` names them verbatim with a dry run, a revert target, and a read-back.
- Land each milestone as its criteria go green — commit in worktree, open PR, merge to main — not one giant untracked patch at the end.
- Dispatch live-system work **with** its access: MCP/API tools named in the launch, production
  **reads** included, data shape pinned in the brief, read-back required.
- Reviewer always a Claude subagent, never `agy`; escalate out of the tool, not to it.
- Irreversible work is `PLANNER-HELD`; explicit approval before dispatch, silence isn't approval.
- Verdicts are `APPROVED`, `CHANGES REQUIRED`, `PLAN DEFECT`; 5-round cap; never self-approve.
- A task needing Claude-level reasoning is recommended to `claude-office` out loud, never forced
  through `agy` to stay inside the invoked skill.

## Protocol version

Implements office-core **`2.0.0`**, vendored at `office-core/` here. Mandatory read:
[`roles-and-authority.md`](office-core/protocol/roles-and-authority.md) — vendored copy
authoritative once installed; repo-root `office-core/` is the dev source. Exception:
`agy-phase-2b` (`COMPATIBILITY.md`).

**Declared narrowing of core.** Core `2.0.0` lets the planner implement inline; this office
does **not** — the planner never implements the plan here. Narrowing is legal, and it is stated so a
reader of both files need not guess which governs.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.


No role reads the whole corpus — each gets the Office Kernel plus the spokes below.

| Phase / need | Load | When |
|---|---|---|
| CLI mechanics | **`agy` skill** | Before first dispatch |
| Plan authoring | [`agy-planning`](skills/agy-planning/SKILL.md) | Phase 1 |
| Launch/recover agy | [`agy-cli`](skills/agy-cli/SKILL.md) | Before dispatch |
| Executor packet | [`agy-executor`](skills/agy-executor/SKILL.md) | Phase 2 |
| Independent verification | [`agy-verification`](skills/agy-verification/SKILL.md) | Phase 2b, mandatory |
| Adversarial review + fix loop | [`agy-reviewer`](skills/agy-reviewer/SKILL.md) | Phase 3 |
| Commit/PR/sync/close loops | [`agy-closeout`](skills/agy-closeout/SKILL.md) | Phase 4 |
| Dispatch sizing | [`routing.md`](references/routing.md) | Sizing a dispatch |
| Decision ownership, blast radius | [`escalation.md`](references/escalation.md) | Upline entry |
| Core protocol floors | [plan](office-core/protocol/plan-contract.md) · [evidence](office-core/protocol/evidence-and-handoff.md) · [review](office-core/protocol/review-states.md) | As needed |

## The Five Phases

One todo per phase; close each with `compact: yes|no — why` (core evidence floor).

**Phase 1 — Plan (Planner).** File tracking issue, interview to 95%, pre-create the isolated
git worktree (`.worktrees/<slug>`), pin every touched interface verbatim, write the plan (Context /
Global Constraints incl. blast-radius ceiling / tagged tasks / waves / out of scope), declare routing,
get approval. → [`agy-planning`](skills/agy-planning/SKILL.md).

**Phase 2 — Execute (Executor).** Record `BASE`, build the packet for the worktree, launch per
[`agy-cli`](skills/agy-cli/SKILL.md), never edit the tree it writes to, handle its
`## Upline`. → [`agy-executor`](skills/agy-executor/SKILL.md).

**Phase 2b — Verify (Planner), mandatory.** Run all seven checks in the worktree; fix and re-verify any confirmed
defect before dispatching the reviewer. **Not review** — no spec judgement, no approving. →
[`agy-verification`](skills/agy-verification/SKILL.md).

**Phase 3 — Review (Reviewer).** Dispatch a fresh Claude subagent with the plan, Global
Constraints, handoff, diff, your Phase 2b evidence; triage/fix; re-run Phase 2b + the gate each
round; cap 5. → [`agy-reviewer`](skills/agy-reviewer/SKILL.md).

**Phase 4 — Closeout (Planner).** Commit in worktree, verify gate, push branch, open PR (`gh pr create`),
merge to main (`gh pr merge --auto --squash` or standard merge), sync local `main`, remove the worktree,
close every open Upline entry, report in ≤6 lines. → [`agy-closeout`](skills/agy-closeout/SKILL.md).

## Composing with other skills

Owns **orchestration shape** only. Domain skills stack freely — fold their rules into Global
Constraints, which outrank this skill's silence; user instructions outrank both. **The `agy`
skill is not a competing orchestrator** — this office's CLI reference. One controller/run.

## Run telemetry

Record one event per
[`run-event.schema.json`](office-core/schemas/run-event.schema.json) per explicit dispatch: agy
launch id, model, workspace/worktree id, base commit, selected spokes, quota/stall events, Phase
2b results, reviewer round. A transcript keyword match is a catalog mention, never an invocation.

## Maintenance and release

Bump `version`, add a `CHANGELOG.md` entry, re-vendor core, run `scripts/check-plugins.sh` if core
changed. CLI behavior → the `agy` skill; executor failure classes →
[`executor-brief.md`](references/executor-brief.md) + a check in
[`agy-verification`](skills/agy-verification/SKILL.md); routing →
[`routing.md`](references/routing.md); invariants → propose a core change, never edit
`office-core/` locally. Sharpen a principle, don't append a scenario.

## Red Flags — stop and correct

| Thought | Reality |
|---|---|
| "Clear enough, skip the interview" | agy fills gaps by inventing, not asking. |
| "I'll implement it myself" | The planner does not implement the plan. |
| "Flags after `--print`" | Swallows the prompt. Greeting + exit 0. |
| "Default model is fine" | Default is Flash — where invented signatures were observed. |
| "Exit 0, so it's done" | agy exits 0 having done nothing. Phase 2b, every time. |
| "Tests are green" | Tests agree with the implementation, nothing more. |
| "Phase 2b clean, reviewer can be light" | Clean means real, not right. |
| "Have agy review its own diff" | Same family, same blind spots — always a Claude reviewer. |
