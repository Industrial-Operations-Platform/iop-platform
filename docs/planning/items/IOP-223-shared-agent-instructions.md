# IOP-223 — Synchronize Mac source and share agent instructions

## Status and goal

Completed. On 2026-11-08 the owner identified Windows as the primary development
computer and requested updating the Mac source checkout and publishing
`AGENTS.md` for use on Windows. The owner clarified that local application/Docker
activation is outside scope. The request explicitly authorizes publication.

## Scope and acceptance

- [x] Fetch origin and fast-forward the Mac develop branch to the latest published
  Windows work while preserving the previous transfer story and local private files.
- [x] Track the root `AGENTS.md`, preserving the existing portable instructions.
- [x] Align the workflow and ADR-0007 refinement with shared, versioned guidance.
- [x] Validate documentation, commit the change and publish the story and develop
  to origin so Windows can retrieve the instructions through Git.

Follow [ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) and
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md). The explicit request
supersedes the earlier decision to keep `AGENTS.md` local and ignored. Preserve
the canonical workflow, existing review/approval rules and historical evidence.
No runtime, database, deployment or unrelated story integration is included.

## Evidence and remaining work

[Completed execution](../completed/IOP-223-shared-agent-instructions-plan.md).
Mac develop advanced from `6e65e52` to `4a68dc1` (15 commits). The previous
`docs/IOP-222-windows-database-transfer` branch remains at `0def3ab`; its two
unpublished documentation commits remain separate from this publication.

Commit `b1d587c` is verified on both `origin/develop` and
`origin/docs/IOP-223-shared-agent-instructions`; the tracked `AGENTS.md` blobs match.
All 255 documentation links and indexed-file secret checks passed. Windows can
retrieve the shared instructions by fast-forwarding develop from origin.
