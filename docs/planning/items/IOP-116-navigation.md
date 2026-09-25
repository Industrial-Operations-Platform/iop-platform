# IOP-116 — App navigation

## Status

Completed — POC navigation only, validated on 2026-09-25.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). The implementation and evidence are recorded below.

## Milestone

M15 — UX & Operational Experience. Completed POC navigation slice.

## Goal

Navigate between import, Executive Overview and analytical detail.

## User / business value

Technicians, managers and administrators need consistent, accessible workflows.

## Context

Scope: Cross-module user experience. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership does not authorize implementation.

## Current state

The local web host provides three navigable destinations with explicit empty states,
shared scope/filter availability, browser history and keyboard focus. CSV submission,
analytical results and functional filters remain separate delivery slices.

## Desired state

Navigate between import, Executive Overview and analytical detail.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- No administration or role-specific landing page prerequisite. Keep controls
  understandable and scope/filters visible; navigation does not grant server permission.

## Acceptance criteria

- [x] Navigate between import, Executive Overview and analytical detail.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Compose existing modules according to role; visible navigation does not grant server permissions.

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

Views consume authorized contracts and do not create divergent copies of entities.

## API considerations

Reuse search/read contracts; define pagination and limits only for the selected scope.

## UI considerations

Evaluate keyboard use, labels, contrast and empty/error/loading states on laptops and tablets; agree on verifiable targets.

## Dependencies

[IOP-017](IOP-017-frontend-bootstrap.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios using accepted tooling,
including expected paths, errors and relevant access denial. Record actual results.
See the [completed evidence](../completed/IOP-116-navigation-plan.md). Navigation
issues no business requests and makes no server authorization claim.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

No unresolved decisions for this navigation slice. Runtime business access still
requires an accepted execution mechanism. This completion does not close the
end-to-end POC or implement import/analytics stories.
