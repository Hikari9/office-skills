---
name: auto-office
description: Use ONLY when explicitly invoked via /auto-office. Router office — a fit test picks the gear (direct / express / full), the current agent plans and interviews to clarity, then hands the whole plan to ONE codex / agy / claude executor per repo which runs it end to end and fans out its own workers. Goal-locked with no further go-aheads, landing a PR at every milestone. Opus gates the code. Never self-triggered.
---

# Auto Office

The office that chooses the office. The executor's **brand** is selected; its **tier is fixed**. One
plan approval, then the run goes to the end — landing each milestone as it goes — without asking again.

```
Planner ─▶ Plan-reviewer ─▶ retires │ Planner ─▶ ONE Executor per repo ─▶ Workers
(plans, self-reviews,  full gear only│ (whole plan, end to end; it fans out,
 gates, lands the deploy)            │  it commits, it pushes, it opens the PR)
```

| Role | Who | Job | Never does |
|---|---|---|---|
| **Planner** | The current agent (you) | Interview → plan + GOAL → approval; **dispatch ONE executor per repo**; hold the review gate; answer consults; perform user-facing and irreversible actions | **Dispatch a per-task worker**; approve work, its own included |
| **Plan-reviewer** | Fresh, planner's brand, Opus **low**. **Full gear only** | One adversarial pass before approval, then **retires** | Distribute work; return; hold a later gate |
| **Executor** | **One per repo**, brand per plan, **sonnet-tier high always** | **Execute the WHOLE plan end to end** — every task in dependency order, fanning out its own workers per the plan's dispatch column; **self-review every task and the whole diff**; commit, push, open the PR; write `EXECUTOR-STATE.md` | Approve its own work; exceed the ceiling; amend a user-approved field |
| **Worker** | Per task; **any** brand/model/effort the plan declares | One task, never a second writer | Widen scope; be promoted mid-run |
| **Reviewer (code)** | Fresh `opus` **low** (`codex-luna` high when Codex *plans*) | Adversarial gate every round | Fix what it gates |

**Core principle: no one gates their own work, and inline work is still reviewed.** The executor's
mandatory self-review is a *pass*, never an approval — it precedes the gate and never stands in for it.

**Second principle: the executor executes the plan; the planner does not execute it task by task.**
The planner *designs* the dispatch — the assignment table stays the planner's — then hands the whole
plan to **one** executor that performs every dispatch in it. Per-task dispatching pays opus rates to
re-derive a plan opus already wrote and had reviewed, plus a round-trip each time, while a sonnet
executor is near-parity at ~⅙ the price **and already holds that plan**. Nine dispatches for nine
tasks means the office is an expensive scheduler. **No PM** (removed 3.0.0); ≥2 repos means ≥2
executors, coordinated between, never inside one. Core §35 still permits planner-implements, but its
live range is narrow — **a fix whose brief would exceed the edit**; never volume, never "the chain is
linear anyway."

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

Before interviewing or planning, price the run. Ask: (1) irreversible, production-facing, or
externally visible? (2) real volume or parallel breadth? (3) needs an interview? (4) would an
adversarial reader plausibly catch something?

| Answers | Gear | What runs |
|---|---|---|
| Any yes to **(1)** | **full** | Everything below. One-way door — never downgraded. |
| No to (1), **2+** across (2)–(4) | **express** | Short plan → implement → **one** Opus review → land it. No plan-review, quota probe, benchmark read, run report, or ledger row. **Cap 2 rounds**; a 2nd `CHANGES REQUIRED` **promotes to full**. |
| No to (1), **≤1** yes | **direct** | No office. Work under the normal safety rules, then stop. |

**Express promotes to full before dispatch** if the run needs >1 executor, >1 repo, or more than ~3
tasks — size is what makes one review round defensible. It drops **phases, never floors**: every rule
under *Non-bypassable safety rules* below still binds.

**State the gear and why in two or three sentences, then proceed** — a discernment step, not a new
approval gate. Never downgrade for quota; that is a routing problem. A caller may name a gear, but
none may name express for a run that answered yes to (1). Full rule:
`office-core/protocol/roles-and-authority.md` → *Fit test*.

