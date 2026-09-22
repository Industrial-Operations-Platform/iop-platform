# IOP-016 — Bootstrap backend

## Status

Completed — local POC backend bootstrap validated on 2026-09-16.

## Milestone

M2 — Development Platform Foundation.

## Goal

Start the NestJS API, expose process health and run meaningful executable tests,
within the [local POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md).

## User / business value

The maintainer can reproduce local API startup and verify changes before adding
CSV import and analytical functionality.

## Context

The owner explicitly requested this story after integrating IOP-142 into develop.
See the [execution plan](../completed/IOP-016-backend-bootstrap-plan.md),
[module boundaries](../../architecture/modules.md) and [workflow](../workflow.md).
This host composes the modular platform; it is not a separate business microservice.

## Current state

The API host, locked npm workspace, TypeScript build, Jest/Supertest tests and
OpenAPI artifact are implemented and validated from a clean npm installation.
No business module or database connection exists.

## Desired state

Reproducible API startup, public process-liveness response and passing tests with
honest scope/validation evidence.

## Requirements

- Deliver the API host only, using the accepted stack and HTTP contract strategy.
- `GET /health` returns `200 {"status":"ok"}` as process liveness; no storage or
  business-readiness claim, identity requirement or organization/site input.
- Restrict startup to loopback, validate PORT and fail safely on startup errors.
- Verify actual Nest injection, HTTP responses, generated contract and compiled
  process lifecycle. Pin compatible dependencies and document commands.
- Keep bootstrap errors sanitized and avoid recording secrets or request payloads.

## Acceptance criteria

- [x] API starts, health responds and executable tests pass.
- [x] Plan records scenarios, dependencies and bounded implementation choices.
- [x] Validation evidence and documentation are synchronized.

## Domain considerations

No business logic, customer labels, source schemas or domain module layout is
introduced. The host exposes only operational process health.

## Architecture constraints

Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md),
[ADR-0009](../../architecture/adr/ADR-0009-local-delivery-tooling.md),
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) and
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md).
Proposed [ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md)
remains unaccepted; the bootstrap does not implement it.

## Security considerations

Loopback-only listener, no business data, fixed failure diagnostics and sanitized
Problem Details. No secrets, production input, authentication bypass or RLS changes.
No claim of shared-user authorization or production readiness.

## Data considerations

No database connection, schema, migrations or seeds. PostgreSQL remains the
accepted persistence target for its own bootstrap story.

## API considerations

Version-neutral public `GET /health`; generated OpenAPI 3.0.0 contract. Minimal
bootstrap errors use `application/problem+json` with `type`, `title`, `status`.
Business API versions, domain errors and correlation remain future implementation.

## UI considerations

No frontend, documentation UI or generated browser bindings in this slice.

## Dependencies

- [IOP-002](IOP-002-technology-stack.md) and [IOP-003](IOP-003-api-contract-strategy.md)
  are Completed and provide the accepted stack/API strategy.
- [IOP-013](IOP-013-observability-baseline.md) remains Proposed for broader health,
  logging and correlation. ADR-0011 explicitly assigns operational health to this
  bootstrap; basic process liveness does not require the complete observability design.
- IOP-015 consumes this host; Compose is not a prerequisite. IOP-018/019 own broader
  configuration and storage. Database lifecycle tests accompany that delivery.
- Runtime business access waits for an accepted execution-context mechanism;
  independent host bootstrap proceeds without implementing a principal.

## Non-goals

Adjacent stories, workers, Docker/Compose, database/ORM/migrations, frontend,
CSV ingestion, analytics, login, permissions, full diagnostic/error infrastructure,
repository-wide hook/lint/format tooling, CI or accepting Proposed ADRs.

## Validation

Clean npm installation, build, type checking, Jest/Supertest HTTP and compiled
process tests; health contract drift, invalid PORT, occupied port and graceful
shutdown; dependency audit/license review and documentation consistency.
See the plan for actual outcomes and [API instructions](../../../apps/api/README.md).

## Documentation impact

This item, its [backlog](../backlog.md) row, the execution plan, API instructions,
root README and obsolete repository-baseline statements are synchronized.

## Open questions

No new architecture decision is required for this host. Broader IOP-013 health/log
contracts and ADR-0018 business execution remain outside its completed scope.
