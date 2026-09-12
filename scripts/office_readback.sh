#!/usr/bin/env bash
set -euo pipefail  
# office-readback.sh — read dispatch output and classify result
#
# Usage:
#   office-readback.sh --dispatch-id <id> [--state-dir <dir>]

DISPATCH_ID=""
STATE_DIR="${HOME}/.office/state"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dispatch-id) DISPATCH_ID="$2"; shift 2 ;;
    --state-dir) STATE_DIR="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$DISPATCH_ID" ]]; then
  echo "Usage: office-readback.sh --dispatch-id <id>" >&2
  exit 1
fi

DISPATCH_DIR="${STATE_DIR}/dispatches/${DISPATCH_ID}"
LOGFILE="${DISPATCH_DIR}/output.log"
METAFILE="${DISPATCH_DIR}/meta.json"
EXITFILE="${DISPATCH_DIR}/exit_code"

if [[ ! -f "$METAFILE" || ! -f "$LOGFILE" ]]; then
    echo "{\"error\": \"Dispatch not found or no output\"}" >&2
    exit 1
fi

# Extract adapter basename (e.g., 'hermes' from 'adapters/seed/hermes.yaml')
ADAPTER=$(python3 -c "import json, os; print(os.path.basename(json.load(open('$METAFILE')).get('adapter', '')).replace('.yaml', ''))")

EXIT_CODE=-1
if [[ -f "$EXITFILE" ]]; then
    EXIT_CODE=$(cat "$EXITFILE")
fi

OUTPUT_BYTES=$(stat -f %z "$LOGFILE" 2>/dev/null || stat -c %s "$LOGFILE" || echo 0)

# Output tail, escaping for JSON
# This correctly escapes quotes, backslashes, and newlines
OUTPUT_TAIL=""
if [[ "$OUTPUT_BYTES" -gt 0 ]]; then
    OUTPUT_TAIL=$(tail -c 2000 "$LOGFILE" | python3 -c 'import json, sys; print(json.dumps(sys.stdin.read())[1:-1])')
fi

# Classify result
CLASSIFICATION="UNKNOWN"
FAILURE_SIGNATURE=""

check_signature() {
    local sig="$1"
    if tail -c 2000 "$LOGFILE" | grep -qi "$sig"; then
        FAILURE_SIGNATURE="$sig"
        CLASSIFICATION="FAILURE"
        return 0
    fi
    return 1
}

case "$ADAPTER" in
    codex)
        check_signature "rate limit" || check_signature "quota exceeded" || check_signature "context length"
        ;;
    claude)
        check_signature "rate limit" || check_signature "quota exceeded" || check_signature "overloaded"
        ;;
    agy)
        check_signature "quota" || check_signature "rate limit" || check_signature "model not available"
        ;;
    hermes)
        check_signature "quota exceeded" || check_signature "model not available" || check_signature "rate limit" || check_signature "context length exceeded" || check_signature "invalid API key"
        ;;
    *)
        check_signature "quota exceeded" || check_signature "rate limit"
        ;;
esac

if [[ -z "$FAILURE_SIGNATURE" ]]; then
    if [[ "$EXIT_CODE" == "0" ]]; then
        CLASSIFICATION="SUCCESS"
    elif [[ "$EXIT_CODE" -gt 0 ]]; then
        CLASSIFICATION="FAILURE"
    fi
fi

if [[ "$CLASSIFICATION" == "UNKNOWN" && "$OUTPUT_BYTES" -gt 0 ]]; then
    CLASSIFICATION="PARTIAL_SUCCESS"
fi

# Override for quota exceeded specifically as requested in prompt: 
# "Classify result: SUCCESS, PARTIAL_SUCCESS, FAILURE, TIMEOUT, QUOTA_EXCEEDED, CRASH, UNKNOWN"
if echo "$FAILURE_SIGNATURE" | grep -qi "quota"; then
    CLASSIFICATION="QUOTA_EXCEEDED"
fi
if echo "$FAILURE_SIGNATURE" | grep -qi "rate limit"; then
    CLASSIFICATION="QUOTA_EXCEEDED" # or something similar, prompt didn't specify rate limit class, likely FAILURE or QUOTA_EXCEEDED
fi

COMPLETED_AT=$(date +%s)

cat <<EOF
{
  "dispatch_id": "$DISPATCH_ID",
  "exit_code": $EXIT_CODE,
  "classification": "$CLASSIFICATION",
  "output_bytes": $OUTPUT_BYTES,
  "output_tail": "${OUTPUT_TAIL}",
  "failure_signature": "$FAILURE_SIGNATURE",
  "completed_at": $COMPLETED_AT
}
EOF
