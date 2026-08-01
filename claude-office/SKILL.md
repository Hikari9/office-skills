---
name: claude-office
description: Use ONLY when explicitly invoked via /claude-office, for irreversible or production-facing work. Four-phase office — planner interviews to 95% clarity, Sonnet executor implements, fresh Opus reviewer adversarially gates on build/test evidence, planner closes loop. Never self-triggered.
---

# Claude Office

An office of three roles run from one session:

| Role | Who | Default model | Job |
|---|---|---|---|
| **Planner** | The current agent (you) | whatever the session is | Interview → plan → approval; later, triage and apply review fixes; close out |
| **Executor** | One dispatched subagent | `sonnet`, high effort | Implement the whole approved plan using in-session subagents; review every task itself |
| **Reviewer** | One fresh dispatched subagent | `opus`, medium effort | ONE adversarial final review, then re-review each fix round; holds the approval gate |

**Core principle:** the planner never implements the plan and the executor never approves its own work. Each gate is held by someone who did not do the work being gated.

## Invocation gate

This workflow is for **irreversible or production-facing work** and runs **only** when the user types `/claude-office` (or names the skill directly) — never because a task "looks like it needs an office." A plain feature request, `/brainstorm`, or a code-review ask does not invoke it.

If you are reading this as a dispatched subagent, you are not the planner. Ignore this file and follow the brief you were given.

### Caller tweaks

Anything after `/claude-office` is an override. Honor it, echo it back in the kickoff line, keep every other default.

| Tweak | Example | Effect |
|---|---|---|
| Executor/reviewer model | `/claude-office use opus as executor` | Change that role's `model` |
| Named agent type | `/claude-office executor: general-purpose` | Change `subagent_type` |
| **`--in-session`** | `/claude-office --in-session` | Executor runs as an in-session Agent-tool subagent (old default) instead of a `claude --bg --remote-control` background agent. Reviewer stays in-session. |
| Skip a phase | `/claude-office plan already approved: docs/plans/x.md` | Start at Phase 2 with that plan |
| No closeout | `/claude-office skip cleanup` | Stop after Reviewer approval |
| Extra gates | `/claude-office reviewer must also check a11y` | Append to the reviewer's rubric |

Only a caller tweak may change a default. Never downgrade the reviewer, skip the review phase, or self-approve on your own initiative.

**Default execution mode is `--cli`**: the executor runs as a `claude --bg --remote-control` background agent (see [references/discernment.md](references/discernment.md)) unless the caller passes `--in-session`, which restores an in-session Agent-tool subagent. Reviewer is always in-session regardless of this setting.

