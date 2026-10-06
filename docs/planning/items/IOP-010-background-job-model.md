# IOP-010 — Design background jobs for later delivery

## Status

Deferred

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define background execution only when needed beyond the direct CSV POC.

## User / business value

The team needs reviewable decisions before building a reusable platform.

## Context

Scope: Product and cross-module architecture. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

CSV processing is direct and bounded. Remaining: background job design, execution
authority, retries and orchestration when explicitly selected; no worker/queue is
delivered.

## Desired state

Define background execution only when needed beyond the direct CSV POC.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Workers, queues, retries and orchestration are deferred. A bounded direct import does
  not require this story. Revisit when measured file size or execution time makes direct
  processing unsuitable.

## Acceptance criteria

- [ ] Define background execution only when needed beyond the direct CSV POC.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Define contracts and decisions; keep identity, permissions, scope and providers separate.

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

Document persistence and isolation implications without creating schemas.

## API considerations

Specify contracts where appropriate; do not create endpoints.

## UI considerations

Document user needs; do not select or build UI by inference.

## Dependencies

[IOP-002](IOP-002-technology-stack.md), [IOP-009](IOP-009-audit-model.md).

These are future parent dependencies, not POC gates. Any minimal local seed slice
uses an accepted execution-context contract rather than requiring the full parent.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce
customer names into the core.

## Validation

Review consistency, links, scenarios and decisions; do not invent commands or write code
to validate this design task.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Resolve this task’s concrete design decisions with options, a recommendation and an ADR
when architecture is affected.

## Current coverage and remaining work — 2026-10-06

CSV processing is direct and bounded. Remaining: background job design, execution
authority, retries and orchestration when explicitly selected; no worker/queue is
delivered.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.
