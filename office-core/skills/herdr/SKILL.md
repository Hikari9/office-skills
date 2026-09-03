---
name: herdr
description: Use when HERDR_ENV=1 to dispatch office workers through visible Herdr panes and coordinate their prompts, reads, waits, and cleanup.
---

# Herdr Office Dispatch

Load this skill before routing any delegated executor, reviewer, plan-reviewer, verifier, scout,
worker, or Tester when the environment identifies a Herdr-managed pane.

## Detect Herdr

Run this check before any Herdr control command:

```bash
test "${HERDR_ENV:-}" = 1
```

When it passes, use the `herdr` CLI for every delegated agent. When it fails, leave the office's
existing routing unchanged; its normal CLI or in-session path still applies. A Herdr command
failure while `HERDR_ENV=1` is not permission to use an in-session subagent: diagnose the Herdr
failure, use an authorized CLI route if one is available, or report the dispatch blocked.

## Who runs herdr

The agent that owns the run owns its herdr commands. Do not hand dispatch to a cheaper
"mechanical" agent on the theory that these commands are clerical. Every rule in this skill is a
judgement wearing a command's clothing: model and effort come from the routing table and never
from the agent's own judgement, `agent_status` is not receipt, `blocked` is a question to surface
rather than answer, and a queued prompt is not a disobeyed one. The commands themselves are a
dozen short calls per run — what actually costs is the reading and the deciding attached to them,
and those are exactly what a cheaper tier gets wrong. Under `HERDR_ENV=1` the substitution is not
even reachable: a dispatcher agent would itself need a pane, opened by the very commands it was
meant to take over.

Two forms of offloading are correct, and this skill uses both:

- **To a script, not to a model.** The deterministic half of a spawn — split, start, argv assert,
  session read, ledger append — is `scripts/office-spawn.sh` in this core (`office-core/scripts/`,
  vendored into every plugin). It removes the retyping without moving a single decision. The same
  applies to watching and cleanup: the `Monitor` pattern below and the `Stop` hook are scripts,
  and a script cannot misread `blocked`.
- **To a reader pane, verbatim.** A cheap-tier agent may be dispatched to read a long pane or
  transcript and return the verdict line and any blocking question **verbatim**. It summarises
  nothing, decides nothing, and issues no herdr command on the caller's behalf. This keeps
  120-line transcript dumps out of the caller's context, which is the real saving.

## Put agents in the layout

The calling agent owns the current pane and keeps focus. Direct children are grouped into columns
by role, not by spawn order: every executor/worker lives in one column, and every reviewer
(plan-reviewer and code-reviewer) lives in a separate column. A child spawned by that agent (its
own subagent, e.g. a Tester under an executor) still gets a visible child pane below its parent,
nested inside the parent's column — that rule is unchanged. Preserve the caller working directory
and do not guess IDs:

```bash
# first executor/worker from the caller — opens the executor column
herdr pane split --current --direction right --cwd "$PWD" --no-focus

# each additional executor/worker — stacks under the last executor/worker pane, same column
herdr pane split --pane <last-executor-pane-id> --direction down --cwd "$PWD" --no-focus

# first reviewer (plan-reviewer or code-reviewer) from the caller — opens the reviewer column
herdr pane split --current --direction right --cwd "$PWD" --no-focus

# each additional reviewer — stacks under the last reviewer pane, same column
herdr pane split --pane <last-reviewer-pane-id> --direction down --cwd "$PWD" --no-focus

# a worker/reviewer that is spawning its own child — nested below itself, not a new column
herdr pane split --current --direction down --cwd "$PWD" --no-focus
```

Track the most recently spawned pane id per role. The first executor/worker and the first reviewer
each open their own column with `right`; every later same-role pane joins that column with `down`
aimed at the last same-role pane via `--pane`, not `--current`. Splitting `right` again for a role
that already has a column opens a stray third column instead of grouping into the one that exists.

**`down` from a tab's only pane does not make a column.** It makes the root split a down-split
spanning the full tab width, so the two panes stack as full-width rows, not side-by-side columns.
This is exactly why the recipe above always opens a column with `right` first — splitting `right`
creates the sibling to stack under — and never `down`s off the tab's original, still-solo pane.

Read `.result.pane.pane_id` from the JSON response, then start the requested brand in that pane
**and record it in the ledger in the same step**.