## Routing, in one screen

Brand by fit — **codex** backend/data/infra/long-horizon (preferred default), **agy** frontend,
recon, bulk breadth, **claude** cross-cutting ambiguity. Rubric:
[auto-routing](skills/auto-routing/SKILL.md).

**Dispatch form is derived, not priced** — planner → **executor** via CLI (its only fan-out in an
approved run); executor → workers in-session, or CLI for a different brand; inline when a brief takes
more thought than the change. **The planner plans every task's dispatch form and must say why; the
executor performs it.** Near-ties: same tier, both fit, pick one.

**Ownership once approved — the planner keeps only what the *user* must see, the *anti-self-gating*
gate, and *irreversible outward* actions.** Everything else is the executor's: every task, all
preview/staging writes and live reads, fixes, commits, pushing its branch, the PR, non-deploying
merges. **Five fields it may never amend** — `goal`, `done_criteria`, `blast_radius`,
`named_actions`, `non_goals`; it amends the *how* freely and reports hash + rationale. Table and
rationale: [auto-loop](skills/auto-loop/SKILL.md) → *Ownership*.

**Headroom is probed on demand, not by ritual** — a long run, a thin brand, or the user asking. Then
weigh it; never gate on a number. UNKNOWN means unavailable. Agy: **3 consecutive tasks**, hard cap.

**Live-system work is delegated WITH its access** — MCP/API tools enumerated in the launch,
production reads included, shape pinned in the brief, read-back required.

**Model and effort are fixed by role**; `xhigh`/`ultra`/`max` and model substitutions are
**user-invoked only**.

## Non-bypassable safety rules

- One executor per repo, one writer per tree, ever. Sub-delegation is not a second writer; a planner
  inline write never overlaps a live executor in that tree.
- **The planner dispatches exactly three kinds of process in an approved run: the executor (one per
  repo), the code reviewer, and — in Phase 1 only — read-only scouts.** A planner-launched worker
  for a numbered task is a protocol violation regardless of how well it goes.
- **No self-approval, ever** — not the executor on its diff, not the planner on its inline fix.
- Executor is **sonnet-tier high** always; a worker's tier is the plan's call, never raised mid-run.
- A delegation buys tier, isolation, parallelism, **or price** — and **every inline row states in a
  clause what a delegation would have bought.** File and task count are never the test.
- Explicit plan approval before dispatch — silence is not approval.
- Fresh Opus code reviewer, resumed across rounds; **`CHANGES REQUIRED`** re-enters the fix loop; no
  approval without pasted evidence; **5-round cap** (2 in express, then promote to full).
- `PLAN DEFECT` and `BRIEF DEFECT` exit the loop without consuming a round; at **2** total (not merely
  consecutive) `CHANGES REQUIRED` on one task, presume `PLAN DEFECT` and re-plan it.
- A successful exit is **not evidence** — the gate is the plan's validation commands with real
  output; live-system writes need a read-back.
- Planner-held actions are **the planner's to perform**, never delegated. They stop the run only when
  the plan did not **name them verbatim** with preconditions (dry run, revert target, read-back). The
  loop never widens blast radius or adds a repo/environment.

Implements office-core `2.0.0`, vendored at `office-core/`. Mandatory read:
`office-core/protocol/roles-and-authority.md`.

## The autonomous run

After plan approval this is **end-to-end**. No go-aheads; report progress and keep moving. Caps and
stops: [auto-loop](skills/auto-loop/SKILL.md).

```
self-review → plan-review (full) → approve → GOAL locked
  per task:      dispatch → verify → Opus review → fix → APPROVED
  per milestone: gate → commit → PR → land it → keep going
  at the end:    sync, close loops, short run report
```

**The run lands work as it goes.** A milestone is a group of done-criteria declared at approval; when
they go green the loop commits, PRs, and merges the chain, then continues. **The merged branch is the
resume record** — an interruption costs one milestone, not the run.

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
| Headroom, **only when you have a reason to probe** | [quota-probe.md](references/quota-probe.md) |
| Doubt about core — the plan/evidence/verdict floor | `office-core/protocol/*` |

