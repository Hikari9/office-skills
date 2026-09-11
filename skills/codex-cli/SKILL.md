---
name: codex-cli
description: Directly invocable Auto Office v3 Codex CLI mechanics primitive. Use when a selected/explicit Codex harness dispatch needs safe model+effort invocation, worktree targeting, prompt transport, liveness/readback, resume safety, or Codex-specific failure attribution. Do not treat this primitive as a lifecycle office or as proof that the Codex adapter is proven.
---

# Codex CLI primitive

Load `../../adapters/seed/codex.yaml` and the current local adapter override. The shipped seed is `valid-unverified`; normal mutable/final-gate authority requires promotion by v3 conformance/evidence or explicit user override.

Always pass explicit model and canonical effort. Current migration mechanics use `codex exec -m <model> -c model_reasoning_effort="<effort>"`; never rely on user config defaults. For mutable full-authority execution the legacy mechanic used `--yolo`, so blast radius/protected paths and adapter trust are the safety boundary.

Pass prompt text as one argv element without a shell. For background execution, close stdin (`< /dev/null` equivalent) to avoid the observed wait-on-stdin deadlock. Verify the launch banner's model and reasoning effort.

Fresh `exec` may target a worktree with `--cd`; `resume` can inherit the caller cwd and cannot accept `--cd` on observed versions. Read back `workdir` before allowing resumed mutation. If wrong, terminate and start a fresh dispatch in the correct tree rather than creating a duplicate writer.

Attribute invocation/stdio bugs to adapter, resume/workdir behavior to harness, quota walls to quota/account, and logical implementation defects to the producer model/role only when evidence supports it.
