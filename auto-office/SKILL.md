---
name: auto-office
description: Use ONLY when explicitly invoked via /auto-office; never self-triggered by task shape. Router office — a fit test picks the gear, then ONE codex / agy / claude executor per repo runs the approved plan end to end.
---

# Auto Office

The office chooser. The executor's **brand** is selected; its **tier is fixed**. One
plan approval, then the run goes to the end — bootstrapping a draft PR, recording each milestone,
and landing once at final closeout — without asking again.

```
Planner ─▶ Plan-reviewer ─▶ retires │ Planner ─▶ ONE Executor per repo ─▶ Workers
(plans, self-reviews,  full gear only│ (whole plan, end to end; it fans out,
  gates, lands the deploy)            │ it bootstraps draft PR, commits, posts the two executor-event comments)
```

| Role | Who | Job | Never does |
|---|---|---|---|
| **Planner** | The current agent (you) | Interview → plan + GOAL → approval; **dispatch ONE executor per repo**; hold the review gate; answer consults; perform user-facing and irreversible actions | **Dispatch a per-task worker**; approve work, its own included |
| **Plan-reviewer** | Fresh, planner's brand, Opus **low**. **Full gear only** | One adversarial pass before approval, then **retires** | Distribute work; return; hold a later gate |
| **Executor** | **One per repo**, brand per plan, **sonnet-tier high always** | **Execute the WHOLE plan end to end** — bootstrap plan-only first commit, named-branch push, one draft PR and resume comments; then every task in dependency order; **self-review every task and the whole diff**; write `EXECUTOR-STATE.md` | Approve its own work; mark ready, remove the plan, merge, exceed the ceiling; amend a user-approved field |
| **Worker** | Per task; **any** brand/model/effort the plan declares | One task; Tester follows the core worker contract | Widen scope; be promoted mid-run |
| **Reviewer (code)** | Fresh `opus` **low** (`codex-luna` xhigh/high when Codex *plans*) | Adversarial gate every round | Fix what it gates |

**Core principle: no one gates their own work, and inline work is still reviewed.** Self-review is
mandatory for **every** role and is a *pass*, never an approval
([evidence-and-handoff.md](office-core/protocol/evidence-and-handoff.md)).

**Second principle: the planner designs the dispatch; ONE executor performs the whole plan per
repo.** No PM; ≥2 repos means ≥2 executors. Planner-implements stays legal for **a fix whose brief
would exceed the edit** — never volume, never "the chain is linear."

## Invocation gate and caller overrides

Runs **only on an explicit `/auto-office`** or this skill named — never because a task "looks
routable." A dispatched subagent reading this file is not the planner: follow your brief. A non-Claude
planner is invoked with `/auto-office` **plus this plugin directory's absolute path**
([delegation-map.md](references/delegation-map.md)).

Anything after `/auto-office` overrides discernment and is echoed in the kickoff line: `use codex`,
`express`, `full`, `no loop`, `skip cleanup`, `plan approved: <path>`. A caller override is the
**only** thing that may change a default, executor tier included — and none may skip independent
review, let an executor review itself, drop a floor, remove a phase, or widen blast radius.

## Fit test — first, and it picks a gear

Before interviewing or planning, price the run. **Probe CLI headroom now, and again immediately
before every executor/reviewer dispatch** — one cheap, tier-aware call per brand, never skipped
([quota-probe.md](references/quota-probe.md)):

```bash
python3 auto-office/scripts/codex-usage.py
python3 auto-office/scripts/claude-usage.py
python3 auto-office/scripts/agy-usage.py
```

Ask: (1) irreversible, production-facing, or externally visible? (2) real volume or parallel
breadth? (3) needs an interview? (4) would an adversarial reader plausibly catch something?