`scripts/office-spawn.sh` does the whole block below in one call — split, start at an explicit
tier, argv assert, session read, ledger append — and fails loudly (closing the pane it just made)
when the launched tier is not the one asked for. Prefer it; the expanded form that follows is what
it runs and what to fall back to when a kind or flag it does not know is in play:

```bash
scripts/office-spawn.sh --name m1-rocksec --kind claude --role executor \
  --model sonnet --effort high --cwd "$PWD"            # opens a new column
scripts/office-spawn.sh --name m2-rockdocs --kind claude --role executor \
  --model sonnet --effort high --anchor <last-executor-pane-id>   # stacks in that column
```

It takes the model, effort, role, and worktree as arguments and chooses none of them. The ledger line is not bookkeeping for later; it
is part of spawning, because it is both what closes the pane and what resumes the session:

```bash
# Required on every spawn: brand, model, AND effort — never brand alone. Values come from the
# dispatching office's routing table, never the harness default, never the agent's own judgement.
# Native flags differ by kind — verify per kind before using this literally:
herdr agent start <unique-name> --kind claude --pane <pane-id> -- --model <model> --effort <effort>
herdr agent start <unique-name> --kind codex  --pane <pane-id> -- -m <model> -c model_reasoning_effort="<effort>"

# claude — concrete example, argv echo verified 2026-09-03:
herdr agent start m1-rocksec --kind claude --pane w1J:p17 -- --model sonnet --effort high

# Required on every spawn. One JSON object per line, appended to the ledger.
mkdir -p /tmp/office
herdr agent get <unique-name> | python3 -c '
import json, sys, datetime
a = json.load(sys.stdin)["result"]["agent"]
print(json.dumps({
  "pane_id":    a["pane_id"],
  "agent":      a.get("name"),
  "kind":       a["agent"],
  "role":       "<executor|reviewer|scout|verifier|...>",
  "session_id": (a.get("agent_session") or {}).get("value"),
  "worktree":   a["cwd"],
  "argv":       a.get("argv"),
  "spawned_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}))' >> /tmp/office/panes.jsonl
```

`session_id` is the resume handle, and it is the reason a pane can be closed the moment its agent
reports. Capture it here. If it is not populated yet, append the line without it and re-read
`herdr agent get` once the agent is live. `role` is recorded for readability; no behavior branches
on it.

**Assert the launched `argv`, in the same step, before treating the spawn as done.** `herdr agent
start` echoes the actual `argv` the pane launched with, at the top level of its own response
(`.argv`, a sibling of `.result.agent`, not inside it). Read it back and confirm it contains the
model and effort you intended — the same way `session_id` capture is treated as part of spawning
rather than bookkeeping. A pane that launched at the wrong tier is caught here, not by a human
noticing the pane header later.

