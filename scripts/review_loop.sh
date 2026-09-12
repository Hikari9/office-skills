#!/usr/bin/env bash
set -euo pipefail
# review_loop.sh — orchestrate the review/verification/fix cycle
#
# Usage:
#   review_loop.sh --state-dir <dir> --dispatch-id <producer-dispatch-id> \
#     --reviewer-dispatch-id <id> --worktree <path> --db <path> \
#     [--max-iterations <n>] [--config <config.yaml>]

STATE_DIR=""
DISPATCH_ID=""
REVIEWER_ID=""
WORKTREE=""
DB=""
MAX_ITERATIONS=3
CONFIG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --state-dir) STATE_DIR="$2"; shift 2 ;;
    --dispatch-id) DISPATCH_ID="$2"; shift 2 ;;
    --reviewer-dispatch-id) REVIEWER_ID="$2"; shift 2 ;;
    --worktree) WORKTREE="$2"; shift 2 ;;
    --db) DB="$2"; shift 2 ;;
    --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
    --config) CONFIG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$STATE_DIR" || -z "$DISPATCH_ID" || -z "$REVIEWER_ID" || -z "$WORKTREE" || -z "$DB" ]]; then
  echo "Missing required arguments"
  exit 4
fi

if [[ "$DISPATCH_ID" == "$REVIEWER_ID" ]]; then
  echo "Self-approval rejection: producer_dispatch_id and reviewer_dispatch_id must be different."
  exit 4
fi

if [[ -n "$CONFIG" && -f "$CONFIG" ]]; then
  if grep -q "max_review_iterations:" "$CONFIG"; then
    MAX_ITERATIONS=$(grep "max_review_iterations:" "$CONFIG" | awk '{print $2}')
  fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_SCRIPT="${SCRIPT_DIR}/verify.sh"
REVIEW_FINDING_SCRIPT="${SCRIPT_DIR}/review_finding.sh"
RUNTIME="${SCRIPT_DIR}/office_runtime.py"

run_review() {
  # Mock independent review. In practice, this would invoke an agent or prompt.
  # We read from a REVIEW_STATUS env var, default to PASS.
  echo "${REVIEW_STATUS:-PASS}"
}

iter=0
while [[ $iter -lt $MAX_ITERATIONS ]]; do
  iter=$((iter + 1))
  
  verify_out=$("$VERIFY_SCRIPT" --worktree "$WORKTREE" --dispatch-id "$DISPATCH_ID" --state-dir "$STATE_DIR" --db "$DB")
  passed=$(echo "$verify_out" | jq -r '.passed' 2>/dev/null || echo "$verify_out" | grep -o '"passed": *true' || true)
  
  if [[ "$passed" != "true" && "$passed" != "\"passed\": true" ]]; then
    "$REVIEW_FINDING_SCRIPT" --dispatch-id "$DISPATCH_ID" --reviewer-dispatch-id "$REVIEWER_ID" \
      --status "IMPLEMENTATION_DEFECT" --summary "Self-verification failed at iteration $iter" \
      --state-dir "$STATE_DIR" --db "$DB"
    
    if [[ $iter -eq $MAX_ITERATIONS ]]; then
      echo "MAX_ITERATIONS reached during self-verification."
      exit 1
    fi
    
    # Run fix hook if provided
    eval "${FIX_COMMAND:-true}"
    continue
  fi
  
  review_status=$(run_review)
  
  case "$review_status" in
    PASS)
      "$REVIEW_FINDING_SCRIPT" --dispatch-id "$DISPATCH_ID" --reviewer-dispatch-id "$REVIEWER_ID" \
        --status "PASS" --summary "Independent review passed" \
        --state-dir "$STATE_DIR" --db "$DB"
      exit 0
      ;;
    IMPLEMENTATION_DEFECT)
      "$REVIEW_FINDING_SCRIPT" --dispatch-id "$DISPATCH_ID" --reviewer-dispatch-id "$REVIEWER_ID" \
        --status "IMPLEMENTATION_DEFECT" --summary "Independent review found implementation defect" \
        --state-dir "$STATE_DIR" --db "$DB"
      
      if [[ $iter -eq $MAX_ITERATIONS ]]; then
        echo "MAX_ITERATIONS reached."
        exit 1
      fi
      
      # Run fix hook if provided
      eval "${FIX_COMMAND:-true}"
      continue
      ;;
    PLAN_DEFECT)
      "$REVIEW_FINDING_SCRIPT" --dispatch-id "$DISPATCH_ID" --reviewer-dispatch-id "$REVIEWER_ID" \
        --status "PLAN_DEFECT" --summary "Independent review found plan defect" \
        --state-dir "$STATE_DIR" --db "$DB"
      
      # Increment plan version and invalidate packets
      new_plan=$("$RUNTIME" increment-plan --state-dir "$STATE_DIR" --db "$DB" | grep -o '"plan_version": *[0-9]*' | awk '{print $2}')
      if [[ -n "$new_plan" ]]; then
        "$RUNTIME" invalidate-packets --state-dir "$STATE_DIR" --plan-version "$new_plan" >/dev/null
      fi
      exit 2
      ;;
    BRIEF_DEFECT)
      "$REVIEW_FINDING_SCRIPT" --dispatch-id "$DISPATCH_ID" --reviewer-dispatch-id "$REVIEWER_ID" \
        --status "BRIEF_DEFECT" --summary "Independent review found brief defect" \
        --state-dir "$STATE_DIR" --db "$DB"
      exit 3
      ;;
    *)
      echo "Unknown review status: $review_status"
      exit 4
      ;;
  esac
done

exit 1
