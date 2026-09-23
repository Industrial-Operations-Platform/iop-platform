# IOP-019 — PostgreSQL + migrations

## Status

Completed — local POC database bootstrap, 2026-09-23. Business persistence and
the remaining POC increment 1 stories are not completed by this slice.

## Milestone and goal

M2 — Development Platform Foundation. Reproduce the local POC database from an
empty database using documented provisioning and versioned migrations.

## Authorization and scope

The owner requested IOP-019 on 2026-09-23 within the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Deliver only local migration infrastructure and separate runtime privileges.
No worker, login, business schema, organization/site seed or full platform delivery.

## Current and desired state

IOP-015 supplies PostgreSQL 17.6 in Compose with a dedicated local volume. The API
and web hosts exist; IOP-018 validates explicit local configuration. IOP-019 now provides explicit role provisioning and versioned migrations.
There are no application database connections. Bootstrap and migration credentials
are confined to one-shot tooling; runtime has connection access only.

The delivered slice has repeatable role provisioning, ordered migrations, separate
migration/runtime credentials and disposable-database verification. Migration
metadata is infrastructure data, not an unscoped container for customer records.

## Requirements and acceptance criteria

- [x] Reproduce the local database from empty using documented commands/migrations.
- [x] Verify unchanged reruns, transactional failure and concurrent migration safety.
- [x] Verify separate non-owner runtime credentials and denied elevated operations.
- [x] Plan scenarios and dependencies without extending the POC scope.
- [x] Record implementation evidence and synchronize documentation.

## Dependencies and architecture constraints

[IOP-002](IOP-002-technology-stack.md), [IOP-005](IOP-005-tenancy-and-data-isolation.md)
and [IOP-018](IOP-018-configuration-management.md) are integrated on develop.
IOP-002/005 are completed design; they do not prove executable persistence isolation.
IOP-015 provides the current database container. Reuse Accepted ADR-0001/0003/0004/
0005/0006/0007/0008 and the npm/Jest/Testcontainers decisions in ADR-0009/0010
from the [ADR directory](../../architecture/adr/).

[ADR-0019](../../architecture/adr/ADR-0019-local-database-migrations.md) selects
node-pg-migrate without an ORM and an explicit privilege model. It was explicitly accepted on 2026-09-23.
[ADR-0013](../../architecture/adr/ADR-0013-tenancy-data-isolation.md) remains binding
for future customer tables, constraints, RLS and transaction-local scope.
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) remains
Proposed; it gates business execution, not this infrastructure bootstrap.
IOP-025/026/123 own persisted organization/site identity and seed; configuration
references are not a substitute. No adjacent story is activated.

## Security, data, API and UI

Keep credentials private and out of error output; use disposable test databases.
Do not reset existing operator data or change the public health contract. No API
connection, browser configuration secret, business endpoint or screen is added.
Future customer data keeps explicit scope, owning modules and forced RLS; this
slice neither implements nor waives those requirements.

## Non-goals

ORM/repository architecture, business schema/seed, login/grants, production hosting,
backup/restore, full demo reset, general integration platform and historical SQL reuse.

## Validation and documentation impact

The [completed implementation plan](../completed/IOP-019-database-bootstrap-plan.md)
records files, sequencing and executed tests. The
[completed proposal increment](../completed/IOP-019-database-bootstrap-proposal-plan.md)
records the earlier documentation increment. [Local commands](../../../infra/database/README.md)
document configuration, operation, privileges and limitations. Repository tests,
PostgreSQL integration tests and the disposable Compose smoke check passed.

## Remaining boundaries

No open decision blocks this completed bootstrap slice. Business data, scoped RLS
policies and runtime execution remain future owning-story work. ADR-0018 remains
Proposed; no shared-user or production readiness is claimed.
