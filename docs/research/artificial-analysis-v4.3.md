# Artificial Analysis v4.3 routing research

Captured 2026-09-11 for issue #70 and the Auto Office default-routing update.

## Verified findings

- Intelligence Index v4.3 contains 10 evaluations: AA-Briefcase, GDPval-AA v2,
  AutomationBench-AA, Terminal-Bench v4.0, SciCode, Humanity's Last Exam, GDP.pdf, CritPt,
  AA-Omniscience, and AA-LCR v1.1.
- Category weights are Agents 30%, Coding 20%, General 30%, and Scientific Reasoning 20%.
- Terminal-Bench v4.0 replaced Terminal-Bench v2.1, and AutomationBench-AA replaced τ³-Banking.
- Private-test-set evaluations account for 45% of the v4.3 index weight.
- Current model-page readings used in the snapshot: Gemini 3.8 Flash high 41, medium 40, low 34;
  GPT-5.6 Luna xhigh 35; Claude Sonnet 5 high 32; Claude Opus 5 low 40.
- The Coding Agent Index is a harness-plus-model measure. Its current methodology is v1.5 and
  should not be represented by a model-only Intelligence Index score.

## Routing interpretation

Public scores remain supporting evidence. Auto Office gives live usage/availability, repeated
failures, and local routing outcomes more weight, with no hardcoded quota threshold. When usage is
UNKNOWN, Gemini is the safe default while it remains launchable.

## Sources

- [Intelligence Index v4.3 announcement](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3)
- [Intelligence Index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
- [Coding Agent Index methodology](https://artificialanalysis.ai/methodology/coding-agents-benchmarking)
- [Gemini 3.8 Flash high](https://artificialanalysis.ai/models/gemini-3-8-flash)
- [Gemini 3.8 Flash medium](https://artificialanalysis.ai/models/gemini-3-8-flash-medium)
- [Gemini 3.8 Flash low](https://artificialanalysis.ai/models/gemini-3-8-flash-low)
- [GPT-5.6 Luna xhigh](https://artificialanalysis.ai/models/gpt-5-6-luna-xhigh)
- [Claude Sonnet 5 high](https://artificialanalysis.ai/models/claude-sonnet-5-high)
- [Claude Opus 5 low](https://artificialanalysis.ai/models/claude-opus-5-low)
