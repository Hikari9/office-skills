#!/usr/bin/env bash
# compact-police.sh — Herdr-only delivery of a planner-declared pane compaction.
#
# This helper deliberately has no token threshold and no polling loop. Automatic,
# per-pane compaction is the hook path:
#
#   office-core/hooks/compact-advisor.mjs   Stop hook: decides, writes a request
#   office-core/hooks/compact-courier.mjs   Stop hook (async): delivers /compact
#
# The hooks fire at the pane's own turn boundary, which is the event a poller can
# only guess at. What they cannot cover is a **Codex** pane (no Stop event) or a
# pane the planner is about to reuse for a different task, where the planner —
# not the pane — knows what the next brief needs kept. That is this command:
#
#   reuse NAME [--keep TEXT]     Compact a completed Claude/Codex pane before reusing it.
#
# Agy is intentionally ignored: its interactive panes do not expose /compact.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  compact-police.sh reuse <agent-name> [--keep <continuity instructions>]

The helper is a no-op unless HERDR_ENV=1 and herdr is available.
It uses explicit reuse intent; it never uses a token threshold.
Automatic per-pane compaction is office-core/hooks/compact-{advisor,courier}.mjs.
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
    reuse)
      [[ $# -ge 2 ]] || { usage; return 2; }
      name="$2"
      shift 2
      reuse_agent "$name" "$@"
      ;;
    planner|watch)
      echo "compact-police: '$1' was removed in core 17.7.0; per-pane compaction is now the" >&2
      echo "compact-advisor/compact-courier Stop hook pair (install.mjs --with-auto-compact)." >&2
      echo "Use 'reuse' for a planner-declared reuse of a Claude or Codex pane." >&2
      return 2
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