**`herdr agent get` does not reliably carry `argv` back.** Observed 2026-09-03: `office-spawn.sh`
asserts tier by re-reading `argv` from a follow-up `herdr agent get <name>` call (even after a few
seconds' wait), and that response's `.result.agent` had no `argv` key at all — the assertion failed
and the script closed a correctly-launched pane (confirmed correct via the `agent start` response
itself, and via the visible pane transcript showing the right `--model`/`--effort` on its prompt
line). Assert from the `agent start` response's own `.argv`, captured at spawn time, not from a
subsequent `get`. If a script only checks `get`, treat a failed assertion as inconclusive rather
than proof of a bad spawn — cross-check the pane's own visible startup line before closing it.

**Know your own name, separately from the names you spawn.** `herdr agent prompt <name>` addresses
whichever agent owns `<name>` in Herdr's flat namespace, including yourself if your own name is
passed by mistake. Observed: a planner with no stated identity ran `herdr agent prompt
<its-own-name> "Pause all further edits"`, intending to reach a worker, and queued the message to
itself instead — deadlocking on its own pause. Every brief for an agent that will itself issue Herdr
commands states its own agent name up front (`You are herdr agent <name>. That name is YOU — never
target it with agent prompt/get/wait.`), so self and other are never resolved from context.

**Brand alone is never a sufficient spawn.** A `herdr agent start` that omits an explicit model
and effort is a defect, not a shorthand: it silently inherits whatever tier the harness defaults
to, not the tier the office priced for that role. Both values come from the dispatching office's
routing table — never the harness default, never the agent's own judgement — passed as native
arguments after `--`. `--model`/`--effort` are verified for the `claude` kind. For `codex`, effort
is a config key, not a flag: `-c model_reasoning_effort="<effort>"` (see
`codex-office/skills/codex-cli`), and a dispatch missing it falls back to whatever
`~/.codex/config.toml` says. For `agy`, only `--model` is verified in `agy-office/skills/agy-cli`;
no effort flag is confirmed there, so this skill does not assert one. The pane direction is the
topology rule; it does not change the agent's role, worktree, scope, or authority.

**Observed 2026-09-03:** a planner dispatched `herdr agent start m1-rocksec --kind claude --pane
w1J:p17` with no model or effort. The pane launched at the harness default (opus, medium) for a
role the routing table priced at claude `sonnet` `high`; nothing in the run surfaced the mismatch
until a human read the pane header and corrected it by hand.

## Rearranging an existing layout

`herdr pane move` cannot rearrange a pane within the tab it is already in — targeting a pane at its
current tab is a silent no-op: `changed:false, reason:"same_tab"`, exit 0. A success exit that did
nothing. There is no in-place reshuffle; to fix a column that landed wrong, bounce the pane out to a
scratch tab and back in with a split:

```bash
herdr pane move <pane-id> --new-tab --workspace <workspace-id>
herdr pane move <pane-id> --tab <target-tab-id> --split right|down --target-pane <anchor-pane-id>
```

**The split form requires `--tab <tab_id>`.** Omit it and the command prints usage to stderr and
does nothing — it does not guess the target tab from the pane you're moving. The emptied scratch
tab auto-closes once its last pane leaves it.

## Send and supervise the prompt

**Check status before sending anything time-sensitive.** Prompts queue behind an agent whose status
is `working` — a pause, gate, or approval sent to a busy agent can be applied only after the action
it was meant to stop, not before it. `herdr agent get <unique-name>` first; if the agent is
`working`, that prompt will sit until the current turn ends, so treat "sent" and "received" as
different events for anything time-sensitive. Observed: a queued amendment arrived after the
executor had already acted, and the planner read the gap as the executor ignoring a mandatory
amendment it had, in fact, not yet received — check queue position before concluding non-compliance.

A brief longer than a few lines: write it to the git-ignored workspace and send a short prompt
that tells the agent to read that file, instead of pasting the brief inline. A long single-shot
paste is what gets silently dropped, and this is not only a just-started-agent problem — the agent
is still doing its own startup work (MCP client init, plugin loading) right after `agent start`, and
a busy agent has the paste sitting behind its current turn either way. Send a pointer, not the text,
regardless of which state the agent is in.

**The prompt text is a POSITIONAL argument. There is no `--message` flag.** Passing one makes herdr
print `unknown option: <your entire message text>` and exit **without sending anything** — and
because a brief is long, `| tail` shows only its last lines, which reads exactly like a successful
echo of the prompt you just sent. Observed 2026-09-03: three consecutive prompts were dropped this
way and the planner reported a dispatched executor that had never received a word. Never pipe
`herdr agent prompt` through `tail`/`head`, for the same reason it is banned for `gh pr merge` —
the refusal scrolls away and the chain continues.

```bash
herdr agent prompt <unique-name> "Read the file <path-to-brief> in full and execute it end to end."
```

**Bound the wait; do not ban it.** An *unbounded* `--wait --until working` blocks synchronously and
can hit the harness's ~120s ceiling if the agent is mid-turn — the same ceiling that makes a long
`herdr agent wait` unusable (see below). But `--wait --until working --timeout 20000` sits well
under it and returns the agent object with `"agent_status":"working"`, which is **machine-checkable
receipt**: herdr requires an observed state change within 5s of an accepted submission, or returns
`agent_prompt_stalled`. Prefer it for the receipt check, and read the returned status rather than
the echoed text:

```bash
herdr agent prompt <unique-name> "$(cat <path-to-brief>)" --wait --until working --timeout 20000
```

**`agent_status` read on its own is not receipt.** `working` observed right after `agent start` is
frequently startup churn, not the brief being accepted — that is why the bounded `--wait --until
working` above is stronger than a bare `herdr agent get`: it asserts a state *change* caused by
your submission, not a status sampled at an arbitrary moment. When you did not use it, confirm the
prompt landed by reading the pane and finding the brief reflected in the transcript:

```bash
herdr agent get <unique-name>
herdr agent read <unique-name> --source recent-unwrapped --lines 120
```

An agent that drops the prompt returns to `idle` with an empty composer — indistinguishable from
"finished instantly" if nobody reads the pane. If the pane shows idle-and-empty with no trace of
the brief, re-prompt the *same* agent: nothing was ever started, so this is not a two-writers risk
and does not call for a new pane. Only treat the dispatch as live once the transcript shows the
brief landed.

For a follow-up, use the same live agent name and the same read-to-confirm step.

Wait for the office's actual completion condition, such as `report-exists OR state=done`, not a
bare process exit. If Herdr reports `blocked`, inspect the agent and its output before sending
keys; surface a genuinely user-owned question instead of answering it by inference.

### Waiting on a long-running agent: use Monitor, not repeated `herdr agent wait --timeout`

`herdr agent wait <name> --until <status> --timeout <ms>` is a **one-shot** poll — correct for
confirming a prompt landed (a few seconds), wrong for watching a multi-minute task through to a
task boundary. The harness backgrounds any Bash call past ~120s regardless of the `--timeout`
you passed it, so a long `herdr agent wait` produces a stream of "failed with exit code 1"
task-completion notifications (a **timeout**, not a real failure — `herdr agent get` right after
each one shows the agent still `working`) with nothing useful in between, and each one still
costs a manual re-check. Observed 2026-09-02: six consecutive `herdr agent wait ... --timeout
150000` calls against one codex executor each timed out at the harness's ~120s ceiling and had to
be individually re-issued, for no signal beyond "still running."

**Prefer a `Monitor` tailing the agent's own session transcript**, which pushes events as they
happen instead of requiring a poll-and-reissue loop:

- **Claude**: `~/.claude/projects/<project-slug>/<session-id>.jsonl`.
- **Codex**: `~/.codex/sessions/<yyyy>/<mm>/<dd>/rollout-*-<session-id>.jsonl` — find it with
  `find ~/.codex/sessions -iname "*<session-id>*"` using the `session_id` from the ledger line.
- **Agy**: there is **no JSONL** — the recipe below does not apply. See *Watching an agy agent*.

Both are JSONL, appended to live. Tail and filter to the events that actually matter — task/turn
boundaries and the agent's own narration — not every tool call, which is too frequent to be a
useful signal and will trip the "too many events" auto-stop:

```bash
tail -f -n0 <rollout-or-transcript-path> | python3 -u -c '
import json, sys
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
    except Exception:
        continue
    payload = d.get("payload") or {}
    pt = payload.get("type")
    if pt == "task_started":
        print("TASK_STARTED")
    elif pt == "task_complete":
        print("TASK_COMPLETE")
    elif pt == "message" and payload.get("role") == "assistant":
        for c in payload.get("content", []):
            t = c.get("text", "")
            if t.strip():
                print("ASSISTANT: " + t.strip()[:500].replace(chr(10), " "))
'
```

Run this as a `persistent: true` Monitor (max timeout 3600000ms) rather than the default 5-minute
window, since an executor task can run longer than that. Drop the `custom_tool_call`/tool-call
event type from the filter entirely — printing just the tool name (e.g. `TOOL_CALL: exec`) on
every shell command is pure noise with no diagnostic value and is what triggers the volume
auto-stop; task boundaries and assistant text carry the actual signal. `herdr agent wait` remains
correct for its original, short-lived purpose (confirming a prompt landed after `agent prompt`);
this Monitor pattern replaces it only for open-ended "tell me when this task/round finishes."

### Watching an agy agent: query its SQLite conversation, never its status

**Agy stores no JSONL transcript**, so the `tail -f` recipe above has nothing to tail. It keeps a
per-conversation **SQLite** database at
`~/.gemini/antigravity-cli/conversations/<uuid>.db` (plus `-wal`/`-shm`). The newest `.db` by
mtime is the live conversation; the ledger's `session_id` is empty for `--kind agy`, so mtime is
the only handle.

The database is **readable while agy holds it open** (WAL mode) provided you open it read-only.
Its `steps` table gains a row per step, so the row count is a live progress counter:

```bash
DB=$(ls -t ~/.gemini/antigravity-cli/conversations/*.db | head -1)
sqlite3 "file:$DB?mode=ro" 'SELECT COUNT(*) FROM steps;'
```

Verified 2026-09-03 against a working agy executor: `157 → 164 → 167` across 40s. Open it
**`mode=ro`** — a read-write open contends with the live writer. Do not read `steps`' other
columns in a shell pipeline: `metadata`/`step_payload` are protobuf BLOBs and will make `cut`,
`awk`, and friends die on an illegal byte sequence. `step_type`/`status` are undocumented integer
enums — do not infer completion from them.

So for agy, poll that count on a long interval and treat **"count has not advanced across N
checks"** as the stall signal.

**Two signals that look right and are not.** Both produced false stalls in one run on 2026-09-03,
each interrupting a healthy executor mid-task:

- **`agent_status` is not a liveness signal for agy.** It flaps to `idle`/`done` *between turns*,
  so any "idle for N consecutive polls" rule fires on a perfectly healthy agent that is merely
  thinking. This is a stronger statement than *`agent_status` is not receipt* above: for agy it is
  not progress either. It remains valid for detecting a **destroyed pane** — `herdr agent get`
  failing outright is real, and panes do die mid-task.
- **Source-tree file mtimes are not a liveness signal.** A `find -newermt '-N minutes'` liveness
  probe read as quiet while the agent was demonstrably editing files in that tree. Do not build a
  stall rule on it.

**Prefer the terminal condition over any stall heuristic.** Watch for what *done* actually looks
like — the handoff file existing **and** the expected commit present — plus genuine pane loss, and
let the Monitor's own `timeout_ms` catch a true hang. A heuristic that cries wolf costs more than
the hang it was meant to catch, because each false alarm spends a real turn confirming the agent
is fine:

```bash
while true; do
  if [ -f "$HANDOFF" ] && git -C "$WT" log --oneline "$BASE"..HEAD | grep -qi "$LAST_TASK"; then
    echo "COMPLETE"; exit 0
  fi
  herdr agent get "$NAME" >/dev/null 2>&1 || { echo "PANE GONE"; exit 0; }
  sleep 60
done
```

**Have the agent commit after every task, and write its handoff incrementally.** Agy panes were
destroyed mid-task three times in that run; a commit is what survives, and a handoff written only
at the end is a record you lose entirely.

## No in-session dispatch while Herdr is detected

With `HERDR_ENV=1`, `herdr` is the dispatch form for every delegated agent, including same-brand
workers and reviewers. Do not use the harness's built-in Agent/Task subagent mechanism. Inline
work remains inline when the delegation test says it buys nothing; Herdr changes only how a real
delegation is hosted. Record the dispatch form as `herdr` in plans and telemetry.

The rule applies recursively: a Herdr-managed worker that needs a further subagent uses a pane
below itself and the same prompt/read/wait contract. It never returns to an in-session child path.

## Close created panes

**Record every pane id you create, and treat closing it as a step you owe, not a courtesy.** A
dispatch is not finished when its result is read; it is finished when its pane is gone. Panes
accumulate silently — the caller sees a report and moves on, while the layout keeps a dead agent
per dispatch until the user notices and asks.

**Closing a pane does not end the work.** A Herdr agent session is restorable by id — the
`session_id` in the ledger — so a closed pane is a closed *window*, not a discarded agent. Continuity
lives in the session id and in the agent's written report, never in a pane left open in case another
round arrives. That is why there is no "keep it open just in case" case.

**Not every session is resumable, and the unresumable ones fail silently.** `claude --resume
<session_id>` replays the transcript; if that transcript **ends in `/exit`**, the resumed session
executes it and quits immediately, leaving a bare shell at the pane with `ctx: 0k`. Distinguish the
two ways a session stops before you plan a recovery around it:

| How it stopped | Resumable | Tell |
|---|---|---|
| Killed by a quota/usage limit mid-turn | **yes** — keeps its full context | pane shows `You've hit your session limit · resets <time>` |
| Exited by the user or the agent (`/exit`) | **no** — replay hits the exit and quits | pane shows the exit and `Catch you later!` |

Observed 2026-09-03: a planner resumed an exited session to recover ~269k of context, read the
replayed transcript as a live agent, and prompted it three times into a dead shell. When a session
is not resumable, start fresh against the **committed work product** — that is what the branch is
for — rather than trying to recover context that is gone.

To pick a session back up, split a fresh pane and start the same brand with its own resume argument
after `--`, then re-record the new pane id in the ledger:

```bash
herdr pane split --current --direction right --cwd "<worktree>" --no-focus
herdr agent start <name>-r2 --kind claude --pane <new-pane-id> -- --model <model> --effort <effort> --resume <session_id>   # claude
herdr agent start <name>-r2 --kind codex  --pane <new-pane-id> -- -m <model> -c model_reasoning_effort="<effort>" resume <session_id>     # codex
```

`scripts/office-spawn.sh ... --resume <session_id>` does this same block. A resume still needs model and effort: a resumed session inherits its prior context, not its prior
tier, so a resume that omits them is the same brand-only defect as the first spawn.

## The ledger

`/tmp/office/panes.jsonl` — one JSON object per spawned agent: `pane_id`, `agent`, `kind`, `role`,
`session_id`, `worktree`, `spawned_at`. Writing it is a **required step of the spawn recipe** above,
not an optional aid, for every agent this run starts. It is the only list of panes this run owns, and
the only record of the session ids that make closing safe.

**An entry without `session_id` is incomplete, not merely terse.** Closing that pane discards the
only handle back into the agent's session — the resume id is readable from `herdr agent get` while
the agent lives and from nowhere afterwards. This has already happened once to hand-seeded entries;
it was harmless only because that work was already committed and pushed. If a line went out without
the id, re-read `herdr agent get <name>` and rewrite the line while the agent is still there.

`herdr pane close` takes the pane id **positionally** — unlike `split`/`move`, it has no `--pane`
flag; passing one prints usage and closes nothing:

```bash
herdr pane close <created-pane-id>
```

After closing explicitly, drop the entry — the ledger holds what is still open. Rewriting a JSONL
file mid-run is awkward, so marking the entry `"closed": true` instead is equally valid: the hook
treats a marked entry as already handled and prunes it without announcing anything.

### The Stop hook is the backstop

`office-core/hooks/close-finished-panes.mjs` — vendored, so every plugin carries its own copy and a
standalone install can reach it. Wired to `Stop`, it reads the ledger at every turn boundary and
closes what has finished:

- **closes** an entry whose agent is `done` or gone (herdr answers `agent_not_found`), and
  removes it from the ledger;
- **never closes** an agent that is `idle`, `working`, `blocked`, or `unknown`; a pane whose agent has since
  moved to a different pane than the ledger recorded; or **any pane absent from the ledger** —
  `herdr pane list` also shows the user's own panes and other sessions', and it is never the input;
- is silent when there is nothing to do, is safe to re-run, and is a no-op when `herdr` is not on
  `PATH`.

**It is a safety net, not a substitute.** Closing explicitly at each report is the primary
mechanism: a pane you already know is finished gets closed now, in the same turn. The hook fires no
earlier than the end of the turn, exists for the one you forgot, and cannot help a run whose ledger
was never written — which is the whole reason the ledger line lives inside the spawn block.

#### Installing it — opt-in, never automatic

It closes real panes in a visible layout, so nothing installs it as a side effect. From the
`office-skills` repository:

```bash
node eval/hooks/install.mjs --with-pane-hygiene   # install (claude, gemini)
node eval/hooks/install.mjs --uninstall           # remove all office-skills hooks
```

The installer only offers the option when Herdr is actually present (`HERDR_ENV=1`, or `herdr` on
`PATH`); elsewhere the option is not mentioned and nothing is wired. A plain re-run without the flag
leaves an existing install alone rather than silently un-wiring it — removal is `--uninstall`.

For a plugin installed on its own, with no repository around it, point the harness at the plugin's
own vendored copy. In `~/.claude/settings.json`:

```json
{ "hooks": { "Stop": [ { "hooks": [ { "type": "command",
  "command": "node <plugin-root>/office-core/hooks/close-finished-panes.mjs" } ] } ] } }
```

Uninstall by deleting that entry. Either way the hook keeps its own runtime guard: no `herdr` on
`PATH` and it exits 0 without doing anything, because presence at install time does not mean
presence at run time. `OFFICE_PANE_LEDGER` overrides the ledger path if `/tmp/office/panes.jsonl`
is not where the run keeps it.

**Close at these named checkpoints, not "eventually":**

| Checkpoint | Close |
|---|---|
| A worker/executor returns its final handoff | its pane, same turn |
| A reviewer returns any verdict, `APPROVED` or `CHANGES REQUIRED` | its pane, same turn |
| A scout, verifier, or one-shot side task returns its result | its pane, same turn |
| Final closeout | every remaining pane in the ledger |

**A pending next round is not a reason to keep a pane.** The round after a `CHANGES REQUIRED`, and
the executor that will take those fixes, both come back through `--resume <session_id>` in a fresh
pane. Close on the report.

**Keep open only these:** an agent that is `working` or `blocked`. `blocked` is a question to
surface, not a pane to close.

Do not close a pane, tab, workspace, or session that this run did not create unless the user
explicitly asks — `herdr pane list` shows other sessions' panes and other workspaces alongside
yours, which is exactly why the ledger is what you close from rather than the listing. Never close a
blocked or still-working agent merely to tidy the layout.
