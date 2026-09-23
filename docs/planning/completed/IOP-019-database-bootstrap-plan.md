# IOP-019 — Local PostgreSQL bootstrap execution plan

Source: [permanent item](../items/IOP-019-database-bootstrap.md).

## Status and authorization

Completed on 2026-09-23. The owner explicitly accepted ADR-0019 and authorized the story push
and merge/push to origin/develop on 2026-09-23. The owner requested IOP-019 on 2026-09-23, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-019-database-bootstrap`, created from clean `develop` before
writing this plan. The two scope documents define the delivery boundary.

## Proposed implementation

Deliver only reproducible local PostgreSQL migration infrastructure and separation
of bootstrap, migration and runtime privileges. The proposal increment prepared ADR-0019 and paused dependent implementation.
The owner subsequently accepted that decision; implementation followed the refinement below.
Do not activate organization/site seed, CSV persistence, login or adjacent stories.

## Files expected to change

This decision increment:
- This plan and a completed decision-preparation record after validation.
- `docs/planning/items/IOP-019-database-bootstrap.md` and `docs/planning/backlog.md`.
- `docs/architecture/adr/ADR-0019-local-database-migrations.md` (subsequently Accepted).

The decision increment made no code edits. The accepted implementation refinement
below recorded exact implementation files and commands before those edits.
The POC scope documents need no change: their existing boundary already applies.

## Dependencies and decisions

- IOP-002: accepted TypeScript/NestJS, PostgreSQL, npm, Jest/Testcontainers stack
  integrated on develop; ORM/migration choice explicitly unresolved.
- IOP-005: accepted isolation design integrated, not runtime implementation.
  Separate non-owner runtime credentials and protect future customer tables with
  scoped constraints and forced RLS; no table is exempted by local POC scope.
- IOP-018: completed local configuration integrated. Its organization/site/source
  references validate configuration only; they are not persisted identities/grants.
- IOP-015: PostgreSQL 17.6 Compose service exists with a dedicated local volume;
  the bootstrap credential must not become an application credential.
- ADR-0018 stays Proposed. It blocks runtime business access, not migration tooling
  or infrastructure privilege tests. No dependency on login or its acceptance is
  added to this infrastructure slice.
- Organization/site schema and seed belong to IOP-025/026/123; importer schemas
  belong to their owning stories. Synthetic isolation fixtures are test-only.

## Database, API and UI changes

No executable changes were made before decision acceptance. The delivered bootstrap
contains migration metadata and role/privilege infrastructure, not business tables.
No endpoint, health contract, UI, database pool or runtime execution adapter changes.

## Steps and validation

1. Review dependencies and accepted boundaries; inspect current Compose/configuration.
2. Propose a bounded migration tool, credential model and reproducibility contract.
3. Validate changed Markdown links, IDs, status parity and `git diff --check`.
4. Record evidence and commit the completed documentation increment. Keep this
   implementation plan active and the parent Blocked on decision acceptance.
5. After acceptance, specify exact commands/files/package versions, then implement.
6. Verify fresh database bootstrap, unchanged rerun, failure rollback and competing
   runners using disposable PostgreSQL 17.6 with Jest/Testcontainers. Verify actual
   runtime credentials cannot perform DDL, migrate, truncate or assume elevated roles;
   no customer data access is granted. Never reset an existing operator volume.
7. Run `npm test`, type checks, Compose model validation and relevant database tests;
   document actual results and limitations before completing the implementation.

## Acceptance mapping

Reproducible database criterion requires executed fresh/rerun/failure tests after
acceptance; documentation alone does not satisfy it. Planning criterion is covered
by this dependency review, proposal and bounded validation scenarios. Evidence and
documentation criterion is recorded separately for each delivered increment.

## Completion checklist

- [x] Migration decision accepted explicitly.
- [x] Bootstrap implemented and reproducibility/privilege tests pass.
- [x] Relevant checks pass with actual evidence.
- [x] Item/backlog synchronized and implementation plan archived on completion.

## Evidence and deviations

Initial tree was clean on develop. Branch creation required a sandbox escalation
and succeeded before any file edit. No merge, push or runtime operation was performed during the proposal increment.

## Accepted implementation refinement — 2026-09-23

Continue on the existing story branch; no second story or branch is needed.
ADR-0019 is accepted by the owner's reply. `git fetch origin` confirmed local
and remote develop match. After validated commits, publish this story branch,
merge it into develop and push develop, as explicitly authorized. Keep the story
branch; do not touch stage/master.

Exact implementation files: `infra/database/{configuration,provision,migrate,cli}.ts`,
`migrations/`, `test/`, `tsconfig.json`, `jest.config.cjs`, `Dockerfile`, `README.md`;
root `package.json`/lockfile, `.env.example`, `.dockerignore`, `compose.yaml`;
root/container README, ARCHITECTURE.md, ADR-0003/0019, this plan and IOP-019 item/backlog.
Update the historical proposal record's active-plan link when archiving this plan.

Use stable node-pg-migrate 9.0.0 and pg 8.23.0; Jest/Testcontainers PostgreSQL 12.1.0
for disposable integration tests. Native commands compile the TypeScript tooling;
the one-shot non-root tooling image builds it separately. Tooling dependencies
remain outside API/web runtime images. No application persistence abstraction.

Configuration requires explicit local mode, fixed `iop_local` database and fixed
role names; only loopback or the explicit Compose `database` hostname is admitted.
Separate bootstrap/migrator/runtime passwords must be provided for provisioning;
migrate consumes only its own password. No ambient PG/DATABASE_URL fallback.
Provision atomically with a lock, refuse incompatible existing role attributes,
memberships, ownership and grants, authenticate existing passwords without rotating
them, and create only absent roles. Provision a private migration metadata schema;
its ownership and grants are verified on repeat runs. No business schema.
The first migration hardens migrator default privileges and is recorded in that
schema. Existing local volumes are not reset or silently repaired.

Proposed commands: `npm run db:provision`, `npm run db:migrate`, `npm run test:database`.
Use a separate opt-in Compose overlay for one-shot commands so normal health-only
startup does not require new passwords. Credentials are passed only to the relevant
service; the migration service receives no bootstrap/runtime password.
Add `compose.database.yaml` to the planned file set.

Tests: configuration rejection/redaction plus disposable PostgreSQL fresh bootstrap,
repeat bootstrap/migrations, second empty database recreation, failing migration
rollback/retry, parallel first migration, real runtime DDL/history/TRUNCATE/SET ROLE
failures, inconsistent role/schema/privilege/password rejection and no rotation.
Repository `npm test` includes database unit tests; explicit `test:database` requires
Docker and fails rather than silently skipping. Run type checks and Compose quiet
validation; smoke-test the built tooling image against a disposable Compose project.

Implementation detail: revoke standard PUBLIC database/public-schema defaults inside
provisioning before verifying effective runtime grants. This also supports recreating
an empty dedicated database while retaining cluster roles, without a manual privilege
repair step. Role drift, ownership conflicts and extra effective runtime object grants
still fail and roll back. The bootstrap never creates/drops the database itself.

## Completion evidence — 2026-09-23

- `npm run typecheck`: passed for API, web and database tooling.
- `npm test`: passed builds, browser contract check, 59 API tests, 11 web tests and
  20 database configuration/CLI tests, using Node 24.21.0/npm 10.9.2.
- `npm run test:database`: 27 tests passed, including 7 integration scenarios on
  disposable PostgreSQL 17.6. Verified fresh/concurrent first migration, no-op rerun,
  runtime privilege denials with real credentials and a SELECT positive control,
  migration rollback/corrected retry, explicit advisory-lock contention/retry,
  role/membership/schema/password drift rejection with no password rotation,
  CLI authentication-error sanitization and database recreation with existing roles.
- Built both tooling services from `compose.database.yaml` successfully. In disposable
  project `iop019-check-6c122c809a`, provision/migrate succeeded, repeated provisioning
  succeeded and migration counts were respectively 1 and 0. Removed only that
  project's test containers/network/volume; existing operator data was untouched.
- Compose `config --quiet` passed with synthetic credentials and `/dev/null` env file.
  Installation/build audits reported zero vulnerabilities at execution time.
- Markdown local-link checks, status parity and `git diff --check` passed. No secret
  or local configuration file was added to the commit. Tool image build uses an
  allowlisted context and retains production dependency license files.

The active plan is archived here after implementation verification. Proposal evidence
remains in its separate completed record. IOP-019 and backlog are Completed for this
local infrastructure slice; no adjacent story, full POC increment, runtime RLS,
business permission, production backup/restore or execution adapter is completed.

## Final scope and deviations

The optional Compose overlay avoids requiring migration credentials for existing
health-only startup; `compose.yaml` itself needed no change. Database tests use
compiled TypeScript with Jest CJS test files, so no test transpilation is needed.
The first integration run passed but exposed unnecessary manual privilege setup in
its recreation scenario; provisioning was refined to revoke standard PUBLIC defaults
before checking runtime grants, and the full checks passed without that manual step.
Role/ownership conflicts still fail transactionally. No new architectural decision
or expansion beyond accepted ADR-0019 was necessary.

Owner explicitly authorized story publication and merge/push to origin/develop.
Validated implementation will be committed on the story branch, then integrated
without rewriting history; stage/master and all review branches remain intact.
