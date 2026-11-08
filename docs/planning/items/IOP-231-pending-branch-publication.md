# IOP-231 — Consolidate and publish pending branches

## Status and goal

In progress. On 2026-11-08 the owner explicitly requested integrating all pending
branches into develop and publishing to origin. This authorizes the local merges
and normal pushes; preserve all branch refs and history.

## Scope and acceptance

- [ ] Audit local/origin branch tips and integrate outstanding ancestry without
  reverting the approved IOP-229/230 logo, caption or navigation behavior.
- [ ] Retain the existing historical transfer note from the already-published
  local transfer branch; do not run its documented operator actions.
- [ ] Verify the resulting application tree matches the validated build, check
  indexed secret hygiene and documentation links/status consistency.
- [ ] Publish develop and every retained local story branch to origin without
  force/deletion; verify remote parity and a clean final develop checkout.

Follow Accepted [ADR-0008](../../architecture/adr/ADR-0008-story-branches.md) and
the [workflow](../workflow.md). No stage/master promotion, database/account action,
new product feature or explicit deployment is requested.

## Evidence

[Execution plan](../active/IOP-231-pending-branch-publication-plan.md).
