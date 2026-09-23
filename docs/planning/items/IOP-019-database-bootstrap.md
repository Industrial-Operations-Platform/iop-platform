# IOP-019 — PostgreSQL + migrations

## Status

Blocked — migration tooling decision awaiting owner acceptance. Planning/proposal
increment prepared on 2026-09-23; no database implementation is claimed.

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
and web hosts exist; IOP-018 validates explicit local configuration. There are no
migrations or application database connections. The bootstrap administrative
credential must not be used by future runtime business operations.

The desired slice has repeatable role provisioning, ordered migrations, separate
migration/runtime credentials and disposable-database verification. Migration
metadata is infrastructure data, not an unscoped container for customer records.

## Requirements and acceptance criteria

- [ ] Reproduce the local database from empty using documented commands/migrations.
- [ ] Verify unchanged reruns, transactional failure and concurrent migration safety.
- [ ] Verify separate non-owner runtime credentials and denied elevated operations.
- [x] Plan scenarios and dependencies without extending the POC scope.
- [ ] Record implementation evidence and synchronize documentation.

## Dependencies and architecture constraints

[IOP-002](IOP-002-technology-stack.md), [IOP-005](IOP-005-tenancy-and-data-isolation.md)
and [IOP-018](IOP-018-configuration-management.md) are integrated on develop.
IOP-002/005 are completed design; they do not prove executable persistence isolation.
IOP-015 provides the current database container. Reuse Accepted ADR-0001/0003/0004/
0005/0006/0007/0008 and the npm/Jest/Testcontainers decisions in ADR-0009/0010
from the [ADR directory](../../architecture/adr/).

[ADR-0019](../../architecture/adr/ADR-0019-local-database-migrations.md) proposes
node-pg-migrate without an ORM and an explicit privilege model. It is not Accepted.
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

The [active implementation plan](../active/IOP-019-database-bootstrap-plan.md)
records files, sequencing and post-acceptance test scenarios. The
[completed proposal increment](../completed/IOP-019-database-bootstrap-proposal-plan.md)
records documentation evidence. Keep item/backlog status aligned. Complete the
parent only after actual bootstrap and privilege tests pass.

## Open decision

Owner acceptance of Proposed ADR-0019 is required before dependent implementation
under AGENTS.md rule 5. No runtime result is inferred from this proposal or its commit.