auto-office owns **routing and the loop**, never CLI or sub-agent mechanics — every phase loads the
sibling spoke for the chosen brand. Where two rules bind the **same** gate the stricter wins; a
sibling's *role* narrowing is never imported ([delegation-map.md](references/delegation-map.md)).

## Telemetry and maintenance

One event per `office-core/schemas/run-event.schema.json` per explicit dispatch, plus `gear`,
`routing_reason`, `loop_iteration`, `milestone`, `reroute_from` — and `headroom_percent` per window
only when a probe ran. Match on session/worktree identity, never a display label.

Bump `plugin.json` `version` to match the new `CHANGELOG.md` heading, re-vendor core if changed, run
`check-plugins.sh` from the **office-skills root**.

**Docs self-heal: compiled, not appended forever.** Every long-lived `.md` a run reads — this hub
included, and `check-plugins.sh` enforces its byte budget — compiles **weekly, or past ~150 lines /
3,000 words**. **An essay that adds tokens without changing a decision is a defect in the document.**
Procedure, rules, and log: [routing-outcomes.md](references/routing-outcomes.md) → *Weekly
compaction*. A shared invariant is a core change proposal,
never a local edit; editing these skills is Opus-planner-only.

## Red Flags — stop and correct

| Thought | Reality |
|---|---|
| "This is routable, I'll auto-invoke" | Only an explicit `/auto-office` invokes this. |
| "It's only a few files, I'll do it" | You are the priciest writer in the office. Volume is a purchase. Justify the inline row in a clause, or delegate it. |
| "Task 1 is recon, I'll dispatch it myself, then start the executor" | Recon inside an approved plan is **task 1 of the executor's run**. Planner scouts are Phase 1 and read-only; if it writes anything — even a reverted probe — it is the executor's. |
| "The brief isn't writable until task 1 answers X" | The plan names both branches; that is what a branch point *is*. The executor picks by evidence. If the plan doesn't name them, fix the plan. |
| "The memory cap means I must split the tasks myself" | The executor re-briefs *itself* from `EXECUTOR-STATE.md`. Reclaiming tasks is the cap disciplining the wrong role. |
| "The preview apply is a live write, so it's mine" | **Preview/staging writes are delegated**, with the read-back. Only production and irreversible actions are planner-held. |
| "Codex is at 14%, so it's out" / "better probe quota first" | No threshold exists — weigh it and spend it if it's worth it. And probe only with a reason; the ritual probe is gone. |
| "This task is hard, I'll use Opus" | The executor is pinned; a bigger *worker* is legal only if the plan declared it. |
| "I fixed it inline, so it's mine to approve" | Planner-implements did not lift planner-never-approves. Fresh reviewer, every time. |
| "Agy is on task 5 and doing fine" | It forgets past 3. Re-brief or re-route. |
| "The plan's done, I'll ask before executing" | You have approval. The run is end-to-end. |
| "It's a prod apply, so the loop stops" | Only if the plan didn't name it. A named action with preconditions met runs — and *you* perform it. |
| "'Deploy when done' — that's named" | It names nothing. Exact command, target, dry run, revert, read-back. Vague = unauthorized = stop. |
| "I'll PR everything at the end" | Land each milestone. A run with no landed checkpoint has no re-entry point. |
| "This needs MCP, so I'll keep it" | Delegate it *with* the tools enumerated, production reads included. Withholding access is a dispatch bug. |
| "CLI was blocked last time" | A past denial is not evidence about now; the dispatch form is an assignment. Attempt it. |
| "My worker said it'll report back" | That is a *return*. An in-session subagent unwinds once it has no live children. Blocking waits go `--bg`, or you hold them. |
| "Executor says done" / "agy can review agy" | Nobody gates their own work; the **code** gate is a fresh Opus reviewer. |
| "Round 6 will converge" | Past the cap the failure is structural. Report the deadlock. |
| "Express needs a third round" | Two is the cap. A 2nd `CHANGES REQUIRED` promotes to full; it buys no extra round. |
| "The loop can add one more repo" | That widens the blast radius. Not the loop's call. |
