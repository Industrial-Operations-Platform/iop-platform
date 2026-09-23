# Local PostgreSQL bootstrap

IOP-019 implements Accepted [ADR-0019](../../docs/architecture/adr/ADR-0019-local-database-migrations.md):
explicit role provisioning and node-pg-migrate 9.0.0 migrations on the existing
PostgreSQL 17.6 local service. The API still exposes process health only and has no
database connection. There are no business tables, seeds, login or ORM.

## Compose commands

Follow the [local environment setup](../docker/README.md). In ignored `.env`, provide
three separate locally generated passwords: `IOP_POSTGRES_PASSWORD`,
`IOP_MIGRATOR_PASSWORD` and `IOP_RUNTIME_PASSWORD`. Each must be 16–256 UTF-8 bytes;
hex passwords generated independently with `openssl rand -hex 24` are convenient.
Keep `.env` restricted to its owner. Never use production credentials.

Run from the repository root:

```sh
docker compose up -d --wait database
docker compose -f compose.yaml -f compose.database.yaml build database-provision database-migrate
docker compose -f compose.yaml -f compose.database.yaml run --rm database-provision
docker compose -f compose.yaml -f compose.database.yaml run --rm database-migrate
```

The first migration reports `1 applied`; an unchanged rerun reports `0 applied`.
Provisioning can also be repeated. The optional overlay requires all three password
variables for Compose interpolation, but the migration container receives only its
own password. Neither API nor web receives any of them. Commands are one-shot jobs;
normal `docker compose up` does not run migrations or require the two new passwords.
Database port 5432 stays unpublished. The tooling image runs as the non-root Node user.

The database/user created by the PostgreSQL image are initialized only on an empty
volume. Changing `.env` does not rotate existing passwords. Provisioning authenticates
existing roles and refuses mismatches or incompatible privileges/ownership. Review
configuration with the local operator; do not delete data to fix credentials.
No command here resets or drops an existing database or volume.

## Native commands

Use Node 24.21.0/npm 10.9.2 and `npm ci`. For a separately provisioned local PostgreSQL
server, explicitly configure the following environment variables:

| Variable | Required value |
| --- | --- |
| `IOP_DATABASE_MODE` | `local` |
| `IOP_DATABASE_HOST` | `127.0.0.1`, `localhost` or `::1`; `database` is reserved for Compose DNS |
| `IOP_DATABASE_PORT` | Explicit port from 1 to 65535 |
| `IOP_DATABASE_NAME` | `iop_local`, owned by `iop_bootstrap` |
| `IOP_POSTGRES_PASSWORD` | Bootstrap password, provisioning only |
| `IOP_MIGRATOR_PASSWORD` | Separate migration password |
| `IOP_RUNTIME_PASSWORD` | Separate runtime password, provisioning only |

Run `npm run db:provision`, then `npm run db:migrate`. These compile the TypeScript
tooling first. They do not load `.env` implicitly. Alternatively, after
`npm run db:build`, Node's explicit `--env-file=.env` option can load a private file
before `infra/database/dist/cli.js provision` or `infra/database/dist/cli.js migrate`.
The file must also contain the five explicit connection/mode fields above when used
this way. The accepted loopback/Compose host restriction is a local-use guard, not
authentication of a DNS server or a production network boundary; TLS is not enabled.
`PG*` connection defaults and `DATABASE_URL` do not supply connection configuration.

## Privileges and migration contract

- `iop_bootstrap` is the local database owner/admin. Only provisioning uses it.
- `iop_migrator` owns the private `iop_migrations` schema and migration-managed
  objects. It can create database schemas but cannot create roles/databases or bypass
  RLS through a role attribute. Object ownership is privileged; never give this
  credential to the API.
- `iop_runtime` has database CONNECT only. It cannot own objects, inherit/set an
  elevated role, create schemas/tables/temp tables, truncate or access migration
  history. No business data permission is implied by being able to connect.

Provisioning locks and changes roles/privileges atomically, revokes standard PUBLIC
access to the dedicated database and public schema, and refuses incompatible role
attributes, memberships, ownership, schema grants and effective runtime grants.
It does not rotate passwords. This initial connection-only baseline must be refined
under the owning story before granting runtime business access; it will reject
additional runtime grants on a later provisioning rerun until that contract changes.

Migrations live in `infra/database/migrations/`; metadata lives in
`iop_migrations.history`. The first migration removes PUBLIC default access for
future migrator-created tables, sequences, functions and types. Future owning-module
migrations must separately define scope, constraints, forced RLS and explicit grants.
Organization/site seed belongs to IOP-025/026/123; ADR-0018 remains Proposed.

Use ordered timestamp-prefixed SQL files with `-- Up Migration`. Committed applied
migrations are immutable by convention; append a corrective migration. There is no
checksum/drift detector or automatic downgrade/reset command. Pending migrations
and history entries run transactionally; node-pg-migrate may create an empty history
table before that transaction. On failure, no pending migration is recorded as
applied. Its advisory lock covers initial history setup as well as execution;
a concurrent attempt fails safely and must be retried explicitly.

Connection timeout is 5 seconds; statement timeout is 30 seconds and lock timeout
is 5 seconds. Commands exit unsuccessfully on invalid configuration, authentication,
connection, privilege or migration errors. Output omits raw SQL/driver diagnostics
and secrets. Operators inspect local database state privately when troubleshooting.

## Validation

```sh
npm run typecheck
npm test
npm run test:database
```

`npm test` includes configuration/CLI checks without requiring Docker.
`test:database` additionally requires a running Docker daemon and uses disposable
PostgreSQL 17.6 Testcontainers; it fails rather than skipping when Docker is absent.
It verifies fresh/recreated database, unchanged reruns, concurrent runners, rollback,
role drift, wrong passwords and denied runtime operations with real credentials.
It never targets the operator's Compose volume. The built Compose tooling was also
checked on a uniquely named disposable project with first and repeat commands.
See [execution evidence](../../docs/planning/completed/IOP-019-database-bootstrap-plan.md).
No business authorization, tenant RLS or production recovery claim follows from
these infrastructure checks.
