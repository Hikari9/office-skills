#!/usr/bin/env bash
set -euo pipefail

OFFICE_STATE_DIR="${OFFICE_STATE_DIR:-.office}"
HOOKS_DEST="${OFFICE_STATE_DIR}/hooks"
MANIFEST="${OFFICE_STATE_DIR}/hook-manifest.json"

UNINSTALL=0
if [ "${1:-}" = "--uninstall" ]; then
    UNINSTALL=1
fi

if [ $UNINSTALL -eq 1 ]; then
    rm -rf "$HOOKS_DEST"
    rm -f "$MANIFEST"
    echo "Uninstalled hooks."
    exit 0
fi

mkdir -p "$HOOKS_DEST"
HOOKS_SRC="$(cd "$(dirname "$0")" && pwd)"
cp "${HOOKS_SRC}/session_end.sh" "$HOOKS_DEST/"
cp "${HOOKS_SRC}/pre_compact.sh" "$HOOKS_DEST/"
cp "${HOOKS_SRC}/compact_advisor.sh" "$HOOKS_DEST/"
cp "${HOOKS_SRC}/close_panes.sh" "$HOOKS_DEST/"
chmod +x "$HOOKS_DEST"/*.sh

cat > "$MANIFEST" << EOF
{
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "hooks": [
    {
      "name": "session_end",
      "trigger": "session_end",
      "script": "${HOOKS_DEST}/session_end.sh",
      "idempotent": true,
      "timeout": 30
    },
    {
      "name": "pre_compact",
      "trigger": "pre_compact",
      "script": "${HOOKS_DEST}/pre_compact.sh",
      "idempotent": true,
      "timeout": 30
    },
    {
      "name": "compact_advisor",
      "trigger": "post_compact",
      "script": "${HOOKS_DEST}/compact_advisor.sh",
      "idempotent": true,
      "timeout": 30
    },
    {
      "name": "close_panes",
      "trigger": "cleanup",
      "script": "${HOOKS_DEST}/close_panes.sh",
      "idempotent": true,
      "timeout": 30
    }
  ]
}
EOF

python3 -c "
import json, os, glob
h = '${HOOKS_DEST}'
configured = []
def configure_codex(path):
    if not os.path.exists(path):
        return False
    with open(path, 'r') as f: d = json.load(f)
    hooks = d.setdefault('hooks', {})
    hooks.update({
        'SessionStart': [{'hooks': [{'type': 'command', 'command': h+'/session_end.sh', 'timeout': 30000}]}],
        'PreCompact': [{'hooks': [{'type': 'command', 'command': h+'/pre_compact.sh', 'timeout': 30000}]}]
    })
    with open(path, 'w') as f: json.dump(d, f, indent=2)
    return True
# Claude
p = os.path.expanduser('~/.claude/settings.json')
if os.path.exists(p):
    with open(p, 'r') as f: d = json.load(f)
    d.setdefault('hooks', {})
    d['hooks'].update({'SessionEnd': h+'/session_end.sh', 'PreCompact': h+'/pre_compact.sh', 'Stop': h+'/close_panes.sh'})
    with open(p, 'w') as f: json.dump(d, f, indent=2)
    configured.append('Claude')

# Codex
p = os.path.expanduser('~/.codex/hooks.json')
if configure_codex(p):
    configured.append('Codex')

# Gemini
p = os.path.expanduser('~/.gemini/config/hooks.json')
if os.path.exists(p):
    with open(p, 'r') as f: d = json.load(f)
    d.update({'SessionEnd': h+'/session_end.sh', 'Stop': h+'/close_panes.sh'})
    with open(p, 'w') as f: json.dump(d, f, indent=2)
    configured.append('Gemini')

if configured:
    print('Configured harnesses:', ', '.join(configured))
"

python3 -c "
import os, glob, yaml
h = '${HOOKS_DEST}'
hermes = False
for p in glob.glob(os.path.expanduser('~/.hermes/profiles/*/config.yaml')):
    with open(p, 'r') as f: d = yaml.safe_load(f) or {}
    d.setdefault('hooks', {})
    d['hooks'].update({'on_session_end': h+'/session_end.sh', 'on_session_finalize': h+'/session_end.sh'})
    with open(p, 'w') as f: yaml.safe_dump(d, f)
    hermes = True
if hermes:
    print('Configured harnesses: Hermes')
" 2>/dev/null || true


echo "Hooks installed to $HOOKS_DEST and manifest created at $MANIFEST"
exit 0
