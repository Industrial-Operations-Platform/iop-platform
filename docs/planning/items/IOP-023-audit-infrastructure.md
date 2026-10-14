# IOP-023 — Audit infrastructure

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M2 — Development Platform Foundation. Site material infrastructure delivered.

Material changes generate scoped Audit records.

## Current state

The owner activated selected implementation beyond the previously excluded pilot
under [IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md). Audit now has a public pinned site-material port,
registered version-one event catalog, append/dedupe storage, 365-day site retention,
scoped operator inspection and bounded purge. Runtime cannot browse event payloads,
update or delete Audit; operators have separately restricted function authority.

## Requirements and delivery boundary

Current mandatory host capture covers journal/formal Handover and delegated
Maintenance resolution; Maintenance/settings; Assets registry plus independent
catalog/enrichment/review/mapping sidecars; Workforce; Tracking evidence/comparison;
Locator; integration registry/import receipt/terminal/recovery; OIP publication
and applied reporting configuration. Events retain safe IDs/revisions/states/codes,
not names, free text, credentials or RAW/source snapshots. Workforce absence/health
content is excluded. Existing Users/RBAC access audit remains a separate record.

## Acceptance criteria

- [x] Capture current site material database operations atomically using owner-defined safe events.
- [x] Verify append failure rollback, idempotency, secret exclusion, forced RLS and separate inspection/retention authority.
- [ ] Deliver separate organization RBAC and bounded platform-security capture/storage/operator contracts under ADR-0017.
- [ ] Complete agreed scheduling/alerts, retention-operation and broader release acceptance.

## Validation and evidence

See [Accepted ADR-0017](../../architecture/adr/ADR-0017-audit-model.md), [Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md)
and the [site capture contract](../../development/site-audit-integration.md).
Ten real PostgreSQL material cases verify capture, actual Audit INSERT denial and
post-append rollback for Handover/Assets, idempotent recovery and sensitive-field
exclusion; six worker/operator cases verify retention/inspection and current grants.
The combined material/jobs/full-restore suite passes 17 checks.

## Dependencies

[IOP-009](IOP-009-audit-model.md), [IOP-019](IOP-019-database-bootstrap.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Organization membership/role Audit needs its organization envelope/storage/target.
Authentication/session/denial collection needs separate platform authority, bounded
admission/suppression/outage evidence and 90-day retention. File activation lacks
a shared PostgreSQL commit boundary. Scheduled purge alerts, operator rotation,
real providers and whole-platform acceptance remain pending; no lossless security
collection or immutable evidence against privileged owners is claimed.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).
