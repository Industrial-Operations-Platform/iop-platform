# IOP-025 — Organization POC execution plan

Source: [permanent item](../items/IOP-025-organization-model.md).

## Status and authorization

Completed POC slice on 2026-09-24 — owner accepted ADR-0020 and authorized this branch push on 2026-09-24; planned on 2026-09-24 under the owner's explicit request to work on IOP-025 within
the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-025-organization-model`, created from clean `develop` before edits.
The bounded bootstrap proposal is explicitly accepted under AGENTS.md rule 5. No acceptance of ADR-0018 is inferred.

## Implemented slice

Persist an explicitly configured organization with a stable opaque identity and
display name. Use versioned DDL and an explicit local insert-only seed command,
preserving forced RLS and leaving runtime access closed. The privileged
initial seed boundary follows Accepted ADR-0020. No site, user,
membership, grant, source, CRUD endpoint, lifecycle or administrative UI delivery.

## Files expected to change

Documentation increment:

- This active plan and a separate completed proposal record.
- `docs/planning/items/IOP-025-organization-model.md` and its backlog row.
- `docs/architecture/adr/ADR-0020-local-organization-bootstrap.md`.

Implementation paths confirmed before edits:

- `infra/database/migrations/20260924000000-organizations.sql` (existing migrations immutable).
- `infra/database/seed-organization.ts`, `infra/database/cli.ts`,
  `infra/database/test/organization.spec.cjs`, `configuration.spec.cjs` and
  `database.spec.cjs` (update migration history expectations).
- `package.json`, `infra/database/README.md`, `compose.database.yaml` and `.env.example`
  for the explicit one-shot command. No additional dependency is anticipated.
- Organization persistence notes in `docs/architecture/data-model.md` and
  `ARCHITECTURE.md`, only when implementation exists.

## Dependencies and decisions

- IOP-004 and IOP-005: completed design is integrated; ADR-0012/0013 define scope
  and isolation. They do not define initial privileged organization creation.
- IOP-019: completed tooling is integrated; node-pg-migrate, pg and role provisioning
  exist. Runtime currently has CONNECT only; preserve that baseline in this slice.
- ADR-0019 permits infrastructure pg usage, not application repository architecture.
- Accepted ADR-0020 defines the first module-owned schema and initial seed authority.
- Proposed ADR-0018 gates later runtime business access, not acceptance of this
  separately bounded seed. IOP-026/123 and other identity stories remain unactivated.

## Database changes

Implemented a Platform Core organization table with opaque text primary scope identity,
validated display name and forced RLS. Seed through explicit transaction-local
scope with migrator-only SELECT/INSERT policies; no runtime grants or policies.
No privileged seed function, RLS bypass or embedded customer data.

## API and UI changes

None. No API database connection, scope transport or authentication adapter.

## Tests and validation

For this documentation increment: check relative links, ID uniqueness, item/backlog
status parity, Proposed ADR status, POC boundaries and `git diff --check`.

After acceptance: `npm run typecheck`, `npm test`, `npm run test:database`, relevant
Compose configuration/build and disposable one-shot smoke checks. Use disposable
PostgreSQL 17.6 only; never reset the operator's database. Verify:

- Fresh migration/seed, second fresh database, unchanged rerun and provisioning rerun.
- Explicit ID/name validation; missing/invalid local configuration fails safely.
- Matching repeat is a no-op; same ID/different name is rejected without mutation.
- Concurrent matching seeds converge; conflicting seeds fail without partial writes.
- Missing/foreign transaction scope denies seed access; transaction completion and
  rollback clear scope; forced RLS is enabled and tested with actual role logins.
- Runtime cannot read, insert, update, delete, truncate, alter or assume elevated
  roles, even with a self-set organization selector. Migrator policies do not permit
  ordinary UPDATE/DELETE. No application authorization claim follows from these tests.
- Errors disclose no credentials, raw SQL or foreign organization details.

## Implementation steps

1. Review prerequisites and create this branch/plan before content changes.
2. Prepare ADR-0020 and synchronize the item/backlog; validate and commit the
   completed documentation increment while preserving this unfinished plan.
3. After explicit acceptance, refine implementation paths, add DDL and seed command.
4. Execute the scenarios, document actual evidence and limitations, commit the
   validated POC slice and move this plan to completed. Keep future parent scope open.

## Completion checklist

- [x] Organization persistence and seed acceptance verified with actual results.
- [x] Relevant executable tests completed; limitations recorded.
- [x] New bootstrap boundary explicitly accepted before dependent implementation.
- [x] Item/backlog synchronized and finished implementation plan archived.

## Evidence and deviations

Initial read-only inspection found a clean develop checkout and no active plans.
Branch creation required sandbox escalation and succeeded before file edits.
At proposal time no implementation or runtime evidence existed. The executed
results below supersede that limitation for the selected seed slice.

Proposal prepared: [ADR-0020](../../architecture/adr/ADR-0020-local-organization-bootstrap.md).
The [completed documentation record](../completed/IOP-025-organization-proposal-plan.md)
preserves the proposal increment. The implementation is now complete and this plan is archived. Existing IOP-018 IDs use bounded opaque text; the
proposal preserves that contract instead of introducing a UUID conversion.


## Executed validation and results

Runtime: Node 24.21.0 and npm 10.9.2 from the existing temporary toolchain
(`/private/tmp/iop-017-runtime/node_modules/.bin`), PostgreSQL 17.6 Testcontainers.

- `npm run typecheck`: passed.
- `npm test`: passed, API 59 tests, web 11 tests, database configuration 40 tests;
  build and browser contract check passed. Initial sandbox run denied test listener
  sockets with EPERM; the authorized rerun with socket access passed.
- `npm run test:database`: 3 suites, 54 tests passed. Includes fresh/recreated DB,
  migration rollback/locking, role checks, organization constraints and Unicode,
  actual migrator scoped SELECT/INSERT, missing/foreign scope denial, no ordinary
  UPDATE/DELETE, transaction commit/rollback cleanup, concurrent equal/conflicting
  seeds, runtime denials even with a forged selector, and safe CLI failures.
- Disposable Compose project `iop025-check-d5c68aab0a`: configuration and all three
  tooling image builds passed; provision/migrate/seed reported `2 applied` and
  `created`; rerun provision/migrate/seed reported `0 applied` and `unchanged`.
  Only that project's containers, network and test volume were removed afterward.
  The operator's existing local database was not modified.
- Documentation links/status parity and `git diff --check` passed.

No dependencies or applied migrations changed. The existing migration test's
expected history and failure-fixture ordering were updated for the new migration.
Names use Unicode code-point length, JavaScript trim whitespace and C0/C1 control
rejection, mirrored in SQL; unpaired JavaScript surrogates are rejected before
encoding. No scope expansion or new decision beyond Accepted ADR-0020.

The POC acceptance criteria are complete. The parent is Deferred for its explicitly
future CRUD/lifecycle/admin scope. There are no sites, users, grants or runtime
business authorization; ADR-0018 remains Proposed. Seed ownership/forced RLS checks
are not evidence of application pool isolation or site relationships.

The owner authorized push of `docs/IOP-025-organization-model` to `origin` in the
same response accepting ADR-0020. No merge, rebase or deployment is authorized.
