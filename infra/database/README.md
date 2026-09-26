# Local PostgreSQL bootstrap

IOP-019 implements Accepted [ADR-0019](../../docs/architecture/adr/ADR-0019-local-database-migrations.md):
explicit role provisioning and node-pg-migrate 9.0.0 migrations on the existing
PostgreSQL 17.6 local service. The API still exposes process health only and has no
database connection. IOP-025 adds the organization table and explicit initial seed
under Accepted [ADR-0020](../../docs/architecture/adr/ADR-0020-local-organization-bootstrap.md).
IOP-026 adds site storage and an explicit initial seed under Accepted
[ADR-0021](../../docs/architecture/adr/ADR-0021-local-site-bootstrap.md). There is no login or ORM.

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

A fresh database reports `5 applied` (privilege baseline, organizations, sites, users and memberships); an unchanged rerun reports `0 applied`.
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
IOP-025/026/027/030 supply the organization/site/user/membership seeds below. Combined demo fixtures
remain IOP-123; ADR-0018 is Accepted, with runtime implementation pending.

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
does not read that JSON or verify persisted site/source ownership. The separate
site seed checks its existing organization; source persistence remains future work. A configured ID alone still grants no runtime authority.

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


## Initial site seed (IOP-026)

After the organization seed, configure these explicit non-secret inputs:

```dotenv
IOP_SEED_ORGANIZATION_ID=org-demo
IOP_SEED_SITE_ID=site-demo
IOP_SEED_SITE_NAME=Fictional Demo Site
IOP_SEED_SITE_TIME_ZONE=Europe/Zurich
```

The owner ID must already exist. Match `organization.id` and `site.organizationId`
in `config/poc.local.json`, and match `site.id` and `site.timeZone` exactly; preserve
source ownership references too. The command does not read that JSON. Do not add
name fields to its strict shape. Persisted scope is not runtime authorization.

```sh
docker compose -f compose.yaml -f compose.database.yaml build database-seed-site
docker compose -f compose.yaml -f compose.database.yaml run --rm database-seed-site
```

For native use, export the four seed variables and explicit migrator connection
fields above, then run `npm run db:seed:site`. Alternatively, after `npm run db:build`,
run `node --env-file=.env infra/database/dist/cli.js seed-site` with native connection
fields in that private file. The tooling never runs at API startup.

IDs and names follow the organization rules above. The zone must be `UTC` or a
slash-separated named IANA zone of at most 100 characters, recognized by Node Intl
and spelled exactly as in PostgreSQL's time-zone catalog. Offsets, bare abbreviations
other than UTC, whitespace and unknown names fail. Accepted alias spelling is
preserved; the command does not canonicalize it or infer source reporting windows.
A catalog-checking invoker trigger also validates direct inserts in PostgreSQL.

First creation reports `created`; identical reruns report `unchanged`. A different
owner, name or zone at the same site ID fails without mutation, including concurrent
attempts. A missing owner fails without creating it. Foreign conflicts return no
foreign identifiers. Zone corrections and transfers require separately reviewed work.

`platform_core.sites` has a globally unique site ID, an organization FK and a unique
`(organization_id, site_id)` key for scoped references. Forced RLS requires both
transaction-local seed selectors for migrator SELECT/INSERT. Missing site scope
never expands access. No UPDATE/DELETE policy or runtime grant is added; provisioning
reruns retain the CONNECT-only runtime baseline. The privileged object owner can
change DDL, so these controls do not establish business RBAC or protect against a
compromised migrator credential. Keep that credential outside API/web containers.

Validation and limitations are recorded in the
[IOP-026 plan](../../docs/planning/completed/IOP-026-site-model-plan.md).
Site lifecycle, CRUD and administration remain deferred. This site command supplies no user/grant/source seed, runtime repository, endpoint
or UI; ADR-0018 is Accepted, with runtime implementation pending.


## Initial local user seed (IOP-027)

Accepted [ADR-0024](../../docs/architecture/adr/ADR-0024-local-principal-bootstrap.md)
adds `users_rbac.users`, owned by Users/RBAC. It stores only the global opaque
`user_id` and non-null `is_active`. No organization, profile, credentials or grants
are stored in the identity row. It can be seeded before any organization exists.

After provisioning and migration, set the explicit non-secret `IOP_SEED_USER_ID`
in your private environment file, for example `local-demo-user`. IDs follow the
same case-sensitive 1–64 character rules as organization IDs. Select once and keep
stable; do not add user fields to the existing strict POC JSON configuration.

