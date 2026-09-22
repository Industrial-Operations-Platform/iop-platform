# IOP-015 — Local Docker development environment

## Status

Completed — local POC container environment validated on 2026-09-22.

## Milestone

M2 — Development Platform Foundation.

## Goal

Start the real frontend, API and PostgreSQL with one command, within the
[local analytical POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).

## User / business value

The maintainer can build and run the local hosts without installing Node locally.

## Context

The owner requested IOP-015 limited to the POC. The
[execution plan](../completed/IOP-015-local-development-environment-plan.md) records
branch, dependency refinement, implementation and validation.

## Current state

Compose builds the existing React UI and NestJS API with multi-stage images and
starts PostgreSQL with dedicated persistent storage. Only the web port is published
on loopback. Nginx serves static assets and proxies public API health. The API
has no database connection; migrations and business access remain separate work.

## Desired state

Reproducible local three-process startup with documented configuration, safe
failure behavior, persistence and verified UI/API connectivity.

## Requirements

- Use the accepted stack and Compose; run real hosts, not substitutes.
- Keep host exposure on loopback and credentials out of builds and frontend.
- Require an explicit local database password and retain data across container restarts.
- Keep native loopback defaults; use validated container-specific listen input.
- Document boundaries, rebuild/stop commands and executable evidence.

## Acceptance criteria

- [x] One command starts the real frontend, API and PostgreSQL.
- [x] The plan records dependencies and bounded implementation decisions.
- [x] Validation evidence and documentation are synchronized.

## Domain considerations

Hosts remain composition/delivery units of the modular monolith, not business
microservices. No customer-specific labels, modules or source schemas are introduced.

## Architecture constraints

Accepted ADR-0001/0003–0011 in the [ADR directory](../../architecture/adr/) govern
the existing hosts, stack, Compose, static frontend/proxy and story workflow.
No new architectural pattern or acceptance of a Proposed ADR is introduced.

## Security considerations

Only web port 8080 is published at 127.0.0.1. API/web use non-root runtime users.
The build context excludes local secrets/data. Bootstrap PostgreSQL credentials
reach only the database and are never application runtime credentials.
This supplies public health only, not identity, business authorization or RLS evidence.

## Data considerations

A dedicated named volume retains the empty local database. No application schema,
seed, ORM, migrations or dataset reset is introduced. Test data stays in an isolated
validation project; existing user volumes are not touched.

## API considerations

The existing public `/health` contract is unchanged. HOST accepts loopback (default)
or explicit container binding; unsupported configuration fails with a safe diagnostic.

## UI considerations

The existing health UI uses the same relative `/health` route through Nginx.
No business screens or frontend secret configuration are added.

## Dependencies

- [IOP-016](IOP-016-backend-bootstrap.md) and [IOP-017](IOP-017-frontend-bootstrap.md)
  are Completed and integrated in develop; their real hosts are packaged here.
- [IOP-018](IOP-018-configuration-management.md) retains broader configuration,
  scoped targets and validation. This slice owns only container/transport inputs.
- [IOP-019](IOP-019-database-bootstrap.md) retains migrations, database roles and
  persistence contracts. These do not block starting an empty PostgreSQL process.
- Accepted ADR-0009/0010 already assign Compose and static proxy implementation
  to this delivery. [IOP-014](IOP-014-security-baseline.md) supplies local safety rules.
- Proposed ADR-0018 blocks dependent business access, not public health startup.

## Non-goals

Workers, login, live integrations, business persistence, migrations, seeds, source
mounts without an importer, hot-reload containers, production hosting, CI/hooks,
reset workflows or implementation/completion of adjacent stories.

## Validation

See the execution plan for actual commands/results and
[container instructions](../../../infra/docker/README.md) for reproduction.
Checks cover build/type checking, API/web tests, Compose input/exposure, real
container startup, browser failure/recovery and database persistence.

## Documentation impact

This item, backlog, execution plan, container/host/root READMEs and current
container statements in the architecture baseline.

## Open questions

No new architecture decision blocks this bounded startup story. Completing it
neither completes POC increment 1 nor selects future database/business mechanisms.
