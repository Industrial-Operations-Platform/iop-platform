# IOP-126 — Synthetic workforce

## Status

Completed — original outcome delivered in later owner-authorized local increments;
reconciled on 2026-10-06.

## Milestone

M16 — Demo / Pilot Dataset. Delivered local slice.

## Goal

Synthetic workforce. Expected outcome: Teams/shifts

## User / business value

The team needs to demonstrate IOP without enterprise infrastructure or information.

## Context

Scope: Synthetic demo and pilot fixtures. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

IOP-184 delivers explicit local fictional technicians, leaders, teams, weekly schedules,
absences, floating duties and zone/phone assignments through the real Workforce use
cases. Credentials are private runtime input.

## Desired state

Teams/shifts

## Requirements

- Deliver only the outcome described for IOP-126.
- Use fictional organizations, names, assets and relationships; fixtures do not define rigid domain levels.

## Acceptance criteria

- [x] Teams/shifts
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

## Domain considerations

Use fictional organizations, names, assets and relationships; fixtures do not define
rigid domain levels.

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

Use reproducible data with explicit scope and provenance; include useful
invalid/ambiguous cases without secrets.

## API considerations

Use agreed loading mechanisms; prevent demo reset from affecting production.

## UI considerations

The user must distinguish demo and real data; this scope does not include designing new screens.

## Dependencies

[IOP-123](IOP-123-demo-organization.md), [IOP-055](IOP-055-shift-assignments.md)

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

## Open questions

None for the delivered original outcome. Broader parent capabilities remain
separately scoped and require an explicit selection before implementation.

## Current coverage — 2026-10-06

IOP-184 delivers explicit local fictional technicians, leaders, teams, weekly schedules,
absences, floating duties and zone/phone assignments through the real Workforce use
cases. Credentials are private runtime input.

Implementation and validation: [execution evidence](../completed/IOP-184-m6-workforce-plan.md).
No remaining implementation for this story’s original outcome; broader scope remains
in the explicitly linked parent stories. Closure does not imply platform release
or final owner product acceptance.
