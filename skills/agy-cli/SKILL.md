---
name: agy-cli
description: Directly invocable Auto Office v3 Agy CLI mechanics primitive. Use when a selected/explicit Agy harness dispatch needs exact launch flag ordering, dynamic model discovery, model-dependent effort handling, workspace pinning, timeout/quota-stall diagnosis, prompt transport, recovery, or Agy-specific failure attribution. Do not treat this primitive as a separate lifecycle office or proof of adapter promotion.
---

# Agy CLI primitive

Load `../../adapters/seed/agy.yaml` plus current local override. The shipped seed is `valid-unverified`.

Migration mechanics use `agy --dangerously-skip-permissions --print-timeout 45m --model <exact display name> --add-dir <cwd> --print=<prompt>`. Bind the prompt to `--print`; do not pipe stdin. The observed CLI is sensitive to prompt/flag ordering and dynamic model display names.

Resolve models from local `agy models` at dispatch. Do not hardcode “latest” slugs. Effort is model-dependent: observed Gemini routes accept `--effort`; observed Claude routes encode thinking differently and may reject the flag. Treat unknown mapping as unroutable until probed/mapped.

Pin the absolute workspace inside the packet/prompt because `--add-dir` alone has not always selected the workspace. Diagnose a greeting/swallowed prompt as adapter invocation failure, and narration-with-no-work under exhausted allowance as quota/account when evidence confirms it.
