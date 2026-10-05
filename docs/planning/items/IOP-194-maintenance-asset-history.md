# IOP-194 — Maintenance Management and Digital Asset Record

## Status and authorization

Completed local implementation. On 2026-10-05 the owner requested full M8 Maintenance Management
and M10 Asset History delivery on a separate branch, delegated implementation
and design choices, and explicitly waived intermediate approvals. Existing
development remains under owner review. M9 Asset Locator is excluded.

## Scope and acceptance

- [x] M8: durable technical work records; explicit Open/In progress/Blocked/Done
  workflow; configurable priorities; site user/team ownership; canonical asset
  and configured location references; searchable/filterable board and list;
  append-only attributed revisions and outcomes.
- [x] M10: searchable stable asset registry and digital record combining
  Maintenance, Handover and analytical source evidence chronologically through
  owner-published read contracts, with links to original records.
- [x] Minimal supporting asset identity, explicit exact source aliases and
  validation/archive handling; no automatic physical identity inference.
- [x] Current exact-site permissions, reference validation, forced RLS,
  optimistic concurrency, atomic revisions and bounded paginated reads.
- [x] API/browser hexagonal boundaries and existing shared visual identity;
  usable desktop/narrow layouts, keyboard controls and empty/error states.
- [x] Executable domain, transport, persistence and browser evidence;
  synchronized contracts, module/data documentation and operator guides.

## Dependencies and boundaries

Implements the requested outcomes of IOP-068–075 and IOP-084–088 as one coherent
owner-requested story. The existing workforce team contract and scoped people
lookup supply ownership. ADR-0013/0014/0016/0026/0032/0036 supply the existing
authorization, time, transaction, revision and adapter patterns. Supporting
asset identity and exact aliases satisfy this delivery without claiming full
M4 hierarchy/controller/survey delivery, general audit infrastructure, formal
handover closure, automatic event-to-asset ingestion or M9 completion.

Analytical daily aggregates retain date-only/reporting-period semantics and RAW
provenance. Timeline coverage is explicit; access to Assets does not grant access
to another module's source data. No plant-control operations or external CMMS
integration. No merge, push, deployment or alteration of existing review branches.

## Evidence

Execution: [plan](../completed/IOP-194-maintenance-asset-history-plan.md).
Owner product acceptance remains a review after local delivery.
