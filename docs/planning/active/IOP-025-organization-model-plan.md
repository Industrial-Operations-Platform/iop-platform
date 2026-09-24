# IOP-025 — Organization POC execution plan

Source: [permanent item](../items/IOP-025-organization-model.md).

## Status and authorization

Blocked on acceptance of Proposed ADR-0020; planned on 2026-09-24 under the owner's explicit request to work on IOP-025 within
the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-025-organization-model`, created from clean `develop` before edits.
Prepare the bounded bootstrap proposal first; dependent implementation requires
acceptance under AGENTS.md rule 5. No acceptance of ADR-0018 is inferred.

## Proposed implementation

Persist an explicitly configured organization with a stable opaque identity and
display name. Use versioned DDL and an explicit local insert-only seed command,
preserving forced RLS and leaving runtime access closed. Define the privileged
initial seed boundary in Proposed ADR-0020 before implementation. No site, user,
membership, grant, source, CRUD endpoint, lifecycle or administrative UI delivery.

## Files expected to change

Documentation increment:

- This active plan and a separate completed proposal record.
- `docs/planning/items/IOP-025-organization-model.md` and its backlog row.
- `docs/architecture/adr/ADR-0020-local-organization-bootstrap.md`.

After acceptance, refine exact paths before edits:

- New organization migration under `infra/database/migrations/` (existing migrations immutable).
- Seed command/configuration under `infra/database/`, existing CLI and relevant tests.
- `package.json`, local database README and optional one-shot Compose overlay/example
  configuration for the explicit command. No additional dependency is anticipated.
- Organization persistence notes in `docs/architecture/data-model.md` and
  `ARCHITECTURE.md`, only when implementation exists.

## Dependencies and decisions

- IOP-004 and IOP-005: completed design is integrated; ADR-0012/0013 define scope
  and isolation. They do not define initial privileged organization creation.
- IOP-019: completed tooling is integrated; node-pg-migrate, pg and role provisioning
  exist. Runtime currently has CONNECT only; preserve that baseline in this slice.
- ADR-0019 permits infrastructure pg usage, not application repository architecture.
- Proposed ADR-0020 will define the first module-owned schema and initial seed
  authority. Pause its dependent DDL/command work until accepted.
- Proposed ADR-0018 gates later runtime business access, not acceptance of this
  separately bounded seed. IOP-026/123 and other identity stories remain unactivated.

## Database changes

Propose a Platform Core organization table with opaque text primary scope identity,
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

- [ ] Organization persistence and seed acceptance verified with actual results.
- [ ] Relevant executable tests completed; limitations recorded.
- [ ] New bootstrap boundary explicitly accepted before dependent implementation.
- [ ] Item/backlog synchronized and finished implementation plan archived.

## Evidence and deviations

Initial read-only inspection found a clean develop checkout and no active plans.
Branch creation required sandbox escalation and succeeded before file edits.
No implementation or runtime evidence exists for IOP-025 yet.

Proposal prepared: [ADR-0020](../../architecture/adr/ADR-0020-local-organization-bootstrap.md).
The [completed documentation record](../completed/IOP-025-organization-proposal-plan.md)
preserves this increment. The active plan remains unfinished pending acceptance
and executable validation. Existing IOP-018 IDs use bounded opaque text; the
proposal preserves that contract instead of introducing a UUID conversion.
