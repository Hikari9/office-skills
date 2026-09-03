# Changelog — auto-office

## 17.1.0 — 2026-09-03

Core `17.2.0`.

**Rendered surfaces need a rendered read-back (`office-core/protocol/evidence-and-handoff.md`).**
New evidence row, plus the rule behind it: "deployed bytes == committed source" only proves the
deploy transported what you wrote, never what it does — the template engine, query string and
viewer scope all sit outside the bytes. Two runs on the same repo shipped blocking defects past
exactly that check (1,194 green tests on 09-02; 1,999 green tests **plus** a byte-identical
read-back on 09-03). Both 09-03 defects were *two individually-correct changes combining*, so
neither is visible in a diff, a unit test, or a hash. Requires: fetch rendered output per viewer
scope, run a one-variable-apart control, search the body for the engine error string, and name
any scope that could not be exercised rather than letting it read as passed.

**Brief each review round on the previous defect's shape, not its line
(`office-core/protocol/review-states.md`).** A fixed finding is a sample of a class. Round 2 found
a blocking defect in a file round 1 had cleared, because its brief named the round-1 mechanism and
told the reviewer to hunt more instances; round 3, briefed the same way, found a third residue and
correctly judged it unreachable. One paragraph, cheapest yield in the loop.

**herdr: the prompt text is positional — there is no `--message` flag
(`office-core/skills/herdr/SKILL.md`).** Passing one prints `unknown option: <the entire message>`
and sends nothing; piped through `tail` that reads as a successful echo. Three prompts were dropped
this way and a planner reported an executor that had never been prompted. Never pipe
`herdr agent prompt` through `tail`/`head`.

**herdr: bound the receipt wait, do not ban it.** `--wait --until working --timeout 20000` sits well
under the ~120s harness ceiling and returns machine-checkable receipt (herdr requires an observed
state change within 5s or returns `agent_prompt_stalled`). Supersedes the blanket "send without
`--wait`" guidance, which pushed callers onto pane-reading — itself unreliable, because a *resumed*
pane replays the prior transcript.

**herdr: a session exited with `/exit` is not resumable.** `claude --resume` replays the transcript,
executes the exit and quits, leaving a bare shell at `ctx: 0k`. A quota-killed session resumes with
its context intact; an exited one cannot. Added the distinguishing table — recover from the
committed work product instead.


## 17.0.0 — 2026-09-03

Core `17.0.0`.

- Herdr: `herdr agent start` now requires an explicit model and effort on every spawn and resume —
  brand alone silently inherited the harness default tier instead of the routing table's. The
  recipe block itself carries the flags (`--model`/`--effort` for claude, `-c
  model_reasoning_effort=` for codex), and the spawn step now asserts the launched `argv` back
  against what was intended, the same way `session_id` capture is already mandatory.

## 16.0.0 — 2026-09-02

Core `16.0.0`.

- Herdr: pane-move mechanics (same-tab no-op, the scratch-tab bounce to rearrange a layout, and
  `--tab` being required on the split form), `pane close`'s positional pane id, why a `down` split
  off a tab's only pane makes a row instead of a column, self-name awareness before issuing Herdr
  commands, and a status-check-before-send rule plus a non-blocking prompt recipe to replace
  `agent prompt --wait --until working`.
- Evidence: a green gate is not evidence for a claim narrower than what the gate checks (distinct
  from a successful exit not being evidence); `git status --short`, pasted, is now required before
  every status report — not only at the end.
- Roles and authority: a brief mentioning co-located agents must state the positive collision test
  (files changing under you that you did not write) rather than a bare "other agents are live"
  warning, which caused false-positive halts.
- Executor/reviewer briefs carry a Herdr self-identity anchor (`You are herdr agent <name>`), and
  Phase-1 scout dispatches now require the literal "Phase 1 is PLAN ONLY, `HEAD` must not move"
  clause plus explicit worktree ownership.
- `routing-outcomes.md`: recorded that an `opus` low reviewer caught a real production failure mode
  a `sonnet` high executor introduced and missed, independent of the executor's own effort tier.
- Closeout: a branch can be reviewer-approved and still be empty at merge — `gh pr diff <n>
  --name-only` before marking ready now confirms the pushed diff matches what review covered.

## 15.0.0 — 2026-09-01

Core `15.0.0`.

- Pane hygiene preserves idle agents, which may have dropped their prompt, and closes only confirmed
  `done` or gone agents.

## 14.0.0 — 2026-09-01

Core `14.0.0`.

- PR comments are limited to approved-plan/execution-begins, first-executor-completion, and final
  `APPROVED` summary events. Intermediate review verdicts, fix resolutions, and milestones remain
  in run artifacts.
- Pane hygiene closes only confirmed `done` or gone agents; idle agents remain available for prompt
  recovery.

## 13.0.0 — 2026-09-01

Core `13.0.0`.

- The pane-hygiene hook now **ships with the plugin**. It moved to
  `office-core/hooks/close-finished-panes.mjs`, so vendoring carries a copy into every office and a
  standalone install can reach it; `eval/hooks/close-finished-panes.mjs` stays as a shim so
  already-installed absolute paths keep working with nothing to re-run.
- **Opt-in, gated on detection.** `node eval/hooks/install.mjs --with-pane-hygiene` installs it;
  plain installs no longer wire it. The option is offered only where Herdr is actually present
  (`HERDR_ENV=1` or `herdr` on `PATH`) and is not mentioned at all elsewhere, rather than installing a
  hook that could only no-op. A plain re-run leaves an existing opt-in in place; removal is
  `--uninstall`. The script keeps its runtime guard regardless, because presence at install time does
  not mean presence at run time.
- Standalone install path documented: a `Stop` entry pointing at the plugin's own vendored copy.
- **An entry without `session_id` is now stated to be incomplete.** Closing that pane discards the
  only resume handle, and the id is readable from `herdr agent get` only while the agent lives. Seeded
  entries missing it already caused exactly that loss.

## 12.0.0 — 2026-09-01

Core `12.0.0`.

- Herdr pane closing becomes **mechanical**. The prose contract added in `11.0.0` did not stop panes
  from accumulating, because closing still depended on the planner noticing. The ledger now has a
  concrete path, `/tmp/office/panes.jsonl`, and writing a line to it is a required step *inside* the
  spawn block next to `herdr agent start` — it cannot be forgotten separately from spawning.
- New `Stop` hook, `eval/hooks/close-finished-panes.mjs`, wired by `eval/hooks/install.mjs`. At every
  turn boundary it closes ledger entries whose agent is `done`, `idle`, or gone, and removes them. It
  never closes an agent that is `working`, `blocked`, or `unknown`, never closes a pane whose agent
  has moved, and never closes a pane absent from the ledger — `herdr pane list` also shows the user's
  own panes and other sessions'. Silent when idle, re-runnable, and a no-op when `herdr` is not on
  `PATH`. `Stop`, not `PostToolUse`: a delegate has just reported when a turn ends.
- **A pending next round no longer keeps a pane open.** A session is restorable by
  `--resume <session_id>`, so continuity lives in the ledger's session id and the agent's written
  report, not in a live pane. The checkpoint table closes an executor or reviewer on its report,
  whatever the verdict; only `working` and `blocked` stay open.
- `auto-loop`'s drift-check item 8 now points at the ledger and the hook instead of restating the
  rule, and names a missing ledger line as the defect to fix.

## 11.0.0 — 2026-09-01

Core `11.0.0`.

- Herdr pane hygiene: closing a created pane is a **step the caller owes**, not a courtesy. A
  dispatch is finished when its pane is gone, not when its result is read. Callers keep a
  `created_panes` ledger in the run workspace and close from that ledger — never from
  `herdr pane list`, which also shows other sessions' panes and other workspaces. Four named
  checkpoints replace "eventually": executor task set approved, reviewer approved or dispositioned
  with no round remaining, one-shot side task returned (same turn), and final closeout.
- `auto-loop`'s drift check gains item 8, so finished-but-open panes are caught every iteration
  instead of accumulating one dead agent per dispatch until the user notices and asks.

## 10.0.0 — 2026-09-01

Core `10.0.0`.

- Herdr dispatch: `agent_status` is not receipt. A prompt is only confirmed live once the pane
  transcript reflects the brief, not when `herdr agent prompt` returns `working` — that status is
  frequently the agent's own startup churn (MCP client init, plugin loading). A long brief is sent
  as a path to a file on the git-ignored workspace with a short prompt telling the agent to read
  it, not pasted inline; a long single-shot paste into a just-started agent is what gets dropped.
- `auto-loop`'s liveness check now names the transcript, not a status field, as the observable for
  a Herdr dispatch, and states that re-prompting an agent confirmed idle-and-empty is not a
  two-writers risk, since nothing was ever started.
