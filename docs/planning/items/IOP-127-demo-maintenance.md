# IOP-127 — Synthetic maintenance

## Status

Completed — original outcome delivered in later owner-authorized local increments;
reconciled on 2026-10-06.

## Milestone

M16 — Demo / Pilot Dataset. Delivered local slice.

## Goal

Synthetic maintenance. Expected outcome: Issues/tasks

## User / business value

The team needs to demonstrate IOP without enterprise infrastructure or information.

## Context

Scope: Synthetic demo and pilot fixtures. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

IOP-194 delivers explicitly labelled fictional assets and 30 Maintenance exercises, plus
four linked Handover problems/repairs. Replay preserves existing data and adds no
duplicate records/revisions; retired training identities remain historical.

## Desired state

Issues/tasks

## Requirements

- Deliver only the outcome described for IOP-127.
- Use fictional organizations, names, assets and relationships; fixtures do not define rigid domain levels.

## Acceptance criteria

- [x] Issues/tasks
- [x] The plan documents scenarios and required decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

The earlier POC deferral is historical; its [disposition evidence](../completed/IOP-127-poc-disposition-plan.md)
is retained. IOP-194 now supplies the fictional issues/tasks dataset and recorded
replay/integrity evidence.

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

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, blueprints or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Use reproducible data with explicit scope and provenance; include useful
invalid/ambiguous cases without secrets.

## API considerations

Use agreed loading mechanisms; prevent demo reset from affecting production.

## UI considerations

The user must distinguish demo data from real data; scope does not include designing new screens.

## Dependencies

[IOP-124](IOP-124-demo-assets.md), [IOP-073](IOP-073-maintenance-board.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

IOP-194 supplies the supporting stable-asset fixtures and completed IOP-073 board.
IOP-124’s broader hierarchy/survey dataset remains open; it is not required for
these explicitly selected Maintenance exercises.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending
delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the acceptance criteria using
accepted tooling. Include the expected path, errors and relevant access denial; record
actual results, not fictitious tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

None for the delivered original outcome. Broader parent capabilities remain
separately scoped and require an explicit selection before implementation.

## Current coverage — 2026-10-06

IOP-194 delivers explicitly labelled fictional assets and 30 Maintenance exercises, plus
four linked Handover problems/repairs. Replay preserves existing data and adds no
duplicate records/revisions; retired training identities remain historical.

Implementation and validation: [execution evidence](../completed/IOP-194-demo-data-plan.md).
No remaining implementation for this story’s original outcome; broader scope remains
in the explicitly linked parent stories. Closure does not imply platform release
or final owner product acceptance.