```sh
docker compose -f compose.yaml -f compose.database.yaml build database-seed-user
docker compose -f compose.yaml -f compose.database.yaml run --rm database-seed-user
```

For native use, export `IOP_SEED_USER_ID` and the migrator connection fields listed
above, then run `npm run db:seed:user`. Alternatively, after `npm run db:build`, use
`node --env-file=.env infra/database/dist/cli.js seed-user` with explicit native
connection fields. There is no implicit environment-file loading or startup seed.

First creation reports `created`; an existing active identity reports `unchanged`.
Concurrent seeds converge on the same row. An inactive identity fails without
reactivation; another ID creates a different identity, not a rename. Invalid input,
nonlocal configuration and incompatible role privileges fail with safe output.

Only the dedicated migrator performs exact-principal SELECT/INSERT, with forced
RLS and a transaction-local `iop.seed_user_id` selector on a fresh connection.
Commit/rollback clears that selector. No ordinary UPDATE/DELETE policy or runtime
grant exists. The migrator can change DDL and remains trusted installation authority.
Keep its credential out of API/web containers. Runtime still has CONNECT only.

This seed does not authenticate a person, create membership/roles or enable import
and analytics access. The later host adapter must validate this current active
identity plus explicit membership and both site roles under ADR-0018. No user CRUD,
reactivation, reset framework or administration screen is introduced. Validation
is recorded in the [IOP-027 plan](../../docs/planning/completed/IOP-027-local-principal-plan.md).

## Initial local membership and site roles (IOP-030)

Accepted [ADR-0025](../../docs/architecture/adr/ADR-0025-local-membership-bootstrap.md)
adds Users/RBAC-owned `organization_memberships` and `site_role_assignments`.
An active organization membership is separate from the two explicit site grants;
no site-membership flag, organization admin or arbitrary role catalog is added.
Composite references enforce the user's membership and the site's organization.

First run provisioning/migrations and the organization, site and user seeds above.
Set all three explicit non-secret selectors in your private environment:

```dotenv
IOP_SEED_ORGANIZATION_ID=org-demo
IOP_SEED_SITE_ID=site-demo
IOP_SEED_USER_ID=local-demo-user
```

Use the existing stable IDs and match the organization/site POC configuration.
The command never reads or changes that JSON and requires no name/zone input.

```sh
docker compose -f compose.yaml -f compose.database.yaml build database-seed-membership
docker compose -f compose.yaml -f compose.database.yaml run --rm database-seed-membership
```

Native: export those selectors and the migrator connection fields, then run
`npm run db:seed:membership`. Alternatively, after `npm run db:build`, run
`node --env-file=.env infra/database/dist/cli.js seed-membership` with explicit
native connection fields. This is initial installation tooling, never API startup.

The command requires an existing active user and correctly owned site. It atomically
creates an active organization membership with exactly `site-operator` and
`analytics-reader` at that site, reporting `created`. An active existing membership
with both roles reports `unchanged`. Concurrent matching calls converge; calls
for different sites under the same membership cannot expand it. Missing roles,
inactive membership or a new site under an existing membership fail unchanged.
No repair, reactivation or grant restoration is performed. Do not delete membership
rows to force reseeding: full deletion is indistinguishable from initial creation.
Recovery or dedicated demo recreation needs separately reviewed work; this command
is not a lifecycle or reset tool.

Migrator-only forced RLS requires exact principal/organization selectors and the
site selector for assignments. One READ COMMITTED transaction uses a transaction
advisory lock for the organization/user pair before reading current state. Hash
collisions only serialize unrelated seeds; locks and selectors clear at transaction
end. The lock coordinates this seed command, not future lifecycle mutations or
manual privileged changes. Every failure rolls back all new membership/role rows.
No UPDATE/DELETE policy, runtime grant, security-definer function or RLS bypass is
added. The trusted migrator owner can change DDL; its credentials stay outside hosts.

Runtime retains CONNECT only. This seed does not authenticate a human or implement
current permission evaluation, the ADR-0018 host adapter, origin protection or
business transactions. Role permissions remain exactly those in ADR-0014; runtime
access must still check active identity, membership, exact scope and grants.
Validation is recorded in the [IOP-030 plan](../../docs/planning/completed/IOP-030-local-membership-plan.md).
