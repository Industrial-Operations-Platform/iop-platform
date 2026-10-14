# IOP-107 — Integration health

## Status

In progress — honest readiness visible; real provider connection/freshness/failure observations pending.

## Milestone

M13 — External Integrations. Readiness delivered under IOP-207; real connections remain separate.

## Goal

Integration health. Expected outcome: Visible status and failures

## User / business value

Administrators need to connect sources without coupling the product to a provider.

## Context

Scope: Integrations and Authentication adapters. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

The composed registry exposes disabled, configuration-pending and transport-pending states, explicit required inputs and absent lastSuccessfulConnection. Saved metadata never becomes a successful provider connection. Readiness/history are scoped and authorized; platform health continues to mean process liveness only.

## Desired state

Visible status and failures

## Requirements

- Deliver only the outcome described for IOP-107.
- WinCC and Ultimo are adapter candidates, not core entities; Entra integrates through Authentication.

## Acceptance criteria

- [ ] Visible status and failures
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

- [ ] Authorized real transport/schema/access and compatibility evidence complete the provider outcome.

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

Documented and authorized interfaces; industrial sources remain read-only. Contracts
do not promise real connectivity.

## UI considerations

Show health and errors without leaking credentials or another customer’s data.

## Dependencies

[IOP-102](IOP-102-integration-registry.md), [IOP-013](IOP-013-observability-baseline.md)

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

## Delivered readiness and remaining provider work — 2026-10-14

The owner's [IOP-203](IOP-203-platform-completion.md) request authorized the
prepared adapter/registry increment. [IOP-207](IOP-207-integration-readiness.md),
its [completed execution](../completed/IOP-207-integration-readiness-plan.md) and
the [readiness contract](../../product/integration-readiness.md) record scope,
current role enforcement and executed API/web/real PostgreSQL evidence. Actual
desktop/390px review shows three disabled providers and explicit missing-input
semantics; no existing provider configuration or account passwords changed.

Real transports must produce reviewed source-specific connection attempts, successful-read/freshness evidence and sanitized bounded failure metadata. Define the observation contract and freshness/coverage policy with authorized providers before showing connected, stale or failed states. Current readiness does not observe network availability or establish equipment health.
