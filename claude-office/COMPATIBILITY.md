# Compatibility — claude-office

| Line | Value |
|---|---|
| Plugin version | `2.1.1` (see `.claude-plugin/plugin.json`) |
| Core protocol supported | `>=3.0.0 <4.0.0` |
| Core protocol vendored | `3.1.0` (see `office-core/SNAPSHOT.json`) |
| Vendored snapshot | `office-core/SNAPSHOT.json`, written by `scripts/vendor-core.sh` |

This plugin is an adapter over `office-core`. It restates or links every core gate that applies
to it, narrows some of them, and never widens authority, drops a gate, reassigns a role, or
redefines a verdict. See `office-core/protocol/compatibility.md` for the full adapter contract
and the release/rollback checklist.

## Exceptions

```yaml
exceptions:
  - id: claude-cli-default-execution
    owner: claude-office
    reason: >
      The executor defaults to a claude --bg --remote-control background agent instead of an
      in-session Agent-tool subagent. This is a runtime-mechanics choice (which process runs the
      executor role), not an authority change — the reviewer stays in-session, and every gate in
      roles-and-authority.md still applies unchanged to whichever mode is active.
    widens_core_authority: false
  - id: claude-cli-send-message-channel
    owner: claude-office
    reason: >
      A raised question from a blocked --cli executor is answered in place via skills/claude-cli-send-message
      (verified keystroke recipes over `claude attach`) rather than always forking and recovering.
      This narrows cost, not authority: the same escalation-ownership rules in
      office-core/protocol/roles-and-authority.md decide who answers.
    widens_core_authority: false
```

## Re-vendoring

When `office-core/VERSION` changes in a way that affects this plugin, re-vendor with
`scripts/vendor-core.sh` from the repo root, bump this plugin's version, add a `CHANGELOG.md`
entry, and run `scripts/check-plugins.sh` before shipping.
