# IOP-007 — Design authentication for later shared use

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

Define authentication for later shared use.

## User / business value

The team needs reviewable decisions before building a reusable platform.

## Context

Scope: Product and cross-module architecture. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; inclusion in the backlog does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Define authentication for later shared use.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Login, passwords and sessions are deferred beyond the POC. Preserve the
  provider-independent boundary. The older local-login proposal on the separate review
  branch is not a POC prerequisite; its technical decisions remain unaccepted here.

## Acceptance criteria

- [ ] Define authentication for later shared use.
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
Proposed ADRs are proposals, not permission to adopt the decision.

## Security considerations

Verify permission and customer/site scope in relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Document persistence and isolation implications without creating schemas.

## API considerations

Specify contracts where appropriate; do not create endpoints.

## UI considerations

Document user needs; do not select or build UI by inference.

## Dependencies

[IOP-002](IOP-002-technology-stack.md), [IOP-006](IOP-006-rbac-model.md).

These are future parent dependencies, not POC gates. Any minimal local seed slice
uses an accepted execution-context contract rather than requiring the full parent.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce customer names into the core.

## Validation

Review consistency, links, scenarios and decisions; do not invent commands or write code to validate this design task.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

Resolve this task’s concrete design decisions with options, a recommendation and an ADR when architecture is affected.
