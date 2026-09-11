---
name: claude-cli
description: Directly invocable Auto Office v3 Claude CLI mechanics primitive. Use when a selected/explicit Claude harness dispatch needs safe background/in-session launch behavior, prompt transport, worktree isolation, tool allowlisting, liveness, remote-control/resume handling, or Claude-specific failure attribution. Do not treat this primitive as a lifecycle office or proof of adapter promotion.
---

# Claude CLI primitive

Load `../../adapters/seed/claude.yaml` plus any current local override. The shipped seed is `valid-unverified`.

Migration seed mechanics use background Remote Control with explicit `--model`, `--effort`, and `--add-dir`. Send the prompt on stdin; the current ecosystem observed positional prompts registering an idle agent without starting work.

Pre-create an isolated worktree for mutable agents. `--add-dir` is access, not guaranteed workspace isolation; the packet must pin the workspace and protected paths. Generate a scoped tool allowlist from the packet/environment. MCP tools are not inherited merely because the parent agent can use them; name only the tools the delegated task requires.

Never use `--resume <id> --bg` to steer a live writer on observed versions: it can fork into a second writer. For a blocked question, use a verified in-place message path; for real steering/recovery, reconcile holder/session identity first.

Use the harness's session listing as primary liveness evidence; negative `pgrep` alone is not proof of death.