**`--resume`/`--bg` against a live `--cli` session still forks instead of steering it in place** (discernment.md's fork gotcha) — never resume a running/blocked agent that way. But a raised question itself is now a cheap reply, not a fork-and-recover cycle, whether it's a numbered menu or an open-ended free-text/custom answer: `claude-office/skills/cli-response/SKILL.md` answers either in place with verified keystroke recipes (digit + Enter for a menu; select-then-type, two separate sends, for free text — never combined in one send). Reserve the fork-and-recover path — or `--in-session` up front — for genuine mid-run steering, not for a raised question of either kind.

**A GitHub tracking issue is filed by default, automatically, no separate approval needed** — see "Issue tracking" under Phase 1.

## Routing table (load the spoke you need)

| Need | Spoke |
|---|---|
| **How many agents to fan out, and why** — justifying or collapsing a delegation, token/cache economics, planner-held tasks, recalibrating from the run | [references/routing.md](references/routing.md) |
| **Upline escalation** — who owns a decision, block-vs-annotate, how it travels up, the reviewer indicting the plan, blast-radius ceilings | [references/escalation.md](references/escalation.md) |
| INLINE-vs-delegate decision, model selection (Opus 5/Sonnet 5/Haiku 4.5), effort tuning, `--bg`/`--remote-control`, stdin prompts, unattended permissions, parallel worktrees | [references/discernment.md](references/discernment.md) |
| Building the executor's prompt | [references/executor-brief.md](references/executor-brief.md) |
| Adversarial review phase mechanics + fix loop | [references/review-gate.md](references/review-gate.md) |
| Building the reviewer's prompt | [references/reviewer-brief.md](references/reviewer-brief.md) |
| Closeout: commit, PR, sync main, close loops | [references/closeout.md](references/closeout.md) |
| Handing this conversation to a fresh session | the `rc-handoff` skill (see [references/handoff.md](references/handoff.md)) |
| Answering a blocked `--bg` agent's raised question without forking it | [skills/cli-response/SKILL.md](skills/cli-response/SKILL.md) |

## The Four Phases

Create one todo per phase at kickoff. Phase 1 (plan + approval) → Phase 2 (execute) → Phase 3 (adversarial review, loops via 3b until approved or the round cap) → Phase 4 (closeout).

### Phase 1 — Plan (Planner)

Announce: `Claude Office — Phase 1: planning. Executor: <model>. Reviewer: <model>.`

**Issue tracking (default, automatic):** before exploring or interviewing, run `gh issue create` in the target repo with a minimal title/body drawn from the raw request (e.g. "Track: <request summary>"). This exists so a tracking issue is open from the very start even if the run stalls or ships incomplete. No user approval needed — file it and move on. Once the interview settles into an approved plan, `gh issue edit <n>` to replace the body with the plan summary (or a link to the plan file). At closeout, reference it with `Closes #N` in the PR body (per [references/closeout.md](references/closeout.md)) so it closes automatically on merge; if the gate stays red or the run stops short, leave the issue open as the record of what's unresolved.

**Interview until 95% clear** — clear enough that a stranger with no access to this conversation could build the right thing from the plan alone. Ask in batches (AskUserQuestion for choices), covering: outcome, scope edges, existing surface (read files, don't guess), constraints (env, data source of truth, framework, protected paths), verification command, and named unknowns. Stop asking once remaining unknowns wouldn't change the implementation.

**Dispatch explorer subagents** for anything that means sweeping files/directories/conventions — don't spend the user's turns on questions a read would settle. Default to `haiku` (fast, cheap, adequate for retrieval); step to `sonnet` only when reconciling conflicting patterns needs judgment, not retrieval. **Never dispatch an `opus` explorer.** Run independent explorers in parallel, `subagent_type: "Explore"`, ask for a specific answer with file:line citations.

**Write the plan to a file** (`docs/plans/<slug>.md`, or scratchpad) — the executor's contract:

1. **Context** — why this work exists.
2. **Global Constraints** — verbatim binding requirements: exact values, formats, protected paths, env target, validation commands. Copied verbatim to the Reviewer later.

   Include a **blast-radius ceiling** here, always, as its own named block: which environments, credentials, remotes, external services and irreversible operations this run may and may not touch. It is declared once and restated verbatim in every downstream brief — ceilings narrow going down and no agent may widen its own. State exclusions explicitly; an unstated exclusion is one a helpful agent will "finish" for you. Back it with mechanism where you can (a scoped `--allowedTools` allowlist, a deny hook) rather than prose alone. Full rules in [references/escalation.md](references/escalation.md).
3. **Numbered tasks** — files touched, exact behavior, verification, and a **strategy + effort tag**:

   | Strategy | When | Effort |
   |---|---|---|
   | **INLINE** | Trivial, deterministic, 1–3 files | n/a |
   | **HAIKU** | Plan text has the complete code, or a single-file mechanical edit/codemod | low |
   | **SONNET** | Default — features, standard debugging, clear-spec refactors, test writing | medium, high if multi-file/integration risk |
   | **OPUS** | Subtle correctness, concurrency, security-sensitive, cross-cutting, multi-file coordination | high, xhigh only for the hardest single task |

   Tag every task (`Strategy: SONNET (medium)`), justify anything above default in ≤8 words. Full model-ID/pricing detail lives in [references/discernment.md](references/discernment.md).

   The table above picks a task's **tier**. It does not decide whether that task deserves its own agent at all — **you** do, and that is the more consequential call. Read [references/routing.md](references/routing.md) before finalizing the tags and apply its test: *a delegation must buy tier, isolation, or parallelism; if it buys none of the three, tag it `INLINE`.* Task count is not a reason to delegate, and a near-linear dependency chain cannot be parallelized however many tasks it holds. Balance it against the one thing collapsing costs: an INLINE task gets no per-task review, so never collapse the task carrying the plan's main correctness or security risk. Tag anything outside the executor's approved blast radius — irreversible production writes, work awaiting a human go-ahead — as `PLANNER-HELD` and say so explicitly in the executor's brief.
4. **Dependency graph** — each task declares `Depends on:` and `Touches:`; group into waves (a `dot` digraph + wave table). Two tasks share a wave only if neither depends on the other **and** their `Touches:` sets are disjoint.

   **A task that deploys, applies, publishes or migrates derives its scope from the diff, not from the feature that motivated it.** Write it as *"apply every artifact whose committed source this branch changed"* and give it a self-check that fails loudly — a dry-run reporting pending changes on any target means the task is not done. Scoping such a task to the artifact you had in mind while planning is how a change gets committed, reviewed, merged and still runs nowhere: the deploy task named one target, a second changed artifact shipped through a different script, and nothing in the plan ever noticed. Enumerate targets mechanically.
5. **Out of scope** — explicit.

**Every factual claim the plan makes about the codebase is a claim you must have checked.** A task that names a field, flag, or helper commits the executor to work on it, and the executor will faithfully build what you named — including tests asserting behaviour that cannot happen. Before specifying work on a field, confirm it is actually *populated*, not merely declared: a field the mapper never sets, or one whose values already flow in through another field, generates dead code and misleading tests that then have to be walked back mid-run.

**Read a field's provenance, not just its existence.** "Where is this written?" and "where does this come from?" are different questions, and the plan's correctness usually rests on the second. Observed 2026-07-30: a plan instructed "the editor's own state wins — treat a present assignment as the user's edit", which is sound only if that collection *is* session state. It wasn't — the normalizer built it from the backend's own membership rows, so the plan routed exactly the legacy data it had elsewhere declared out of scope into a destructive full-replace write. Both Critical findings of that run traced to provenance the plan asserted rather than read. Whenever a task says "prefer X over the fallback", open the mapper and confirm X and the fallback are genuinely distinct sources.

**Two specific things masquerade as checked facts. Both produced a plan defect on 2026-08-01, in the same run.**

- **An example in an explorer's report is not an observation.** An explorer wrote *"section names are literal text (e.g. `Cluster // MNL Adults`)"*. The parenthetical was an illustration it invented; real names were `Cluster // Alex Mitra & Angelika Mitra`. The plan built a name-parsing task on it that would have returned `undefined` for nearly every real record — passing every test while doing nothing. The tell was available and ignored: the UI *already displayed* the value the task was meant to derive, so "where does that come from?" would have exposed the aggregation that was the real source. **When a plan depends on the shape of real data, read real data** — one page of production/preview output beats five explorers.
- **Deriving from a wrong source does not rescue you.** The same plan asserted a map "is derived from the env-switched constant and is therefore correct", and specified a fix built on it. The constant was stale, so every derived map was wrong — and one of them sat on a write path, silently persisting the wrong foreign key. Derivation **inherits** correctness; it never creates it, and it hides the error one hop from where it hurts. Trace to the authority (the live system), not to the nearest thing that looks computed.

Both failures are cheap to prevent and expensive to ship: they are invisible to lint, tests, and the diff, because the code faithfully implements a false premise. Prefer one read of the live system during Phase 1 over a confident inference — and note that this is exactly why the plan must keep a live-verification task that no build can substitute for.

The sharper version of the same rule applies to any **invariant you assert in order to justify a restructuring**. "Safe because every filterable field is covered" must hold *by construction*, not because today's data happens to make it true. An invariant that rests on data shape will be enumerated as verified, pass every test, and then fail on the one record shaped differently — and if the restructuring made that invariant load-bearing, the failure is now user-visible. State how the invariant is guaranteed, not just that it holds; if the honest answer is "transitively, via a first-non-empty fallback", that is not coverage, and the fix is to carry the field explicitly.

Summarize routing (`Routing: 1 INLINE · 3 SONNET(medium) · ...`), the **total agent count** (`Agents: 3 — executor + 2 subagents`), and waves (`Waves: 3 (max 2 parallel) — critical path 1→3→5`) when presenting the plan. Add a one-clause reason per delegation naming what it buys — a delegation you cannot justify in a clause is one to collapse. If the user questions the fan-out, walk the three purchases against the actual dependency graph and give a straight recommendation; don't defend the first draft.

**Get explicit approval** — "looks good"/"go"/"approved". Silence is not approval. Do not dispatch off an unapproved plan.

### Phase 2 — Execute (Executor)

Announce: `Phase 2: dispatching executor (<model>).` Record `BASE=$(git rev-parse HEAD)`.

**One executor per repository.** A multi-repo plan gets one executor per repo (parallel across repos, never within one); each gets its own repo path, branch, BASE, workspace, plan slice, and handoff path. You consolidate every executor's handoff into one picture before Phase 3.

**2A — `--cli` background agent (default):** launched as a `claude --bg --remote-control` background agent per [references/discernment.md](references/discernment.md)'s invocation section. Fill the brief (from [references/executor-brief.md](references/executor-brief.md)) with: repo/worktree path, branch, plan file, workspace path, BASE, validation commands, handoff report path.

**2B — in-session subagent:** only when the caller passed `--in-session`. Same brief, launched via the Agent tool instead:

```
Agent(
  description: "Execute <slug> plan",
  subagent_type: "general-purpose",   // must have the Agent tool
  model: "sonnet",
  run_in_background: false,
  prompt: <built from references/executor-brief.md>
)
```

Everything else (executor-as-task-reviewer, handoff report, Phase 3 review) is unchanged between the two modes.

While the executor runs: do non-conflicting prep only (read signatures, draft the reviewer dispatch) — never edit the tree it's writing to. Read its handoff report; don't ask it to paste the diff into your context.

**Handle its `## Upline` section when it lands.** Answer everything marked `[needs-planner]`. Surface every `[needs-user]` item to the user **batched, with your recommendation attached** — never resolve a user-owned question by inferring what they'd want. Carry the `[decided]` list into the reviewer's packet: those are decisions made under uncertainty and they tell the reviewer where to look hardest. See [references/escalation.md](references/escalation.md).

### Phase 3 — Adversarial Review (Reviewer)

Full mechanics, the fix loop, and the round cap live in **[references/review-gate.md](references/review-gate.md)** — read it before dispatching. In short: dispatch a fresh Opus reviewer built from [references/reviewer-brief.md](references/reviewer-brief.md), hand it the plan, Global Constraints, handoff report, and a diff-package file; it returns `APPROVED` or `CHANGES REQUIRED` with numbered findings and never approves without pasted validation-command output.

**Build evidence comes from the repo's existing gate, not a second build.** If this repo runs `pnpm build` as a `Stop` hook, that hook's captured output *is* the reviewer's build evidence — hand it over rather than having the reviewer (or yourself) re-run the build. Re-deriving a build that already ran pays twice for the same verification. Only fall back to running it yourself/the reviewer if no such hook exists or its output predates `HEAD`.

You triage and apply fixes (INLINE / delegate sonnet / opus / haiku per the matrix in review-gate.md), then send the same reviewer (via SendMessage) the fix diff + fresh gate output. Cap at 5 rounds; past that, report the deadlock rather than self-approving.

**The reviewer has a third verdict: `PLAN DEFECT`** — the diff faithfully implements the plan and the *plan* is what's wrong. That exits the fix loop instead of consuming a round; you amend the plan (if the gap is technical) or route it to the user (if it's a tradeoff, scope, or business call). Never answer it by pressuring the reviewer to downgrade it. Also hand the reviewer anything **written to a live system**: its evidence gate requires a read-back of the deployed artifact, not the writer's exit code.

### Phase 4 — Closeout (Planner)

Announce: `Phase 4: closeout.` Follow **[references/closeout.md](references/closeout.md)** — commit, verify the gate, PR + automerge, document, sync main, remove the worktree, close loops. Skip only if the caller passed `skip cleanup`.

Report the run in ≤6 lines: plan file, executor commits range, review rounds used, gate command + result, what closeout did, anything left open.

**Then make the skill better than you found it.** Every run produces evidence this file cannot have anticipated, and the routing call is where the planner is most often wrong. Spend one pass on it:

- **Routing feedback** — did the executor escalate a tier (under-tagged), serialize a wave you marked parallel (bad `Touches:` analysis), return `NEEDS_CONTEXT` (thin brief, or should have been INLINE), or did a collapsed task draw a reviewer finding (it needed per-task review)? Fold the lesson into [references/routing.md](references/routing.md).
- **Mechanism gotchas** — a flag that didn't behave as documented, a verification command that reports nothing useful, a launch that silently ignored an argument. Those go to [references/discernment.md](references/discernment.md), where the invocation contract lives.
- **Anything else durable** — a constraint that should have been in Global Constraints from the start, a review gate that missed a whole class of defect.

Sharpen an existing principle rather than appending a scenario; a list of past situations doesn't generalize, a principle does. Nothing durable to add is a legitimate outcome — say so and stop. Do not rewrite a rule you merely found inconvenient, and tell the user in one line what you changed.

## Composing with other skills

This skill owns the **orchestration shape** only. Domain/platform skills (Rock, Vercel, WordPress, design, etc.) stack freely — load them and feed their rules into the plan's Global Constraints. Where another skill's instruction is more specific or safer, it wins. Explicit user instructions outrank both. Don't run a second orchestration skill inside this one.

## Red Flags — stop and correct

| Thought | Reality |
|---|---|
| "The request is clear enough, I'll skip the interview" | Phase 1 ends at 95%, not "I could start." Ask. |
| "I'll just implement it myself" | The planner does not implement the plan. That's the gate. |
| "This exploration is important, I'll use opus" | Exploration is search and summarize. Haiku, or sonnet at most. |
| "The executor's report says it's done" | It cannot approve its own work. Phase 3 is not optional. |
| "I'll review it myself instead of spawning Opus" | You're the worst available reviewer for code you've been reading all session. |
| "Fresh reviewer per round is simpler" | It loses what was already settled. SendMessage the same one. |
| "I'll re-run the build to be thorough" | If a Stop hook already produced it, reuse that output — don't pay twice. |
| "Round 6 will converge" | Past the cap the failure is structural. Report the deadlock. |
| "Everything gets OPUS to be safe" | SONNET is the default. Above-default tags need a stated reason. |
| "Seven tasks, so seven subagents" | Count waves, not tasks. Each delegation must buy tier, isolation, or parallelism — or it's `INLINE`. |
| "Collapsing it all into the executor is cheapest" | An INLINE task gets no per-task review. Never collapse the task carrying the main correctness/security risk. |
| "Fanning out these three will be faster" | They share a file and run in sequence — that's one context primed three times, zero parallelism. |
| "The executor's already in there, it can do the deploy" | Irreversible production work is `PLANNER-HELD` and named as excluded in the brief. |
| "The user probably wants X, I'll just decide" | User-owned decisions get stated with a recommendation, never inferred. Check whose fact settles it. |
| "I'll mention the assumption in my summary" | Summaries get compacted. `[decided]` goes in the file, one line. |
| "The reviewer's finding contradicts the plan, so it's wrong" | Plans are hypotheses. That's a `PLAN DEFECT` or a user call — not a dismissal. |
| "The apply script exited 0, so it's deployed" | For anything written to a live system, evidence is a read-back of the artifact. |
| "Two repos, one executor across both" | One executor per repo, in parallel. You consolidate. |
| "This task looks like office work, I'll invoke it" | Only `/claude-office` invokes this. |
| "I'll skip the tracking issue, the plan file is enough" | The issue is the default, automatic, no-approval record — file it before exploring, not after. |
| "The caller didn't say `--cli`, so use in-session" | `--cli` is now the default; in-session only runs when the caller passes `--in-session`. |
| "It'll just ask if it hits ambiguity" | Both a numbered-menu question and an open-ended free-text answer are cheap `cli-response` replies now — verified, no fork. Still prefer front-loading foreseeable ambiguity into the brief where you can; `cli-response` is for what surfaces anyway. |