| Answers | Gear | What runs |
|---|---|---|
| Any yes to **(1)** | **full** | Everything below. One-way door — never downgraded. |
| No to (1), **2+** across (2)–(4) | **express** | Short plan → bootstrap → implement → Opus review → closeout. **Cap 2 rounds**; 2nd `CHANGES REQUIRED` requires planner disposition, then full only if continuing. |
| No to (1), **≤1** yes | **direct** | No office. Work under the normal safety rules, then stop. |

**Express promotes to full before dispatch** if the run needs >1 executor, >1 repo, or more than ~3
tasks — size makes one review round defensible. Drops **phases, never floors**: rules under
*Non-bypassable safety rules* still bind.

**State the gear and why in two or three sentences, then proceed** — discernment, not a new gate.
Never downgrade for quota; that is a routing problem. Full rule:
`office-core/protocol/roles-and-authority.md` → *Fit test*.

## Routing, in one screen

Brand by fit — **codex** backend/data/infra/long-horizon (preferred default), **agy** frontend,
recon, bulk breadth, **claude** cross-cutting ambiguity. Rubric:
[auto-routing](skills/auto-routing/SKILL.md).

**Dispatch form is derived, not priced** — with `HERDR_ENV=1`, real children use [Herdr](office-core/skills/herdr/SKILL.md)
(right, then below), never in-session; otherwise existing CLI/in-session/inline forms apply. The
planner states why; the executor performs it.

**Ownership once approved — the planner keeps only what the *user* must see, the gate, and
*irreversible outward* actions.** Everything else is the executor's: every task, preview/staging
writes, live reads, fixes, commits, its branch, the draft PR, and the two executor event comments. **Five fields it may
never amend** — `goal`, `done_criteria`, `blast_radius`, `named_actions`, `non_goals`; it amends the
*how* freely, reporting hash + rationale. [auto-loop](skills/auto-loop/SKILL.md) → *Ownership*.

**Headroom is ALWAYS probed during fit-test**; then weigh it, never gate on a number. UNKNOWN means
unavailable. Agy: **3 consecutive tasks**, hard cap.

**Live-system work is delegated WITH its access** — MCP/API tools enumerated in the launch,
production reads included, shape pinned in the brief, read-back required.

**Model and effort are fixed by role**; `xhigh`/`ultra`/`max` and model substitutions are **user-invoked only**.

## Non-bypassable safety rules

- One executor per repo; one implementation writer per tree, except one Tester with disjoint
  test/config paths and locked commits. A planner inline write never overlaps a live executor.
- With `HERDR_ENV=1`, read [`herdr`](office-core/skills/herdr/SKILL.md): delegated agents use visible
  panes (right, then below), never in-session; otherwise existing CLI/in-session routing remains.
- **The planner dispatches the executor, code reviewer, and Phase 1 read-only scouts.** After
  bootstrap, the Executor may dispatch task workers and Tester under the core contract. A
  planner-launched numbered-task worker is a protocol violation.
- **No self-approval, ever** — not the executor on its diff, not the planner on its inline fix.
- Executor is **sonnet-tier high** always; a worker's tier is the plan's call, never raised mid-run.
- A delegation buys tier, isolation, parallelism, **or price** — and **every inline row states in a
  clause what a delegation would have bought.** File and task count are never the test.
- One final plan approval after all Phase 1 gates and amendments, before dispatch — silence is not
  approval.
- Fresh Opus code reviewer; resume vs. fresh per round is a cost call, not a default (see
  `review-states.md`). **`CHANGES REQUIRED`** sends the planner to a disposition checkpoint; no
  approval without pasted evidence; **5-round cap** (2 in express).
- `PLAN DEFECT` and `BRIEF DEFECT` exit the loop without consuming a round; two `CHANGES REQUIRED`
  findings on one task force a planner reflection and recommendation, not an automatic re-plan.
- A successful exit is **not evidence** — the gate is the plan's validation commands with real
  output; live-system writes need a read-back.
- Planner-held actions are **the planner's to perform**, never delegated. They stop the run only when
  the plan did not **name them verbatim** with preconditions (dry run, revert target, read-back). The
  loop never widens blast radius or adds a repo/environment.

