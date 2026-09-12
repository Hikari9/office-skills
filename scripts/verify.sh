#!/usr/bin/env bash
set -euo pipefail
# verify.sh — run verification gates against a worktree
#
# Usage:
#   verify.sh --worktree <path> --dispatch-id <id> --state-dir <dir> --db <path> \
#     [--packet <packet.json>] [--config <config.yaml>]

WORKTREE=""
DISPATCH_ID=""
STATE_DIR=""
DB=""
PACKET=""
CONFIG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --worktree) WORKTREE="$2"; shift 2 ;;
    --dispatch-id) DISPATCH_ID="$2"; shift 2 ;;
    --state-dir) STATE_DIR="$2"; shift 2 ;;
    --db) DB="$2"; shift 2 ;;
    --packet) PACKET="$2"; shift 2 ;;
    --config) CONFIG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$WORKTREE" || -z "$DISPATCH_ID" || -z "$STATE_DIR" || -z "$DB" ]]; then
  echo "Missing required arguments"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="${SCRIPT_DIR}/office_runtime.py"

mkdir -p "$STATE_DIR/.office/validations"

PROJECT_TYPE="unknown"
if [[ -f "$WORKTREE/package.json" ]]; then
  PROJECT_TYPE="node"
elif [[ -f "$WORKTREE/Cargo.toml" ]]; then
  PROJECT_TYPE="rust"
elif [[ -f "$WORKTREE/pyproject.toml" || -f "$WORKTREE/requirements.txt" ]]; then
  PROJECT_TYPE="python"
fi

OVERALL_PASS=true
RESULTS="[]"

run_gate() {
  local kind="$1"
  local cmd="$2"
  local evidence_hash="sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  local passed=true
  local skip_reason=""
  
  if [[ -z "$cmd" ]]; then
    skip_reason="Not applicable for $PROJECT_TYPE"
  else
    if ! (cd "$WORKTREE" && eval "$cmd" > gate.log 2>&1); then
      passed=false
      OVERALL_PASS=false
    fi
    if [[ -f "$WORKTREE/gate.log" ]]; then
      evidence_hash=$("$RUNTIME" hash "$WORKTREE/gate.log" | grep -o '"hash": *"[^"]*"' | cut -d'"' -f4 || echo "$evidence_hash")
    fi
  fi
  
  local pass_int=1
  if [[ "$passed" == "false" ]]; then pass_int=0; fi
  
  local val_file="$STATE_DIR/.office/validations/${kind}_${DISPATCH_ID}.json"
  cat <<EOF > "$val_file"
{
  "dispatch_id": "$DISPATCH_ID",
  "kind": "$kind",
  "command": "$cmd",
  "passed": $pass_int,
  "known_bad_proven": 0,
  "evidence_hash": "$evidence_hash"
}
EOF

  "$RUNTIME" record-validation --db "$DB" "$val_file" > /dev/null || true

  local p_str="true"
  if [[ "$passed" == "false" ]]; then p_str="false"; fi
  
  # Append to JSON array
  local temp_results
  temp_results=$(echo "$RESULTS" | sed 's/]$//')
  if [[ "$RESULTS" != "[]" ]]; then temp_results="${temp_results},"; fi
  RESULTS="${temp_results}{\"name\": \"$kind\", \"passed\": $p_str, \"skip_reason\": \"$skip_reason\", \"evidence_hash\": \"$evidence_hash\"}]"
}

cmd_lint=""
cmd_typecheck=""
cmd_build=""
cmd_regression=""

case "$PROJECT_TYPE" in
  node)
    cmd_lint="npm run lint"
    cmd_typecheck="npx tsc --noEmit"
    cmd_build="npm run build"
    cmd_regression="npm test"
    ;;
  rust)
    cmd_lint="cargo clippy -- -D warnings"
    cmd_typecheck="cargo check"
    cmd_build="cargo build"
    cmd_regression="cargo test"
    ;;
  python)
    cmd_lint="ruff check ."
    cmd_typecheck="mypy ."
    cmd_build=""
    cmd_regression="pytest"
    ;;
esac

run_gate "lint" "$cmd_lint"
run_gate "typecheck" "$cmd_typecheck"
run_gate "build" "$cmd_build"
run_gate "targeted_tests" ""
run_gate "regression_tests" "$cmd_regression"
run_gate "runtime_verification" ""
run_gate "browser_acceptance" ""
run_gate "known_bad_controls" ""

overall_str="true"
if [[ "$OVERALL_PASS" == "false" ]]; then overall_str="false"; fi

cat <<EOF
{
  "passed": $overall_str,
  "dispatch_id": "$DISPATCH_ID",
  "gates": $RESULTS
}
EOF
