---
name: agy-office
description: Use ONLY when explicitly invoked via /agy-office, for irreversible or production-facing work. Five-phase office — planner interviews to 95% clarity, the agy CLI executes, planner independently verifies, fresh Opus reviewer adversarially gates, planner closes loop. Never self-triggered.
---

# Agy Office

The same office discipline as `claude-office`, with the `agy` CLI (Antigravity/Gemini agent) standing in as the Executor instead of a Claude subagent.

| Role | Who | Default model | Job |
|---|---|---|---|
| **Planner** | The current agent (you) | whatever the session is | Interview → plan → approval; **independently verify the executor's output**; triage and apply review fixes; close out |
| **Executor** | `agy --print`, unsandboxed | `gemini-3.6-flash-high` | Implement up to ~3 tasks of the approved plan; commit to the designated branch; write a handoff report |
| **Reviewer** | One fresh dispatched Claude subagent | `opus`, medium effort | ONE adversarial final review, then re-review each fix round; holds the approval gate |

**Core principle:** the planner never implements the plan and the executor never approves its own work. Each gate is held by someone who did not do the work being gated.

**REQUIRED BACKGROUND:** load the **`agy` skill** before your first dispatch. It is the living record of the CLI's sharp edges — flag ordering (`--print` must come last or the prompt is silently swallowed), workspace semantics, `--print-timeout`, model names, quota, live monitoring. Do not reconstruct any of it from memory, and append what you learn.

## Why this office has five phases, not four

`claude-office` and `codex-office` both run four. This one adds **Phase 2b: independent verification**, and it is mandatory. Three properties of this executor force it:

1. **Exit code 0 means nothing.** `agy` exits 0 having done nothing at all, and its completion summary is not a signal. Every other executor's report is a claim you can discount; this one's is a claim you must independently replace.
2. **It produces self-consistently wrong work.** It has invented an interface signature — a 4-argument filter for a documented 3-argument WordPress action, with the correct signature in its prompt — then written test stubs matching its own invention. The suite went green over code that could never fire. **Green tests from this executor prove the tests agree with the implementation, nothing more.**
3. **The prompt is the only guardrail.** `--dangerously-skip-permissions` is required for unattended work and removes every approval stop. There is no sandbox catching a scope violation after the fact.

Phase 2b is seven checks ([references/verification.md](references/verification.md)). It is not review — it establishes that the work is *real* before an expensive reviewer judges whether it is *right*.

**Quota is a live risk.** agy runs on a token quota that has died mid-orchestration; the symptom is a stall after a few narration lines. Confirm quota with the user before a long plan, and have Claude subagents ready as the fallback worker.

## Invocation gate

This workflow is for **irreversible or production-facing work** and runs **only** when the user types `/agy-office` (or names the skill directly) — never because a task "looks like it needs an office." A plain feature request, `/brainstorm`, or a code-review ask does not invoke it.

If you are reading this as a dispatched reviewer, you are not the planner. Ignore this file and follow the brief you were given.

### Caller tweaks

Anything after `/agy-office` is an override. Honor it, echo it back in the kickoff line, keep every other default.

| Tweak | Example | Effect |
|---|---|---|
| Executor model | `/agy-office use gemini-3.1-pro-high` | Change `--model` (exact value from `agy models`) |
| Reviewer model | `/agy-office reviewer: sonnet` | Change the reviewer subagent's model |
| Skip a phase | `/agy-office plan already approved: docs/plans/x.md` | Start at Phase 2 with that plan |
| No closeout | `/agy-office skip cleanup` | Stop after Reviewer approval |
| Extra gates | `/agy-office reviewer must also check a11y` | Append to the reviewer's rubric |

Only a caller tweak may change a default. **Phase 2b is not a default — it is structural.** Never skip it, never downgrade the reviewer, never route review through `agy`, never self-approve.

**A GitHub tracking issue is filed by default, automatically, no separate approval needed** — see "Issue tracking" under Phase 1.

## Routing table (load the spoke you need)

