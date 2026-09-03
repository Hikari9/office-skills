# Changelog

## 16.1.0 — 2026-09-03

Core `17.2.0`. Core-only change; see `auto-office/CHANGELOG.md` 17.1.0 for the full rationale.

- **Rendered surfaces need a rendered read-back** — byte-identity ("deployed == committed source")
  is not evidence for a page/template/UI. Fetch rendered output per viewer scope, run a
  one-variable-apart control, search for the engine error string, and name unexercised scopes.
- **Brief each review round on the previous defect's shape, not its line** — a fixed finding is a
  sample of a class; round 2 found a blocking defect in a file round 1 had cleared.
- **herdr** — prompt text is positional (no `--message`; a wrong flag looks like a successful echo
  under `tail`); bounded `--wait --until working --timeout 20000` is valid machine-checkable
  receipt; a session exited with `/exit` is not resumable, unlike a quota-killed one.


## 16.0.0 — 2026-09-03

Core `17.0.0`.

- Herdr: `herdr agent start` now requires an explicit model and effort on every spawn and resume —
  brand alone silently inherited the harness default tier instead of the routing table's. The
  recipe block itself carries the flags (`--model`/`--effort` for claude, `-c
  model_reasoning_effort=` for codex), and the spawn step now asserts the launched `argv` back
  against what was intended, the same way `session_id` capture is already mandatory.

## 15.0.0 — 2026-09-02

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
- Executor and reviewer prompt contracts carry a Herdr self-identity anchor (`You are herdr agent
  <name>`), stated once the Executor itself spawns a Tester through Herdr.
- Closeout: a branch can be reviewer-approved and still be empty at merge — `gh pr diff <n>
  --name-only` before marking ready now confirms the pushed diff matches what review covered.

## 14.0.0 — 2026-09-01

Core `15.0.0`.

- Pane hygiene preserves idle agents, which may have dropped their prompt, and closes only confirmed
  `done` or gone agents.

## 13.0.0 — 2026-09-01

Core `14.0.0`.

- PR comments are limited to approved-plan/execution-begins, first-executor-completion, and final
  `APPROVED` summary events. Intermediate review verdicts, fix resolutions, and milestones remain
  in run artifacts.
- Pane hygiene closes only confirmed `done` or gone agents; idle agents remain available for prompt
  recovery.

## 12.0.0 — 2026-09-01

Core `13.0.0`. Re-vendor only.

- Picks up the pane-hygiene hook as a shipped, vendored file
  (`office-core/hooks/close-finished-panes.mjs`), installed only as an explicit opt-in and only where
  Herdr is detected, plus the rule that a ledger entry without `session_id` is incomplete.

## 11.0.0 — 2026-09-01

Core `12.0.0`. Re-vendor only.

- Picks up core's mechanical pane closing: the ledger at `/tmp/office/panes.jsonl` written inside the
  spawn block, a `Stop` hook that closes `done`/`idle`/gone entries and nothing else, and
  `--resume <session_id>` as the way a next round comes back rather than a pane left open.

## 10.0.0 — 2026-09-01

Core `11.0.0`. Re-vendor only.

- Picks up core's Herdr pane-hygiene tightening: a `created_panes` ledger, four named closing
  checkpoints, and closing from the ledger rather than from `herdr pane list`.

## 9.0.0 — 2026-09-01

Core `10.0.0`.

- Herdr dispatch: `agent_status` is not receipt. A prompt counts as landed only once the pane
  transcript reflects the brief, not when `herdr agent prompt` returns `working` — that status is
  frequently the agent's own startup churn. A long brief is sent as a path to a file, not pasted
  inline, since a long single-shot paste into a just-started agent is what gets silently dropped.
- Re-vendored from core `10.0.0`; no codex-office-specific text changed.

## 8.0.0 — 2026-09-01

Core `9.0.0`.

- Adds the shared Herdr dispatch override: when `HERDR_ENV=1`, delegated Codex workers and
  reviewers run in visible Herdr panes, nested children go below their parent, in-session
  subagents are disabled, and created panes close after settled results are read.
- Preserves the existing Codex in-session/CLI routing when Herdr is not detected.

## 7.0.0 — 2026-09-01

Core `8.0.0`.

- Gives the planner an explicit disposition checkpoint after `CHANGES REQUIRED`, including
  pre-fix and mid-fix self-reflection, while preserving independent re-review for gated changes.

## 6.0.0 — 2026-08-31

Core `7.0.0`.

