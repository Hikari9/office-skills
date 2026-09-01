#!/usr/bin/env node
/**
 * Shim. The hook itself lives at `office-core/hooks/close-finished-panes.mjs`,
 * because it is core behaviour that has to ship inside every plugin — a plugin
 * installed on its own cannot reach this repo's `eval/` directory.
 *
 * This path stays alive because installed hook commands carry absolute paths: a
 * settings.json that already points here keeps working across the move with
 * nothing to re-run.
 */
await import("../../office-core/hooks/close-finished-panes.mjs");
