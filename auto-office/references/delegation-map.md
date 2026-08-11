# Delegation map

auto-office owns routing and the loop. It owns **no CLI mechanics and no sub-agent mechanics of its
own**. Every phase loads the sibling office's spoke for the brand actually in use, so a fix to the
`agy` launch form, the `claude --cli` fork gotcha, or the `codex exec` background-launch rule lands in
exactly one place and this office inherits it.

Paths are given as installed plugin roots (`agy-office/`, `claude-office/`, `codex-office/`), which
is how they resolve once installed alongside this plugin.

## Vocabulary

This office says **Executor** for core's `executor` role — same authority, same gates, same schema
id. A **Worker** is this office's name for a per-task sub-delegate; core has no separate role for it,
because it holds no authority of its own. **PM** and **Plan-reviewer** are added roles, legal under
`office-core/protocol/roles-and-authority.md`: the plan-review gate *adds* a gate rather than
absorbing one, and the PM is a coordinator holding no planner-held action and no gate.

Keep emitting `executor` as the role id in schema fields (`office-kernel`, `run-event`,
`capability-manifest`), and keep the sibling spoke names (`codex-executor`, `claude-executor`,
`agy-executor`) exactly as they are.

## The map

| Need | codex route | claude route | agy route |
|---|---|---|---|
| CLI launch mechanics | `codex-office/skills/codex-cli` | `claude-office/skills/claude-cli` | `agy-office/skills/agy-cli` |
| Executor packet / brief contract | `codex-office/skills/codex-executor` | `claude-office/skills/claude-executor` | `agy-office/skills/agy-executor` |
| Independent verification pass | — | — | `agy-office/skills/agy-verification` (**mandatory**) |
| **Plan-review** gate | `codex-office/skills/codex-reviewer` at `codex-sol` **low** | `claude-office/skills/claude-reviewer` at `opus` **low** | `agy-office/skills/agy-reviewer` at `agy` **high** |
| **Code-review** gate | `codex-office/skills/codex-reviewer` | `claude-office/skills/claude-reviewer` | **never** — agy does not hold this gate |
| **PM** (≥2 executors only) | the planner's brand at **executor tier**, dispatched by **CLI** per that office's `*-cli` spoke — for claude that is `claude --bg --remote-control`, **never** an in-session Agent (see auto-routing: an in-session PM returns instead of monitoring) | ← | ← |
| Answering a blocked background agent | — | `claude-office/skills/claude-cli-send-message` | — |
| Closeout mechanics | `codex-office/skills/codex-closeout` | `claude-office/skills/claude-closeout` | `agy-office/skills/agy-closeout` |

The plan-review row uses the same reviewer spoke as code review, with a **plan-review rubric**: read
the plan for contradictions, unexecutable assignments, rules the plan's own changes made dead, gates
that cannot pass as written, and costs asserted rather than budgeted. It gates a document, not a diff,
so it needs no diff package and no gate output — and it runs exactly once.

## Rules

- **Load only the spoke for the brand you are dispatching.** A role never receives another office's
  material, and never the whole corpus.
- **Code-review mechanics come from `claude-office/skills/claude-reviewer`** whenever the reviewer is
  Opus, which is the default regardless of who executed. The `codex-reviewer` / `agy-reviewer` spokes
  are loaded only when a caller override, the Codex-as-planner case, or a **plan** review puts that
  brand in the chair.
- **Two floors, and neither overrides the other.** The **code**-review floor is `opus` high; the
  **plan**-review floor is `opus` low. The "stricter rule wins" clause below is about conflicting
  rules for the *same* gate — it does not promote plan review to the code-review floor. Applying it
  that way doubles the cost of the cheap gate and strengthens nothing.
- **Dispatch form follows brand match.** Planner → executor or PM is **CLI**. Executor → worker of
  the **same** brand is **in-session**; a worker of a **different** brand is **CLI**, necessarily.
  Work a delegation buys nothing for is **inline**. The brief says the executor *may* fan out; it
  never says how. Mechanism is the sibling office's, like every other mechanism.
- **Agy's Phase 2b is structural.** If agy executed a task, run
  `agy-office/skills/agy-verification` before review — no exceptions, no "the diff looks fine."
  That phase exists because agy can exit 0 having done nothing.
- **Stricter rule wins — for two rules binding the same gate, mechanism, or action.** Where a
  sibling spoke and the auto-office hub disagree about *how* something is done, take the stricter
  one, and record which you took. It does **not** import a sibling office's *role* rules into this
  one. Two named consequences, because both have misfired:
  - It does not promote plan review to the code-review floor (see the two-floor rule above).
  - It does not restore "the planner never implements." The sibling hubs declare that as a local
    narrowing of core; auto-office runs core `1.2.0` unnarrowed, so the planner may implement
    inline here — and, exactly as everywhere else, still never gates its own work.
- **A missing sibling plugin is a hard stop for that route.** If the chosen brand's office is not
  installed, re-route to an installed one and say so — never improvise the CLI mechanics from
  memory.
- **Sub-delegation inherits the brief's limits.** A worker dispatched by the executor gets the
  executor's file scope and constraints, never a wider one.

## "Remote" is a claim you must verify, not a flag you set

`isolation: "remote"` on the Agent tool is **gated**. When it is unavailable the call still succeeds
and you get an ordinary in-session background subagent — no error, no warning. Observed 2026-08-02:
the planner passed `isolation: "remote"`, announced "remote planner launched," and the user caught
it. `TaskStop` reported `"task_type":"local_agent"`.

- **Check before announcing.** A local fallback writes its `output_file` into the session scratchpad;
  a genuinely remote run does not. `TaskStop`/task metadata reports `task_type` outright.
- **Know why it matters.** A background subagent's questions surface to the *planner*, who relays.
  If the user asked for remote specifically so they could answer the agent **directly**, a local
  fallback silently reinstates the middleman they were removing — the delegation still "works" while
  failing at the only thing they wanted from it.
- **The real remote channel on a Claude harness is `RemoteTrigger`** (claude.ai routines): create a
  trigger with `job_config.ccr` — `environment_id` is **required**, `sources[].git_repository` sets
  the repo, `persist_session: true` makes the session answerable — then `run` it. It returns a
  `session_id` the user can open and converse in. Park the `cron_expression` far in the future and
  fire it manually if the intent is one interactive session rather than a schedule.
- **A remote session inherits every MCP connector on the account**, including production-write ones.
  The prompt is the only boundary. Say so in the brief, and tell the user which live systems the
  session can reach.

## Invoking this office from a non-Claude harness

Any brand may hold the planner role, but only a Claude harness loads this plugin automatically. So a
non-Claude planner is invoked with **`/auto-office` plus the absolute path of the `auto-office`
plugin directory**, and reads the hub, spokes, and references directly from disk instead of relying
on plugin loading.

**Record which invocation form was used** in the run report. "The skill was never loaded" and "the
skill was loaded and ignored" are different defects with different fixes, and without the record they
are indistinguishable afterwards.