- Adds the coordinated Executor-owned Tester worker exception for parallel test authoring, live
  test execution, checkpoint evidence, and bounded correction loops.

## 5.0.0 — 2026-08-31

Core `6.0.0`.

- Draft PR bodies now contain an immutable GitHub blob deeplink to the tracked plan, anchored to
  the plan-only first commit.

## 4.1.0 — 2026-08-31

Core `5.1.0`.

- Every complete reviewer verdict is now copied to the existing draft PR before triage or
  follow-up.
- `CHANGES REQUIRED` findings are preserved verbatim, with finding-by-finding resolution comments
  after each fix wave for resumeability.

## 4.0.0 — 2026-08-31

Core `5.0.0`.

- Executors now bootstrap every run with a plan-only first commit, named-branch push, one draft PR
  referencing the tracked plan and issue, and resumability comments for each milestone.
- Closeout keeps the PR draft through reviewer approval, removes the plan in the final pre-merge
  commit, then marks the PR ready and merges it.
- Re-vendored the breaking core authority and milestone lifecycle contract.

## 3.2.0 — 2026-08-29

**Code-review effort is priced per leg by blast radius** (standing user decision, 2026-08-29;
the rule and its floor re-declaration live in `auto-office`).

- `xhigh` remains the default for **plan** review, hard diagnosis, and **code** review of a
  high-blast-radius leg. A **code** review of a low-blast-radius leg — docs, evidence-checking,
  applied-state claims the planner can verify with a `git grep` plus a `--dry-run` — runs at
  `high`. Never below `high`, and never for plan review. This narrows 3.1.0's "any reviewer
  dispatch, plan or code" for the code case only.
- Updated in the hub role table, `codex-cli`, and `references/reviewer-brief.md` (whose CLI
  invocation now takes `<xhigh|high>` rather than a literal `xhigh`).

## 3.1.0 — 2026-08-26

**Effort inverts: executor to `high`, reviewer to `xhigh`** (standing user decision, 2026-08-26).

- `gpt-5.6-luna` **high** is the executor default; **xhigh** is now any reviewer dispatch, plan or
  code, plus hard diagnosis. Updated in the hub role table, `codex-cli`, `codex-reviewer`, and
  `reviewer-brief.md` — the brief matters most, since it carries the literal
  `-c model_reasoning_effort=` a dispatch copies.
## 3.0.0 — 2026-08-26

Core `4.0.0`.

- **Self-review is mandatory for every role** (core `4.0.0`), not only the executor. `codex-executor`
  gains the per-task and whole-run read-back plus the obligation to reject a worker return with no
  `## Self-review`; `codex-reviewer` gains a self-review of its own findings before every verdict.
- **Telemetry moved into hooks.** The hub's "record an event at each dispatch" instruction is
  replaced by a pointer to `eval/hooks/`. It produced zero records in three weeks because obeying it
  was optional at the moment of dispatch.
- Sibling references repointed: the claude route's spokes now live in `auto-office`.
All notable changes to the `codex-office` plugin are documented in this file. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 2.3.0 — 2026-08-25

- **Codex same-brand workers now run in-session.** When the planner and assigned executor or
  reviewer are both Codex, the office uses fresh in-session Codex subagents. A non-Codex planner
  continues to use the assignee's CLI adapter, and cross-brand assignments remain CLI-routed.
- Independent review is preserved: the reviewer gets a fresh subagent identity and is never the
  planner or executor.
- Re-vendored core `3.1.1`, which clarifies that telemetry dispatch form follows each office's
  brand-routing rule.

## 2.2.1 — 2026-08-25

Core `3.1.0` (minor, additive). Re-vendored only — no adapter-specific change.

- Core `closeout.md` now documents a **standalone invocation** mode: confirm target, commit,
  gate, PR, document, sync, cleanup, and close loops all still apply, but with no milestone list,
  no Office Kernel packet, and no plan file — for closeout run directly on work that never went
  through the full pipeline. Existing Upline-closing behavior is unchanged; it still applies
  whenever a handoff file with open entries actually exists.

## 2.2.0 — 2026-08-25

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
- **Reviewer model moves to `gpt-5.6-luna` high** (was `gpt-5.6-sol` high). `gpt-5.6-sol` is no
  longer a routing option in this office at all — Luna covers both the reviewer and hard-diagnosis
  lanes.


## 2.1.0 — 2026-08-25

### Codex executor default is `gpt-5.6-luna` at `xhigh`

