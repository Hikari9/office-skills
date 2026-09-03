#!/usr/bin/env bash
# office-spawn.sh — the deterministic half of a Herdr dispatch, in one command.
#
# Splits a pane, starts the requested brand at an EXPLICIT model and effort, asserts the
# launched argv actually carries them, reads back the resume session id, and appends the
# ledger line. These steps are mechanical and were previously retyped per spawn, which is
# where the observed defects came from: a brand-only start that silently inherited the
# harness default tier, and a ledger line written without a session_id.
#
# What it does NOT do: choose the model, the effort, the role, the worktree, or the brief.
# Those come from the dispatching office's routing table and stay with the calling agent.
# See ../skills/herdr/SKILL.md, "Who runs herdr".
#
# Usage:
#   office-spawn.sh --name <n> --kind claude|codex|agy --role <role> \
#                   --model <model> [--effort <effort>] [--cwd <dir>] \
#                   [--anchor <pane-id>] [--direction right|down] [--resume <session-id>]
#
#   --anchor  stack under an existing same-role pane (defaults to direction "down").
#             Omit it to open a new column off the current pane (direction "right").
#   --resume  reattach an existing session in the fresh pane. Model and effort are still
#             required: a resumed session inherits its context, not its tier.
#
# Prints the pane id on stdout. Exits non-zero, after closing the pane it just made, if the
# launched argv does not carry the tier that was asked for.
set -euo pipefail

NAME=""; KIND=""; ROLE=""; MODEL=""; EFFORT=""; CWD="$PWD"; ANCHOR=""; DIRECTION=""; RESUME=""
LEDGER="${OFFICE_PANE_LEDGER:-/tmp/office/panes.jsonl}"

die() { echo "office-spawn: $*" >&2; exit 2; }

while [ $# -gt 0 ]; do
  case "$1" in
    --name)      NAME="$2"; shift 2;;
    --kind)      KIND="$2"; shift 2;;
    --role)      ROLE="$2"; shift 2;;
    --model)     MODEL="$2"; shift 2;;
    --effort)    EFFORT="$2"; shift 2;;
    --cwd)       CWD="$2"; shift 2;;
    --anchor)    ANCHOR="$2"; shift 2;;
    --direction) DIRECTION="$2"; shift 2;;
    --resume)    RESUME="$2"; shift 2;;
    -h|--help)   sed -n '2,30p' "$0"; exit 0;;
    *)           die "unknown argument: $1";;
  esac
done

[ -n "$NAME" ]  || die "--name is required"
[ -n "$KIND" ]  || die "--kind is required (claude|codex|agy)"
[ -n "$ROLE" ]  || die "--role is required"
[ -n "$MODEL" ] || die "--model is required; a brand-only spawn inherits the harness default tier"
command -v herdr >/dev/null 2>&1 || die "herdr is not on PATH"
[ "${HERDR_ENV:-}" = 1 ] || echo "office-spawn: warning: HERDR_ENV is not 1" >&2

# Effort: required where the flag is verified, refused where it is not.
case "$KIND" in
  claude|codex)
    [ -n "$EFFORT" ] || die "--effort is required for kind $KIND" ;;
  agy)
    [ -z "$EFFORT" ] || die "no effort flag is verified for agy; omit --effort" ;;
  *) die "unknown kind: $KIND (claude|codex|agy)" ;;
esac

[ -n "$DIRECTION" ] || { [ -n "$ANCHOR" ] && DIRECTION=down || DIRECTION=right; }

if [ -n "$ANCHOR" ]; then
  SPLIT_JSON="$(herdr pane split --pane "$ANCHOR" --direction "$DIRECTION" --cwd "$CWD" --no-focus)"
else
  SPLIT_JSON="$(herdr pane split --current --direction "$DIRECTION" --cwd "$CWD" --no-focus)"
fi
PANE_ID="$(printf '%s' "$SPLIT_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')"
[ -n "$PANE_ID" ] || die "could not read pane_id from: $SPLIT_JSON"

# Native arguments after `--` differ per kind. Effort is a flag for claude, a config key
# for codex, and unverified for agy.
case "$KIND" in
  claude) NATIVE=(--model "$MODEL" --effort "$EFFORT")
          [ -n "$RESUME" ] && NATIVE+=(--resume "$RESUME") ;;
  codex)  NATIVE=(-m "$MODEL" -c "model_reasoning_effort=\"$EFFORT\"")
          [ -n "$RESUME" ] && NATIVE+=(resume "$RESUME") ;;
  agy)    NATIVE=(--model "$MODEL")
          [ -n "$RESUME" ] && NATIVE+=(--resume "$RESUME") ;;
esac

herdr agent start "$NAME" --kind "$KIND" --pane "$PANE_ID" -- "${NATIVE[@]}" >/dev/null

# Assert the launched argv, in the same step, before treating the spawn as done.
AGENT_JSON_FILE="$(mktemp -t office-spawn)"
trap 'rm -f "$AGENT_JSON_FILE"' EXIT
herdr agent get "$NAME" > "$AGENT_JSON_FILE"
if ! python3 - "$AGENT_JSON_FILE" "$MODEL" "$EFFORT" <<'PY'
import json, sys
path, model, effort = sys.argv[1], sys.argv[2], sys.argv[3]
argv = json.load(open(path))["result"]["agent"].get("argv") or []
argv = " ".join(argv) if isinstance(argv, list) else str(argv)
missing = [v for v in (model, effort) if v and v not in argv]
if missing:
    print("launched argv is missing %s: %s" % (", ".join(missing), argv), file=sys.stderr)
    sys.exit(1)
PY
then
  echo "office-spawn: tier assertion failed for $NAME; closing $PANE_ID" >&2
  herdr pane close "$PANE_ID" >/dev/null 2>&1 || true
  exit 1
fi

# Ledger line. session_id is the resume handle and the reason a pane can be closed on report;
# it is readable only while the agent lives.
mkdir -p "$(dirname "$LEDGER")"
python3 - "$AGENT_JSON_FILE" "$ROLE" >> "$LEDGER" <<'PY'
import json, sys, datetime
a = json.load(open(sys.argv[1]))["result"]["agent"]
print(json.dumps({
  "pane_id":    a["pane_id"],
  "agent":      a.get("name"),
  "kind":       a["agent"],
  "role":       sys.argv[2],
  "session_id": (a.get("agent_session") or {}).get("value"),
  "worktree":   a["cwd"],
  "argv":       a.get("argv"),
  "spawned_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}))
PY

if ! tail -1 "$LEDGER" | grep -q '"session_id": *"'; then
  echo "office-spawn: session_id not populated yet for $NAME; re-read 'herdr agent get $NAME' and rewrite the line once the agent is live" >&2
fi

echo "$PANE_ID"
