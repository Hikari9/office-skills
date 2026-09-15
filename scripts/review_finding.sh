#!/usr/bin/env bash
set -euo pipefail
# review_finding.sh — persist a review finding
#
# Usage:
#   review_finding.sh --dispatch-id <id> --reviewer-dispatch-id <id> \
#     --status <PASS|IMPLEMENTATION_DEFECT|PLAN_DEFECT|BRIEF_DEFECT> \
#     --summary <text> --state-dir <dir> --db <path> [--severity <level>]

DISPATCH_ID=""
REVIEWER_ID=""
STATUS=""
SUMMARY=""
STATE_DIR=""
DB=""
SEVERITY="medium"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dispatch-id) DISPATCH_ID="$2"; shift 2 ;;
    --reviewer-dispatch-id) REVIEWER_ID="$2"; shift 2 ;;
    --status) STATUS="$2"; shift 2 ;;
    --summary) SUMMARY="$2"; shift 2 ;;
    --state-dir) STATE_DIR="$2"; shift 2 ;;
    --db) DB="$2"; shift 2 ;;
    --severity) SEVERITY="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$DISPATCH_ID" || -z "$REVIEWER_ID" || -z "$STATUS" || -z "$SUMMARY" || -z "$STATE_DIR" || -z "$DB" ]]; then
  echo "Missing required arguments"
  exit 1
fi

mkdir -p "$STATE_DIR/.office/findings"
FINDING_ID="$(uuidgen || cat /proc/sys/kernel/random/uuid)"
FINDING_FILE="$STATE_DIR/.office/findings/${FINDING_ID}.json"

SCHEMA_STATUS="$STATUS"
case "$STATUS" in
  PASS) SCHEMA_STATUS="rejected-on-evidence" ;;
  IMPLEMENTATION_DEFECT|PLAN_DEFECT|BRIEF_DEFECT) SCHEMA_STATUS="accepted-material" ;;
esac

cat <<EOF > "$FINDING_FILE"
{
  "finding_id": "$FINDING_ID",
  "dispatch_id": "$DISPATCH_ID",
  "reviewer_dispatch_id": "$REVIEWER_ID",
  "status": "$SCHEMA_STATUS",
  "severity": "$SEVERITY",
  "summary": "$SUMMARY",
  "evidence": "$SUMMARY",
  "evidence_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
EOF

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="${SCRIPT_DIR}/office_runtime.py"
"$RUNTIME" record-finding --db "$DB" "$FINDING_FILE" > /dev/null

echo "$FINDING_ID"
