# IOP-102 — Integration registry

## Status

Proposed

## Milestone

M13 — External Integrations. Proposed delivery slice.

## Goal

Integration registry. Expected outcome: Configurable sources

## User / business value

Administradores necesitan conectar fuentes sin acoplar el producto a un proveedor.

## Context

Scope: Integrations and Authentication adapters. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Manual CSV sources/configuration and import histories exist. Remaining: a general
integration registry with source lifecycle/configuration contracts beyond the
single-source local path.

## Desired state

Configurable sources

## Requirements

- Deliver only the outcome described for IOP-102.
- WinCC and Ultimo are adapter candidates, not core entities; Entra integrates through Authentication.

## Acceptance criteria

- [ ] Configurable sources
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

WinCC and Ultimo are adapter candidates, not core entities; Entra integrates through Authentication.

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

Separate secrets, mapping, provenance and scope; preserve existing flows during any migration.

## API considerations

Interfaces documentadas y autorizadas; fuentes industriales solo lectura. Contratos no
prometen conectividad real.

## UI considerations

Show health and errors without leaking credentials or another customer’s data.

## Dependencies

[IOP-012](IOP-012-source-integration-contract.md), [IOP-018](IOP-018-configuration-management.md), [IOP-029](IOP-029-rbac-enforcement.md)

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

Confirm the approved contract, edge cases and exact evidence for this slice before
starting implementation.

## Current coverage and remaining work — 2026-10-06

Manual CSV sources/configuration and import histories exist. Remaining: a general
integration registry with source lifecycle/configuration contracts beyond the
single-source local path.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.