- Evidence: a live run on 2026-09-01 dispatched two Codex executors through Herdr; both prompts
  were silently dropped by the agents' own MCP-startup churn, both agents sat idle at the splash
  screen, and `agent_status: working` was read as success for both until a user asked whether the
  executors were actually running.

## 9.0.0 — 2026-09-01

Core `9.0.0`.

- Adds the shared Herdr dispatch override: when `HERDR_ENV=1`, every delegated brand runs in a
  visible Herdr pane, direct children go right, nested children go below their parent, in-session
  subagents are disabled, and created panes close after settled results are read.
- Preserves the existing CLI/in-session routing when Herdr is not detected.

## 8.0.0 — 2026-09-01

Core `8.0.0`.

- Gives the planner an explicit disposition checkpoint after `CHANGES REQUIRED`, including
  pre-fix and mid-fix self-reflection, while preserving independent re-review for gated changes.

## 7.0.0 — 2026-08-31

Core `7.0.0`.

- Adds the coordinated Executor-owned Tester worker exception for parallel test authoring, live
  test execution, checkpoint evidence, and bounded correction loops. This is a major core change
  because it widens the one-writer authority rule.

## 6.0.0 — 2026-08-31

Core `6.0.0`.

- Draft PR bodies now contain an immutable GitHub blob deeplink to the tracked plan, anchored to
  the plan-only first commit.

## 5.1.0 — 2026-08-31

Core `5.1.0`.

- Every complete reviewer verdict is now copied to the existing draft PR before triage or
  follow-up.
- `CHANGES REQUIRED` findings are preserved verbatim, with finding-by-finding resolution comments
  after each fix wave for resumeability.

## 5.0.0 — 2026-08-31

Core `5.0.0`.

- All executor routes now bootstrap a tracked plan-only first commit, push their named branch, open
  one draft PR referencing the plan and issue, and post resumability comments for every milestone.
- The draft PR stays draft through review. Final closeout removes the plan before marking the PR ready
  and merging it; milestones are no longer merged independently.
- Re-vendored the breaking core authority and milestone lifecycle contract across every route.

## 4.3.0 — 2026-08-29

**Codex code-review effort is priced per leg, by blast radius** (standing user decision, 2026-08-29).

- A uniform top-tier code-review gate outspends the work it gates: measured at **293k** tokens for
  one `xhigh` review against a 226k-269k executor leg. `auto-routing`'s *Reviewer selection* now
  prices codex code-review effort per leg — `xhigh` for shared libraries, Auth/Order-0 writers, and
  anything production-facing, irreversible, or externally visible; `high` for docs,
  evidence-checking, and applied-state claims the planner can verify with a `git grep` plus a
  `--dry-run`. Row 1 wins on any match, and an unpriceable leg is row 1.
- **The codex code-review floor is re-declared from `xhigh` to `high`** to make that legal
  (`references/delegation-map.md`). The codex **plan**-review floor stays at `xhigh`, and `claude`
  stays at `opus` low on both gates. No gate is skipped and no leg is raised above its brand's
  standing default, so the `xhigh`/`ultra`/`max` ceiling is unchanged.
- Normative surfaces updated together with the rule: the `auto-routing` role table, the
  effort-goes-to-the-gates paragraph, the copy-paste launch line, the hub's reviewer row, and
  `codex-office/skills/codex-reviewer`. The hub's fixed-by-role line is left alone: the hub has a
  12000-byte budget and the reviewer row it summarises now carries the range.
- `codex-office` 3.2.0 moves with it: `codex-cli`'s effort list, `references/reviewer-brief.md`'s
  CLI invocation (now `<xhigh|high>`, not a literal), and the hub role table. Without that sweep
  `delegation-map.md`'s stricter-rule clause would have arbitrated `xhigh` back on every codex code
  review; that clause now carves out blast-radius pricing and its two-floor consequence is worded
  direction-neutrally, since the codex floors no longer coincide.
- Recorded in the ledger as standing lesson 42, citing `auto-routing` as the owning file.

## 4.2.0 — 2026-08-27

- **CLI headroom is ALWAYS probed during fit-test.** The quota probes (`codex-usage.py`,
  `claude-usage.py`, `agy-usage.py`) run as part of the fit test before interviewing or planning,
  ensuring live headroom figures per window are known upfront across gears. Headroom is reported
  in the kickoff line with reset times.
- **`agy-usage.py` produces Gemini numbers by default and never Claude numbers.** Any Claude
  buckets in the CloudCode API response are filtered out, and default reporting / tightest headroom
  tracks Gemini models.
- **`codex-usage.py` adds 5-hour window support.** Reads `primary_window` (5h) alongside
  `secondary_window` (weekly), reporting both windows with reset times and reporting tightest
  headroom across the two.

## 4.1.0 — 2026-08-26

**Codex effort inverts: effort goes to the gates, not the implementation** (standing user
decision, 2026-08-26).

| Role | Was | Now |
|---|---|---|
| codex executor | `gpt-5.6-luna` xhigh | `gpt-5.6-luna` **high** |
| codex worker (default) | xhigh | **high** |
| codex **plan**-review gate | low → high (earlier today) | **xhigh** |
| codex **code**-review gate | high | **xhigh** |

The reasoning was already on record in this spoke and now the defaults match it: *a bigger
executor does not fix a wrong brief, it implements it more convincingly.* Effort buys more at
the gate that catches the wrong brief than in the process producing one.

On the index this is −3 for the executor and +3 for each gate — Luna scores **52 / 50 / 47**
across max / xhigh / high. Both remain well under Terra max's 55 at a fifth of the price; the
whole codex row stays a deliberate cost trade the user owns.

- The "user-invoked only" ceiling rule now cites the **reviewers'** standing xhigh rather than
  the executor's, which no longer exists.
- The code-review row in the delegation map now states its per-brand efforts, matching the
  plan-review row that already did.
## 4.0.1 — 2026-08-26

- **Codex plan-review floor raised to `codex-luna` high** (was low), matching the codex code-review
  floor. `codex-luna` low is a materially weaker reader than `opus` low, so the two brands' floors
  were not equivalent despite reading as a matched pair. Fixed in the role table, the delegation
  map, and the `codex exec` flag block — all three had said `low`.
- The two-floor rule now states floors **per brand** rather than asserting both are `opus` low.
- `eval/gate.mjs` reports the compaction segment beside the goal: runs whose session compacted land
  at 90% vs 30% for runs that did not, and the gap holds among 40+ turn runs (90% vs 32%). That is
  the evidence the 80% target is reachable rather than aspirational.
## 4.0.0 — 2026-08-26

Core `4.0.0`. **Breaking: claude-office is absorbed into this office and no longer ships.**

- **The claude route lives here now.** `claude-cli`, `claude-cli-send-message`, `claude-executor`,
  `claude-reviewer`, and `claude-closeout` moved into `skills/`; their references moved into
  `references/`. `claude-planning` was dropped — `auto-planning` already owns the planner role, and
  it scored lowest of every office skill (58 over 5 runs).
  The reason it lives here rather than staying a sibling: **`claude-reviewer` is the default
  code-review gate for every route**, whoever executed. A gate every run depends on cannot sit in a
  plugin a run might not have installed.
- `references/routing.md` → `references/fan-out.md`, so it stops reading as a sibling of
  `auto-routing`, which decides something entirely different.
- **Self-review is mandatory for every role**, not just the executor (core `4.0.0`).
- **Telemetry moved into hooks.** The hub no longer instructs anyone to record events;
  `eval/hooks/` reads the transcript. The old instruction produced zero records in three weeks.
- **Hub cut to 11,992 bytes**, under the 12,000 budget for the first time. The 24-row Red Flags
  table moved to `references/red-flags.md` behind a branch-naming pointer, and now also carries the
  pre-dispatch checklist and the four recurring planner defects distilled from the 2026-08-04
  Opus-5 mistake catalogue.
- **agy model slugs are resolved, not pinned.** Everything that named a Gemini version now says
  *Flash latest* and resolves it via `agy-office/scripts/agy-model.sh`. Four files had named four
  different versions.
## 3.2.1 — 2026-08-25

Core `3.1.0` (minor, additive). Re-vendored only — no adapter-specific change.

- Core `closeout.md` now documents a **standalone invocation** mode: confirm target, commit,
  gate, PR, document, sync, cleanup, and close loops all still apply, but with no milestone list,
  no Office Kernel packet, and no plan file — for closeout run directly on work that never went
  through the full pipeline. Existing Upline-closing behavior is unchanged; it still applies
  whenever a handoff file with open entries actually exists.

## 3.2.0 — 2026-08-25

Core `3.0.0`. Two changes, both directed by the user.

- **Code-review gate drops to `opus` low** (was `opus` high). The gate's strength is independence,
  freshness, and a pointed brief — not effort tier. The plan-review floor was already `opus` low;
  the two floors are still declared separately and neither promotes the other.
