# Local PostgreSQL bootstrap

IOP-019 implements Accepted [ADR-0019](../../docs/architecture/adr/ADR-0019-local-database-migrations.md):
explicit role provisioning and node-pg-migrate 9.0.0 migrations on the existing
PostgreSQL 17.6 local service. The API still exposes process health only and has no
database connection. IOP-025 adds the organization table and explicit initial seed
under Accepted [ADR-0020](../../docs/architecture/adr/ADR-0020-local-organization-bootstrap.md).
There are no sites, login or ORM.

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

A fresh database reports `2 applied` (privilege baseline and organizations); an unchanged rerun reports `0 applied`.
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
IOP-025 supplies the organization seed below. Site and combined fixture delivery
remain IOP-026/123; ADR-0018 remains Proposed.

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

## Initial organization seed (IOP-025)

After provisioning and migration, supply two explicit non-secret variables in the
private `.env` used by Compose:

```dotenv
IOP_SEED_ORGANIZATION_ID=org-demo
IOP_SEED_ORGANIZATION_NAME=Fictional Demo Organization
```

Use the exact `organization.id` from your `config/poc.local.json`, preserving its
case and all `site.organizationId`/`source.organizationId` references. The existing
JSON remains a reference-only configuration; do not add a name field. The command
does not read that JSON or verify persisted site/source ownership: those records
are not implemented. A configured ID alone still grants no runtime authority.

```sh
docker compose -f compose.yaml -f compose.database.yaml build database-seed-organization
docker compose -f compose.yaml -f compose.database.yaml run --rm database-seed-organization
```

For native use, export the two seed variables and the explicit migrator connection
configuration in the table above, then run `npm run db:seed:organization`.
Alternatively compile with `npm run db:build` and use
`node --env-file=.env infra/database/dist/cli.js seed-organization` with explicit
native connection fields. No command implicitly loads an environment file.

IDs are opaque, case-sensitive ASCII letters/digits/underscores/hyphens, 1–64
characters, starting with a letter/digit. Select the ID once; never derive it from
a display name. Names are 1–200 Unicode code points with no edge whitespace or
C0/C1 controls. No silent trimming or normalization occurs. Names need not be unique.

The first successful call reports `created`; identical input reports `unchanged`.
The same ID with a different name fails without renaming. Concurrent equal inputs
converge; conflicting inputs leave one committed name. Another explicit ID creates
a separate organization, never a rename. Invalid/missing inputs and unavailable
connections exit unsuccessfully without disclosing values or database diagnostics.

`platform_core.organizations` is owned by Platform Core, with its primary key also
serving as root organization scope. The migrator login performs only scoped
SELECT/INSERT through forced RLS in a fresh transaction. Commit/rollback clears its
local selector. No runtime grant or UPDATE/DELETE policy exists. The migrator owner
can change DDL and remains privileged installation authority; RLS is not protection
against that credential. Keep it out of hosts and never use this command as a
business configuration endpoint. This seed does not create sites, users, grants or
sources, and does not enable API access or implement reset/CRUD/lifecycle operations.

IOP-025 validation adds concurrent seed, conflict, rollback, constraint and real-role
access tests on disposable PostgreSQL 17.6. Native suites and a disposable Compose
build/provision/migrate/seed/rerun are recorded in the
[completed plan](../../docs/planning/completed/IOP-025-organization-model-plan.md).
