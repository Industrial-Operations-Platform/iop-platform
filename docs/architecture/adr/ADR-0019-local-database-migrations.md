# ADR-0019: Local PostgreSQL migration tooling

## Status

Accepted — explicitly approved by the owner on 2026-09-23 under [IOP-019](../../planning/items/IOP-019-database-bootstrap.md).
Implementation is authorized within the local POC boundary below.

## Context

The [POC](../../product/scope-poc.md) needs a reproducible local database. PostgreSQL
17.6 already runs in Compose; TypeScript/Node.js, npm and Jest/Testcontainers are
accepted. ADR-0003 leaves migration tooling open; ADR-0013 requires separate runtime
credentials. IOP-018 configuration does not establish persisted scope or permission.
A migration runner does not require a business ORM or acceptance of ADR-0018.

## Decision

Use `node-pg-migrate` for ordered, versioned migrations under
`infra/database/migrations/`, with explicit SQL where appropriate. Use its
node-postgres connection support for infrastructure commands/tests only; this does
not choose the application's repository, ORM or pool architecture. Pin a stable
compatible release and transitive dependencies in the lockfile during implementation.
The live documentation currently displays an alpha release; do not adopt that
release implicitly. Check the chosen stable version's documented behavior and tests.

Run migrations as an explicit local command/one-shot Compose service, never during
API startup or through an HTTP endpoint. Require explicit connection configuration,
a dedicated local database target and safe error output without credentials or SQL
payloads. Do not pass privileged connection settings to the web or API containers.

Keep migration ordering checks, advisory locking and transactional execution enabled.
Applied migrations are immutable in repository practice; corrections use a new
migration. Do not claim checksum/drift detection unless separately implemented and
tested. The POC does not need nontransactional migrations or automatic downgrade.
Use forward corrections; recreation targets only explicitly disposable databases.

### Privilege separation

- Bootstrap: the existing local PostgreSQL administrative credential creates the
  database roles and hardens database/schema privileges through an explicit,
  repeatable provisioning step. It is not used for ordinary migrations or API work.
- Migrator: a separate login owns migration-managed objects, with only the local
  database privileges needed for DDL. No superuser, role creation, database creation
  or RLS bypass attribute. It is inherently privileged over its objects and is never
  treated as an application authorization boundary.
- Runtime: a separate non-owner login with no superuser, role/database creation,
  RLS bypass, schema creation, truncate or privileged role membership. Initially
  it has connection access only; no business tables exist. Future grants are explicit
  per owning migration, with no blanket grants to future tables.

Revoke unsafe PUBLIC creation/access privileges on the dedicated database and
managed schemas as applicable. Keep migration metadata inaccessible to runtime.
Role provisioning is distinct from schema migration history because roles are
cluster-level objects. Refuse incompatible pre-existing role attributes/ownership
rather than silently weakening them. Supply passwords privately; never embed them
in migrations, examples, logs or committed files. Verify reconnect/rerun behavior
without changing an operator's existing volume or silently rotating credentials.

### First implementation boundary

Deliver migration metadata, the minimal database privilege baseline, explicit
provision/migrate commands and executable reproducibility/privilege checks.
Do not create organization/site, user/grant, source/import or analytical tables.
IOP-025/026/123 own scoped identities and seed; subsequent owning-module migrations
must apply scoped constraints and enabled/forced RLS under ADR-0013 before runtime
access. Test-only disposable objects can prove role restrictions without becoming
production schemas. No API connection or transaction abstraction is introduced.

## Alternatives considered

| Option | Assessment |
| --- | --- |
| node-pg-migrate without ORM | Recommended for this slice: PostgreSQL-focused migration lifecycle within the accepted Node toolchain, with reviewable SQL. Adds one tooling dependency and version-specific verification. |
| Handwritten SQL runner using psql or pg | Avoids a migration package but makes ordering, history, locking and failure handling repository-maintained infrastructure. Not justified for this POC. |
| Select an ORM and its migration stack now | Could serve future repositories, but couples this bootstrap to an unrequested application persistence decision. Defer ORM evaluation until a concrete consumer requires it. |

## Validation required after acceptance

- Fresh disposable PostgreSQL 17.6: provision roles and apply all migrations; compare
  expected objects, history and effective privileges. Repeat on another empty DB.
- Rerun: no duplicate history or schema changes; incompatible provisioning fails safely.
- Failure: injected migration error rolls back transactional DDL/history and exits
  unsuccessfully; a corrected test fixture can subsequently migrate.
- Concurrency: competing runners never apply the same migration twice; record the
  chosen version's actual lock-contention behavior, including first-run metadata.
- Actual runtime login: connection succeeds, but metadata writes, schema/table
  creation, elevated SET ROLE, migration execution and truncate fail. Use disposable
  fixtures for object-level checks so absence of a table cannot fake denial evidence.
- Invalid/missing credentials and unavailable database: fail without secret disclosure.
- Run repository tests and Compose validation; record limitations explicitly. These
  checks do not prove business authorization or tenant RLS, which have no tables yet.

## Consequences and acceptance boundary

This establishes local migration mechanics only. It does not provide production
backup/restore, shared hosting, seeds, reset tooling for the complete demo, an ORM,
authentication or business access. ADR-0018 remains Proposed and independent.
Acceptance enables the planned IOP-019 implementation, not adjacent stories.
IOP-019 implements node-pg-migrate 9.0.0 with pg 8.23.0; see the
[local commands and validation](../../../infra/database/README.md). Infrastructure
tests are executable evidence, not proof of business authorization or tenant RLS.

## Sources

Official sources consulted on 2026-09-23:

- [node-pg-migrate migrations](https://salsita.github.io/node-pg-migrate/migrations/):
  migration definitions, advisory locking and transaction behavior.
- [node-pg-migrate CLI](https://salsita.github.io/node-pg-migrate/cli): connection,
  ordering and execution options; verify against the pinned stable release.
- [PostgreSQL 17 CREATE ROLE](https://www.postgresql.org/docs/17/sql-createrole.html):
  role attributes and their privilege implications.

Tool capability descriptions inform this proposal; the selected privilege model
and slice boundaries are project design recommendations, not upstream guarantees.
