# Model benchmark snapshot

```yaml
captured: 2026-08-14
source: artificialanalysis.ai (Intelligence Index v4.1.1, Coding Index, Coding Agent Index v1.1)
staleness_horizon_days: 30
last_move: Gemini 3.7 Flash shipped and takes the flash tier (high 56, up from 3.6's 50) — now
           the highest-index non-frontier model in the catalog and agy's executor default.
           Luna variants added with their real ordering (max 52 > xhigh 50 > high 47).
```

**Intelligence Index v4.1.1 is 9 evaluations**: GDPval-AA v2, τ³-Banking, Terminal-Bench v2.1,
SciCode, Humanity's Last Exam, GPQA Diamond, CritPt, AA-Omniscience, AA-LCR. Quote the index
version whenever you quote a score — v4.x numbers are not comparable to earlier captures.

**This file is data, not doctrine.** Route from the capability roles in
[auto-routing](../skills/auto-routing/SKILL.md); this table only says who currently occupies each
role. Refresh it when `captured` is older than the horizon, or immediately when a new frontier
model ships.

**The snapshot selects brand and executor-default only — it never promotes a role at run time.** A
leaderboard movement can change *which brand* holds a capability role and can update a standing
executor default at plan time; it can **never** raise an effort level mid-run or let you substitute a
higher-scoring variant because you read it here. Reading a bigger number is not a reason to call it.

**Workers are the exception, and a deliberate one.** The planner may assign a worker **any** brand,
model, and effort in this table — above the executor's tier, below it, or across brands — because
that is a plan-time argument about the *kind* of question the sub-task poses. The index is the axis
you argue on; it is still not the argument. See [auto-routing](../skills/auto-routing/SKILL.md) →
*Workers are routed, not pinned*.

Read [routing-outcomes.md](routing-outcomes.md) before this file — local outcomes outrank the
leaderboard.

## Intelligence Index and output speed

| Model | Intelligence | Output tok/s | ~$/M tokens | Office role |
|---|---|---|---|---|
| Claude Opus 5 (max) | 61 | 54 | 2.34 | — |
| Claude Opus 5 (xhigh) | 60 | 52 | 1.80 | — |
| Claude Fable 5 | 60 | 66 | 3.15 | — |
| GPT-5.6 Sol (max) | 59 | 63 | 1.86 | — (no longer a routing option) |
| **Claude Opus 5 (high)** | **59** | 53 | 1.23 | **planner** |
| **Gemini 3.7 Flash (high)** | **56** | **340** | 0.58 | **agy executor default** |
| Claude Opus 5 (medium) | 56 | 53 | 0.72 | — |
| GPT-5.6 Terra (max) | 55 | 126 | 0.73 | — |
| Claude Sonnet 5 (max) | 53 | 74 | 1.72 | — |
| Gemini 3.7 Flash (medium) | 53 | — | — | — |
| GPT-5.6 Luna (max) | 52 | 172 | 0.07 | — |
| Claude Opus 5 (low) | 51 | 51 | 0.43 | **plan-review gate; code-review gate** |
| Gemini 3.7 Flash (low) | 51 | — | — | bulk mechanical work |
| Gemini 3.6 Flash (high) | 50 | 217–304 | 0.56 | superseded by 3.7 |
| Gemini 3.5 Flash | 50 | 171 | 0.69 | — |
| **GPT-5.6 Luna (xhigh)** | **50** | 140 | **0.17** | **codex executor — standing user default** |
| GPT-5.6 Luna (high) | 47 | — | — | **code reviewer when Codex plans; hard diagnosis** |

**Two orderings in this table are counter-intuitive and are the reason it exists.** Luna **max (52)
outscores Luna xhigh (50)** — effort labels do not rank monotonically, so read the row rather than
the flag name. And Gemini 3.7 Flash (high) at **56** now outscores Terra max (55) and matches Opus
medium, at a sixth of Terra's price and ~2.7× its speed; the flash tier is no longer only a speed
play. Luna xhigh also carries a **~50s time-to-first-token** — irrelevant for a long executor run,
badly wrong for a short interactive one.

## Agentic coding — harness + model, not model alone