| Need | Spoke |
|---|---|
| **CLI mechanics** — flag ordering, `--add-dir`, `--print-timeout`, model catalog, sessions, quota, live tailing | the **`agy` skill** (read it first) |
| **How many agy dispatches, and why** — justifying or collapsing a split, when to use `claude-office` instead, planner-held tasks | [references/routing.md](references/routing.md) |
| **Upline escalation** — who owns a decision, block-vs-annotate, the reviewer indicting the plan, blast-radius ceilings | [references/escalation.md](references/escalation.md) |
| The required task-prompt contract + real-signature clause + handoff contract — build every agy prompt from this | [references/executor-brief.md](references/executor-brief.md) |
| **Phase 2b — the six-check verification pass** | [references/verification.md](references/verification.md) |
| Adversarial review phase mechanics + fix loop | [references/review-gate.md](references/review-gate.md) |
| Building the reviewer's prompt | [references/reviewer-brief.md](references/reviewer-brief.md) |
| Closeout: commit, PR, sync main, close loops | [references/closeout.md](references/closeout.md) |
| Handing this conversation to a fresh session | the `rc-handoff` skill |

## The Five Phases

Create one todo per phase at kickoff. Phase 1 (plan + approval) → Phase 2 (execute) → **Phase 2b (verify)** → Phase 3 (adversarial review, loops until approved or the round cap) → Phase 4 (closeout).

### Phase 1 — Plan (Planner)

Announce: `Agy Office — Phase 1: planning. Executor: agy <model>. Reviewer: <model>.`

**Issue tracking (default, automatic):** before exploring or interviewing, run `gh issue create` in the target repo with a minimal title/body drawn from the raw request (e.g. "Track: <request summary>"). This exists so a tracking issue is open from the very start even if the run stalls or ships incomplete — and with a quota-limited executor, stalling is a live possibility. No user approval needed — file it and move on. Once the interview settles into an approved plan, `gh issue edit <n>` to replace the body with the plan summary (or a link to the plan file). At closeout, reference it with `Closes #N` in the PR body so it closes automatically on merge; if the gate stays red or the run stops short, leave the issue open as the record of what's unresolved.

