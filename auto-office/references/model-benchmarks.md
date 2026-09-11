# Model benchmark snapshot

```yaml
captured: 2026-09-11
source: artificialanalysis.ai (Intelligence Index v4.3, Coding Agent Index v1.5)
staleness_horizon_days: 30
last_move: Intelligence Index v4.3 replaced Terminal-Bench v2.1 with v4.0 and τ³-Banking with
           AutomationBench-AA. Gemini 3.8 Flash is the current Gemini family; explicit maintainer
           defaults now prefer Gemini for executor work and Codex Luna for scouts and review.
```

**Intelligence Index v4.3 is 10 evaluations**: AA-Briefcase, GDPval-AA v2, AutomationBench-AA,
Terminal-Bench v4.0, SciCode, Humanity's Last Exam, GDP.pdf, CritPt, AA-Omniscience, and
AA-LCR v1.1. Category weights are Agents 30%, Coding 20%, General 30%, and Scientific Reasoning
20%; private-test-set tasks account for 45%. Quote the index version whenever you quote a score —
v4.x numbers are not comparable across index versions.

**This file is data, not doctrine.** Route from the capability roles in
[auto-routing](../skills/auto-routing/SKILL.md); this table only says who currently occupies each
role. Refresh it when `captured` is older than the horizon, or immediately when a new frontier
model ships.

## Role-relevant v4.3 components

| Role | Primary public evidence | Weight/context |
|---|---|---|
| Planner / knowledge worker | AA-Briefcase + GDPval-AA v2 | Agents, 15% + 10% |
| Tool/workflow worker | AutomationBench-AA | Agents, 5%; guardrail violations zero the task |
| Repo/terminal executor | Terminal-Bench v4.0 + Coding Agent Index | Coding, 10%; use harness pairing evidence |
| Document worker | GDP.pdf + AA-LCR v1.1 | General, 10% + 5% |
| Research scout | Model capability plus search/provider quality | No single composite proxy; treat search quality separately |

**The snapshot is evidence only — it never silently changes a default or promotes a role at run time.**
Public benchmark movement can inform a future maintainer decision, but it cannot raise an effort level
mid-run or let the Planner substitute a higher-scoring variant merely because it appears here.

**Workers are the exception, and a deliberate one.** The planner may assign a worker **any** brand,
model, and effort in this table — above the executor's tier, below it, or across brands — because
that is a plan-time argument about the *kind* of question the sub-task poses. The index is the axis
you argue on; it is still not the argument. See [auto-routing](../skills/auto-routing/SKILL.md) →
*Workers are routed, not pinned*.

Read [routing-outcomes.md](routing-outcomes.md) before this file — local outcomes outrank the
leaderboard.

## v2 dedicated plan-drafter note