- **Executor self-review is mandatory** (core 3.0.0). The executor reviews its own work per task
  before marking it complete — **including work it implemented inline**, the only work with no other
  reader before the gate — and once over the cumulative `BASE..HEAD` diff after the gate is green.
  Findings go in a required `## Self-review` handoff section. A handoff without it is returned to the
  executor **before** review is dispatched, and its findings are never copied into the reviewer's
  brief (that anchors the gate). Self-review is a pass, never an approval.
- **`codex exec` dispatches now mandate `-c model_reasoning_effort="<effort>"`.** There is no
  `--effort` flag on `codex exec`, so `-m` alone silently inherited `model_reasoning_effort` from
  `~/.codex/config.toml` (`medium` on the machine checked) while the role tables said `xhigh` —
  verified 2026-08-25 against Codex v0.149.1. An unrecognised effort is accepted silently and echoed
  in the launch banner, so the banner's `model:` / `reasoning effort:` lines are now the required
  read-back and the telemetry source.
- The planner's own review pass is unchanged: planner-as-reviewer stays exactly as it was.
- **Core protocol note:** the planner-works-in-the-worktree rule, previously only in agy-office's
  vendored snapshot, now lives in the root `office-core` source so re-vendoring cannot drop it.
- **Codex-brand routing moves off `codex-sol` to `codex-luna`** for planner, plan-reviewer, and the
  codex-as-planner code-review path. `codex-sol` no longer appears as a routing option.


## 3.1.0 — 2026-08-14

Core `2.0.0`, unchanged. **The executor executes the plan.** Triggered by an observed run in which
the planner dispatched a per-task worker for task 1 of a 7-task plan and had queued itself to
dispatch the rest — turning an opus planner into a scheduler for a plan it had already written and
had adversarially reviewed.

### The defect

`office-core/roles-and-authority.md:11` already defines the executor as *"implementing the approved
plan"* — the plan, not a task — and `auto-routing`'s dispatch-form table never had a row for
planner → per-task worker. So the behaviour was never authorised. What **enabled** it was shape:
the planning spoke's assignment table carried a per-task `Brand` and `Dispatch` column and never said
who launches, so a planner filling it in reads it as a list of processes to start.

The same run also made the preview apply planner-held, contradicting the user's own standing rule
that preview/staging writes are delegated.

### Changes

- **Hub role table**: the executor executes the **whole plan end to end**, fans out its own workers,
  commits, pushes, and opens the PR. The planner's job now names dispatching **one executor per
  repo** and explicitly forbids dispatching a per-task worker.
- **New hub section — "Who owns what, once the plan is approved"**: a two-column split. Planner keeps
  only what the **user** must see, the **anti-self-gating** gate, and **irreversible outward**
  actions. Preview/staging writes, commits, pushes, PR-opening, non-deploying merges, fix
  implementation, and run-report drafting all move to the executor.
- **Five protected plan fields**: the executor may amend the *how* — committing the amendment and
  reporting its **hash plus rationale** — but never `goal`, `done_criteria`, `blast_radius`,
  `named_actions`, or `non_goals`. A code reviewer reads a clean diff against an amended contract and
  cannot see that the contract moved; scope is the one thing no downstream gate catches.
- **Assignment table reframed, not removed**: it stays per-task for cost visibility at approval, but
  is stated as *the planner's dispatch design handed to the executor*. Adds a **row 0** naming the
  executor and its whole-plan scope, renames the reason column to `Why this dispatch form`, and
  requires a justification per row — parallelism, a different brand, isolation, an event loop, or
  (for `inline`) that the brief would exceed the edit.
- **A fan-out tree is now required in the plan** — an ASCII diagram showing what runs in parallel and
  where the barriers are, so the run's width is legible at approval rather than inferred from a table.
- **Launch-count self-check** before approving your own table: more than (one executor per repo) +
  (one reviewer per task) + (Phase 1 scouts) means you wrote a scheduler.
- **`EXECUTOR-STATE.md` is mandatory**, rewritten after every task. The consecutive-task memory cap is
  now managed by the executor **re-briefing itself** from that file; the planner never reclaims tasks
  to fit a cap. A missing state file is a stop.
- **Consultation is brand-dependent and the docs now say so**: `claude` executors have a live inbound
  channel; **`agy` has none** for a running `--print` process, so an agy consult costs an exit and a
  `--continue`. This is why the state file is mandatory rather than encouraged.
- **Fix loop**: every fix returns to the executor, one-liners included. The planner triages and
  contests findings; it implements only when the executor has already retired and the brief would
  exceed the edit.
- **Git authority**: executor commits, pushes its own branch (named, never `HEAD`), opens the PR, and
  may merge a **non-deploying** branch. Merges into a deploying branch stay planner-held.
- **Routing table**: adds explicit planner→reviewer and planner→scout rows, and carries a struck-out
  `planner → worker for a numbered task` row labelled *does not exist*, so the absence is visible
  rather than merely unstated.
- **Six new red flags**, each the verbatim rationalisation from the observed run — including "task 1
  is recon so I'll dispatch it myself", "the executor's brief isn't writable until task 1 answers X",
  and "the memory cap means I have to split the tasks up myself".

### Routing and model catalog

- **`EXECUTOR-STATE.md` is never committed.** Worktree root, `.git/info/exclude` (never the repo's
  `.gitignore` — that is itself a committed file), dies with the worktree. The brief must forbid
  `git add -A` / `git commit -a`, since the executor now authors its own commits and a blanket add is
  exactly how a scratch file reaches a PR. The durable record stays the merged branch plus amendment
  commits.
- **Codex executor default is now `gpt-5.6-luna` `xhigh`** (standing user default, 2026-08-14) — a
  caller override made durable, which is the only legitimate route to an `xhigh` default. Documented
  honestly as a **cost trade, not an upgrade**: Luna xhigh scores **50** vs Terra max **55**, at
  **$0.17/M vs $0.73/M**.
- **Agy executor default is now `gemini-3.7-flash-high`** (was 3.6). Updated in `auto-routing`,
  `agy-office`, `agy-office/agy-planning`, and the `agy` skill's catalog — the last re-read live from
  `agy models` rather than edited from memory.
- **Workers may be ANY mix.** The routing spoke now states explicitly that a worker's brand, model,
  and effort are independently assignable — above the executor tier, below it (`haiku` for mechanical
  sweeps), or cross-brand. Adds a kind-of-question → model table keyed to AA Intelligence Index
  scores.
- **Effort is a scored axis, not a synonym for "try harder."** Both spokes now carry the two
  counter-intuitive orderings: **Luna max (52) outscores Luna xhigh (50)** — effort labels do not rank
  monotonically — and **Gemini 3.7 Flash high (56) outscores Terra max (55)**, so "flash is fast but
  not smart" is retired.
- **`model-benchmarks.md` refreshed** to `captured: 2026-08-14`, Intelligence Index **v4.1.1** (its 9
  evaluations named, with a rule to quote the index version alongside any score since v4.x is not
  comparable to earlier captures). Adds an *Office role* column so the table shows who occupies each
  slot, and Luna's ~50s time-to-first-token — irrelevant to a long executor run, wrong for a short
  interactive one.

- **Scout fallback**: `agy` is the default Phase 1 scout brand; when unavailable, fall back to the
  planner's own brand at its **lower** tier (`haiku` in-session for claude, `gpt-5.6-luna` for codex),
  never planner tier — scouting is breadth-first reading, and planner tier spends Decider rates on
  locating files. Echo the substitution in the kickoff line.

### Docs self-heal — the ledger is now compiled, not appended

- **`routing-outcomes.md` compacted 7,802 → ~2,900 words**, its first consolidation. 30 verbose rows
  became **40 numbered standing lessons**, each one line and each **citing the file that enforces
  it** — because the file's own rule already said prose here binds nothing. Rows keep the routing
  data (date, slug, brand, model, rounds, tokens, wall, verdict) plus a clause and a `§n` cite.
- **The file was violating its own two rules.** Its "two lines per row, hard cap" is dated
  2026-08-12 and the rows *on that date* run 1,500+ words; and its opaque-slug rule was broken by
  rows naming real hosts. Both fixed: rows re-slugged (`repo-c/e/f/g` added to the gitignored map),
  verbose originals archived to `routing-outcomes-archive.local.md`. **Git history still carries the
  real names** — not fixable from the plugin, and stated in the compaction log rather than left
  implicit.
- **New self-healing clause, binding every long-lived `.md`**: compile weekly or past ~150 lines /
  3,000 words; archive raw as `*.local.md`; promote recurrences to numbered rules with owners; merge
  duplicates by mechanism; **keep every number — a compaction that loses one failed**; an unfixed
  recurrence gets *louder*, not shorter. Test: *would the next reader act on this, and find it in ten
  seconds?* **An essay that adds tokens without changing a decision is a defect in the document.**
