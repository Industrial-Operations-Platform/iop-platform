# IOP-118 — Area overview

## Status

Completed — local source-owned composition and actual browser review delivered through IOP-210.

## Milestone

M15 — UX & Operational Experience. Local software delivery completed.

## Goal

Area overview. Expected outcome: Quick access to what happened here

## User / business value

Technicians, owners and administrators need coherent, accessible workflows.

## Context

Scope: Cross-module user experience. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

The composed configured department/area/date overview shows current Handover issues, selected-day journal entries, current pending Maintenance statuses, registered Assets, actual formal-record/previous-shift context and optional explicitly mapped analytical coverage. Each source retains its current permission boundary and truthful missing-input state.

## Desired state

Quick access to what happened here

## Requirements

- Deliver only the outcome described for IOP-118.
- Compose existing modules according to role; visible navigation does not grant server permissions.

## Acceptance criteria

- [x] Quick access to what happened here
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

## Domain considerations

Compose existing modules according to role; visible navigation does not grant server permissions.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permissions and customer/site scope in relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Views consume authorized contracts and do not create divergent copies of entities.

## API considerations

Reuse search/read contracts; define pagination and limits only for the selected scope.

## UI considerations

Assess keyboard use, labels, contrast and empty/error/loading states on laptop and
tablet; agree on verifiable targets.

## Dependencies

[IOP-067](IOP-067-previous-shift-overview.md), [IOP-073](IOP-073-maintenance-board.md), [IOP-095](IOP-095-area-analytics.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery
to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the criteria below using
accepted tooling. Include the expected path, errors and relevant access denial; record
actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Completed local delivery — 2026-10-14

The owner's [IOP-203](IOP-203-platform-completion.md) request authorized this
outcome. [IOP-210](IOP-210-operational-search-overview.md), its
[completed execution](../completed/IOP-210-operational-search-overview-plan.md)
and [operator guide](../../development/operational-overview.md) record source
ownership, exact permission/role/scoping behavior, executed API/web/PostgreSQL
checks and actual local browser evidence.

The host registers the factory/controller, generated API/browser contracts, shared
German dictionary, header search and source navigation. Actual local desktop and
390px review confirms exact Assets/Handover/Maintenance/area navigation, overview
counts matching source queries, both themes and German controls, without page
errors or horizontal overflow. No saved operational records, provider metadata or
account passwords changed during review. Optional source-unknown analytical area
mappings remain explicitly unmapped input; they do not fabricate metrics or block
the delivered generic search/overview.