**Interview until 95% clear** — clear enough that a stranger with no access to this conversation could build the right thing from the plan alone. That standard is literal here: `agy` *is* that stranger, in a separate process, with no way to ask you a follow-up mid-run, and it fills gaps by inventing rather than asking. Ask in batches (AskUserQuestion for choices), covering: outcome, scope edges, existing surface (read files, don't guess), constraints (env, data source of truth, framework, protected paths), verification command, and named unknowns. Stop asking once remaining unknowns wouldn't change the implementation.

**Dispatch explorer subagents** for anything that means sweeping files/directories/conventions — don't spend the user's turns on questions a read would settle. Default to `haiku`; step to `sonnet` only when reconciling conflicting patterns needs judgment, not retrieval. **Never dispatch an `opus` explorer.** Run independent explorers in parallel, `subagent_type: "Explore"`, ask for a specific answer with file:line citations.

**Pin every interface the plan touches, verbatim, during Phase 1.** For each hook, callback, event, SDK method, or endpoint in scope, have an explorer return the real signature with its file:line, and put it in Global Constraints as literal text. This costs one explorer and closes this executor's worst failure mode at the source. Note that it is not sufficient — the executor has invented a signature that was stated correctly in its prompt — which is why the brief also demands a citation and Phase 2b checks it.

**Write the plan to a file** (`docs/plans/<slug>.md`, or scratchpad) — the executor's contract:

1. **Context** — why this work exists.
2. **Global Constraints** — verbatim binding requirements: exact values, formats, **pinned interface signatures with file:line**, protected paths, env target, validation commands. Copied verbatim into the agy prompt and to the Reviewer later.

   Include a **blast-radius ceiling** here, always, as its own named block: which environments, credentials, remotes, external services and irreversible operations this run may and may not touch. It is declared once and restated verbatim in every downstream brief — ceilings narrow going down and no agent may widen its own. State exclusions explicitly; an unstated exclusion is one a helpful agent will "finish" for you, and this one has front-run *unasked* work. With permissions skipped there is little mechanism behind the prose, so write it as if nothing else will stop the run. Where a real mechanism exists, use it too: a dedicated worktree, credentials absent from the environment, `--sandbox` when the task needs no terminal access. Full rules in [references/escalation.md](references/escalation.md).
3. **Numbered tasks** — files touched, exact behavior, verification, and a **strategy tag**:

   | Strategy | When | Model |
   |---|---|---|
   | **INLINE** | Trivial, deterministic, 1–3 files | You edit it; no dispatch, no verification pass |
   | **FLASH** | Codemods, renames, boilerplate, doc/config churn — formulaic and trivially checkable | `gemini-3.6-flash-high` |
   | **PRO** | Default — well-briefed features, mid-size changes with a detailed spec, test writing | `gemini-3.6-flash-high` |
   | **ELSEWHERE** | Hard debugging, architectural work, subtle correctness, security-sensitive surface | Recommend `claude-office` for that task — see [references/routing.md](references/routing.md) |
   | **PLANNER-HELD** | Irreversible production writes, anything awaiting a human go-ahead, anything outside the ceiling | Never in an agy brief; named as excluded |

   Tag every task (`Strategy: PRO`), justify anything off-default in ≤8 words. **Both tiers resolve to `gemini-3.6-flash-high` — the configured default for this office (Rico, 2026-08-01).** The tag still matters: it records how much the task is trusted to be checkable, which drives how hard Phase 2b looks at it.

   **The Flash family is where the invented-signature and narrow-guard failures were observed. That is an argument for the guardrails, not for a different model.** Running the default safely means the pinned-signature block, the citation table, the mutation-verification table and Phase 2b are all non-negotiable — never treat any of them as optional because the task looked small. Always pass `--model` explicitly; omitting it silently gets you whatever agy's own default is, which is not necessarily this one.

   The table picks a task's **model**. It does not decide whether that task gets its own dispatch — **you** do. **The default is one `agy` dispatch for the whole plan.** Read [references/routing.md](references/routing.md) and apply its test: *a second dispatch must buy tier, isolation, or parallelism; if it buys none of the three, keep it in the single run.* Each extra dispatch also costs its own verification pass and its own slice of a quota that can die mid-run. Balance that against what INLINE costs: anything you implement yourself, you also planned, so the Phase 3 reviewer is the only independent eye on it — never INLINE the task carrying the plan's main correctness or security risk.
4. **Dependency graph** — each task declares `Depends on:` and `Touches:`; group into waves (a `dot` digraph + wave table). agy works the waves in order inside one run. Two tasks share a wave only if neither depends on the other **and** their `Touches:` sets are disjoint. **Parallel dispatches require separate worktrees** — one tree, one agy process, always.

   **A task that deploys, applies, publishes or migrates derives its scope from the diff, not from the feature that motivated it.** Write it as *"apply every artifact whose committed source this branch changed"* and give it a self-check that fails loudly — a dry-run reporting pending changes on any target means the task is not done. Most such tasks are `PLANNER-HELD` here anyway: an executor whose exit code proves nothing has no business writing to a live system.
5. **Out of scope** — explicit.

Summarize routing (`Routing: 1 agy dispatch (Pro High) · 3 INLINE · 1 planner-held`), the **dispatch count**, and waves (`Waves: 3 — critical path 1→3→5`) when presenting the plan. Add a one-clause reason per extra dispatch naming what it buys. If a task landed in `ELSEWHERE`, say so out loud and recommend the split rather than routing it through the wrong office to stay inside the skill the user invoked.

**Get explicit approval** — "looks good"/"go"/"approved". Silence is not approval. Do not dispatch off an unapproved plan.

### Phase 2 — Execute (Executor — agy)

Announce: `Phase 2: dispatching agy executor (<model>).` Record `BASE=$(git rev-parse HEAD)`.

**One executor per repository.** A multi-repo plan gets one `agy` run per repo (parallel across repos, never within one); each gets its own repo path, branch, BASE, scratch dir, plan slice, and handoff path. You consolidate every handoff into one picture before Phase 2b.

Build the prompt from **[references/executor-brief.md](references/executor-brief.md)** — **every field in that contract is required, not optional**, including the absolute workspace root stated in the prompt text, the real-signature clause, the no-front-running clause, the blast-radius ceiling, and the handoff-report contract. Then launch per the `agy` skill's verified invocation:

```bash
agy --dangerously-skip-permissions --print-timeout 45m \
  --model "<exact display name>" --add-dir "<abs repo/worktree path>" \
  --print "$(cat <prompt file>)"
```

**`--print` must come last, immediately before the prompt.** Any flag between them silently swallows the prompt and you get a greeting instead of work. `--print-timeout` defaults to 5m — always raise it. Stdin piping does not work; use the positional argument.

Launch it as a background task with **no pipes on stdout**, then tell the user the task's `.output` path so they can watch it (piping through `tail`/`head` buffers until exit and kills live tailing). You read only the tail of that file after completion. While it runs: do non-conflicting prep only — **never edit the tree it is writing to.**

**Exit code 0 does not mean done.** Read the final message and the handoff file, then go straight to Phase 2b. A stall after a few narration lines is quota, not slowness — check `git status`/`git log`, and expect that nothing was written. A greeting or banner is the swallowed-prompt bug: fix the flag order and relaunch. A clarifying-question stall or a focused correction goes back via `agy --continue` / `--conversation <id>`.

**Commit boundary (absolute):** agy commits only to the designated branch/worktree. It must never push, open a PR, deploy, change remote config, send messages, or touch credentials unless the prompt explicitly authorized that exact action. Silence means not authorized.

**Handle its `## Upline` section when it lands.** Answer everything `[needs-planner]`. Surface every `[needs-user]` item to the user **batched, with your recommendation attached** — never resolve a user-owned question by inferring what they'd want. Carry the `[decided]` list into the reviewer's packet, and say whether the list looked complete against the diff. See [references/escalation.md](references/escalation.md).

### Phase 2b — Independent verification (Planner) — mandatory

Announce: `Phase 2b: verifying executor output.` Run all seven checks in **[references/verification.md](references/verification.md)**: did it write anything; anything untracked it wasn't asked for; does every interface it touched really have that signature; do the new tests actually fail when the behaviour breaks; the gate, run by you; are the guards as wide as the spec; and do the new tests assert anything that could fail.

This is **not** review — no spec judgement, no quality findings, no approving anything. It establishes that the diff is real and its interface claims are true, so the reviewer spends its round on whether the work is *right*. A confirmed signature mismatch or a test that won't go red is a defect you fix (via the Phase 3b matrix) and re-verify **before** dispatching the reviewer.

### Phase 3 — Adversarial Review (Reviewer)

Full mechanics, the fix loop, and the round cap live in **[references/review-gate.md](references/review-gate.md)** — read it before dispatching. In short: dispatch a fresh Opus reviewer built from [references/reviewer-brief.md](references/reviewer-brief.md), hand it the plan, Global Constraints, handoff report, `[decided]` list, a diff-package file, **your own Phase 2b gate output**, and a one-line-per-check summary of what your pass verified; it returns `APPROVED`, `CHANGES REQUIRED` with numbered findings, or `PLAN DEFECT`, and never approves without pasted validation-command output.

**The reviewer is always a Claude subagent.** There is no tweak that routes review through `agy` — a same-family reviewer cannot see this executor's characteristic failure, which is work that is wrong and internally consistent about it.

**Because agy reviewed nothing, do not compress the reviewer's rubric.** It gates interface truth against real source, guard width against the spec, and scope containment — and its evidence is *your* gate output, not the executor's pasted block.

You triage and apply fixes (INLINE / `flash` / `pro` / **Claude subagent** per the matrix in review-gate.md — every agy fix dispatch is a full task prompt, and every fix wave gets a re-run of the verification pass). **Escalate out of the tool, not up within it:** an invented signature, a test that wouldn't go red, or anything the reviewer calls subtle goes to a Claude subagent or INLINE, never back to the executor that produced it. Then send the same reviewer (via SendMessage) the fix diff + fresh gate output. Cap at 5 rounds; past that, report the deadlock rather than self-approving.

**`PLAN DEFECT` exits the fix loop instead of consuming a round** — the diff faithfully implements the plan and the *plan* is what's wrong. You amend the plan (technical gap) or route it to the user (tradeoff, scope, business call). Never answer it by pressuring the reviewer to downgrade it. Also hand the reviewer anything **written to a live system**: its evidence gate requires a read-back of the deployed artifact, not the writer's exit code.

### Phase 4 — Closeout (Planner)

Announce: `Phase 4: closeout.` Follow **[references/closeout.md](references/closeout.md)** — commit, verify the gate, PR + automerge, document, sync main, remove the worktree, close loops (including every open `## Upline` entry). Skip only if the caller passed `skip cleanup`.

Report the run in ≤6 lines: plan file, executor model + commit range, what Phase 2b caught, review rounds used, gate command + result, what closeout did, anything left open.

**Then make the skills better than you found them.** Every run produces evidence these files cannot have anticipated. Spend one pass, and note that the lessons split across two skills:

- **CLI behaviour → the `agy` skill.** A flag that didn't behave as documented, a `--continue` that lost context, a new model in the catalog, a quota symptom, a workspace surprise. That file is the shared living record and other workflows read it; this is the highest-value place to write.
- **Executor failure classes → [references/executor-brief.md](references/executor-brief.md).** A new way it produced plausible-looking wrong work needs a new clause in the contract, and probably a new check in [references/verification.md](references/verification.md). If Phase 2b missed something a reviewer caught, that is a missing check — add it.
- **Routing → [references/routing.md](references/routing.md).** A dispatch that should have been INLINE or `claude-office`, a purchase that turned out illusory, a quota cost that dominated.

Sharpen an existing principle rather than appending a scenario; a list of past situations doesn't generalize, a principle does. Nothing durable to add is a legitimate outcome — say so and stop. Do not rewrite a rule you merely found inconvenient, and tell the user in one line what you changed.

## Composing with other skills

This skill owns the **orchestration shape** only. Domain/platform skills (Rock, Vercel, WordPress, design, etc.) stack freely — load them and fold their rules into the plan's Global Constraints so both agy and the reviewer are bound by them. A domain skill's safety rule ("take a backup first") outranks this skill's silence on it. Explicit user instructions outrank both. The **`agy` skill is not a competing orchestrator** — it is this office's CLI reference and you should always have it loaded. Don't run a second *orchestration* skill inside this one; one controller per run.

## Red Flags — stop and correct

| Thought | Reality |
|---|---|
| "The request is clear enough, I'll skip the interview" | Phase 1 ends at 95%, not "I could start." agy fills gaps by inventing, not asking. |
| "I'll just implement it myself" | The planner does not implement the plan. That's the gate. |
| "This exploration is important, I'll use opus" | Exploration is search and summarize. Haiku, or sonnet at most. |
| "I'll put the flags after `--print`, order doesn't matter" | It silently swallows the prompt. You get a greeting and an exit 0. |
| "The default model is fine" | The default is Flash — where the invented-signature failures were observed. Always pass `--model`. |
| "5m timeout is probably enough" | `--print-timeout` defaults to 5m. Raise it or the run dies mid-task. |
| "I'll pipe the prompt in on stdin" | Stdin is ignored. Positional argument only. |
| "`--add-dir` means it's working in my repo" | Not reliably. The prompt must state the absolute workspace root and forbid the scratch dir. |
| "Exit 0, so it's done" | agy exits 0 having done nothing. Phase 2b, every time. |
| "The tests are green, so the code is right" | Green means the tests agree with the implementation. Check signatures against real source. |
| "It said it verified the interfaces" | That's a claim about its own work. Open the file:line yourself — it's one read per row. |
| "Phase 2b is diligence, I'll skip it when I'm confident" | It's structural, not a default. Six commands, and each has caught a real failure. |
| "Phase 2b was clean, so the reviewer can be light" | Clean means the diff is real, not right. Phase 3 is still the only review. |
| "I'll have agy review its own diff / a second agy check it" | Same family, same blind spots. The reviewer is always a Claude subagent. |
| "The signature was wrong, send it back to agy" | Escalate out of the tool. That's the failure it just demonstrated. |
| "It stalled, I'll retry with a bigger timeout" | A stall after a few narration lines is quota. Fall back to Claude subagents. |
| "This hard task can stay in agy, the user invoked /agy-office" | Recommend `claude-office` for it. Say so out loud; don't route it wrong to stay inside the skill. |
| "agy can push/open the PR itself, saves a step" | Not unless the prompt authorized that exact action. Closeout owns push/PR. |
| "Seven tasks, so seven dispatches" | One dispatch is the default. Each extra buys tier, isolation, or parallelism — and costs a verification pass. |
| "Two agy runs in this repo will be faster" | One tree, one agy process. Parallel means separate worktrees or not at all. |
| "Two repos, one executor across both" | One executor per repo, in parallel. You consolidate. |
| "agy is already in there, it can do the deploy" | Irreversible production work is `PLANNER-HELD`. Its exit code proves nothing. |
| "The user probably wants X, I'll just decide" | User-owned decisions get stated with a recommendation, never inferred. |
| "I'll mention the assumption in my summary" | Summaries get compacted and the process exits. `[decided]` goes in the file, one line. |
| "The reviewer's finding contradicts the plan, so it's wrong" | Plans are hypotheses. That's a `PLAN DEFECT` or a user call — not a dismissal. |
| "Round 6 will converge" | Past the cap the failure is structural. Report the deadlock. |
| "This task looks like office work, I'll invoke it" | Only `/agy-office` invokes this. |
| "I'll skip the tracking issue, the plan file is enough" | The issue is the default, automatic record — and this executor stalls. File it before exploring. |
