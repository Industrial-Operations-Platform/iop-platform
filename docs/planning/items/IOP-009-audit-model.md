# IOP-009 — Design the audit trail

## Status

Completed — [ADR-0017](../../architecture/adr/ADR-0017-audit-model.md) accepted
as a future design. The owner explicitly deferred audit implementation beyond
the pilot; it is not a pilot release requirement.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal and business value

Define auditable events and retention so operators can investigate material
changes and security events without exposing customer data or collecting an
unbounded duplicate of operational history.

## Context and current state

The platform has a documentation baseline, with no implemented audit capability.
Accepted tenancy and RBAC decisions establish scope enforcement and traceable
access changes. V1 is CSV ingestion and analytics; future transactional modules
are not activated by this task. The original seed listed an outcome but no named
alternatives. The owner requested evaluation, an ADR and documentation updates
conditional on acceptance. The owner subsequently accepted the design while
clarifying that this capability is unnecessary for the pilot and should remain
planned for later.

## Desired state and requirements

- Define audit-event categories, ownership, safe record fields and retention.
- Compare capture and delivery options against module boundaries and PostgreSQL.
- Separate identity, permission, scope and provider details.
- Define failure, retry, inspection, disposal and isolation behavior without DDL.
- Keep proposed policy distinct from accepted architecture and runtime evidence.

## Accepted design and delivery boundary

[ADR-0017](../../architecture/adr/ADR-0017-audit-model.md) compares operational logs,
database triggers, explicit module records, event sourcing and external storage;
it also compares same-transaction append, an outbox and post-commit delivery.
The accepted future design uses explicit Audit-owned PostgreSQL records committed atomically with material
changes. Security observations have separately documented failure behavior.

The future design uses 365-day retention for material changes/maintenance and 90 days for security
events, with scoped expiry/purge and separately bounded backup handling before
production. These are reviewable defaults, not established customer requirements.
General audit browsing is not added to existing roles; inspection is restricted to
an explicitly authorized operator procedure. No new identity mechanism is chosen.

## Acceptance criteria

- [x] Auditable events and retention options evaluated with a concrete recommendation.
- [x] Plan and ADR document required decisions, scenarios and boundaries.
- [x] Proposal validation evidence and planning documentation synchronized.
- [x] Owner accepts the audit model and retention policy for later implementation.
- [x] Architecture, modules, data model, glossary and pilot scope synchronized.

IOP-009 is complete as design. Audit capture, inspection and retention are not
pilot release gates; IOP-023 remains unimplemented future work.

## Domain, security and data considerations

Audit receives explicit records from owning modules; it does not coordinate their
workflows. Customer records preserve validated organization/site scope and RLS.
Platform security events cannot contain unscoped business payloads. Keep safe
before/after grant information, stable identities and correlation; exclude secrets,
RAW data and unrestricted serialized objects. Retention does not imply tamper-proof
storage or physical erasure from backups at online expiry.

## API and UI considerations

No endpoint or UI is selected. Any future audit browsing requires reviewed access
permissions and the accepted API contract strategy. Current product roles gain no
implicit audit permission from this design.

## Dependencies and architecture constraints

- [IOP-005](IOP-005-tenancy-and-data-isolation.md) and
  [IOP-006](IOP-006-rbac-model.md): accepted prerequisites.
- [IOP-008](IOP-008-time-and-timezone-model.md): accepted instant semantics.
- [IOP-007](IOP-007-authentication-model.md): authentication integration remains
  separate; this design relies only on the accepted provider-independent boundary.
- [IOP-023](IOP-023-audit-infrastructure.md): future implementation consumer,
  not authorized by this design task.

Follow Accepted ADR-0001/0003/0004/0005/0006/0007/0008/0011/0012/0013/0014/0016.
ADR-0017 is Accepted through explicit owner approval, with implementation deferred
beyond the pilot.
See [architecture](../../../ARCHITECTURE.md), [modules](../../architecture/modules.md)
and [workflow](../workflow.md).

## Non-goals

Application code, migrations, endpoints, infrastructure, general event sourcing,
queue selection, self-service audit UI, enterprise identity integration or
customer-specific core logic. Do not start adjacent implementation stories.

## Validation and evidence

The [completed proposal plan](../completed/IOP-009-audit-model-plan.md) records
sources, scenario review, local link/status checks and limitations. ADR walkthroughs
cover atomicity, retries, partial imports, scope denial, inspection, secret
exclusion, clock ordering and retention. No runtime tests have run.

## Acceptance evidence

The [acceptance plan](../completed/IOP-009-audit-acceptance-plan.md) records owner
approval and synchronized architecture, module, data-model, glossary and product
scope documentation. No runtime capability or test evidence is claimed. Future
implementation must revisit operating constraints and customer retention needs;
no implementation story is activated by design completion.
