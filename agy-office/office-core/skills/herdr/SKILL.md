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
**and record it in the ledger in the same step**. The ledger line is not bookkeeping for later; it
is part of spawning, because it is both what closes the pane and what resumes the session:

```bash
herdr agent start <unique-name> --kind <codex|claude|agy|...> --pane <pane-id>

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
  "spawned_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}))' >> /tmp/office/panes.jsonl
```

`session_id` is the resume handle, and it is the reason a pane can be closed the moment its agent
reports. Capture it here. If it is not populated yet, append the line without it and re-read
`herdr agent get` once the agent is live. `role` is recorded for readability; no behavior branches
on it.

**Know your own name, separately from the names you spawn.** `herdr agent prompt <name>` addresses
whichever agent owns `<name>` in Herdr's flat namespace, including yourself if your own name is
passed by mistake. Observed: a planner with no stated identity ran `herdr agent prompt
<its-own-name> "Pause all further edits"`, intending to reach a worker, and queued the message to
itself instead — deadlocking on its own pause. Every brief for an agent that will itself issue Herdr
commands states its own agent name up front (`You are herdr agent <name>. That name is YOU — never
target it with agent prompt/get/wait.`), so self and other are never resolved from context.

Use the model and effort required by the office's routing table as native arguments after `--`
when that agent kind supports them. The pane direction is the topology rule; it does not change
the agent's role, worktree, scope, or authority.

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
different events for anything time-sensitive.

A brief longer than a few lines: write it to the git-ignored workspace and send a short prompt
that tells the agent to read that file, instead of pasting the brief inline. A long single-shot
paste is what gets silently dropped, and this is not only a just-started-agent problem — the agent
is still doing its own startup work (MCP client init, plugin loading) right after `agent start`, and
a busy agent has the paste sitting behind its current turn either way. Send a pointer, not the text,
regardless of which state the agent is in.

Send the prompt **without** `--wait --until working`: that combination blocks synchronously inside
the tool call and can itself hit the harness's ~120s ceiling if the agent is mid-turn or slow to
pick the prompt up — the same ceiling that makes a long `herdr agent wait` unusable (see below).
Send it, then confirm receipt by reading the pane instead:

```bash
herdr agent prompt <unique-name> "Read the file <path-to-brief> in full and execute it end to end."
```

**`agent_status` is not receipt.** `working` observed right after `agent start` is frequently that
startup churn, not the brief being accepted. After every `herdr agent prompt`, confirm the prompt
actually landed by reading the pane and finding the brief reflected in the transcript — this is
the completion signal, not the status field:

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

To pick a session back up, split a fresh pane and start the same brand with its own resume argument
after `--`, then re-record the new pane id in the ledger:

```bash
herdr pane split --current --direction right --cwd "<worktree>" --no-focus
herdr agent start <name>-r2 --kind claude --pane <new-pane-id> -- --resume <session_id>   # claude
herdr agent start <name>-r2 --kind codex  --pane <new-pane-id> -- resume <session_id>     # codex
```

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