The executor role and the `codex-cli` model-selection list now name `gpt-5.6-luna` `xhigh` instead
of `gpt-5.6-terra`, matching the standing user default already recorded in `auto-routing`. Read it
as a cost-and-speed trade, not an upgrade: Luna xhigh scores **50** on the AA Intelligence Index
against Terra max's **55**, at **$0.17/M vs $0.73/M**. An executor implements an already-reviewed
plan, so the index gap buys less than the price gap costs.

The reviewer floor is untouched — `gpt-5.6-luna` at high effort, as before.

## 2.0.0 — 2026-08-14

Core `2.0.0`. Adopts the release's three protocol changes and fixes the delegation bug behind
"delegates can't reach MCP".

### The fit test picks a gear

`direct` / `express` / `full`. Express is core's declared phase set — short plan → execute →
**one** adversarial review → land it — with **no plan-review pass** and a **2-round cap**; a second
`CHANGES REQUIRED` promotes the run to full rather than funding a third round. Any yes to the
irreversible/production/externally-visible question still forces **full**, and express drops
**phases, never floors**.

### Closeout runs per milestone

The plan declares `milestones:`; each group of done-criteria that goes green is gated, committed,
PR'd and merged along the promotion chain **during** the run. Sync, worktree removal and Upline
closure stay terminal. The merged branch is the run's re-entry point, so an interruption costs one
milestone instead of the whole run.

### Planner-held names the actor, not a pause

An irreversible action stays the planner's to perform and never transfers to an executor. It runs
**without a fresh go-ahead** when the plan's `named_actions:` names it verbatim with its dry run,
revert target and read-back. A vague entry authorizes nothing and stops the run; so does a failed
precondition. The only unconditional stops left are an external send and a user-owned decision the
plan did not anticipate.

### Live-system work is delegated with its access

`codex-cli` gains a rule that `--yolo` removes the sandbox but **not** the MCP boundary: a
`codex exec` session sees the servers configured for *Codex*, not the planner's connectors. Check
before routing rather than after an empty dispatch, prefer plain HTTP where the API allows it, and
treat production **reads** as ordinary delegated work with the shape pinned and read back. A
per-brand config gap is not evidence that delegates cannot do MCP work.

### Trimmed

Run report shortened and given a mandatory **not verified** row; the **cost retrospective is
removed** (core `2.0.0` no longer requires it — it produced paragraphs nobody acted on). Self-heal
bar raised to *write a rule or write nothing*, with "nothing durable to add" stated as the expected
outcome.

## 1.5.0 — 2026-08-13

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
- **Wired into the hub** so it is read before anything else, restating the rule at the entry point.

## 1.4.0 — 2026-08-11

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

## 1.3.3 — 2026-08-11

Both entries come from failures observed in the `connect.favor.church` department progressive-loading
run, where two individually-correct instructions combined into a defect.

- **Every Upline instruction must declare whether it halts the run.** `evidence-and-handoff.md` gains
  **§ Every Upline instruction must say whether it halts the run**. The authority boilerplate's
  blanket "raise it Upline and stop" is right for a remote/production/credential action and
  catastrophic when it attaches to a per-finding "raise this Upline" — a conservative executor
  resolves the conflict by halting *everything*. Observed: a five-finding fix brief whose headline
  item was a verified data-loss defect returned zero implementation and zero commits, because the
  *fifth* finding's narrow sub-case touched a protected path. Briefs must now mark each escalation
  `note and continue` or `stop the run`, carry the mixed-severity procedural override, and rank
  findings so an executor forced to choose protects the worst defect rather than the last paragraph.
- **`VERDICT: PENDING` while a review file is incomplete.** `references/reviewer-brief.md` gains that
  state. "Write the verdict file early so a kill doesn't lose it" and "end with exactly one verdict
  line" jointly produce a stub whose stamped verdict is indistinguishable from a real one — and the
  two-consecutive-`CHANGES REQUIRED` plan-defect presumption *acts* on that. A stub, or a stamped
  verdict with an empty findings section, is now explicitly **not a round**: do not advance either
  counter for it, re-dispatch instead.

Neither entry relaxes a safety rule, raises a cap, widens a blast radius, or downgrades a reviewer.

## 1.3.2 — 2026-08-08

