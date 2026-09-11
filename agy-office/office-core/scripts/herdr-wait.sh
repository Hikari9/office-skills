#!/usr/bin/env bash
# herdr-wait.sh — bounded, evidence-based wait for one delegated task.
#
# This watches task completion, not narration. It is intentionally a separate process so the
# planner can launch it in the background and avoid the harness's short foreground-command timeout.
set -euo pipefail

NAME=""; KIND=""; WORKTREE=""; BASE=""; HANDOFF=""
POLL_SECONDS=60; TIMEOUT_SECONDS=7200

die() { echo "herdr-wait: $*" >&2; exit 2; }

while [ $# -gt 0 ]; do
  case "$1" in
    --name)            [ $# -ge 2 ] || die "--name needs a value"; NAME="$2"; shift 2;;
    --kind)            [ $# -ge 2 ] || die "--kind needs a value"; KIND="$2"; shift 2;;
    --worktree)        [ $# -ge 2 ] || die "--worktree needs a value"; WORKTREE="$2"; shift 2;;
    --base)            [ $# -ge 2 ] || die "--base needs a value"; BASE="$2"; shift 2;;
    --handoff)         [ $# -ge 2 ] || die "--handoff needs a value"; HANDOFF="$2"; shift 2;;
    --poll-seconds)    [ $# -ge 2 ] || die "--poll-seconds needs a value"; POLL_SECONDS="$2"; shift 2;;
    --timeout-seconds) [ $# -ge 2 ] || die "--timeout-seconds needs a value"; TIMEOUT_SECONDS="$2"; shift 2;;
    -h|--help) sed -n '1,30p' "$0"; exit 0;;
    *) die "unknown argument: $1";;
  esac
done

[ -n "$NAME" ] || die "--name is required"
case "$KIND" in agy|claude|codex) ;; *) die "--kind must be agy, claude, or codex";; esac
[ -d "$WORKTREE" ] || die "--worktree is not a directory: $WORKTREE"
[ -n "$BASE" ] || die "--base is required"
[ -n "$HANDOFF" ] || die "--handoff is required"
command -v herdr >/dev/null 2>&1 || die "herdr is not on PATH"

BASE="$(git -C "$WORKTREE" rev-parse --verify "$BASE^{commit}")" \
  || die "--base is not a commit in $WORKTREE"

started_at="$(date +%s)"
deadline=$((started_at + TIMEOUT_SECONDS))
seen_working=0
same_seq=0
last_seq=""
last_status=""
poll=0

read_agent() {
  local raw status_seq
  if ! raw="$(herdr agent get "$NAME" 2>/dev/null)"; then
    echo "EXIT=pane-gone"
    exit 0
  fi
  if ! status_seq="$(python3 -c '
import json, sys
doc = json.load(sys.stdin)
agent = (doc.get("result") or {}).get("agent") or {}
print(agent.get("agent_status", "unknown"), agent.get("state_change_seq", ""))
' <<<"$raw")"; then
    echo "EXIT=herdr-error"
    exit 1
  fi
  read -r STATUS SEQ <<<"$status_seq"
}

while [ "$(date +%s)" -lt "$deadline" ]; do
  poll=$((poll + 1))
  read_agent

  HEAD="$(git -C "$WORKTREE" rev-parse HEAD 2>/dev/null || true)"
  COMMITS=0
  if [ -n "$HEAD" ] && [ "$HEAD" != "$BASE" ]; then
    COMMITS="$(git -C "$WORKTREE" rev-list --count "$BASE..$HEAD" 2>/dev/null || echo 0)"
  fi

  if [ "$STATUS" = blocked ]; then
    echo "EXIT=blocked"
    exit 0
  fi

  if { [ "$STATUS" = idle ] || [ "$STATUS" = done ]; } && [ -e "$HANDOFF" ] && [ "$COMMITS" -gt 0 ]; then
    echo "EXIT=done commits=$COMMITS head=$HEAD handoff=$HANDOFF"
    exit 0
  fi

  if [ "$STATUS" = working ]; then
    seen_working=1
    same_seq=0
  elif [ "$KIND" != agy ] && { [ "$STATUS" = idle ] || [ "$STATUS" = done ]; }; then
    if [ -n "$SEQ" ] && [ "$SEQ" = "$last_seq" ]; then
      same_seq=$((same_seq + 1))
    else
      same_seq=0
    fi
    last_seq="$SEQ"
    if [ "$same_seq" -ge 3 ]; then
      if [ "$seen_working" = 1 ]; then
        echo "EXIT=stalled commits=$COMMITS"
      else
        echo "EXIT=never-started"
      fi
      exit 0
    fi
  fi

  if [ "$STATUS" != "$last_status" ] || [ $((poll % 5)) -eq 0 ]; then
    elapsed=$(( $(date +%s) - started_at ))
    echo "WAIT status=$STATUS seq=$SEQ commits=$COMMITS elapsed=${elapsed}s"
    last_status="$STATUS"
  fi
  sleep "$POLL_SECONDS"
done

echo "EXIT=timeout kind=$KIND"
