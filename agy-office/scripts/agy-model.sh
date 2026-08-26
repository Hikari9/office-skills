#!/usr/bin/env bash
# Resolve the newest Gemini Flash slug agy offers, at the requested effort.
#
# agy has no `latest` alias — every slug is version-pinned — so "Flash latest"
# has to be resolved at dispatch. Hardcoding a version is how this office ended
# up citing 3.1, 3.5, 3.6 and 3.7 in four different files at the same time.
#
# Usage:  agy-model.sh [high|medium|low]      (default: high)
# Prints one slug on stdout. Falls back to the newest slug seen at time of
# writing if `agy models` is unavailable, so a dispatch never blocks on it.
set -uo pipefail

EFFORT="${1:-high}"
FALLBACK="gemini-3.7-flash-${EFFORT}"

# 5s ceiling: this runs on the dispatch path and a model list is never worth
# stalling a run for. `timeout` is coreutils; absent on a bare BSD box, hence
# the guard.
if command -v timeout >/dev/null 2>&1; then
  LIST="$(timeout 5 agy models 2>/dev/null)"
else
  LIST="$(agy models 2>/dev/null)"
fi

# Version key computed in awk, not `sort -V` — BSD sort has no -V, and the
# pipeline fails silently to empty when it is missing.
SLUG="$(printf '%s\n' "${LIST:-}" | awk -v e="$EFFORT" '
  $1 ~ ("^gemini-[0-9]+\\.[0-9]+-flash-" e "$") {
    split($1, p, "-"); split(p[2], v, ".");
    printf "%06d%06d\t%s\n", v[1], v[2], $1
  }' | sort -n | tail -1 | cut -f2)"

if [ -n "$SLUG" ]; then
  printf '%s\n' "$SLUG"
else
  printf '%s\n' "$FALLBACK"
  # Stderr, so a caller substituting this into --model still gets a clean slug.
  echo "agy-model.sh: could not reach 'agy models'; using pinned fallback $FALLBACK" >&2
fi
