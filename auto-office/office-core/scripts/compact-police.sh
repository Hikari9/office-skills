#!/usr/bin/env bash
# compact-police.sh — Herdr-only compactability driver.
#
# This helper deliberately has no token threshold. The pane's own compact-monitor skill makes
# the qualitative decision; this script only delivers the prompt at a safe boundary.
#
# Commands:
#   planner NAME                 Ask an idle planner to run /compact-monitor.
#   watch --planner NAME         Repeat that check once per planner work cycle.
#   reuse NAME [--keep TEXT]     Compact a completed Claude/Codex pane before reusing it.
#
# Agy is intentionally ignored: its interactive panes do not expose /compact.
set -euo pipefail

INTERVAL="${COMPACT_POLICE_INTERVAL:-5}"

usage() {
  cat <<'EOF'
Usage:
  compact-police.sh planner <planner-name>
  compact-police.sh watch --planner <planner-name> [--interval <seconds>]
  compact-police.sh reuse <agent-name> [--keep <continuity instructions>]

The helper is a no-op unless HERDR_ENV=1 and herdr is available.
It uses lifecycle boundaries and explicit reuse intent; it never uses a token threshold.
EOF
}

log() {
  printf 'compact-police: %s\n' "$*"
}

herdr_info() {
  local name="$1" payload
  payload="$(herdr agent get "$name" 2>&1 || true)"
  python3 - "$payload" <<'PY'
import json
import sys

try:
    doc = json.loads(sys.argv[1])
except Exception:
    print("unavailable|||" )
    raise SystemExit

if doc.get("error"):
    code = str(doc["error"].get("code", "unknown"))
    print(f"{('gone' if code == 'agent_not_found' else 'unavailable')}|||{code}")
    raise SystemExit

agent = (doc.get("result") or {}).get("agent") or {}
print("|".join([
    str(agent.get("agent_status") or "unavailable"),
    str(agent.get("agent") or ""),
    str(agent.get("state_change_seq") or ""),
]))
PY
}

require_herdr() {
  if [[ "${HERDR_ENV:-}" != 1 ]]; then
    log "HERDR_ENV is not 1; no-op"
    exit 0
  fi
  if ! command -v herdr >/dev/null 2>&1; then
    log "herdr is not on PATH; no-op"
    exit 0
  fi
}

read_info() {
  local name="$1" info="$2"
  IFS='|' read -r STATUS KIND SEQ EXTRA <<<"$info"
  if [[ "$STATUS" == unavailable || "$STATUS" == gone ]]; then
    log "$name is $STATUS${EXTRA:+ ($EXTRA)}"
    return 1
  fi
}

compact_prompt() {
  local keep="$1"
  printf '/compact Keep %s Drop stale tool output. First action after compaction: re-read the current brief, handoff/state files, and plan before acting.' "$keep"
}

planner_once() {
  local name="$1" info
  info="$(herdr_info "$name")"
  read_info "$name" "$info" || return 0

  case "$STATUS" in
    idle|done)
      case "$KIND" in
        claude|codex)
          herdr agent prompt "$name" "/compact-monitor" >/dev/null
          log "asked planner $name to run /compact-monitor at $STATUS boundary"
          ;;
        *)
          log "skipped planner $name: Herdr kind '$KIND' has no supported compact command"
          ;;
      esac
      ;;
    working|blocked|unknown)
      log "skipped planner $name: status is $STATUS"
      ;;
    *)
      log "skipped planner $name: unrecognized status '$STATUS'"
      ;;
  esac
}

