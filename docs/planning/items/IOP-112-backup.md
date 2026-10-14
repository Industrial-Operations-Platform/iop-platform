# IOP-112 — Backup process

## Status

Completed

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M14 — Security & Reliability. Reproducible local software slice completed.

Reproducible full local platform backup.

## Current state

[IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md) implements an authenticated encrypted full
application-database/private-configuration/reference backup. It includes operational
history, credentials/application roles/grants, locator PNGs/traces and explicit
additional private roots. Previous archives are excluded; this is independent of
the earlier analytics-only seed path. Disposable roundtrips and actual-installation encrypted backup/isolated restore pass.

## Requirements and delivery boundary

The operator stops API/web/workers while PostgreSQL stays running, then holds an
exclusive maintenance lease and exported snapshot. AES-256-GCM uses a separate
random 32-byte mode-0600 key; SHA-256 manifests and independent database fingerprints
verify contents. Bounds are 2 GiB uncompressed/20,000 files. Archives expire after 30
elapsed days; explicit bounded pruning authenticates archives and never touches
the source installation. Custom role memberships and omitted external roots fail
or stay outside the declared contract.

## Acceptance criteria

- [x] Deliver private consistent database/file capture, integrity metadata, overwrite protection and finite archive retention.
- [x] Verify safe wrong-key/tamper/path/symlink/changed-source failures and complete disposable roundtrips.
- [x] Record reproducible backup evidence from the actual local installation under root IOP-203.
- [x] Reconcile scope/status against that evidence without claiming deployment or agreed recovery targets.

## Validation and evidence

Private-file crypto tests and real PostgreSQL full restore verify data, operational
revisions, job/Audit effects, application roles/grants and exact RLS policies.
See [local operating guide](../../development/local-operations.md), [Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md) and
[IOP-208 evidence](IOP-208-local-delivery-infrastructure.md). Root IOP-203 actual encrypted backup and isolated verified restore
pass: 170 files, 62 tables and 154,341 rows reconcile with exact catalog/data,
RLS, role and schema/table/column/function ACL evidence. The independent key stays
outside archive/private inputs; the review directory is mode 0700. API/web restarted
healthy after capture. Neither Docker persistence nor analytics seeding substitutes
for this executed full-platform gate.

## Dependencies

[IOP-019](IOP-019-database-bootstrap.md), [IOP-011](IOP-011-file-storage-model.md), [IOP-014](IOP-014-security-baseline.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

The reproducible local software criterion is completed. Remote/offsite storage,
customer recovery-time objectives, independent key-custody/rotation procedures,
scheduled operation and production operating/human acceptance remain separate
scope; no activation, deployment or recovery SLA is inferred.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).
