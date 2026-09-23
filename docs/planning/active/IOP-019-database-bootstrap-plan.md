# IOP-019 — Local PostgreSQL bootstrap execution plan

Source: [permanent item](../items/IOP-019-database-bootstrap.md).

## Status and authorization

Blocked on owner acceptance of Proposed ADR-0019. The owner requested IOP-019 on 2026-09-23, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-019-database-bootstrap`, created from clean `develop` before
writing this plan. The two scope documents define the delivery boundary.

## Proposed implementation

Deliver only reproducible local PostgreSQL migration infrastructure and separation
of bootstrap, migration and runtime privileges. First prepare a reviewable migration
tooling ADR: the repository explicitly leaves that choice open. Pause dependent
implementation until accepted, as required by AGENTS.md and ADR-0007.
Do not activate organization/site seed, CSV persistence, login or adjacent stories.

## Files expected to change

This decision increment:
- This plan and a completed decision-preparation record after validation.
- `docs/planning/items/IOP-019-database-bootstrap.md` and `docs/planning/backlog.md`.
- `docs/architecture/adr/ADR-0019-local-database-migrations.md` (Proposed).

After acceptance, refine this plan before editing implementation files: anticipated
areas are `infra/database/`, npm manifests/lockfile, Compose and secret-free examples,
database tests and local startup documentation. No code edits in this increment.
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

No executable changes before decision acceptance. The proposed first bootstrap
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

- [ ] Migration decision accepted explicitly.
- [ ] Bootstrap implemented and reproducibility/privilege tests pass.
- [ ] Relevant checks pass with actual evidence.
- [ ] Item/backlog synchronized and implementation plan archived on completion.

## Evidence and deviations

Initial tree was clean on develop. Branch creation required a sandbox escalation
and succeeded before any file edit. No merge, push or runtime operation performed.
