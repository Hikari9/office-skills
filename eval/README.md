# eval — measuring the offices

Three things live here, and they answer three different questions.

| Question | Answer | Cost |
|---|---|---|
| What did the offices actually do, historically? | `backfill.mjs` → `SCORECARD.md` | free, already ran |
| Which version was that? | `build-version-tree.mjs` → `VERSION-TREE.md` | free |
| Are we hitting the goal? | `gate.mjs` — landed rate ≥ 80% | free |
| What should we change about it? | `debrief.mjs` → `out/DEBRIEF.md` | free |
| What do they do now, before anyone uses them? | `../*-office/evals/*.yaml` in CI | API spend per PR |
| Is this lull compactable? | the `Stop` hook, every lull | free |

## Why the existing schema produced nothing

`office-core/schemas/run-event.schema.json` has defined ten event types since core
3.0.0 and has never produced a single record. The reason is structural: emitting an
event was an instruction *to the model*, and every hub carries it as prose. That
makes the measurement depend on the thing being measured choosing to cooperate —
which is the same defect `evidence-and-handoff.md` names about self-reported success.

Everything here reads the harness's own transcript instead. The office does not have
to agree that it ran.

## 1. The version tree

```
node eval/build-version-tree.mjs      # -> eval/VERSION-TREE.md, eval/out/version-tree.json
```

Reverse-chronological. Each row opens an interval that closes when the row above it
begins, and carries the full version vector — core plus all four offices — so any
instant maps to exactly one set of versions. The top row is current.

Attribution is sound here because the offices are **symlinked** into `~/.claude/skills`
(`agy-office -> /Users/rico/Git/office-skills/agy-office`), not installed from a
marketplace cache. The version in effect at any instant is this working tree at that
instant.

Its one soft edge: development happens in this same tree, so content can be live and
uncommitted for hours before the commit that records it. Runs inside 6 hours before a
bump are stamped `version_boundary: "fuzzy"` and the current-version scorecard drops
them. A fuzzy run is evidence about neither version.

## 2. The backfill

```
node eval/backfill.mjs                # -> eval/out/run-events.jsonl
node eval/score.mjs                   # -> eval/SCORECARD.md
```

Walks `~/.claude/projects/**/*.jsonl` read-only. Per skill per session it collects
what the harness recorded and nothing the agent asserted:

- `Skill` tool calls — explicit dispatch, exactly the signal `docs/telemetry-event-model.md`
  asks for and a keyword match is not.
- `attributionSkill` on each turn — the harness's own attribution, which also catches
  a skill that was loaded and followed without a tool call.
- `usage` blocks, timestamps, tool-call and tool-error counts, subagent dispatches,
  `[Request interrupted by user`, `pr-link` records, compaction markers.

**Privacy.** No prompt text, no tool arguments, no file contents. Prompts become a
length and a truncated sha256. Repos become opaque slugs; the slug → real path map is
written to `eval/out/repo-map.local.json` and gitignored, matching the convention
`auto-office/references/routing-outcomes-archive.local.md` already uses.

### The score

`landed(35) · uninterrupted(25) · clean_tools(20) · gate(10) · efficiency(10)`,
renormalised over the components that apply. A component is dropped when it cannot
apply — a skill that has never opened a PR in the whole corpus is not graded on
`landed`, so read-only skills are not punished for being read-only.

- **landed** — a PR was opened in-session at or after the invocation. The only
  component anchored to an artifact outside the transcript.
- **uninterrupted** — no `[Request interrupted by user`. The strongest objective
  dissatisfaction signal a transcript contains.
- **clean_tools** — tool-error rate; 20% scores zero.
- **gate** — `APPROVED` full, `CHANGES REQUIRED` half, `PLAN DEFECT`/`BRIEF DEFECT`
  0.3. Dropped when no verdict appeared. Round count is reported as a cost, not
  scored as a failure.
- **efficiency** — output tokens against that skill's own median.

Two honest limits. Verdicts are matched on literal strings in assistant text, so
this component is a heuristic where the others are counts. And old transcripts do not
record which plugin version was loaded — the tree infers it from time, which is why
the fuzzy stamp exists.

## 3. The live hook

```
node eval/hooks/install.mjs           # install all three
node eval/hooks/install.mjs --uninstall
```

