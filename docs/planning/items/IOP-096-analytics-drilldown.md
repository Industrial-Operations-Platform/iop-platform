# IOP-096 — Analytical drill-down

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Drill down from overview to contributing aggregate records.

## User / business value

Operations staff and managers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Drill down from overview to contributing aggregate records.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Retain filters through sector, area, source equipment and message/detail navigation.
  Show scope, date/coverage and provenance. KPI-to-physical-asset navigation is
  deferred; aggregate rows are not individual occurrences.

## Acceptance criteria

- [ ] Drill down from overview to contributing aggregate records.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

OIP is an IOP module; metrics are decoupled from the UI and WinCC schemas.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.

## Security considerations

Verify customer/site permissions and scope for relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Define grain, coverage, units and periods; accumulated alarm duration does not automatically equal downtime.

## API considerations

Queries use verified scope filters and traceability to contributing records.

## UI considerations

Show the metric definition and limits; do not present correlation as root cause.

## Dependencies

[IOP-094](IOP-094-asset-analytics.md), [IOP-095](IOP-095-area-analytics.md), [IOP-097](IOP-097-analytics-filters.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the following criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictitious tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before activating implementation.

## Owner-supplied CSV and reporting context

The requested path is overview → configured hall/sector → area → equipment → fault message or verified sensor identity. Retain scope, period and filters and expose contributing aggregate records. A collective fault is not a proven root cause. Physical maps, coordinates, plant surveying and 3D remain deferred.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This is context for future planning; this
item remains Proposed and no implementation or metric formula is accepted here.
