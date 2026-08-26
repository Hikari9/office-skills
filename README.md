# office-skills

Hey! This repo holds 3 offices for irreversible or production-facing work, plus the shared protocol they all agree on, plus the harness that measures whether any of it works.

An "office" is a strict, role-separated delivery process. A planner plans, a separate executor implements, and a fresh reviewer holds the approval gate. Nobody approves their own work, ever.

## The offices

| Plugin | Executor | Shape |
|---|---|---|
| [auto-office](auto-office/) | **Chosen** — codex, agy, or claude | Plan + GOAL, plan-review, route, then a goal-locked autonomous loop to closeout |
| [codex-office](codex-office/) | Codex in-session workers when planner and assignee are Codex; otherwise CLI | Plan, execute, adversarial review, closeout |
| [agy-office](agy-office/) | The `agy` CLI (Antigravity/Gemini) | Plan, execute, **independent verification**, adversarial review, closeout |

Each one installs, versions, and rolls back on its own. Improving one office never quietly changes the others.

`auto-office` is a router first. It owns **which brand should do this work** (by capability and
measured quota, not habit) and **an end-to-end run** that takes one plan approval and continues to
closeout without further go-aheads. Codex and agy mechanics still come from those offices, so a CLI
fix lands in one place.

It also owns the **claude route** outright, as of `4.0.0`. `claude-office` was absorbed rather than
deleted, because `claude-reviewer` is the default code-review gate for *every* route whoever
executed — and a gate every run depends on cannot live in a plugin a run might not have installed.

Three decisions, not a tier ladder: **which brand is the executor** (one per repo, the only writer),
**which brand and tier each worker gets** per task, and **how each is dispatched** — and the third is
derived, not chosen (same-brand planner/worker pairs use in-session subagents, cross-brand pairs
use the assignee's CLI, and work a delegation buys nothing for is done inline). The executor is
pinned to sonnet-tier, so a hard task
gets a better *plan*, not a bigger executor; a worker may be assigned higher when the sub-task is a
different *kind* of question, declared in the plan and never promoted mid-run. The plan itself is
gated twice before it costs anything: the planner self-reviews, then one fresh Opus-tier
plan-reviewer reads it and retires.

Agy has a fifth phase because its executor exits 0 having done nothing, and it can produce work that is wrong and internally consistent about it. Phase 2b is structural there, not optional diligence.

## How they are built

Each office is a **hub and spoke** plugin:

* The **hub** (`SKILL.md`) is small and always loaded. It carries the invocation gate, the roles, the safety rules that cannot be bypassed, and a routing table. Nothing else.
* **Spokes** (`skills/<name>/SKILL.md`) are loaded on demand, by role. A reviewer never receives the executor's material, and no role reads the whole corpus.
* **References** hold the durable long-form detail, reached through the spokes.
* **office-core** is the shared contract: role authority, the plan contract, evidence and handoff rules, review states, the closeout procedure, and the compatibility policy. Runtime mechanics stay with the plugin that owns them.

```text
office-skills/
├── office-core/            shared protocol source, the only editable copy
├── codex-office/           plugin root, hub, spokes, references, vendored core
├── agy-office/             plugin root, hub, spokes, references, vendored core
├── auto-office/            router office + the claude route: routing, goal loop, review gate
├── scripts/                vendor-core.sh, check-plugins.sh
├── eval/                   run telemetry, version tree, scorecard, hooks, debrief
├── docs/                   packaging, telemetry, canaries, rule ownership
└── .claude-plugin/         local marketplace listing every plugin
```

## Working in this repo

```bash
./scripts/vendor-core.sh     # after any edit under office-core/
./scripts/check-plugins.sh   # before any commit or release
```

**Edit `office-core/` at the root, never a vendored copy inside a plugin.** The checker hashes the snapshots and will tell you if one drifted.

## Docs

* [Packaging and install](docs/packaging-and-install.md), for building, installing, releasing, and **installing the telemetry hooks into Claude Code, Codex, Gemini CLI, and Hermes**.
* [Telemetry event model](docs/telemetry-event-model.md), for how a run gets measured and why transcript matches do not count.
* [Canaries and rollback](docs/canaries-and-rollback.md), for what each office has to prove before it ships.
* [Rule ownership matrix](docs/rule-ownership-matrix.md), for who owns which rule and where it lives.
* [Eval harness](eval/README.md), for the version tree, the scorecard, the hooks, and the 80% goal.

## One thing to keep in mind

This corpus is hard-won. Almost every rule in it exists because something went wrong once and nobody wanted it to happen twice. When you are tightening a file, cut repetition freely, and never cut a rule.
