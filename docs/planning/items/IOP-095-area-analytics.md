# IOP-095 — Area analytics

## Status

Blocked — the POC specification is complete; executable IOP-089 queries, production
OIP storage and ADR-0018 host activation remain pending.

## Milestone

M11 — OIP / Operational Intelligence. Bounded POC delivery slice.

## Goal

Deliver reconciled area and configured-sector comparisons of reported frequency
and accumulated alarm duration for the local analytical POC.

## User / business value

Operations staff and managers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

The [area specification and reconciliation matrix](../../product/area-analytics-poc.md)
reuse accepted aggregate/filter/query semantics. No runtime grouped query or view
is delivered. See the [specification execution record](../completed/IOP-095-area-analytics-plan.md).
The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this slice; broader reporting is not an additional POC gate.

## Desired state

An aggregated area view with sector context, shared filters and contributing-record
drill-down that reconciles to both full selected measures.

## Requirements

- Deliver only the POC comparison defined in the [specification](../../product/area-analytics-poc.md).
- Partition by exact scoped source area and frozen configured sector membership;
  retain unclassified areas, repeated lines and matching zero measures.
- Preserve canonical selection, admitted revision, units and coverage between
  overview, groups and contributing records; never sum a page as the full result.
- OIP is an IOP module; metrics remain decoupled from the UI and WinCC schemas.

## Acceptance criteria

- [ ] Runtime area/sector groups and contributing records reconcile to both measures.
- [ ] Shared filters, drill-down/return, coverage, zero/empty states and relevant
  access denial are validated through the delivered path.
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Specification evidence exists and documentation is synchronized; runtime
  acceptance remains pending.

## Domain considerations

OIP is an IOP module; metrics remain decoupled from the UI and WinCC schemas.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, plant drawings or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Define grain, coverage, units and periods; accumulated alarm duration does not automatically equal downtime.

## API considerations

Queries require verified scope filters and traceability to contributing records.

## UI considerations

Show metric definitions and limitations; do not present correlation as root cause.

## Dependencies

[IOP-090](IOP-090-event-frequency.md) and [IOP-091](IOP-091-downtime.md) supply
completed measure specifications; their runtime reconciliation is Blocked.
[IOP-026](IOP-026-site-model.md) supplies the completed POC site seed; deferred
site administration is not a prerequisite. [IOP-089](IOP-089-analytics-query-layer.md)
has accepted query semantics under ADR-0028 but no executable queries. Production
OIP storage and ADR-0018 implementation/validation independently gate runtime access.

Dependencies identify required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the acceptance criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

The specification reuses Accepted ADR-0023/0028 and existing metrics without a new
architectural pattern. Bounded grouped response delivery remains to be resolved
within the query boundary once its runtime prerequisites exist. No adjacent story
is activated. General hierarchies, physical assets, exports, rates and additional
metrics remain outside this slice.

## Owner-supplied CSV and reporting context

Support configurable higher-level hall/sector and area comparisons with frequency/duration rankings and drill-down context. These are source/customer dimensions, not fixed core hierarchy levels. Confirm mappings and preserve unknown groups in reconciliation.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This historical
context does not add formulas or fixed hierarchy levels to this POC.
The current specification follows subsequently accepted contracts; no runtime
implementation is claimed.