- `.gitignore` widened from one filename to `references/*.local.md`.

### Not changed

Core is untouched. `roles-and-authority.md` §35 (*the planner may implement inline*) stands; this
release narrows its **live range** in commentary — a fix whose brief would exceed the edit — rather
than removing the permission, since the office may bind itself more strictly than core but may not
rewrite a shared invariant locally.

## 3.0.0 — 2026-08-14

Core `2.0.0`. **The efficiency release.** The office was paying full price on every run and the
user's own ledger said so — one row records closeout at ~8× implementation. Four changes, three of
them deletions.

### The fit test now picks a gear, not a yes/no

`direct` / `express` / `full`. Express is a **core-declared** phase set: short plan → implement →
**one** Opus code review → land it. No plan-review, no quota probe, no benchmark read, no run
report, no ledger row. Cap **2** review rounds; a second `CHANGES REQUIRED` **promotes the run to
full** rather than funding a third. Express also promotes before dispatch if the run needs >1
executor, >1 repo, or more than ~3 tasks.

Any yes to the irreversible/production/externally-visible question still forces **full**, and no
caller override may name express for such a run. Express drops **phases, never floors**.

Why: the office was all-or-nothing by construction (core forbade a partial office outright), so a
medium-sized run either paid for the whole machine or got nothing. In practice it got nothing — the
user ran vanilla Opus instead and got the same result. Express is the missing middle gear.

### The run lands each milestone instead of one PR at the end

The plan declares `milestones:` — groups of done-criteria that are shippable on their own — at Phase
1, reviewed at approval. When a milestone's criteria go green the loop gates, commits, opens the PR,
and merges the promotion chain, **then continues**. `auto-closeout` now runs once per milestone;
sync, worktree removal and loop closure stay terminal.

**The merged branch is the resume record.** Resume reads what is merged, not a plan file's task
notes. An interruption costs one milestone rather than the run — which is the actual problem this
solves: work that lands only at the end gets abandoned when the session's context is lost.

### Stop conditions: four → two, and production work runs

`named_actions:` replaces `planner_held:` in the GOAL block. Planner-held now names the **actor**
(the planner performs it, never a delegate) and no longer implies a **pause**. An action the approved
plan names verbatim — exact command, target, what it changes, dry run, revert target, read-back —
executes without a fresh go-ahead. Deploys, prod applies, migrations, merges to deploying branches.

The two remaining stops: an **external send** (never pre-authorizable), and a **user-owned decision
the plan did not anticipate**. A vague entry (`deploy when done`) names nothing, is unauthorized, and
stops the run; a failed precondition is likewise a stop, and it stops *because the precondition
failed*.

The gate did not disappear — it moved to approval, onto a list the user reads once, instead of
firing mid-run on a decision they already made.

### Live-system work is delegated with its access

New brief clause 4, and a matching rule in `auto-routing` and `delegation-map`: a task touching
Rock/Basecamp/Sheets/any MCP server is dispatched with **those tools enumerated in the launch**,
**production reads included**, and its **data shape pinned** — entity, operation, field names, ID
provenance, expected envelope — with the executor pasting back one real record.

Root cause of the old behaviour, now fixed in `claude-office/skills/claude-cli`: the default scoped
`--allowedTools` allowlist carries **no MCP tools at all** unless named. Agents reported they could
not reach the system, work bounced back to the planner, and the episode read as a capability limit.
It was a dispatch bug. A pinned shape contradicted by reality is now a `BRIEF DEFECT` — one read
instead of a wrong implementation plus the rounds that find it.

### Removed

- **The PM role, entirely.** The one run that spawned one recorded it dispatching three lanes for
  ~1h and then being driven directly by the planner anyway. At ≥2 executors the planner distributes
  and monitors. `auto-pm-fanout` is withdrawn; `auto-no-coordinator` replaces it. The underlying
  lesson — anything containing a blocking wait must be a background process, since an in-session
  subagent unwinds the moment it has no live children — is kept, reframed on **workers**, which is
  where it was also observed.
- **The mandatory quota probe.** Demoted to on-demand. Three consecutive runs logged "headroom never
  probed" as a defect, filed an issue about it each time, and lost nothing — the definition of a step
  that was never load-bearing. Probe when the run is long, a brand looks thin, or the user asks.
- **The cost retrospective**, and 7 of the run report's 14 fields. What survives: goal, landed,
  route, task ledger, stops, **not verified**, still open. Express emits no report; the PR bodies are
  the record.

### Tightened

- **Ledger rows are capped at two lines.** Historical rows are kept as history, explicitly *not* as a
  template — they reached several thousand words each and stopped being a routing input. A lesson
  needing more than a sentence is a rule change: make the change in the file that owns the rule and
  let the row cite it.
- **Self-heal bar raised: write a rule or write nothing.** Nothing durable to add is now stated as
  the *expected* outcome. This mechanism is why the plugin reached 9.5k lines.
- `auto-loop` brief clauses 2 and 3 compressed — every rule kept, the narrative evidence around them
  cut to citations.

## 2.10.0 — 2026-08-13

Core `1.5.0`. Adds the **fit test**: before an invoked office interviews, plans, or dispatches, it
prices the whole run and says out loud whether the office is worth paying for.

- **The office now discerns whether to be an office.** `roles-and-authority.md` gains *Fit test —
  before the office runs at all*, above the per-task delegation test. Four questions — risk, size and
  shape, ambiguity, and whether a fresh adversarial reader would catch something. Any yes on risk, or
  two or more yeses across the rest, and the office runs as specified; none, and the run is overhead,
  so the work is done directly under the same safety rules.
- **It explains, it does not ask.** The verdict is stated in two or three sentences — the call, the
  reason, what the alternative would have cost — then the run proceeds. A user who typed the office's
  name gets an explanation of a downgrade, never a request for permission to think.
- **Bounded so it cannot become a bypass.** It chooses only between the full office and direct work;
  no partial office. It may never downgrade an irreversible, production-facing, or externally visible
  run, and never downgrade because quota is short or an executor brand is unavailable — those are
  routing problems, answered by the routing table rather than by less review. A caller override
  outranks it in both directions.
- **Restated in `auto-planning`**, which self-runs the test if the spoke is entered directly or
  after a compaction that ate the hub's pass — a run that fails it gets done, not planned.
- **Wired into the hub** so it is read before anything else, restating the rule at the entry point.

## 2.9.2 — 2026-08-12

