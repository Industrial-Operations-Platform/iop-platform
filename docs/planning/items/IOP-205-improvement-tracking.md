# IOP-205 — Improvement Tracking delivery

## Status and authorization

Completed local module increment. The owner explicitly requested complete local Improvement Tracking on
2026-10-14, delegated development decisions and restricted access to Administrator,
Team Leader and Task Force. This delivery implements IOP-098–101 under
[IOP-203](IOP-203-platform-completion.md) and Accepted
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md).

## Scope and acceptance

- [x] Scoped actions link explicit registered assets and/or Handover issues.
- [x] Named owners, goals, dates and lifecycle transitions retain attributed history.
- [x] Append-only notes/results and corrections preserve original evidence.
- [x] OIP computes before/after results from identical filters, with date coverage,
  missing-data and zero-baseline semantics; immutable saved snapshots are server computed.
- [x] All three authorized profiles can coordinate actions; Technician is denied by
  current profile and scoped grants, including direct API access.
- [x] Tests, operation documentation and local commits record evidence.

Plant facts, exposure/throughput data, intervention dates and causal attribution are
never invented. Generic binary attachments are outside this notes/results increment.
Maintenance and Handover retain their records; OIP retains measure ownership.

## Dependencies and evidence

IOP-098–101, IOP-011, IOP-051 and IOP-068 were read; their prose is already English.
Accepted ADR-0014, ADR-0016, ADR-0032 and ADR-0037 govern this implementation.
The [execution plan](../completed/IOP-205-improvement-tracking-plan.md) records changes,
validation and remaining external inputs. Root composition and shared permission
catalog integration are coordinated in IOP-203.