| Hook | Event | Does |
|---|---|---|
| `session-end.mjs` | `SessionEnd` | Emits run events, same parser as the backfill |
| `pre-compact.mjs` | `PreCompact` | Writes the run-state scratchpad + a `run.compacted` marker |
| `compact-advisor.mjs` | `Stop` | Prints `compact: yes\|no — <driver>` at every lull |

All three write to `~/.claude/office-skills-telemetry/` — outside this repo, per the
run-state rule in `evidence-and-handoff.md`. Records are tagged `source:
"session-end-hook"` where the backfill's say `"backfill"`, so a retro number is never
mistaken for a live one, and both come from the same code path. Installing is
idempotent and preserves any hooks you already had on those events.

**Why the `Stop` hook exists.** Core has required a `compact: yes|no` recommendation at
every boundary since `2.0.0`, and the transcripts say it rarely happened — it asked the
planner to remember a rule at exactly the moment its context was fullest. The hook runs
core's own arithmetic instead. A hook cannot forget.

**Why `PreCompact` exists.** Session id already survives compaction in practice — 48 of
49 compacted transcripts keep a single id, so a PR opened after a mid-run compact is
already matched to the same run. But "in practice" is not a record, and the one outlier
is why the marker is written.

Every hook never writes to stdout on failure, never blocks, and always exits 0.
Telemetry that can fail a session is worse than no telemetry.

## 5. The goal

```
node eval/gate.mjs                    # exits 1 below target
```

**Landed rate ≥ 80%** — the share of office runs that open a PR. Enforced once a scope
holds 15+ runs, reported below that: a threshold on four runs measures the sample.

Deliberately **not** gated on the composite score. `gate` is string-matched and
`uninterrupted` sits at 94–100% across every office, so the composite is inflated and
cannot carry a threshold honestly. Landed counts an artifact outside the transcript.

The second 80% is skill-eval's `pass-threshold` in CI — the only number that exists
before a version has been used by anyone.

## 6. The debrief

```
node eval/debrief.mjs                 # -> eval/out/DEBRIEF.md
```

Groups runs by **failure signature** and names the file that owns the violated rule, so
a lesson lands in the skill instead of being relearned. A rule fails to land one of two
ways, needing opposite fixes: **never read** (sharpen the pointer) or **read and
ignored** (make the harness enforce it). The telemetry rewrite was the second kind.

## 4. The eval cases

```
node eval/validate-cases.mjs          # structural check, no API spend
```

Cases live at `<office>/evals/*.yaml` because that is where `skill-bench/skill-eval-action`
looks — it takes `skill-path`, not a separate evals path. CI runs one matrix job per
office on any PR touching `*-office/**` or `office-core/**`.

They exist because the backfill cannot cover everything. Most office sub-skills have
fewer than fifteen lifetime runs (see the thin-coverage list in `SCORECARD.md`), and a
brand-new version has none at all until someone happens to use it.

The suite deliberately grades two things and not a third:

- **Trigger discipline.** Every office hub says "Use ONLY when explicitly invoked …
  Never self-triggered." Each office carries at least one `expect_skill: false`
  control, and `validate-cases.mjs` fails if one goes missing. This is the cheapest
  regression to introduce — a description edit widens a trigger — and the most
  expensive to suffer, since a false positive costs a whole orchestrated run.
- **Protocol compliance that is pure reasoning:** plan-contract sections, routing that
  states a basis, the `compact:` recommendation carrying a real driver, the three
  verdicts by their literal names, `BRIEF DEFECT` on a mismatched pin, rejecting a
  handoff with no `## Self-review`, refusing exit 0 as evidence, demanding a control
  run before trusting a PASS.
- **Not** end-to-end execution. These cases run read-only (`Read,Grep,Glob`). Making
  CI launch a worker CLI and open real PRs would cost more than it tells you, and the
  backfill already measures real runs for free.

## Regenerating everything

```
node eval/build-version-tree.mjs && node eval/backfill.mjs && node eval/score.mjs && node eval/debrief.mjs
node eval/validate-cases.mjs && node eval/gate.mjs
```

`eval/out/` is gitignored. `VERSION-TREE.md` and `SCORECARD.md` are generated —
do not hand-edit them.
