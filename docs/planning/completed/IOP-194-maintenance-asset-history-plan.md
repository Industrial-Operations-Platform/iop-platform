# IOP-194 — Maintenance Management and Digital Asset Record execution

Status: Completed. Authorized by the owner's full-development request and
delegation of design choices on 2026-10-05. Branch:
`feature/IOP-194-maintenance-asset-history`, created from clean `develop`.
Scope and acceptance: [item](../items/IOP-194-maintenance-asset-history.md).

## Changes and steps

1. Implement Maintenance-owned pure rules/use cases/ports, PostgreSQL adapter,
   scoped migration, transport DTOs/controller and focused tests in
   `apps/api/src/modules/maintenance`, `apps/api/src/host/maintenance-*`,
   `apps/api/test` and `infra/database`.
2. Implement Asset-owned stable identity, exact aliases and digital-record
   orchestration in `apps/api/src/modules/assets`, with source read adapters
   inside Maintenance/Handover/OIP. Maintain source-specific access and honest
   date-only coverage. Add controller/contracts, migration and tests.
3. Extend the existing fixed permission catalog/provisioning and
   `scripts/local/bootstrap-access.cjs` for site reader,
   contributor/coordinator and administrator responsibilities; wire owner
   contracts in API host composition. Reuse existing transaction/revision
   patterns rather than introducing a new architectural pattern.
   Keep the existing offline analytical reset's exact migration allowlist current
   in `infra/database/demo-maintenance.ts`; preserve operational records and aliases.
   Update dependent migration-count/history assertions and wait for the loaded
   profile form in the existing asynchronous browser verification.
   Synchronize the existing Handover demo fixture with its current published
   name/latest-actor ports and stabilize existing browser assertions when async
   rendering is verified as the cause; do not change unrelated Handover behavior.
   Real database browser fixtures also follow the existing account creation dialog,
   account menu and Data administration navigation; their source/permission assertions
   remain intact. Production Access/Analysis behavior is outside this task's fixes.
4. Implement pure browser applications, HTTP and React adapters in
   `apps/web/src/features/maintenance` and `features/assets`. Compose into the
   existing shell/navigation; reuse shared components/tokens and localization.
   Add an Analysis-owned exact source-evidence destination using the existing
   source-row gateway for digital-record navigation.
5. Regenerate OpenAPI/browser bindings. Update `ARCHITECTURE.md`, module/data
   model, glossary, roadmap, product/development guides and requested stories.
   Translate only Spanish story files read for this work: IOP-068–072, 074–075,
   084–088, and dependencies IOP-032/037/040/044. Preserve dependency statuses.
6. Validate, review clean code/boundaries and actual desktop/narrow rendering,
   record evidence, synchronize status, archive plan and commit logical increments.

## Design and review boundaries

M8 and M10 are one new umbrella story; their original items reference its evidence.
M9 and full M4 remain outside scope. Module-owned immutable revisions satisfy local
change history without claiming broader Audit infrastructure. Stable asset identity
requires manual registration and exact scoped alias evidence; rebuildable analytics
identifiers never become asset identity. A filtered timeline is a read projection,
not a new event owner. User-authorized delegated design decisions do not accept
unrelated Proposed ADRs. Existing branch review work is preserved.

Maintenance: Open → In progress/Blocked/Done; progress/blocked may resume or finish;
Done may reopen with a reason. Done requires an outcome, Blocked a reason. Current
grants and record ownership control mutations; revisions serialize stale writes.
Priorities and locations are configured scoped data. Administrator owns configuration
and asset/alias validation, coordinators own reassignment, contributors own work
authored by/assigned to them. All four profiles receive operational read access;
analytical timeline evidence still requires `analytics.read`.

## Validation and evidence

Pinned Node 24.21.0/npm 10.9.2; local HTTP listeners and Docker used only isolated
synthetic fixtures. No operator installation was migrated or activated.

- `npm run typecheck`: API, web and database infrastructure passed.
- `npm run openapi` and `npm run contract --workspace @iop/web`: passed;
  11 additive routes and 34 schemas, with no removed/changed existing path or
  schema definitions. Browser contract consistency passed in `npm test`.
- `npm test`: 384 API tests in 27 suites, 115 web tests in 26 suites,
  77 infrastructure configuration tests and 18 secrets-tool tests passed.
  The final coverage-display refinement subsequently passed the entire web suite:
  118 tests in 26 suites; production build/type/design guards passed again.
- `npm run test:e2e`: all 25 browser journeys passed, including desktop/narrow
  layouts and existing platform journeys. After the final coverage refinement,
  `npm run test:e2e --workspace @iop/web -- maintenance-assets.spec.ts` passed
  all six Maintenance/Asset journeys again.
- Final `npm run test:database`: all 225 tests in 17 suites passed.
- Documentation validation: 33 revised/new Markdown files, 497 local links with
  no missing targets; all 14 delivered item/backlog statuses and linked IDs match.
  Dependency translations retain their Proposed statuses. Whitespace and staged
  secrets checks passed; the active plan is archived here.
- Ten generated `apps/web/test-results/IOP-194-*.png` captures cover board,
  work details, asset timeline/form and priority configuration at 1440/390 px.
  Visual inspection confirmed shared identity, readable forms and bounded controls.
  Browser fixture tests cover all four profile presentations, retry/conflict states,
  retained navigation, source filters and pagination; they do not claim live source data.

Real PostgreSQL cases cover both modules' immutable revisions, atomic rollback,
restart durability, caller identity/content/reason idempotency, competing writes,
reference scope/FKs/RLS, logical retirement, exact aliases, filtered counts/pages,
current grant revocation and source-owner authorization. The asset integration
fixture uses actual Handover/Maintenance records and CSV publication to verify
original import/physical-line identity, frequency and exact accumulated seconds.
A failed SQL source aborts safely and a fresh request recovers on the same clean
pooled connection; non-database source faults report unavailable coverage.

Broad validation identified stale dependency fixtures: migration counts/history
and the reset version allowlist, current owner name/latest-actor ports, account
creation/menu and Data administration navigation, and asynchronous style/logout
assertions. These compatibility corrections retain original behavior assertions;
production Access/Handover/Analysis flows were not changed by the fixture repairs.
The real offline analytical reset regression retains all operational identities,
aliases, work/settings revisions, Workforce/Handover evidence and scoped profiles.

## Delivery boundaries

Manual registration and exact current aliases remain deliberate operator work.
The registry admits 500 assets and 30 aliases per asset; timeline windows span at
most 366 calendar dates with 25-row pages. Dates/aggregates never fabricate fault
instants or downtime. M9, full M4, general Audit infrastructure and automatic event
mapping remain deferred. Owner product acceptance and branch integration remain
pending review. Local validated commits are automatic; no merge/push/deploy is
part of this execution.
