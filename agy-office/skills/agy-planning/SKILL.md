---
name: agy-planning
description: Interview to 95% clarity, pin interfaces, write the plan, route tasks, get approval. Loaded by the agy-office hub; not invoked directly.
---

# Agy Planning

Loaded by: planner, at Phase 1.
Assumes: the Office Kernel is already in the packet.

Narrows [`office-core/protocol/plan-contract.md`](../../office-core/protocol/plan-contract.md) — the
shared floor every office's plan meets. This file adds what's specific to briefing a headless,
unsandboxed CLI executor that fills gaps by inventing rather than asking.

## Issue tracking (default, automatic)

Before exploring or interviewing, run `gh issue create` in the target repo with a minimal
title/body drawn from the raw request (e.g. "Track: <request summary>"). This exists so a
tracking issue is open from the very start even if the run stalls or ships incomplete — and with
a quota-limited executor, stalling is a live possibility. No user approval needed — file it and
move on. Once the interview settles into an approved plan, `gh issue edit <n>` to replace the body
with the plan summary (or a link to the plan file). At closeout, reference it with `Closes #N` in
the PR body so it closes automatically on merge; if the gate stays red or the run stops short,
leave the issue open as the record of what's unresolved.

## Interview until 95% clear

Clear enough that a stranger with no access to this conversation could build the right thing from
the plan alone. That standard is literal here: `agy` *is* that stranger, in a separate process,
with no way to ask you a follow-up mid-run, and it fills gaps by inventing rather than asking. Ask
in batches (AskUserQuestion for choices), covering: outcome, scope edges, existing surface (read
files, don't guess), constraints (env, data source of truth, framework, protected paths),
verification command, and named unknowns. Stop asking once remaining unknowns wouldn't change the
implementation.

## Explorer dispatch

**Dispatch explorer subagents** for anything that means sweeping files/directories/conventions —
don't spend the user's turns on questions a read would settle. Default to `haiku`; step to
`sonnet` only when reconciling conflicting patterns needs judgment, not retrieval. **Never dispatch
an `opus` explorer.** Run independent explorers in parallel, `subagent_type: "Explore"`, ask for a
specific answer with file:line citations.

## Pin every interface the plan touches, verbatim, during Phase 1

For each hook, callback, event, SDK method, or endpoint in scope, have an explorer return the real
signature with its file:line, and put it in Global Constraints as literal text. This costs one
explorer and closes this executor's worst failure mode at the source.

**This is necessary but not sufficient.** The executor has invented a signature that was stated
correctly in its prompt — which is why the brief also demands a citation (see
[executor-brief.md](../../references/executor-brief.md)) and Phase 2b checks it
([verification.md](../../references/verification.md)).

## The plan's required sections

**Write the plan to a file** (`docs/plans/<slug>.md`, or scratchpad) — the executor's contract:

1. **Context** — why this work exists.
2. **Global Constraints** — verbatim binding requirements: exact values, formats, **pinned
   interface signatures with file:line**, protected paths, env target, validation commands. Copied
   verbatim into the agy prompt and to the Reviewer later.

   Include a **blast-radius ceiling** here, always, as its own named block: which environments,
   credentials, remotes, external services and irreversible operations this run may and may not
   touch. It is declared once and restated verbatim in every downstream brief — ceilings narrow
   going down and no agent may widen its own. State exclusions explicitly; an unstated exclusion is
   one a helpful agent will "finish" for you, and this one has front-run *unasked* work. **With
   permissions skipped there is little mechanism behind the prose, so write it as if nothing else
   will stop the run.** Where a real mechanism exists, use it too: a dedicated worktree, credentials
   absent from the environment, `--sandbox` when the task needs no terminal access. Full rules in
   [references/escalation.md](../../references/escalation.md).
3. **Numbered tasks** — files touched, exact behavior, verification, and a **strategy tag**:

   | Strategy | When | Model |
   |---|---|---|
   | **INLINE** | Trivial, deterministic, 1–3 files | You edit it; no dispatch, no verification pass |
   | **FLASH** | Codemods, renames, boilerplate, doc/config churn — formulaic and trivially checkable | `gemini-3.6-flash-high` |
   | **PRO** | Default — well-briefed features, mid-size changes with a detailed spec, test writing | `gemini-3.6-flash-high` |
   | **ELSEWHERE** | Hard debugging, architectural work, subtle correctness, security-sensitive surface | Recommend `claude-office` for that task — see [routing.md](../../references/routing.md) |
   | **PLANNER-HELD** | Irreversible production writes, anything awaiting a human go-ahead, anything outside the ceiling | Never in an agy brief; named as excluded |

   Tag every task (`Strategy: PRO`), justify anything off-default in ≤8 words. **Both tiers resolve
   to `gemini-3.6-flash-high` — the configured default for this office (operator default, 2026-08-01).** The tag
   still matters: it records how much the task is trusted to be checkable, which drives how hard
   Phase 2b looks at it.

   **The Flash family is where the invented-signature and narrow-guard failures were observed. That
   is an argument for the guardrails, not for a different model.** Running the default safely means
   the pinned-signature block, the citation table, the mutation-verification table and Phase 2b are
   all non-negotiable — never treat any of them as optional because the task looked small. **Always
   pass `--model` explicitly**; omitting it silently gets you whatever agy's own default is, which
   is not necessarily this one.

   The table picks a task's **model**. It does not decide whether that task gets its own dispatch —
   **you** do. **The default is one `agy` dispatch for the whole plan.** Read
   [routing.md](../../references/routing.md) and apply its test: *a second dispatch must buy tier,
   isolation, or parallelism; if it buys none of the three, keep it in the single run.* Each extra
   dispatch also costs its own verification pass and its own slice of a quota that can die mid-run.
   Balance that against what INLINE costs: anything you implement yourself, you also planned, so
   the Phase 3 reviewer is the only independent eye on it — **never INLINE the task carrying the
   plan's main correctness or security risk.**
4. **Dependency graph** — each task declares `Depends on:` and `Touches:`; group into waves (a
   `dot` digraph + wave table). agy works the waves in order inside one run. Two tasks share a wave
   only if neither depends on the other **and** their `Touches:` sets are disjoint. **Parallel
   dispatches require separate worktrees** — one tree, one agy process, always.

   **A task that deploys, applies, publishes or migrates derives its scope from the diff, not from
   the feature that motivated it.** Write it as *"apply every artifact whose committed source this
   branch changed"* and give it a self-check that fails loudly — a dry-run reporting pending changes
   on any target means the task is not done. Most such tasks are `PLANNER-HELD` here anyway: an
   executor whose exit code proves nothing has no business writing to a live system.
5. **Out of scope** — explicit.

This narrows the shared floor in
[`office-core/protocol/plan-contract.md`](../../office-core/protocol/plan-contract.md) — every
claims-discipline rule there (existence is not provenance, an explorer's example is not an
observation, derivation inherits correctness rather than creating it) applies unchanged; this file
adds the pinned-signature requirement and the strategy table on top.

## Present the plan

Summarize routing (`Routing: 1 agy dispatch (Pro High) · 3 INLINE · 1 planner-held`), the
**dispatch count**, and waves (`Waves: 3 — critical path 1→3→5`) when presenting the plan. Add a
one-clause reason per extra dispatch naming what it buys. If a task landed in `ELSEWHERE`, say so
out loud and recommend the split to `claude-office` — see
[routing.md](../../references/routing.md) — rather than routing it through the wrong office to
stay inside the skill the user invoked.

**Get explicit approval** — "looks good"/"go"/"approved". Silence is not approval. Do not dispatch
off an unapproved plan.

## Links

- [`../../references/routing.md`](../../references/routing.md) — how many dispatches, model tiers,
  the 3-task ceiling, planner-held tasks.
- [`../../references/escalation.md`](../../references/escalation.md) — who owns a decision, the
  blast-radius ceiling.
- [`office-core/protocol/plan-contract.md`](../../office-core/protocol/plan-contract.md) — the
  shared floor this spoke narrows.
