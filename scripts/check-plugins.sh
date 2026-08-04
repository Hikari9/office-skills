#!/usr/bin/env bash
# Contract checks for the three office plugins. Warning-only budgets, hard failures on
# anything that would ship a broken or unsafe artifact.
#
# Run from anywhere: scripts/check-plugins.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/office-core"
PLUGINS=(codex-office claude-office agy-office auto-office)
FAILED=0
WARNED=0

fail() { echo "FAIL  $*"; FAILED=$((FAILED + 1)); }
warn() { echo "WARN  $*"; WARNED=$((WARNED + 1)); }
ok()   { echo "ok    $*"; }

core_hash() {
  ( cd "$1" && find . -type f ! -name SNAPSHOT.json -print0 \
      | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d' ' -f1 )
}

# --- root marketplace ---------------------------------------------------------
MARKET="$ROOT/.claude-plugin/marketplace.json"
if [ -f "$MARKET" ]; then
  python3 -c "import json,sys; json.load(open('$MARKET'))" 2>/dev/null \
    && ok "marketplace.json parses" || fail "marketplace.json is not valid JSON"
else
  fail "missing .claude-plugin/marketplace.json"
fi

CORE_VERSION="$(tr -d '[:space:]' < "$SRC/VERSION")"
SRC_HASH="$(core_hash "$SRC")"
ok "core source version $CORE_VERSION ($SRC_HASH)"

# --- per plugin ---------------------------------------------------------------
for p in "${PLUGINS[@]}"; do
  echo
  echo "== $p"
  dir="$ROOT/$p"

  # descriptor
  desc="$dir/.claude-plugin/plugin.json"
  if [ -f "$desc" ]; then
    if python3 - "$desc" "$p" <<'PY' 2>/dev/null
import json, sys
d = json.load(open(sys.argv[1]))
assert d["name"] == sys.argv[2], "name mismatch"
assert d["version"].count(".") == 2, "version is not semver"
assert d.get("description"), "missing description"
PY
    then ok "plugin.json valid"; else fail "$p/.claude-plugin/plugin.json invalid"; fi
  else
    fail "$p missing .claude-plugin/plugin.json"
  fi

  # hub present, frontmatter intact, within budget
  hub="$dir/SKILL.md"
  if [ -f "$hub" ]; then
    bytes=$(wc -c < "$hub" | tr -d ' ')
    head -1 "$hub" | grep -q -- '---' || fail "$p hub has no YAML frontmatter"
    grep -q "^name: $p\$" "$hub" || fail "$p hub frontmatter name is not $p"
    if [ "$bytes" -gt 9000 ]; then
      warn "$p hub is $bytes bytes (budget 9000; the hub is a dispatch surface, not a manual)"
    else
      ok "hub $bytes bytes"
    fi
  else
    fail "$p missing SKILL.md"
  fi

  # vendored core snapshot: present, fresh, unmodified
  snap="$dir/office-core"
  if [ -d "$snap" ] && [ -f "$snap/SNAPSHOT.json" ]; then
    got_hash="$(core_hash "$snap")"
    rec_hash="$(python3 -c "import json;print(json.load(open('$snap/SNAPSHOT.json'))['content_hash'])")"
    rec_ver="$(python3 -c "import json;print(json.load(open('$snap/SNAPSHOT.json'))['core_version'])")"
    [ "$rec_ver" = "$CORE_VERSION" ] || fail "$p snapshot is core $rec_ver, source is $CORE_VERSION (re-vendor)"
    [ "$got_hash" = "$rec_hash" ] || fail "$p snapshot was hand-edited (hash does not match SNAPSHOT.json)"
    [ "$got_hash" = "$SRC_HASH" ] || fail "$p snapshot is stale against the core source (re-vendor)"
    [ "$got_hash" = "$rec_hash" ] && [ "$got_hash" = "$SRC_HASH" ] && ok "core snapshot fresh at $rec_ver"
  else
    fail "$p has no vendored core snapshot (run scripts/vendor-core.sh)"
  fi

  # compatibility declaration
  compat="$dir/COMPATIBILITY.md"
  if [ -f "$compat" ]; then
    grep -q "exceptions:" "$compat" || fail "$p COMPATIBILITY.md declares no exceptions block"
    grep -q "widens_core_authority: true" "$compat" && fail "$p declares an exception that widens core authority"
    ok "COMPATIBILITY.md present"
  else
    fail "$p missing COMPATIBILITY.md"
  fi

  [ -f "$dir/CHANGELOG.md" ] && ok "CHANGELOG.md present" || fail "$p missing CHANGELOG.md"

  # spokes exist and each declares a hub-routed description
  spokes=$(find "$dir/skills" -name SKILL.md 2>/dev/null | wc -l | tr -d ' ')
  if [ "$spokes" -ge 4 ]; then ok "$spokes spokes"; else fail "$p has only $spokes spokes"; fi
  while IFS= read -r s; do
    grep -qi "not invoked directly\|do not invoke" "$s" \
      || warn "spoke ${s#$ROOT/} does not mark itself hub-routed"
  # claude-cli-send-message is a standalone mechanism skill, legitimately invocable on its own.
  done < <(find "$dir/skills" -name SKILL.md 2>/dev/null | grep -v claude-cli-send-message)

  # required safety rules survive in the hub
  while IFS='|' read -r label pattern; do
    [ -z "$label" ] && continue
    grep -qiE "$pattern" "$hub" || fail "$p hub is missing a required safety rule: $label"
  done <<RULES
explicit invocation|explicitl?y? (invoke|named|typed)|only when the caller
no self-approval|never approves? (its|their) own|self-approv
one writer per tree|one writer|one .*process|separate worktrees
evidence over exit code|exit (code )?0|not evidence|real (validation|gate) output
planner-held irreversible work|PLANNER-HELD|planner-held
review verdicts|CHANGES REQUIRED
round cap|5 rounds|five rounds|round cap
blast radius|blast[- ]radius
RULES

  # no catalog injection in role templates
  if grep -rqi "available skills:\|full skill catalog\|<available-skills>" "$dir/skills" 2>/dev/null; then
    fail "$p ships a skill catalog inside a role template (use a capability manifest)"
  else
    ok "no catalog injection in role templates"
  fi

  # markdown link integrity, relative links only
  broken=0
  while IFS= read -r f; do
    while IFS= read -r link; do
      case "$link" in http*|"") continue;; esac
      base="$(cd "$(dirname "$f")" && cd "$(dirname "$link")" 2>/dev/null && pwd)"
      if [ -z "$base" ] || [ ! -f "$base/$(basename "$link")" ]; then
        fail "broken link in ${f#$ROOT/}: $link"
        broken=$((broken + 1))
      fi
    done < <(grep -oE '\]\([^)#][^)]*\.md[^)]*\)' "$f" 2>/dev/null \
             | sed -E 's/^\]\(//; s/\)$//; s/#.*$//')
  done < <(find "$dir" -name '*.md' -not -path '*/office-core/*')
  [ "$broken" -eq 0 ] && ok "markdown links resolve"
done

echo
if [ "$FAILED" -gt 0 ]; then
  echo "$FAILED failure(s), $WARNED warning(s)"
  exit 1
fi
echo "all checks passed, $WARNED warning(s)"
