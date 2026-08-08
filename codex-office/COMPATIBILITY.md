# Compatibility

- **Plugin version:** `1.2.0` (see `.claude-plugin/plugin.json`)
- **Supported core range:** `>=1.0.0 <2.0.0`
- **Vendored snapshot:** `office-core/`, with `office-core/SNAPSHOT.json` recording the exact core
  version and content hash this plugin ships against. The vendored copy is authoritative for an
  installed plugin; `scripts/vendor-core.sh` (run from the repo root) refreshes it from the
  repo-root `office-core/`, which is the only editable source.

## Exceptions

Codex Office has no office-specific additions that fall outside core at `1.3.0`.

```yaml
exceptions: []
```