watch_planner() {
  local name="$1" info phase=0 ready_seen=0
  trap 'log "stopped planner watch"; exit 0' INT TERM

  while :; do
    info="$(herdr_info "$name")"
    if ! read_info "$name" "$info"; then
      [[ "$STATUS" == gone ]] && return 0
      sleep "$INTERVAL"
      continue
    fi

    case "$STATUS" in
      working)
        # phase 1 is the monitor's prompt in flight. If it was already ready once,
        # this working turn belongs to the planner's next piece of work; otherwise
        # it is the monitor prompt itself.
        if [[ "$phase" == 1 && "$ready_seen" == 0 ]]; then
          phase=2
        elif [[ "$phase" == 1 && "$ready_seen" == 1 ]]; then
          phase=3
        fi
        ;;
      idle|done)
        # phase 0 is the initial/next ready boundary. phase 2 is the monitor's
        # check returning to ready. phase 3 is a new planner turn; its completion
        # is the next boundary eligible for another check.
        if [[ "$phase" == 0 || "$phase" == 3 ]]; then
          case "$KIND" in
            claude|codex)
              if herdr agent prompt "$name" "/compact-monitor" >/dev/null; then
                log "asked planner $name to run /compact-monitor at $STATUS boundary"
              else
                log "could not ask planner $name to run /compact-monitor"
              fi
              # Do not retry while the pane remains ready. The prompt may be accepted even
              # when Herdr's status transition is too brief for a poll to observe.
              phase=1
              ready_seen=0
              ;;
            *)
              log "skipped planner $name: Herdr kind '$KIND' has no supported compact command"
              phase=1
              ready_seen=0
              ;;
          esac
        elif [[ "$phase" == 2 ]]; then
          # The planner returned from the monitor's own check. Stay armed until a
          # later working state proves that new planner work has started.
          phase=1
          ready_seen=1
        elif [[ "$phase" == 1 ]]; then
          # The prompt may have gone ready without a poll catching its working state.
          ready_seen=1
        fi
        ;;
      blocked|unknown)
        log "planner $name is $STATUS; no prompt sent"
        ;;
      *)
        log "planner $name is $STATUS; no prompt sent"
        ;;
    esac
    sleep "$INTERVAL"
  done
}

reuse_agent() {
  local name="$1" keep="the plan, current brief, handoff/state files, and the next task" info
  shift
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --keep)
        [[ $# -ge 2 ]] || { echo "compact-police: --keep needs text" >&2; return 2; }
        keep="$2"
        shift 2
        ;;
      -h|--help)
        usage
        return 0
        ;;
      *)
        echo "compact-police: unknown reuse argument: $1" >&2
        return 2
        ;;
    esac
  done

  info="$(herdr_info "$name")"
  read_info "$name" "$info" || return 2

  case "$KIND" in
    agy)
      log "skipped $name: Agy has no interactive /compact command"
      return 0
      ;;
    claude|codex)
      ;;
    *)
      log "skipped $name: unsupported Herdr kind '$KIND'"
      return 0
      ;;
  esac

  case "$STATUS" in
    idle|done)
      herdr agent prompt "$name" "$(compact_prompt "$keep")"
      log "sent directed /compact to reusable $KIND pane $name"
      ;;
    working|blocked|unknown)
      echo "compact-police: refusing to compact $name while status is $STATUS" >&2
      return 2
      ;;
    *)
      echo "compact-police: refusing to compact $name with status $STATUS" >&2
      return 2
      ;;
  esac
}

main() {
  require_herdr
  [[ $# -gt 0 ]] || { usage; return 2; }

  case "$1" in
    planner)
      [[ $# -eq 2 ]] || { usage; return 2; }
      planner_once "$2"
      ;;
    watch)
      local planner=""
      shift
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --planner)
            [[ $# -ge 2 ]] || { echo "compact-police: --planner needs a name" >&2; return 2; }
            planner="$2"
            shift 2
            ;;
          --interval)
            [[ $# -ge 2 ]] || { echo "compact-police: --interval needs seconds" >&2; return 2; }
            INTERVAL="$2"
            shift 2
            ;;
          -h|--help)
            usage
            return 0
            ;;
          *)
            echo "compact-police: unknown watch argument: $1" >&2
            return 2
            ;;
        esac
      done
      [[ -n "$planner" ]] || { echo "compact-police: watch requires --planner" >&2; return 2; }
      watch_planner "$planner"
      ;;
    reuse)
      [[ $# -ge 2 ]] || { usage; return 2; }
      name="$2"
      shift 2
      reuse_agent "$name" "$@"
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "compact-police: unknown command: $1" >&2
      usage >&2
      return 2
      ;;
  esac
}

main "$@"