Self-heal from a live run (#118, rock-pages unified-chrome UI fixes + PROD deploy). One change to
`auto-loop`'s mutation clause: **restore an uncommitted mutation by file copy, never `git checkout`** —
`git checkout -- <file>` reverts to the committed version and silently wipes the uncommitted edits the
mutation was probing, desyncing generated-from-authored artifacts. Snapshot with `cp` before mutating
(or commit first). Measured cost: a four-edit re-apply after a `git checkout` wiped an authored `.lava`
while its generated twin kept the edits.

## 2.9.1 — 2026-08-12

Self-heal from a live run (#92, rock-pages Merge Person). One change to `auto-loop`: the goal loop's
drift check now carries a **deploy-completeness** rule — a change to a shared source file must
enumerate its live consumers from the diff (grep every apply command that reads it), re-apply all of
them, and verify every host runs the *same build*; removing a shared action is ordered sync-first,
remove-second. A `.lava` block that ships as two Rock Block rows via two apply scripts was re-applied
on only one host per round, silently ran stale code on the other, and then a removal broke it — a full
extra dispatch to relearn a lesson the target repo's memory already held. No safety rule relaxed, no
cap raised, no blast radius widened.

## 2.9.0 — 2026-08-11

Core `1.4.0`. Five changes from live-run failures: planners holding work inline that the executor
should have bought, agents losing the protocol past Phase 2, code review running long because
findings named defects but not fixes, unreadable spawned sessions, and a hub budget the router had
already outgrown.

- **The delegation test buys a fourth thing: price.** `roles-and-authority.md` — the planner is the
  office's most expensive writer and the executor is sonnet-tier by fixture, so implementation
  *volume* is itself a purchase: two to six times cheaper per output token, in parallel, at the same
  gated quality. Task count is still never the reason to delegate; the tokens those tasks would cost
  at planner rates are. Without this line a nine-task run held inline read as compliant.
- **The justification clause is inverted, so the bias has to be written down.** `plan-contract.md`
  already demanded a one-clause reason per *delegation*. Now an **inline** row must also state what a
  delegation would have bought and why the brief costs more than the edit — and an inline row that
  cannot be justified in a clause is one to delegate. The plan-reviewer checks it like any other
  claim. Every file-count threshold (`1–3 files` / `>3 files`) is deleted rather than retuned: three
  files inside one function and three files across three surfaces are not the same work.
- **Re-read the protocol at every phase boundary and after every compaction.** Nothing previously
  told the survivor of a compaction to reload; the loop recommends compacting at every task boundary,
  so a run reliably kept its GOAL and lost its gates. The rule binds whoever holds the phase — the
  same agent across a boundary as much as a fresh one.
- **Code review moves to `opus` high and its findings carry a fix guide.** Each numbered finding adds
  `Fix:` (the approach, not a patch), `Where:` (the address), and `Rejected:` (the plausible-but-wrong
  fix and why it fails) — the last of these because a finding whose obvious remedy targets the wrong
  term ships a freeze as a fix for a lag. Two guardrails travel with it: the reviewer still never
  writes the fix, and on follow-up rounds it judges the result on correctness, never on whether its
  own suggestion was followed. **Plan review stays at `opus` low** — the ledger records it returning
  the best value per token in the run five times running, and the two-floor design is unchanged.
- **The plan-defect presumption tightens from 2 consecutive to 2 total.** An `APPROVED`-then-rejected
  sequence no longer resets the count: a task that needed two rounds of findings is a task whose
  instruction was wrong, whatever landed between them.
- **Every dispatch announces its role in its first brief line** — `[ROLE] <repo> — <task>`, with the
  same string passed to any label flag the brand exposes. The first line is the carrier because codex
  and agy expose no naming flag at all. The prefix stays a display convenience: matching is still on
  session or worktree identity, never on a label.
- **Hub byte budget 9000 → 12000** (`scripts/check-plugins.sh`), still a warning, not a failure.

## 2.8.0 — 2026-08-11

- **The both-parents diff must be TWO-dot** (`auto-closeout`, merge rules). The three-dot form
  **cannot** find a dropped hunk — it diffs from the merge-base, so content the parent added after that
  base and the merge then dropped reads as "out of scope" rather than as missing. Observed this run: a
  three-dot diff showed exactly the 6 intended feature files while 47 lines of the target's own test
  mocks had been silently dropped from a 7th file the branch never touched, reddening 8 tests in a page
  the run never edited. The rule now names the form, states the expected result (differ from the target
  parent by *only* the intended files), and adds a hash sweep over every path the parent changed since
  the merge-base, so completeness is proven rather than inferred.
- **Read the promotion chain out of the repo before opening the PR** (`auto-closeout`, gate item 5).
  A base picked from the repo's *default* branch is a guess. Getting it wrong late forces a merge of the
  target, which invalidates the run's green gate under 2.7.0's rule — strictly more expensive than one
  `gh pr list --state merged` lookup.
- **A version bump must be proven unclaimed across every ref** (`auto-closeout`, gate item 6, new).
  Comparing `>` against the promotion branches is not this check: an unmerged branch already holding the
  value passes it. Observed: 2.28.2 claimed by *three* branches at once, and a `git merge-tree` probe
  showed the dangerous one was the branch sharing **no** code with ours — it merged completely clean,
  two changesets under one version with zero signal. Requires `git log --all -S`, re-run immediately
  before the merge since a claimant can land in between.

## 2.7.0 — 2026-08-11

- **Closeout: a branch behind its target must be merged, re-gated, and re-reviewed**
  (`auto-closeout`, new subsection under "Closeout lands the work"). Promotion assumes the branch was
  built against the tree it lands on; once it is behind, the run's green gate describes a tree that no
  longer exists, so the full gate re-runs on the MERGED tree as a *cause*, not an exception to the
  validation budget. Four rules carry the lesson. **A clean auto-merge is the hazard and a conflict is
  the reassurance** — a conflict is a question git asks out loud, while a clean merge of a file both
  sides edited yields an untested tree silently; `git merge-tree`'s "no conflict" is not clearance and
  can simply be wrong (observed: it predicted none, the real merge produced three, and the naive result
  contained two copies of one JSX block, one referencing deleted state). **Resolve to the union of
  intents, never to a redesign** — take the other side's position/structure with your content, and
  preserve their shipped behaviour verbatim *even when it is wrong*, filing the defect instead, because
  a fix made inside a merge is attributed by `git blame` to your PR and sends the next debugger to the
  wrong one. **Diff against BOTH parents**, the only check that catches a silently dropped hunk. And
  **re-run the task's own mutations against the merged file** — tests passing after a merge proves they
  still run, not that they would still catch what they were written for.
- **Closeout: the deploy check outranks the local gate for anything the toolchain cannot observe.**
  Install/lockfile consistency, route and prerender behaviour, and env-dependent config can all be
  green locally and broken on the platform. When a deploy check fails where every local gate passed,
  suspect a local-toolchain blind spot before suspecting the check (observed: local pnpm silently
  ignores `pnpm.overrides` and rewrote the lockfile without it; lint, tsc, the full suite and a
  production build were all green while the deploy could not install at all).

## 2.6.0 — 2026-08-11

- **Closeout: file the carries as real issues, and close only what is actually merged**
  (`auto-closeout`, new "Close the issue loop" section). A run report is a record; the issue tracker
  is what the team reads, and closeout owes both. Two rules: **filing an issue is not a
  `PLANNER-HELD` action** — push/PR/merge/deploy are held because they are irreversible or
  user-facing, an issue is neither, and a hold on *shipping* must not silently expand into a hold on
  *recording* (observed: a planner read "you may not push/PR/merge/deploy" as covering issue
  creation and left eight findings in a draft file nobody would read again). And **close an issue
  only when the work is on the default branch**, verified with
  `git merge-base --is-ancestor <sha> origin/<default>` — not when the branch is ready, not when the
  reviewer approved. A promotion-chain merge usually will not auto-close it, since `Closes #N` fires
  only for the default branch. If a hold left the work unmerged, leave the issue open and say what
  would make it closable; closing it would tell the team a fix shipped that nobody can use. Also:
  split filed carries by triage destination rather than by count, so a design-level defect is not
  triaged as tidy-up alongside a doc nit.

## 2.5.0 — 2026-08-11

- **Loop: a brief must name the OBSERVABLE OUTCOME, and the planner must verify the path to it
  against the code graph before writing the brief** (`auto-loop`, brief clause 3). A brief that
  specifies a mechanism is satisfied by fixing that mechanism, which is not the same as fixing the
  symptom. Adds three sharpenings: **a data path is not automatically a render path**; **enumerate
  the full lifecycle of any state the task introduces** (for a cache that is write / read / **clear**
  — a brief naming two of three ships the third as a defect); and **grep the done-criteria for the
  field the task is about before funding a fix wave**. Evidence, one run: four briefs named a
  function feeding a sort key, a dead fallback branch, or a write half while the visible value came
  from elsewhere — each passed review on the thing the brief named and left the symptom intact,
  costing ~6 review rounds at reviewer rates. Twice the missing seam was the *clear*, i.e. state
  written and read correctly that then shadows the server for the whole session while the pending
  indicator makes it look more correct. The decisive fact ending the run's worst task — that the
  field appeared in no done-criterion — was one grep, run only after the second CHANGES REQUIRED.
- **Loop: a mutation-testing reviewer is NOT read-only; verify the tree after every review**
  (`auto-loop`, safety rules). It edits source and restores as the *last* step of an interruptible
  sequence, so a killed reviewer leaves the mutation applied and never reaches the "tree is clean"
  line its own report would have carried. Treat a missing completion record as *assume a mutation is
  applied*. Evidence: a reviewer stopped by a machine shutdown left a reconcile call silently
  disabled in the working tree; the next executor would have started from it, in a file outside its
  own scope. Every prior one-writer rule points at executors, which is why the gap survived. Requires
  reviewers to apply/run/restore each mutation **within a single tool call** with a restore proof, so
  the window closes structurally rather than by discipline.

## 2.4.7 — 2026-08-09

- **Loop: a mutation that stays green is a claim about the mutation first** (`auto-loop`).
  Before reading a mutation's verdict, prove the break took effect — that the edited file is
  the one the gate loads, that the anchor existed, that the injected code runs in the scope
  the gate inspects. A broken mutation and a blind gate produce identical output, and the
  broken mutation is the likelier of the two. Evidence: three of a planner's own mutations
  were invalid in one run (wrong artifact, absent anchor, wrong scope); all printed
  "0 FAILs" and two were a sentence away from being reported as "the gate is blind".
- **Routing: the in-session unwind test is a BLOCKING WAIT, not a "watcher" role**
  (`auto-routing`). The prior wording scoped the rule to long-lived watcher roles, so it did
  not obviously bind an ordinary worker whose step happens to contain a long command.
  Observed on a `sonnet` worker told to apply, clear cache and read back a deployment: it
  armed a Monitor, said "still running — I'll report back", and stopped. "I'll report back"
  in a subagent's final message is a return.

Both sharpen the existing rule in its owning spoke rather than appending a scenario. No
safety rule was relaxed, no cap raised, no reviewer downgraded, no blast radius widened.
Also corrects a pre-existing drift: `plugin.json` read 2.4.5 while the CHANGELOG's top
heading read 2.4.6.

## 2.4.6 — 2026-08-09

- **Routing: breadth-fit is the wrong axis when the deliverable is EVIDENCE**
  (`auto-routing`). Before routing on task shape, ask what the task produces. Tests,
  gates, verifiers and migrations are judged by whether they can FAIL correctly, and a
  brand that writes plausible code writes equally plausible tests — which are worthless
  in a way working code is not. "Frontend" and "mechanical" no longer override this.
  Evidence: an agy lane produced working blocks plus 79 harness checks that passed
  against deliberately broken code; the bad evidence cost two review rounds, and the fix
  lane sent to repair it introduced two page-blanking blockers.
- **Planning: a named hazard your gates cannot detect is a TASK, not a caveat**
  (`auto-planning`). A plan that writes down its worst failure mode and mitigates nothing
  reads as diligence and functions as none — every executor after that point works blind
  in the exact place the plan flagged as most dangerous. Evidence: a plan stated "nothing
  in this repo executes Lava or SQL", shipped no gate for it, and the fix loop then rewrote
  T-SQL with zero runtime feedback for four rounds.

Both are rule sharpenings in the owning spoke, not appended scenarios. No safety rule was
relaxed, no cap raised, no reviewer downgraded, no vendored core file touched.

## 2.4.5 — 2026-08-08

- **Core `1.3.0`: the compaction recommendation is now a shared rule.** `evidence-and-handoff.md`
  gains **§ Run-state durability and the compaction recommendation** — at every phase or task
  boundary the planner posts `compact: yes | no — <reason>`, because the planner cannot compact
  itself and only the user can invoke it. It carries the three `yes` conditions, the rule that a
  live executor never withholds a `yes` (a dispatch is the ideal compaction window), and the rule
  that a **`no` is a defect report, not a wait instruction** — run state living only in a context
  window must be written to a file, which turns the answer into `yes`. Previously this existed only
  in `auto-office/skills/auto-loop`, so the three linear offices lost planner state at every window
  boundary with nothing telling them to.
- `auto-loop`'s section is now a **narrowing that links core** rather than a duplicate: the boundary
  is a task reaching `APPROVED` (this office loops, so it has more boundaries), and the field rides
  the existing status line. The brief-sizing evidence stays here, where it was measured.
- **The recommendation is now cost-driven, not just state-driven.** A clean boundary makes
  compaction *safe*; it does not make it *worth it*. Core states both tests and the arithmetic:
  saving scales with context held × turns remaining, while cost is the summary plus everything
  **re-read afterward at the current model's input rate**. Two inversions follow — a small context
  at a clean boundary is a `no`, and a heavier planner should compact earlier than a lighter one
  holding the identical context. The reason field must name the driver, not say "clean boundary".

## 2.4.4 — 2026-08-05

- **The four remaining underspecified clauses are now decidable**, per operator ruling:
  - **Liveness window is 25 minutes** (`auto-loop`). It previously said "within a **stated** window"
    while nothing stated one, so the agent had to invent the number the rule implied it would supply.
  - **`report-exists OR state=done` is the turn-ending condition** (`auto-loop`). "Do not end the turn
    on a live CLI dispatch" plus "blocking blind costs the same" forbade both available actions. It
    means: always end the turn *on the wait condition* mid-execution. Ending on a bare dispatch with no
    condition attached is waiting for nothing, and that is the only forbidden form.
  - **Stop condition 4 pauses via `AskUserQuestion`**, recommendation as the first option (`auto-loop`,
    hub). "Recommend, do not infer. Then continue." read as non-blocking under a header saying the loop
    returns to the user; the pause is the question, and the run resumes on the answer.
  - **Headroom stays case-by-case planner discernment, explicitly and permanently** (`auto-routing`,
    hub), with the question to answer out loud: *is it worth running this in a low-threshold agent if
    quality will be massively lost otherwise?* Naming it as discernment stops agents hunting for the
    threshold the old wording implied existed.
- **Prose pruned to instructions across all four auto-office files** — 208 lines out, 171 in, every
  rule kept. War stories that ran 8-20 lines are now the rule plus a one-line evidence tag: the
  branch-moved-under-you incident, the 829k-token task, the 1h38m unwatched dispatch, the partial
  329k-token brief, the property-vs-instance criterion defect, and the self-review overlap measurement.
  This follows the repo's own maintenance rule - sharpen a principle, don't append a scenario.
- The hub is **under its 9000-byte budget for the first time** (9068 at the start of this work).
  `check-plugins.sh` now reports zero warnings across all four plugins.

## 2.4.3 — 2026-08-05

- **"Stricter rule wins" no longer imports a sibling office's role rules.** Every dispatch loads a
  sibling spoke, and `agy-office` / `claude-office` / `codex-office` all state "the planner never
  implements" as a local narrowing. Read literally, the unscoped clause therefore deleted
  auto-office's own central lifted rule — while the hub, `auto-loop`, and `auto-planning`'s task
  table all assume the planner *may* implement inline. The clause is now scoped to two rules binding
  the **same** gate, mechanism, or action, with both known misfires named (the plan-review floor and
  planner-implements). `delegation-map.md` and the hub say it the same way.
- `auto-routing` — the delegation test now carries its operative discriminator instead of leaving it
  in prose two sections away: a CLI dispatch always technically buys isolation, so "if writing the
  brief takes more thought than making the change, the delegation buys nothing." The near-tie ladder
  gains a terminal rung (**still tied → codex**); a ladder that can run out invites the deliberation
  the section exists to refuse. The agy ceiling is stated as a hard `3`, not `~3`.
- `auto-planning` — the 95% interview floor now carries core's definition of 95% (the stranger
  standard) rather than the bare number, matching how the sibling planning spokes state it.

## 2.4.2 — 2026-08-05

- **Fixes the reason auto-office plans came out thin.** Everything that makes a plan comprehensive —
  Context, Global Constraints, Numbered tasks with files/behavior/verification, the dependency graph,
  Out of scope, and the whole *Claims discipline* section — lives in
  `office-core/protocol/plan-contract.md`, and `auto-planning` cited it as a **bare backtick path** at
  step 6. That path resolves from the plugin root, **not** from inside a spoke, so from the planner's
  position it pointed at nothing; the hub made only `roles-and-authority.md` a mandatory read and
  listed the contract solely in its "Doubt about core" fallback table. A planner therefore wrote the
  two things `auto-planning` states inline — the GOAL block and the task assignment table — and
  skipped the required sections entirely. Nothing was broken; the requirements were simply
  unreachable, and had been since the initial release.
- `auto-planning` now opens with a `Narrows [plan-contract.md](…)` link, as `agy-planning` already
  did, and step 6 spells out all five required sections with a note that the GOAL block and task
  table are **additions to** them, never substitutes.
- `claude-planning` carried the same bare path (harmless there — it already listed the five sections
  inline). Fixed; see claude-office `1.3.1`.
- `scripts/check-plugins.sh` gains **planning spoke carries the plan contract**: a planning spoke must
  have a *resolvable relative link* to `plan-contract.md` and must name all five required sections.
  Neither existing check could see this — the link check only inspects `[](…)` links, so a bare
  backtick path passed it clean. `codex-office` has no planning spoke and plans from its hub, where a
  plugin-root path does resolve; that case is accepted explicitly rather than special-cased silently.
- **Known warning, unchanged:** the hub is still 9068 bytes against a 9000 budget. This change adds
  nothing to it — the fix belongs in the spoke, which is where the planner actually reads.

## 2.4.1 — 2026-08-04

- **The maintenance step was unrunnable as written, and a planner reported it as missing.** `SKILL.md`
  said "run `scripts/check-plugins.sh`" without naming a root. The script lives at the **office-skills
  workspace root**; the plugin's own `scripts/` holds only the three quota probes. A planner looked in
  the plugin, searched `~/.claude`, found nothing, and reported the script as non-existent — twice
  wrong, since it exists and the installed plugins are symlinks into the workspace. Maintenance now
  names the root explicitly and ties the `version` bump to the CHANGELOG heading.
- `scripts/check-plugins.sh` gains two checks, both targeting failures observed today:
  - **version drift** — the newest `## X.Y.Z` CHANGELOG heading must equal `.claude-plugin/plugin.json`'s
    `version`. The maintenance step said "bump version, add a CHANGELOG entry" and nothing verified
    the two agreed.
  - **referenced scripts resolve** — any `scripts/<name>.sh|.py` mentioned in a plugin's markdown must
    exist at the workspace root or in the plugin. This is the check that would have prevented the
    false "missing script" report outright.
- Fixes a contradiction in the hub: the safety rules called `PLANNER-HELD` "the one thing the loop
  stops for" while *The autonomous run* lists **four** stop conditions. The four-condition list is
  authoritative; the stale clause is removed.
- **Known warning, left deliberately:** the auto-office hub is 9068 bytes against a 9000 budget. It was
  already at 8984 before this change — 16 bytes of headroom — so any new rule overruns it. Shaving the
  new Red Flag row to fit would gut it; cutting further office content to fit is a judgement call for
  the owner. Either raise the budget or cut content deliberately.

## 2.4.0 — 2026-08-04

- `auto-loop` — **the per-task compaction recommendation.** The status line gains a final
  `compact: yes | no — <reason>` field. The planner cannot compact itself; only the user can invoke
  it, so this is a recommendation on a line the user already reads, never an action and never a
  blocking question. `yes` requires a clean `APPROVED` boundary, evidence already **on disk**, and a
  next brief that is a file rather than a memory; `no` covers mid-review, mid-conflict-resolution,
  and any empirical result not yet written down.
- The field's real value is that **a `no` is a defect report** — it means something exists only in a
  context window, which a compaction, a crash, or a window boundary deletes. The correct response to
  a `no` is to write the state to a file, not to wait. It is a durability audit at every task
  boundary for the cost of one clause.
- Records that **a live executor is not a reason to withhold a `yes`** (a background executor has its
  own window and is unaffected), and that run-state files go **outside the repo while an executor is
  live in that tree** — committing beside a running executor orphaned two commits in one run.
- Adds **brief sizing** as the same problem one level down: a subagent cannot ask to be compacted, so
  an oversized brief returns *partial* rather than failing loudly, which misreads as an executor
  shortfall. Observed: a ten-call-site brief spanning three unrelated surfaces returned four at 329k
  tokens / 142 tool calls, with a correct handoff. Size briefs to one surface; split on surface
  boundaries, not file count. A scoped resume of a partial handoff is not a review round.

## 2.3.1 — 2026-08-04

- **"A past denial is not evidence about now."** A planner assigned `cli` dispatch in its own
  approved plan, then substituted an in-session subagent at dispatch time, citing a 2026-08-03
  ledger row where the classifier had denied `--dangerously-skip-permissions`. Rico's correction:
  don't pre-decide against CLI, especially when the caller asked for it. A probe minutes later
  launched a background agent with the scoped `--allowedTools` form, piped the prompt on stdin, and
  got the expected output file on the first attempt — CLI was never blocked.
- Two failures compounded: a **stale environment observation treated as a standing fact**, and the
  **dispatcher overriding its own plan's assignment** instead of surfacing a `PLAN DEFECT`.
- Changes: `SKILL.md` gains two Red Flag rows (stale-denial reasoning, and substituting a plan's
  dispatch form). `references/routing-outcomes.md`'s misleading ledger lesson is corrected in place —
  it read as licence to skip CLI. `claude-office/skills/claude-cli` now states the **scoped
  allowlist as the default** permission form with a verified launch command, documents that the
  prompt **must** be piped on stdin (a positional prompt yields a registered-but-`idle` agent), and
  adds a hard rule that the two-refusals fallback requires two refusals **in the current run**.
- Does not change: the executor tier, the review gates, or `PLANNER-HELD`.

## 2.3.0 — 2026-08-02

- `auto-closeout` — **"Closeout lands the work; it does not park it."** A run fixed the connect-week
  prev/next bug, passed both gates, opened a green mergeable PR against `preview` — and stopped
  there, reporting "ready for your review." Rico's correction: that is an incomplete run. Unique to
  auto-office, whose whole point is autonomous shipping, closeout must merge to the target branch
  and continue along the repo's promotion chain to its final branch regardless of outcome, unless
  the caller said otherwise. Adds: read the chain from the repo's own history rather than assuming
  one; verify each hop landed before opening the next; treat a timed-out `gh merge` as ambiguous and
  re-read state rather than retrying blind; itemize swept-up commits in the promotion PR but treat
  them as the normal release train, not scope creep, while stopping on genuine divergence; and name
  every verification that did not happen so an unrun check never reads as a passed one. Explicitly
  does not lift the review gate, the evidence floor, or `PLANNER-HELD`.

## 2.2.1 — 2026-08-02

- `auto-loop` — **"The branch you are on is not a fact you may assume."** A planner committed and
  pushed to `main` after a dispatched CLI agent switched the shared checkout on its way to building
  its own worktree; the target branch was a production deploy and Vercel shipped it in under a
  minute. Adds a drift-check item (`git rev-parse --abbrev-ref HEAD` before every commit and push),
  forbids dispatching a CLI agent into the tree the planner is working in, and requires pushing a
  **named branch** rather than `HEAD`, since `HEAD` inherits whatever branch you happen to be on.
  The content that shipped was reviewed and wanted — the control was luck, not process.

## 2.2.0 — 2026-08-02

From the rsvp.favor.church run (issue #49, PR #50, 3 tasks, 2 brands, 5 review rounds). The run
found **two live production bugs unrelated to the feature**, both surfaced by the review gate rather
than by any done-criterion — which is the through-line: the gates earned their cost, the plan did not
anticipate what they found.

- `codex-cli` — **never pipe a dispatch through `tail`/`head`; `tee` to a stable, gitignored,
  user-tailable path and state that path in the status line.** `agy-cli` already carried this rule;
  `codex-cli` said nothing, so the first dispatch of the run was invisible for ~19m and the user had
  to ask for a log path mid-run. The rule is per dispatch mechanism, not per brand, so it is now
  stated in both spokes.
- `auto-planning` — a done-criterion that pins an *instruction* ("filter before the slice") instead
  of the *guarantee* ("never render worse than BASE") can be satisfied by code that breaks the
  guarantee. Observed twice in one run: §3.5's literal rule was implemented faithfully and still
  produced a false "already checked in" error. **Pin the property; let the implementation choose the
  mechanism.**
- `auto-planning` — before pinning a REST route in an interface, **probe it**. A route that is
  mocked in the repo's test harness *and* dead in production passes every test while doing nothing
  forever. One read-only `curl` at plan time would have caught it; instead it took the reviewer.
- `auto-loop` — when a task's diff is correct but collides with untouched code, the verdict is
  `PLAN DEFECT`, not `CHANGES REQUIRED`. Confirmed working as intended: T2's code needed no change,
  the plan needed a new rule, and the amendment was cheaper than a fix wave.
- `auto-loop` — the mandatory agy verification pass **found a real defect this run** (counts derived
  from a filtered list) at check 6, "guards as wide as the spec". Check 6 is not a formality; it is
  the check most likely to catch a narrow implementation of a correct interface.
- Planner inline fixes went to the same reviewer as executor work, every time, including on the last
  task. No self-approval occurred.

## 2.1.0 — 2026-08-02

Additive rule sharpening from the second real run (connect-portal, issues #180/#181/#183, 9 tasks,
3 PRs merged). No breaking semantics; v2 plans and run reports still read correctly.

Through-line of the run: **every `CHANGES REQUIRED` verdict across three tasks was a test defect,
never an implementation defect** — and three of the planner's own done-criteria plus one fix
instruction were themselves wrong, all caught downstream by reviewers or an executor.

- `auto-planning` — four new done-criteria rules. State the **property, not the vivid instance**
  (a criterion naming one case is satisfiable by code broken in every other case; this shipped a
  data-loss bug while reading green). Criteria whose cases all move state **0 → N** never test the
  update path. Never make the **agent's own identity** a discriminator in a verify command — `gh`
  and `git` act under the user's credentials, so an author filter is unsatisfiable by construction.
- `auto-loop` — failing at `BASE` is declared **necessary but not sufficient**; briefs must demand
  **mutation testing**, with a two-sided assertion wherever the change is a guard. A new test file
  "fails at BASE" merely by importing a module that does not exist yet.
- `auto-loop` — CLI executors have **no return channel unless the brief builds one**. Every CLI
  brief names a handoff file; the wait condition is `report-exists OR state=done`, never state
  alone. Proven by an outage that killed an executor mid-round whose report survived on disk.
- `claude-office/references/discernment.md` — corrected the auto-mode-classifier remedy: the fix is
  an **`autoMode.allow`** entry, **not** a `permissions.allow` rule (the two are independent gates;
  `Bash(claude*)` was already allowed and the launch was still refused). Also recorded that the
  agent cannot apply it itself, and that `claude logs` is unusable for polling (47 KB of ANSI for a
  few lines).
- `claude-office/skills/claude-cli-send-message` — the delayed-`\r` gotcha is **not unicode-only**;
  a ~700-character pure-ASCII send behaved identically. Length alone is the trigger.
- `references/routing-outcomes.md` — 4 rows appended; the reading note now covers nine rows and
  names the repeatable shape: the planner's artifacts fail more often than the executor's, and
  reviewer capacity is better spent attacking the criteria than re-reading the diff.

## 2.0.0 — 2026-08-01

**Breaking:** the `T0`/`T1`/`T2` dispatch-tier ladder is **removed**, roles are added, and the prose
name **Orchestrator** becomes **Executor** (the schema role id was always `executor` and is
unchanged). A v1 plan or run report will not read correctly against v2 semantics, which is why this
is a major bump rather than a quiet one.

Source: a retrospective on the first real auto-office run, whose through-line was that **cost and
correctness both concentrate in the plan and the brief, not in the executor's model.**

### Roles

- **Executors and workers are mandated sonnet-tier, high effort** — `sonnet` high / `codex-terra`
  high / `agy` high. No self-escalation, no exceptions without a caller override. On the run that
  produced this rule, both green-but-useless tests the reviewer caught were written by the *bigger*
  model.
- **New role: plan-reviewer.** One adversarial pass over the plan document, before user approval,
  held by a fresh agent of the planner's own brand at Opus-tier **low** — then it **retires
  permanently**. It never distributes work and never returns, so it cannot gate work it approved.
- **New role: PM**, spawned by CLI **only at ≥2 executors**, at executor tier. It hands out the
  briefs the plan already wrote and collects results. It holds no planner-held action and no gate.
  A PM facing a routing decision means the plan was incomplete — a `PLAN DEFECT`, not a reason to
  upgrade the PM.
- **"The planner never implements" is lifted.** The planner may fix and implement inline when a
  delegation buys nothing — and **still never approves its own work**. New precondition: a planner
  inline write never overlaps a live executor in that tree.
- **Planning is exactly two passes:** planner self-review, then one adversarial plan-review. Never a
  loop. Measured on the plan behind this release, self-review found 10 findings and the fresh gate
  found 12, overlapping on only 4 — which is why both exist and neither substitutes for the other.

### Routing

- **Two decisions, not three:** which brand owns each unit of work, and how it is dispatched — and
  the second is **derived**, not chosen. Planner fans out → CLI; executor fans out → in-session;
  work a delegation buys nothing for → inline; a cross-brand worker → CLI, the only exception.
  **No tax arithmetic.**
- `references/dispatch-cost.md` **deleted.** Its surviving lessons live in `auto-routing`: brief
  quality is the real cost of a dispatch, batch adjacent cheap edits, **never batch across the
  review gate**, and a supervised sub-delegation is still one writer.
- **Model and effort are fixed per role**, in one table, including **two review floors**: `opus`
  medium for the **code**-review gate and `opus` low for the **plan**-review gate. Stated explicitly
  because "stricter rule wins" would otherwise promote plan review and double its cost.
- **Near-ties are not deliberated.** Same tier, both fit: tiebreak on live headroom, then the
  operator's codex preference, then spread — then commit, in at most one line. agy is disqualified
  from the tiebreak if its 3-consecutive-task cap is spent or the task is a long chain.
- The benchmark snapshot now selects **brand only** — never model or effort.

### Loop and cost

- **2 consecutive `CHANGES REQUIRED` on one task ⇒ presume `PLAN DEFECT`** and take core's existing
  route. This replaces a dead cap ("reroute to the Decider tier"), which was a no-op once the
  executor was already at the tier it was going to be at. Direct fix for the task that burned 829k
  tokens over three rounds: funding stops at round 2, not round 5. Bound: a **second** amendment to
  the same task stops the loop for the user.
- **`BRIEF DEFECT`** (core 1.2.0) enters the loop beside `PLAN DEFECT`, and every brief now carries
  the reproduce-at-`BASE` clause and the test-must-be-red-at-`BASE` clause.
- **Liveness check after every CLI dispatch**, and **no re-dispatch until the silent process is
  confirmed dead** — a silent-but-live process plus a replacement is two writers. One run lost 1h38m
  of wall clock and zero tokens to this.
- **Cost retrospective at closeout**, with per-window headroom and reset times. Single-number
  headroom deltas are banned: last run's `82% → 52% → 85%` described nothing that happened.
- **New `references/routing-outcomes.md`** — the workspace-local outcomes ledger, appended every
  closeout and read at routing **before** the benchmark file. Committed rows carry **opaque repo
  slugs**; the slug → real-repo mapping lives in a gitignored `routing-outcomes.local.md`.
- **Artifact location stated explicitly:** everything belonging to a run lives in that run's target
  repo; the outcomes ledger is the sole cross-run exception.
- **Self-heal gate:** editing these skills is permitted **only when the planner is claude/Opus**.
  codex and agy planners propose in the run report and stop.

### Compatibility

- Pinned to office-core **1.2.0** (planner-implements resolved, plan-review gate and coordinator role
  permitted, floors bind their own gate, `BRIEF DEFECT`, standing brief clauses, the 2-round
  presumption, cost retrospective, per-window headroom, schema cost fields).
- Four new exceptions: `auto-plan-review-gate`, `auto-pm-fanout`, `auto-mandated-executor-tier`,
  `auto-opus-only-self-heal`. Nothing dropped; all four pre-existing flags re-audited against core
  1.2.0 and all remain `widens_core_authority: false`.

## 1.0.0 — 2026-08-01

First release. A fourth, router office over `office-core` `1.1.0` and the three tool offices.

Vocabulary: **Planner → Orchestrator → Worker | inline**. "Orchestrator" is this office's prose name
for core's `executor` role — same authority and gates, and schema fields still emit `executor`, so
core compatibility and the sibling spoke names (`codex-executor`, …) are untouched. "Worker" is the
per-task sub-delegate, which holds no authority of its own.

Model + effort defaults are the operator's standing preferences, not benchmark-derived: `codex-terra` high /
`sonnet` high / `agy` high as orchestrators and workers, `opus` **medium** as reviewer,
`codex-sol` high as reviewer only when Codex is the planner. **`xhigh`/`ultra`/`max` and
bigger-model substitutions are user-invoked only, never self-escalated** — the benchmark table
decides which *tool* holds a capability role, never which *effort tier* it is called at.

- `SKILL.md` hub: invocation gate, the routing summary, non-bypassable safety rules, the
  autonomous-run shape, routing table, delegation policy, telemetry, Red Flags.
- `skills/auto-planning`: Phase 1 — quota probe first, interview floor, agy scout recon, route,
  plan, and the GOAL block whose done-criteria the loop is measured against. One approval
  authorizes the whole run.
- `skills/auto-routing`: the discernment engine. Separates orchestrator choice (one per repo) from
  per-task tool choice; routes by capability role (Decider / Backend builder / Fast scout) so the
  rubric survives model upgrades; **headroom weighed as a cost, with no hardcoded threshold** —
  best-fit first, then a stated case-by-case call on whether the tool is worth its remaining quota
  (run size, reset time, queued work, what a worse route would lose), with UNKNOWN treated as
  unavailable rather than low; agy capped at 3 consecutive tasks; the agy miss-list appended to the
  reviewer rubric whenever agy touched a task; Opus reviewer floor with the
  Codex-Sol-when-Codex-plans exception.
- `skills/auto-loop`: goal-locked bounded loop, the per-iteration drift check, hard caps, and the
  four stop conditions (PLANNER-HELD, destructive/production write, external send, user-owned
  decision). Nothing else stops the run.
- `skills/auto-closeout`: re-runs every GOAL verify command before committing, then the sibling
  office's closeout, then an auditable run report including routing decisions and cost shape.
- `references/model-benchmarks.md`: Artificial Analysis snapshot captured 2026-08-01 (Intelligence
  Index, Coding Index, Coding Agent Index v1.1, output tok/s) with a 30-day staleness horizon and a
  refresh procedure that re-seats capability roles when a tool overtakes another.
- `references/quota-probe.md` + three probes sharing one contract (`--percent` / `--json` / bare,
  exit 0 read / exit 2 UNKNOWN), all stdlib-only and consuming no model tokens:
  - `scripts/codex-usage.py` — `~/.codex/auth.json` → ChatGPT `wham/usage`,
    `rate_limit.primary_window`. Verified 2026-08-01: 99% left.
  - `scripts/claude-usage.py` — macOS Keychain `Claude Code-credentials` (`~/.claude/.credentials.json`
    as fallback) → `api.anthropic.com/api/oauth/usage`; `--percent` returns the **tightest** of the
    5-hour and 7-day windows. Verified 2026-08-01: 84% left.
  - `scripts/agy-usage.py` — **honest negative, always exit 2.** agy refreshes quota in memory from
    `loadCodeAssist` and never persists it, and `agy --help` has no usage subcommand, so there is no
    programmatic source. Reports login state and scans recent CLI logs for exhaustion markers. Route
    agy on fit plus the documented behavioral signal (a stall after a few narration lines is quota
    death) and keep a Claude fallback Worker.
  UNKNOWN is treated as *unavailable*, which is deliberately distinct from *low*.
- `references/delegation-map.md`: which sibling spoke each phase loads per routed tool; stricter
  rule wins; agy's Phase 2b verification is structural.
- `COMPATIBILITY.md` declaring four exceptions, none widening core authority.
