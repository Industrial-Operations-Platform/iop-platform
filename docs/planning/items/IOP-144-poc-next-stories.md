# IOP-144 — Recommend four next POC stories

## Status

Completed

## Request and scope

On 2026-09-25 the owner requested four stories that move toward the POC, after
reviewing [scope](../../product/scope-poc.md), the [delivery map](../poc-delivery.md)
and dependencies, with a branch and plan before edits. This is a recommendation
and required translation increment, not authorization to implement four stories.

## Recommended order

Historical recommendation from 2026-09-25, integrated by IOP-197. The dependency
statuses and runtime gates below describe that review date. IOP-147 and subsequent
delivery resolved them; the current [delivery map](../poc-delivery.md),
[IOP-195 audit](IOP-195-development-status.md) and canonical story statuses govern
new work. This completed recommendation does not reopen or activate those stories.

Follow the delivery map's visual-first preference. IOP-015–019 are already
Completed; repeating host/bootstrap work would not advance the analytical journey.

| Order | Existing story and first useful slice | Dependencies and completion boundary |
| --- | --- | --- |
| 1 | [IOP-116 — App navigation](IOP-116-navigation.md): a navigable import → Executive Overview → detail shell, with fixture-backed states clearly identified. | IOP-017 is Completed. A visual shell can proceed without business endpoints; navigation grants no server permission. |
| 2 | [IOP-125 — Synthetic analytical CSV fixtures](IOP-125-demo-events.md): representative valid, invalid, duplicate and unclassified data, with independently calculated expected frequency/duration totals. | IOP-012 is Completed as design. IOP-123 remains Proposed: reuse its fictional scope requirements and the existing organization/site seed capability; do not claim its full delivery. Fixtures may be authored before importer completion; import validation follows through IOP-103. |
| 3 | [IOP-097 — Date/filter model](IOP-097-analytics-filters.md): define and demonstrate consistent reporting-date, sector, area, equipment and message filters using the fixtures. | IOP-008 supplies accepted temporal semantics; IOP-089 is still Proposed. Fixture-backed interaction can precede runtime queries, but full delivery requires the query contract and verified analytics. |
| 4 | [IOP-096 — Analytical drill-down](IOP-096-analytics-drilldown.md): demonstrate overview → sector → area → source equipment → message/contributing aggregate rows while retaining filters. | IOP-094, IOP-095 and IOP-097 remain Proposed. A visual preview is independent; full drill-down requires their verified measures, filters and provenance. IOP-094/095 in turn require IOP-090/091. |

These are four focused next slices, not four stories sufficient to complete the
POC. Start only the selected story with its own implementation branch and plan.
Do not close a story merely because a preview works. IOP-089 also depends on
IOP-043/048/049; importer/persistence and reconciliation work remain necessary.
This review checks direct contexts and records their further dependencies; it
does not claim a complete implementation-readiness audit of the transitive graph.

## Gate and evidence

[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) remains
Proposed. Runtime business access requires its acceptance or another accepted
mechanism. Independent UI and fixture work can proceed. Preserve unknown coverage,
unclassified totals and the distinction between accumulated alarm duration and
plant downtime. A filename date is a reporting label, not an occurrence timestamp.

The eventual POC still requires actual CSV import, stored provenance, duplicate
rejection, reconciled overview/detail totals and reproducible demonstration/reset.
This recommendation neither accepts architectural decisions nor changes product scope.

## Acceptance

- [x] Four existing stories recommended with useful slices and dependency limits.
- [x] Consulted mixed-language stories translated without status or scope changes.
- [x] Links, IDs, statuses and diff checked; evidence recorded and committed locally.

Execution evidence: [plan](../completed/IOP-144-poc-next-stories-plan.md).
