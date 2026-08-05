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

  # changelog present, and its newest heading matches the declared plugin version.
  # Drift here is silent: the maintenance step says "bump version, add a CHANGELOG
  # entry" and nothing previously checked that the two agreed.
  chg="$dir/CHANGELOG.md"
  if [ -f "$chg" ]; then
    ok "CHANGELOG.md present"
    top_ver="$(grep -m1 -oE '^## [0-9]+\.[0-9]+\.[0-9]+' "$chg" | awk '{print $2}')"
    if [ -z "$top_ver" ]; then
      fail "$p CHANGELOG.md newest heading is not '## X.Y.Z — YYYY-MM-DD'"
    elif [ -f "$desc" ]; then
      dec_ver="$(python3 -c "import json;print(json.load(open('$desc'))['version'])" 2>/dev/null)"
      if [ "$top_ver" = "$dec_ver" ]; then
        ok "version $dec_ver matches newest CHANGELOG entry"
      else
        fail "$p version drift: plugin.json is $dec_ver, newest CHANGELOG entry is $top_ver"
      fi
    fi
  else
    fail "$p missing CHANGELOG.md"
  fi

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

  # Referenced helper scripts must resolve. A doc that says "run scripts/foo.sh"
  # without saying which root it is relative to sent a planner hunting in the
  # plugin's own scripts/ dir, concluding the script did not exist at all, and
  # reporting a maintenance step as unrunnable. Accept a hit at the workspace
  # root OR in the plugin, and fail only when it is nowhere.
  missing_scripts=0
  while IFS= read -r ref; do
    [ -z "$ref" ] && continue
    base="$(basename "$ref")"
    if [ ! -f "$ROOT/scripts/$base" ] && [ ! -f "$dir/scripts/$base" ]; then
      fail "$p references a script that exists nowhere: $ref"
      missing_scripts=$((missing_scripts + 1))
    fi
  done < <(grep -rhoE '\bscripts/[A-Za-z0-9_.-]+\.(sh|py)\b' \
             "$dir" --include='*.md' 2>/dev/null | sort -u)
  [ "$missing_scripts" -eq 0 ] && ok "referenced scripts resolve"

  # The planning spoke must carry core's plan-contract INTO the planner's context:
  # a resolvable relative link (bare plugin-root paths do not resolve from inside a
  # spoke) AND the five required section names spelled out. auto-office had neither,
  # so its planners wrote the GOAL block and task table — both inline here — and
  # silently skipped the required sections. Nothing caught it: the link check only
  # inspects [](...) links, and a bare backtick path passes it.
  planspoke="$(find "$dir/skills" -name SKILL.md -path '*planning*' 2>/dev/null | head -1)"
  if [ -n "$planspoke" ]; then
    contract_ok=1
    grep -qE '\]\((\.\./)+office-core/protocol/plan-contract\.md\)' "$planspoke" \
      || { fail "${planspoke#$ROOT/} has no resolvable link to plan-contract.md (a bare path does not resolve from a spoke)"; contract_ok=0; }
    for section in Context "Global Constraints" "Numbered tasks" "Dependency graph" "Out of scope"; do
      grep -qiF "$section" "$planspoke" \
        || { fail "${planspoke#$ROOT/} never names required plan section: $section"; contract_ok=0; }
    done
    [ "$contract_ok" -eq 1 ] && ok "planning spoke carries the plan contract"
  elif grep -q 'office-core/protocol/plan-contract\.md' "$hub" 2>/dev/null; then
    # codex-office plans from the hub itself. A bare plugin-root path is fine there:
    # the hub is the file in context, so the path resolves from where it is read.
    ok "hub carries the plan contract (no planning spoke)"
  else
    fail "$p neither has a planning spoke nor cites plan-contract.md in its hub"
  fi
done

echo
if [ "$FAILED" -gt 0 ]; then
  echo "$FAILED failure(s), $WARNED warning(s)"
  exit 1
fi
echo "all checks passed, $WARNED warning(s)"
