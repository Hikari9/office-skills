# Compatibility

- **Plugin version:** `17.0.0` (see `.claude-plugin/plugin.json`)
- **Supported core range:** `>=18.0.0 <19.0.0`
- **Vendored snapshot:** `office-core/`, with `office-core/SNAPSHOT.json` recording the exact core
  version and content hash this plugin ships against. The vendored copy is authoritative for an
  installed plugin; `scripts/vendor-core.sh` (run from the repo root) refreshes it from the
  repo-root `office-core/`, which is the only editable source.

## Exceptions

Codex Office has no office-specific additions that fall outside core at `18.0.0`. Re-checked
against core `18.0.0`: this office keeps one session in both the Orchestrator and Planner roles,
which core's two-hats rule permits, and adopts the producer-owned dispositions, the inline-review
tier, the integration-scoped final adversary, and the landing packet unchanged.

```yaml
exceptions: []
```
