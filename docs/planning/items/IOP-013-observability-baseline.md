# IOP-013 — Define local health and diagnostic logging

## Status

Completed — local POC design; runtime delivery remains separately scoped.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define health and diagnostic logging for the local POC.

## User / business value

The team needs reviewable decisions before building a reusable platform.

## Context

Scope: Product and cross-module architecture. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

The API host implements process liveness, sanitized startup diagnostics and the
IOP-022 error-occurrence correlation contract. The [POC diagnostic baseline](../../architecture/health-logging-poc.md)
now defines the bounded design and remaining import/UI verification handoffs.
No runtime behavior is added by IOP-013.

## Desired state

Define health and diagnostic logging for the local POC.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Provide startup/health visibility and useful bounded error/import identifiers without
  secrets or RAW payloads. A metrics platform, distributed tracing and operational
  dashboards are later work.

## Acceptance criteria

- [x] Define health and diagnostic logging for the local POC.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Define contracts and decisions; keep identity, permissions, scope and providers separate.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt a decision.
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md) supplies the accepted
error strategy. This design specializes existing contracts without adding an
architectural mechanism; no new ADR is required.

## Security considerations

Verify permission and customer/site scope in relevant operations and references.
Keep secrets, site plans and production data out of the repository. Keep industrial
integrations read-only; record material changes where applicable.

## Data considerations

Document persistence and isolation implications without creating schemas.

## API considerations

Specify contracts where appropriate; do not create endpoints.

## UI considerations

Document user needs; do not infer authorization to select or build UI.

## Dependencies

[IOP-002](IOP-002-technology-stack.md), [IOP-003](IOP-003-api-contract-strategy.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Both dependencies are Completed on develop.
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) is Accepted;
runtime business access still requires its implementation and validation. This
does not block the independent health/diagnostic design.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce customer names into the core.

## Validation

Review consistency, links, scenarios and decisions; do not invent commands or write
application code to validate this design task. See the baseline scenario table and
[completed plan](../completed/IOP-013-local-health-logging-plan.md) for evidence.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.
The POC delivery map and API guide link the diagnostic baseline.

## Open questions

No POC design blocker remains. Reusing process liveness and bounded console errors
meets this slice; a readiness/metrics platform would exceed it. Import correlation
and output verification belong to the delivering stories. Broader observability
is explicitly deferred, not completed by this design.
