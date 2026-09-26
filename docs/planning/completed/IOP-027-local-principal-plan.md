# IOP-027 — Local principal plan

Status: Completed — bounded POC principal slice validated on 2026-09-26. Authorized on 2026-09-26 by the owner's request to work on
[IOP-027](../items/IOP-027-user-model.md) within the POC boundary.
Branch: `docs/IOP-027-local-principal`, created from clean `develop` before edits.

## Scope and dependencies

Limit this slice to the stable active development principal required by Accepted
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md).
Full lifecycle, login, memberships, grants and runtime adapter implementation are
outside this story slice. A principal alone never authorizes business access.
IOP-007 sessions are deferred, not a prerequisite; IOP-025's organization seed is
integrated, but its privileged bootstrap authority excludes users. Existing site
storage is integrated too. No prerequisite branch needs merging.

ADR-0013 classifies global identities separately; ADR-0014 leaves detailed lookup
policies/schema for review. Prepare a Proposed decision for principal storage and
initial seed authority before migrations or code. Pause dependent implementation
until explicit acceptance; do not reopen the accepted local adapter decision.

## Files and steps

1. Translate the whole IOP-027 story and the Spanish IOP-007 dependency read during
   review. Preserve IOP-007's meaning/status/links; no functional changes there.
2. Add `docs/architecture/adr/ADR-0024-local-principal-bootstrap.md` with bounded
   storage, insert-only seed authority, failure behavior and verification contract.
3. Update IOP-027 and its backlog row with scope, dependencies and decision status.
   Link the proposal from `docs/planning/poc-delivery.md`; leave product scope intact.
4. Validate links, unique ID, statuses, English prose and diff hygiene; commit the
   documentation increment. Keep this plan active while the decision is pending.

## Validation and evidence

Planned: `git diff --check`, local Markdown target checks for all changed files,
manual ADR/status/scope consistency review and `git status --short --branch`.
No executable changes or runtime evidence are claimed by this proposal. After
acceptance, extend this plan with implementation files and concrete database/API
test commands before edits; use the verification scenarios in ADR-0024.


## Documentation increment evidence — 2026-09-26

Prepared ADR-0024 and synchronized IOP-027/backlog as Blocked. IOP-007 received
translation-only edits; its Deferred status and contracts are unchanged. IOP-025
was reviewed in English and left unchanged. Existing historical Proposed references
to ADR-0018 in dependency documentation do not override its current Accepted status.

`git diff --check` passed. Local Markdown file targets in all six changed documents
were checked; no missing targets. ADR-0024 has one file, remains Proposed and is
linked from item/plan/delivery map. Scope review confirms no login, lifecycle,
membership/grant implementation or runtime privileges. No application tests were
run for this documentation-only increment. The proposed command is not executable yet.

Implementation remains pending the new bootstrap authority decision. Keep the plan
in active/ and the parent open; a committed proposal is not accepted design or
completed POC principal delivery.


## Authorized implementation — 2026-09-26

The owner accepted ADR-0024 and publication of the reviewed documentation. The
proposal branch was fast-forward merged into develop and both were pushed to origin
at `07b280f`. Implementation branch: `feature/IOP-027-local-principal`, from develop.
This implementation requires separate publication approval when ready for review.

Before implementation, extend the planned files to:
- New user migration, `infra/database/seed-user.ts`, CLI dispatch, root npm script,
  optional Compose seed service and `.env.example` input.
- Database user integration tests and configuration unit tests; update existing
  migration-count assertions for the fourth migration.
- ADR-0024 acceptance, architecture/data-model/module status references relevant
  to the new identity storage, database guide, item/backlog/delivery map and this plan.

Implement the accepted exact-principal RLS and insert-only seed without runtime
grants. Verify inactive rejection, concurrent seeds, constraints, transaction
rollback/context cleanup, actual-role isolation and safe CLI output. Run
`npm run typecheck`, `npm test`, `npm run test:database`, and an isolated disposable
Compose build/provision/migrate/seed/rerun. Check documentation links and staged
secret hygiene. Record results, mark only this POC slice complete, leave lifecycle
Deferred, and move this plan to completed/ after successful validation.


## Implementation evidence and closure — 2026-09-26

Implemented the fourth migration and `seed-user` with native/npm/Compose entry
points. It stores only identity and active state; exact-principal forced RLS applies
to ordinary migrator SELECT/INSERT. Inactive identities fail without reactivation;
no runtime grant, membership/assignment, login, endpoint or UI was added. Existing
applied migrations were not changed. IOP-027/backlog remain Deferred for future
lifecycle scope; ADR-0024 acceptance and canonical documentation are synchronized.

Validation used Node 24.21.0/npm 10.9.2 from
`/private/tmp/iop-017-runtime/node_modules/.bin` and PostgreSQL 17.6:

- `npm run typecheck`: passed (API, web and database tooling).
- `npm test`: passed; 9 secrets checks, 105 API, 15 web and 72 database configuration
  tests, plus builds and browser contract verification. The initial sandbox run
  failed because Supertest could not listen; rerunning with local socket access
  passed without code changes.
- `npm run test:database`: 101 tests across five suites passed. User checks include
  fresh/recreated databases, matching and concurrent seeds, inactive rejection,
  exact-principal policies, constraints, failed transaction rollback and scope
  cleanup, actual-role access denial, role drift, safe CLI failures and native CLI
  reproduction. Runtime remains denied after repeated provisioning.
- Disposable Compose project `iop027-check-946643f749`: configuration and image build
  passed; provision/migrate reported 4 applied, user seed created; repeated
  provision/migrate reported 0 applied and seed unchanged. Its test containers,
  network and volume were removed; no operator dataset was targeted.
- `git diff --check` and local Markdown target/ADR/status consistency checks passed.

The completed seed supplies no evidence of authentication, runtime grant evaluation,
origin checks or pooled business isolation. Those remain later ADR-0018 delivery
work. No scope expansion or new architectural decision was needed after acceptance.
