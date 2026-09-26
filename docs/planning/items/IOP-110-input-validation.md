# IOP-110 — Input validation

## Status

In progress — health-only POC slice implemented; CSV and analytical path validation
remain pending their endpoint delivery.

## Milestone

M14 — Security & Reliability. Bounded POC delivery slice.

## Goal

Reject hostile inputs at delivered boundaries, with bounded processing and safe errors.

## User / business value

Customers and operators need verifiable isolation and reproducible recovery.

## Context and current state

The owner selected the [local POC](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). The API currently exposes public process health
only. Its no-input contract now rejects supplied query/body data; JSON/form parsing
has explicit finite limits. No CSV or analytical endpoint exists yet.
See [modules](../../architecture/modules.md) and [workflow](../workflow.md).
The original backlog outline alone does not authorize implementation.

## Desired state and requirements

Reject hostile inputs with controls accompanying each delivered vertical slice;
security must not wait until the final milestone. Deliver only IOP-110's selected
outcome, using endpoint-specific constraints and tests as paths become available.

## Acceptance criteria

- [x] Current health path rejects unsupported input with safe, bounded errors.
- [ ] CSV and analytical paths reject hostile input when delivered, including
  byte/row/field/filter budgets and semantic validation in their owning adapters.
- [x] The plan records scenarios and necessary choices without expanding scope.
- [x] Validation evidence and documentation are synchronized for the delivered slice.

## Domain and architecture constraints

Apply controls from each vertical slice. Preserve Accepted
[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) and the transport
validation rules of [ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md).
Proposed ADRs are proposals, not permission to implement their decisions.

## Security and data considerations

Verify permission and organization/site scope on relevant operations and references.
Public process health provides no business authorization evidence. Exclude secrets,
drawings and production data from the repository. Keep industrial integrations
read-only and record material changes where applicable. Retention, restoration and
sensitive data follow agreed decisions; tests use synthetic data.

## API and UI considerations

Test relevant authorization, input, error and recovery boundaries. UI errors must
be useful without sensitive data and preserve scope. This slice changes the health
transport contract and generated bindings, without introducing business UI behavior.

## Dependencies

[IOP-003](IOP-003-api-contract-strategy.md) supplies Accepted API strategy;
[IOP-014](IOP-014-security-baseline.md) supplies local input safety requirements;
[IOP-022](IOP-022-api-error-model.md) supplies implemented safe Problem Details.
All are available on develop. Dependency numbers describe capabilities, not order.
ADR-0018 is Accepted, but runtime access implementation still gates future business
endpoints; it does not block this independent public health slice.

## Non-goals

Neighboring tasks, implicit acceptance of open decisions or the entire milestone.
No customer-specific core names, importer, analytics, login, authorization/RLS,
shared-hosting protection, DTO engine or general validation framework is introduced.

## Validation and documentation

The [completed slice plan](../completed/IOP-110-poc-input-validation-plan.md)
records executable success/rejection scenarios and actual results. API documentation,
OpenAPI, browser bindings, this item and its [backlog](../backlog.md) row stay aligned.

## Open questions

Future endpoint stories must define and verify their exact contracts, limits and
edge cases before activation. The health-only evidence does not close the remaining
POC input validation or certify shared-use security.