This snapshot does **not** choose the v2 dedicated plan drafter (an added role,
never the Planner). The maintained policy is conditional on the orchestrator,
not benchmark-derived — canonical definition, resolution order, and fallback
semantics: [`planner-handoff.md`](planner-handoff.md#v2-selection-policy). In
short: **Claude Opus 5 medium, unconditionally**, with GPT-6 Astra low as the
fallback when Opus is unavailable. The former orchestrator/headroom-conditional
Astra default was revoked 2026-09-10. A benchmark refresh may update this
evidence file, but it must not silently change those drafter defaults or
fallbacks.

## Intelligence Index and output speed

| Model | Intelligence | Output tok/s | ~$/M tokens | Office role |
|---|---|---|---|---|
| **Gemini 3.8 Flash (high)** | **41** | 272.9 | 1.24 | Agy reviewer default (latest high) |
| **Gemini 3.8 Flash (medium)** | **40** | — | 0.93 | Agy executor default |
| **Claude Opus 5 (low)** | **40** | 49.2 | 1.10 | Reviewer fallback |
| **GPT-5.6 Luna (xhigh)** | **35** | 106.1 | 0.09 | Codex reviewer and plan-review default; executor fallback |
| **Gemini 3.8 Flash (low)** | **34** | — | — | Current Gemini low evidence |
| **Claude Sonnet 5 (high)** | **32** | 59.5 | 1.79 | Executor fallback |
| Gemini 3.7 Flash (low) | 37* | — | — | Scout fallback |

\* Estimated by the current Artificial Analysis comparison page; do not treat an estimate as a
measured score. Output speed and cost are weighted per-task figures where Artificial Analysis
publishes them; `—` means the current page did not expose a stable value.

**This table is evidence, not a selector.** Artificial Analysis v4.3 now measures more realistic
agentic and knowledge-work behaviour, but the Planner gives live usage, launchability, repeated
failures, and local routing outcomes more weight than these public scores. Effort labels are not a
universal quality ordering; use the exact model+effort row.

## Agentic coding — harness + model, not model alone

The Coding Agent Index methodology is now v1.5 and uses the current Terminal-Bench v4.0 direction,
reward-hacking detection, and revised token accounting. It scores the **harness+model pairing**,
which remains the right unit here since each office is a harness. Refresh live pairing scores from
the [official Coding Agent Index leaderboard](https://artificialanalysis.ai/leaderboards/coding-agents)
before making a new maintainer default.

| Pairing | Coding Agent Index |
|---|---|
| Current live pairing score | See official leaderboard | Do not copy a model-only score into this table |

Terminal-Bench remains the most predictive public component for agents that edit files and run
terminal commands, but local routing outcomes and live quota are stronger evidence for this office.

## What the numbers mean for routing

- **Gemini Flash is the executor default** because it is fast and retains strong current capability;
  the Planner should prefer it even for frontend work and when quota is UNKNOWN.
- **Sonnet high is the quality fallback**, not the frontend default. Use it when Gemini usage is
  dire, Gemini cannot launch, or repeated failures justify moving down the ladder.
- **Codex Luna xhigh is the review default** and the final executor fallback. Review effort is
  intentionally higher than executor effort because the gate is where independent defect detection
  pays for itself.
- **Usage is not a hard threshold.** The Planner records the measured or UNKNOWN state and makes a
  semi-deterministic choice based on availability, remaining window, task shape, local outcomes,
  and then public benchmark evidence.

## Refresh procedure

1. Search Artificial Analysis for: Intelligence Index leaderboard, Coding Index, Coding Agent
   Index (harness pairings), and output tokens/sec for the current Claude / GPT / Gemini flagships.
2. Rewrite the numbers above. Bump `captured`. Note in one line what moved.
3. If a capability role changed hands, **say so in the run's kickoff line** and route the new way.
4. Leave locally-observed behavior alone unless an explicit maintainer decision changes the policy;
   this refresh explicitly changes Auto Office's old Agy-first executor rule, while Agy Office's
   own harness-specific constraints remain in its sibling skill.

Sources: [Intelligence Index v4.3 announcement](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3),
[Intelligence Index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking),
[Coding Agent Index methodology](https://artificialanalysis.ai/methodology/coding-agents-benchmarking),
[Gemini 3.8 Flash high](https://artificialanalysis.ai/models/gemini-3-8-flash),
[Gemini 3.8 Flash medium](https://artificialanalysis.ai/models/gemini-3-8-flash-medium),
[Gemini 3.8 Flash low](https://artificialanalysis.ai/models/gemini-3-8-flash-low),
[GPT-5.6 Luna xhigh](https://artificialanalysis.ai/models/gpt-5-6-luna-xhigh),
[Claude Sonnet 5 high](https://artificialanalysis.ai/models/claude-sonnet-5-high),
[Claude Opus 5 low](https://artificialanalysis.ai/models/claude-opus-5-low),
[Gemini 3.7 Flash low comparison](https://artificialanalysis.ai/models/comparisons/gemini-3-8-flash-vs-gemini-3-7-flash-low).
