# IOP-194 — Maintenance Management and Digital Asset Record

## Status and authorization

Completed: owner-requested equipment-catalog review corrections delivered on 2026-10-06. On 2026-10-05 the owner requested full M8 Maintenance Management
and M10 Asset History delivery on a separate branch, delegated implementation
and design choices, and explicitly waived intermediate approvals. Existing
development remains under owner review. M9 Asset Locator is excluded. On
2026-10-06 the owner approved integration into develop and publication of the
story and develop to origin, with the checkout left on develop. Further owner
functional/product testing remains pending; integration is not final acceptance.

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

## Linked-maintenance follow-up

Owner-requested on 2026-10-05; [execution plan](../completed/IOP-194-linked-maintenance-plan.md).

- [x] Corrective (default), preventive and inspection categories; explicit manual
  repair target and location spanning several exact Betriebsmittelkennzeichen.
- [x] Related Shift Handover problem/matrix entries inside Maintenance, with
  contextual detail navigation and preserved return selections.
- [x] Completion resolves explicitly included open issues; exclusions retain their
  open state and require a reason. Unreviewed scope prevents accidental closure.
- [x] Team Leader assignment authority, worker Start summaries and activity notices.
- [x] Assets available to Administrator, Team Leader and Task Force, with provisional source-code
  identities preserved as unverified until the owner checks them.
- [x] Default board retains unfinished work and previous/current-week completions;
  searchable historical scope and focused status layouts show three cards per row
  on wide screens.
- [x] Durable revisions, current permissions, atomic failure behavior, tests and
  synchronized documentation; no 3D/radius selection or M9 delivery.

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
integration. The owner explicitly authorizes merging
`feature/IOP-194-maintenance-asset-history` into develop and pushing both refs to
origin. Deployment, stage/master promotion and alteration of other review branches
remain outside this publication. See the
[integration plan](../active/IOP-194-publication-integration-plan.md).

## Evidence

On 2026-10-05 the owner additionally requested local placeholder data to explore
the delivered functions. Execution: [demo data plan](../completed/IOP-194-demo-data-plan.md).
This follow-up is completed: 10 fictional assets and 30 maintenance exercises
are loaded locally; repeated application preserves existing data and adds no
duplicates. M9 remains excluded.

Execution: [plan](../completed/IOP-194-maintenance-asset-history-plan.md).
Linked-maintenance delivery: [execution evidence](../completed/IOP-194-linked-maintenance-plan.md).
The additional local dataset contains two unverified equipment assets, four Handover
problems and four assigned repairs. Repeated application preserves earlier data and
creates no duplicate records or revisions. Search `[DEMO LINKED]` to explore it.
Owner product acceptance remains a review after local delivery.

## Equipment-catalog review corrections

[Execution plan](../completed/IOP-194-equipment-catalog-refinement-plan.md).
The owner explicitly restores Administrator operational access and requests one
current asset per exact code with name equal to code, Halle/Bereich-scoped reported
code choices, conditioned source dropdowns and manual component/group metadata.
Archive superseded training identities from the current directory while retaining
referenced history. Included report closure remains atomic; distinguish inclusion
from related/excluded context and avoid copying report narratives into interventions.
The current asset registry/digital record does not implement M09 spatial placement;
the owner confirmed on 2026-10-06 that M09 remains deferred while catalog and manual
within-area grouping proceed.

The retained local registry now contains 5,643 current code identities and 12
retired training identities. Source, Handover and Maintenance history preservation
and zero-write replay were verified; physical product acceptance remains owner review.