- **Core `1.3.0`: the compaction recommendation is now a shared rule.** `evidence-and-handoff.md`
  gains **§ Run-state durability and the compaction recommendation** — at every phase or task
  boundary the planner posts `compact: yes | no — <reason>`, because the planner cannot compact
  itself and only the user can invoke it. It carries the three `yes` conditions, the rule that a
  live executor never withholds a `yes` (a dispatch is the ideal compaction window), and the rule
  that a **`no` is a defect report, not a wait instruction** — run state living only in a context
  window must be written to a file, which turns the answer into `yes`. Previously this existed only
  in `auto-office/skills/auto-loop`, so the three linear offices lost planner state at every window
  boundary with nothing telling them to.
- The hub's four-phase section now requires the field at the close of every phase.
- **The recommendation is now cost-driven, not just state-driven.** A clean boundary makes
  compaction *safe*; it does not make it *worth it*. Core states both tests and the arithmetic:
  saving scales with context held × turns remaining, while cost is the summary plus everything
  **re-read afterward at the current model's input rate**. Two inversions follow — a small context
  at a clean boundary is a `no`, and a heavier planner should compact earlier than a lighter one
  holding the identical context. The reason field must name the driver, not say "clean boundary".

## 1.3.1 — 2026-08-05

- **Protocol version corrected to `1.2.0`** (was `1.1.0`, while the vendored core was already
  `1.2.0`), and **"the planner does not implement the plan" is now declared as a narrowing of core** —
  core `1.2.0` permits inline planner implementation and this hub makes that file a mandatory read.
  The rule is unchanged; it is labelled so the two documents no longer contradict each other silently.

## 1.3.0 — 2026-08-02

- `codex-cli` — new **"Watching it run — never pipe the dispatch"** section. Launch as a background
  task with **no pipes on stdout** and hand the user the harness's `.output` path. Never pipe
  through `tail`/`head`: they buffer the whole stream until exit, so the task-output file sits at 0
  bytes, the required liveness check has nothing to read, and the user has nothing to watch —
  observed on a ~19m dispatch where the user had to ask for a log path mid-run. And never write logs
  into the target repo: a first pass at this rule created `.run-logs/` plus a `.gitignore` entry in
  the user's repo, which they called intrusive. The handoff file is the artifact that belongs in the
  repo; the log is not. `agy-office/skills/agy-cli` already carried both halves — the mistake is per
  dispatch mechanism, not per brand, so it is now stated in both.

## 1.2.0 - 2026-08-01

### Changed

- Pinned to office-core `1.2.0`. Three shared invariants land in this office's spokes:
  - `codex-closeout` gains the **cost retrospective** — per task: brand, model, effort, dispatch
    form, review rounds, tokens where reported, wall clock — plus one honest paragraph on what was
    over- or under-provisioned, and **headroom reported per window with reset times**, never as a
    single-number delta.
  - `codex-executor` gains the **`BRIEF DEFECT`** return: the executor stops without implementing
    when the brief's stated cause is false at `BASE`, and that return consumes no review round. A
    reviewer cannot catch a wrong brief, so this is the only path that exists for one.
  - `codex-executor` gains the two standing brief clauses (reproduce the stated cause at `BASE`;
    a test must be shown failing at `BASE`) and an **in-session fan-out** permission bounded by the
    brief's file scope and one-writer-per-tree. The permission is stated; the mechanism is not
    prescribed.
- Re-vendored the core snapshot.

## 1.1.0 - 2026-08-01

### Changed

- Pinned to office-core `1.1.0`, which promotes the closeout procedure to
  `office-core/protocol/closeout.md`. It was previously duplicated, effectively verbatim,
  across two plugins and kept in sync by hand.
- `references/closeout.md` is now a thin adapter over the core procedure, carrying only this
  office's additions. This office adopts the full step-by-step procedure it previously described only in summary; its authorization language and report fields are unchanged.
- Re-vendored the core snapshot.

No safety rule was removed and no step was dropped. Every closeout step in 1.0.0 is still run.

## 1.0.0 - 2026-08-01

### Changed

- Restructured from a single flat `SKILL.md` into a hub-and-spoke plugin: a compact
  `SKILL.md` hub (orientation and dispatch only) plus four spokes —
  `skills/codex-cli`, `skills/codex-executor`, `skills/codex-reviewer`,
  `skills/codex-closeout` — each loaded only by the role and phase that needs it.
- Added the `.claude-plugin/plugin.json` descriptor, versioning this plugin independently of
  its sibling offices.
- Pinned to office-core protocol `1.0.0`, vendored at `office-core/` in this plugin (see
  `COMPATIBILITY.md`).

### Notes

- Behavior is unchanged: same four phases, same roles, same models, same routing to the existing
  `references/` files.
- No safety rule was removed; every prior rule is restated in the new hub or in a spoke.