Implements office-core `9.0.0`, vendored at `office-core/`. Mandatory read:
`office-core/protocol/roles-and-authority.md`.

## The autonomous run

After plan approval this is **end-to-end**. No go-aheads; report progress and keep moving. Caps and
stops: [auto-loop](skills/auto-loop/SKILL.md).

```
self-review → plan-review (full) → approve → GOAL locked
  per task:      dispatch → verify → Opus review → fix → APPROVED
  before tasks:  plan-only commit → push → draft PR → bootstrap comment
  first executor ends: completion gate → executor-completion comment → keep going
  at the end:    remove plan → ready PR → merge → sync, close loops, report
```

**The run records work as it goes.** A milestone is a group of done-criteria declared at approval;
when they go green the loop commits and updates local run state, then continues. **The branch, plan,
run state, and three allowed PR comments are the resume record until final closeout**, when the planner
posts the final approval summary, removes the plan, marks the PR ready, and merges it.

It stops for two things: an **external send**, and a **user-owned decision the plan did not
anticipate** (`AskUserQuestion`, recommendation first). Everything else — production applies and
merges the plan named included — it executes.

## Routing table

**On entering any phase, and after any compaction, re-read this hub and the phase's spoke before
acting.** This binds whoever holds the phase — the same agent across a boundary as much as a fresh
one. Protocol amnesia past Phase 2 is the observed failure; a re-read is the cheapest fix for it.

| Phase / need | Load |
|---|---|
| Phase 1 — interview, plan + GOAL + milestones + named actions, self-review, approval (**full** adds plan-review) | [auto-planning](skills/auto-planning/SKILL.md) |
| Phase 1 — brand per unit of work, dispatch form, model+effort | [auto-routing](skills/auto-routing/SKILL.md) |
| Routing — the local ledger, read **before** the benchmarks | [routing-outcomes.md](references/routing-outcomes.md) · [model-benchmarks.md](references/model-benchmarks.md) |
| Phase 2+ — goal loop, milestone landing, caps, stops, drift checks | [auto-loop](skills/auto-loop/SKILL.md) |
| Every dispatch — sibling spoke to load, forced-invocation path | [delegation-map.md](references/delegation-map.md) |
| Milestone landing and final closeout (unless `skip cleanup`) | [auto-closeout](skills/auto-closeout/SKILL.md) |
| Headroom, probed at fit-test and before every dispatch | [quota-probe.md](references/quota-probe.md) |
| Doubt about core — the plan/evidence/verdict floor | `office-core/protocol/*` |

auto-office owns **routing, the loop, and the claude route**; codex and agy mechanics load from the
sibling office. Where two rules bind the **same** gate the stricter wins; a sibling's *role*
narrowing is never imported.

## Telemetry and maintenance

**The harness records it; you do not.** `eval/hooks/session-end.mjs` reads the transcript and emits
run events; `eval/hooks/pre-compact.mjs` preserves run state across a compaction; the `Stop` hook
prints the `compact:` recommendation at every lull. Install with `node eval/hooks/install.mjs`.
Nothing in a run emits, counts, or remembers an event.

Bump `plugin.json` `version` to match the new `CHANGELOG.md` heading, re-vendor core if changed, run
`check-plugins.sh` from the **office-skills root**.

**Docs compile, they do not accrete.** An essay that adds tokens without changing a decision is a
defect in the document. Procedure and log: [routing-outcomes.md](references/routing-outcomes.md) →
*Weekly compaction*. A shared invariant is a core change proposal, never a local edit.

## Red flags

**Rationalisations this office produces, with what was true instead:**
[red-flags.md](references/red-flags.md). Reach for it when you catch yourself about to
self-invoke, do a task inline, reclaim a task from the executor, keep a live-system tool,
skip a review round, stop the loop for something the plan already named, or hold a PR
to the end.