Coding Agent Index v1.1 = mean pass@1 over DeepSWE, Terminal-Bench v2, SWE-Atlas-QnA. It scores
the **pairing**, which is the right unit here since each office is a harness.

| Pairing | Coding Agent Index |
|---|---|
| GPT-5.6 Sol (max) in Codex | 80 — leads all three component evals |
| field average (4 evaluated) | 77 |
| Opus 4.7 in Cursor CLI | 61 |
| GPT-5.5 in Codex / Opus 4.7 in Claude Code | 60 |

Coding Index (Terminal-Bench v2.1 + SciCode): GPT-5.6 Sol (xhigh) 78, Claude Opus 5 (adaptive,
max effort) 78, GPT-5.6 Sol (max) 77.

Terminal-Bench is the most predictive component for agents that edit files and run terminal
commands — weight it above LiveCodeBench-style scores when judging executor fitness.

## What the numbers mean for routing

- **Opus 5 is the intelligence ceiling** (61) and therefore the Decider and the reviewer. Its
  ~54 tok/s is the price of that; do not spend it on bulk typing. Both review gates run Opus at
  **low** — a review gate's yield comes from independence and a pointed brief, and the index gap
  between Opus low (51) and Opus high (59) has not been the thing that catches findings.
- **Codex leads agentic coding** (80 vs a 77 field average) at roughly a third of Opus's per-token
  cost — the preferred implementation route while quota holds. Its constraint is the weekly window,
  not capability.
- **Gemini 3.7 Flash changed the flash tier's argument.** At **56** it is ~6× Opus's output speed
  (340 vs 54 tok/s) at half the cost and only 3 points below Opus high — where 3.6 Flash sat 9 points
  back. It still does not own *decisions* (56 vs 61 is a real gap on arbitration and ambiguity), but
  "flash is for speed, not smarts" is no longer true and should not be repeated in a brief.
- **Luna is the price play, not the capability play.** xhigh at **50** for **$0.17/M** is a sixth of
  Terra's cost; it is the standing codex executor default because an executor implements an
  already-reviewed plan, which is the task least sensitive to the top of the index. If a run's
  difficulty lives in the *implementation* rather than the plan, that default is the first thing to
  question — with the user, since it is theirs.
- **Speed is a real axis, not a tiebreak.** On read-heavy fan-out, N parallel Flash scouts finish
  before one Opus pass starts producing. On a single long ambiguous chain, that advantage inverts
  completely.

## Refresh procedure

1. Search Artificial Analysis for: Intelligence Index leaderboard, Coding Index, Coding Agent
   Index (harness pairings), and output tokens/sec for the current Claude / GPT / Gemini flagships.
2. Rewrite the numbers above. Bump `captured`. Note in one line what moved.
3. If a capability role changed hands, **say so in the run's kickoff line** and route the new way.
4. Leave locally-observed behavior alone — the agy 3-task drift cap is workspace experience, not a
   benchmark, and a leaderboard cannot overturn it.

Sources: [Artificial Analysis models leaderboard](https://artificialanalysis.ai/leaderboards/models),
[coding capabilities](https://artificialanalysis.ai/models/capabilities/coding),
[coding agents](https://artificialanalysis.ai/agents/coding-agents),
[Coding Agent Index methodology](https://artificialanalysis.ai/methodology/coding-agents-benchmarking),
[Coding Agent Index v1.1 leaderboard](https://llm-stats.com/benchmarks/artificial-analysis-coding-agent-index-v1.1),
[Gemini 3.7 Flash (high)](https://artificialanalysis.ai/models/gemini-3-7-flash),
[Gemini 3.7 Flash (medium)](https://artificialanalysis.ai/models/gemini-3-7-flash-medium),
[Gemini 3.7 Flash (low)](https://artificialanalysis.ai/models/gemini-3-7-flash-low),
[GPT-5.6 Luna (xhigh)](https://artificialanalysis.ai/models/gpt-5-6-luna-xhigh),
[GPT-5.6 Luna (max)](https://artificialanalysis.ai/models/gpt-5-6-luna),
[Gemini 3.6 Flash analysis](https://artificialanalysis.ai/models/gemini-3-6-flash).
