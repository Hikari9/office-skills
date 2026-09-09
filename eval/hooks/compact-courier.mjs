#!/usr/bin/env node
/**
 * Shim. The hook itself lives at `office-core/hooks/compact-courier.mjs`. Same
 * reasoning as the other shims here: core behaviour ships inside every plugin,
 * and installed hook commands are absolute, so this path has to stay stable.
 */
await import("../../office-core/hooks/compact-courier.mjs");
