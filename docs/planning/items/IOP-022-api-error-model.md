# IOP-022 — API error model

## Status

Completed — common local POC error model validated on 2026-09-26.
Domain-specific errors remain with future endpoint stories.

## Milestone

M2 — Development Platform Foundation.

## Goal and value

Provide consistent, documented API error responses so developers can diagnose
failures and clients can handle them without parsing human messages.

## Context and scope

The owner requested implementation limited to the [POC](../../product/scope-poc.md)
and [delivery map](../poc-delivery.md). The existing NestJS health host has minimal
bootstrap errors. Extend that host with the common error contract accepted in
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md).
See [modules](../../architecture/modules.md) and [workflow](../workflow.md).

## Requirements

- Consistent RFC 9457 responses, documented status/type mapping, sanitized failures
  and a server-generated correlation identifier for each error occurrence.
- A bounded validation representation with documented field pointers and codes;
  future endpoints supply their own validation rules through the transport boundary.
- Shared OpenAPI DTOs and synchronized generated browser bindings.
- Use only accepted stack/contracts; hosts are not business microservices.

## Acceptance criteria

- [x] Consistent, documented error responses validated over real HTTP.
- [x] Plan documents scenarios and necessary choices without expanding scope.
- [x] Validation evidence, generated contracts and documentation are synchronized.

## Constraints

Apply Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs do not authorize implementation.

Verify permissions and organization/site scope in future relevant operations and
references. No access-control implementation or denial-of-access claim belongs to
this health-only host. Exclude secrets, drawings, production data and customer
labels from code, logs and responses. Keep industrial integrations read-only and
record material changes where applicable. PostgreSQL remains authoritative; test
configuration/data stays synthetic and separate. No business screens are needed.

## Dependencies

[IOP-003](IOP-003-api-contract-strategy.md) and
[IOP-016](IOP-016-backend-bootstrap.md) are Completed and present on develop.
Dependencies identify required capabilities, not numerical implementation order.

## Non-goals

Adjacent stories, business endpoints, full domain error catalogs, CSV row results,
login, authorization/RLS, UI behavior, distributed tracing or broader logging.
Future owning stories document domain-specific cases (including duplicate imports)
using this common transport contract. No entire-milestone delivery or inferred ADR
acceptance. No new persistence or integration behavior.

## Validation and documentation

The [execution plan](../completed/IOP-022-api-error-model-plan.md) records executable
success/error, sanitization and contract checks. Update this item, its
[backlog](../backlog.md) row, API documentation and generated artifacts together.
Exact endpoint-specific errors remain with later endpoint delivery; the common
POC model has no unresolved architectural dependency.
