# IOP-168 — Operational Shift Handover implementation

Status: Completed locally, 2026-09-29. Owner approved ADR-0036 and implementation on 2026-09-29.
Branch: `feature/IOP-168-shift-handover`, from develop after authorized documentation
merge/push (`0922bff`). [Scope](../items/IOP-168-shift-handover.md),
[decision](../../architecture/adr/ADR-0036-shift-handover.md).

## Changes and steps

1. Close the accepted/published documentation plan; retain historical discovery.
2. Add framework-free entry rules and transactional use cases in API
   `modules/shift-handover/{domain,application}`, PostgreSQL adapters and scoped
   configured location lookup in Platform Core. Persist entries and append-only
   revisions with explicit equipment-reference identity and idempotency.
3. Add a database migration for module storage, forced RLS, scoped constraints,
   narrow runtime privileges and existing-profile handover assignments. Extend
   Users/RBAC fixed bundles, provisioning and profile changes. Add bounded scoped
   person lookup without exposing the administration directory.
4. Compose HTTP DTO/controller/runtime adapters; versioned OpenAPI and generated
   browser bindings. Operator-provided configuration supplies locations/categories;
   document setup and missing-configuration behavior. No analytics-derived assets.
5. Implement `features/shift-handover/{domain,application,adapters}` and compose it
   into Workspace navigation and independent Start highlights/sector context. Reuse
   shared components; add a generic textarea control. Include publish, history,
   matrix/meeting views, correction, follow-up/state and coordinator highlights.
6. Verify domain, authorization, actual PostgreSQL and HTTP behavior, generated
   contracts and browser journeys/layout. Synchronize docs and evidence, commit
   validated increments. Implementation publication needs separate authorization.

Expected files: new module/feature and tests; host runtime/application/controllers;
Users/RBAC authorization/profile and adapters as needed; database migrations/tests;
local setup/configuration scripts and guides; shared components; web host composition;
OpenAPI artifacts; architecture/module/data model summaries; item/backlog and plans.
No external integrations, corporate identity, workforce scheduling or formal closure.

## Validation

Run typecheck, npm test (including API, architecture and contract checks), real-role
PostgreSQL integration and relevant Playwright journeys. Verify all four profiles,
create/reload and durable history, correction conflicts, atomic revisions, duplicate
requests, equipment/location scoping, revoked access, protected fields, issue
transitions and carryover, highlight withdrawal, empty/error states and Start
without imports. Inspect desktop and narrow layouts. Record commands/results and
material limitations; do not claim unexecuted checks.

## Verification refinements

The full migration suite requires updating its known migration inventory/counts
and the offline analytics-maintenance allowlist for the added migration. Maintenance
continues to reset analytics only; handover history is independent. The existing
access browser fixture is updated to enter Administration before opening Users,
matching the already-delivered IOP-167 navigation rule (no runtime access change).
Shared CSS is stubbed by the web unit-test adapter; actual styles are verified in
Playwright. These are compatibility fixes within this implementation's validation.

Location configuration supports intermediate `location` nodes and cycle/parent
validation; department/area are presentation roles rather than fixed tree depths.
Stable date/creation/ID cursors preserve ordering for multiple updates on one day.

Documentation synchronization covers ARCHITECTURE, module/data-model summaries,
API/database/Docker guides, the component catalog, and a dedicated operational
guide. Operator location configuration remains explicit; an empty catalog still
allows site-wide information.

The owner explicitly selected the existing Halle/Bereich mapping as the initial
operational catalog. Validated and wrote the private ignored
`.local-platform/config/handover.json`: 5 departments, 89 areas, stable hashed IDs
and explicit sector-label mappings. This is a one-time approved configuration
snapshot, not automatic synchronization from analytics. No running containers
were rebuilt or restarted by this configuration write.

## Delivered behavior and evidence

- Published entries, exact unverified equipment references, full filtered journal,
  department matrix, category/department meeting groups and cross-date open issues.
- Attributed append-only revision history, corrections, follow-up, reassignment,
  resolution/reopening and explicit Start highlight/withdrawal. Creation retries
  are idempotent; stale revisions conflict. API and browser boundaries remain
  framework-independent inside domain/application layers.
- `npm run typecheck` and production build passed with Node 24.21.0. The existing
  Vite large-bundle advisory remains; no new deployment or code-splitting project.
- `npm test` passed (secret tooling 18, API 321, web 65, database configuration 77).
  Final API/web rerun after the last UI/query refinements passed. Generated browser
  contracts match the reviewed API artifact; architecture boundary tests pass.
- All 14 PostgreSQL suite definitions were exercised using disposable PostgreSQL
  17.6 containers. The initial complete run exposed migration-inventory and existing
  navigation-fixture expectations; after correction, the five affected regression
  suites passed (49 tests), and the final handover suite passed all 6 tests. The
  other eight suites passed in the full run. No unexecuted all-green aggregate run
  is claimed.
- Real-role handover tests cover existing-profile migration, new provisioning,
  demotion/revocation, foreign scopes/users, forced RLS/narrow grants, failed-write
  rollback, concurrent duplicate creates and stale revisions, fresh-pool persistence,
  cursor pages, pending carryover and highlight withdrawal with retained revisions.
- Playwright exercised all four profiles without analytical imports: publish,
  reload/search, equipment history, matrix, correction, follow-up, highlight links,
  resolution/withdrawal and earlier open issues. Forged authors, foreign assignees
  and contributor highlight writes were denied over HTTP. Desktop and 390px layout
  screenshots were inspected; narrow layout has no document-level horizontal
  overflow and there were no browser page errors. Artifacts: `/tmp/iop-168-browser`.
- `git diff --check` and local Markdown link/status review passed (14 documentation
  files, 298 local links). Secret-hygiene rules passed for all 66 changed/new paths
  and the existing 612-file index. Changes contain
  no credentials, private location configuration or application-generated artifacts.

## Closure and limits

IOP-168 is complete for this bounded increment; original M7 parents remain open.
Equipment identity is explicitly unverified; no canonical asset lifecycle, workforce
assignment, formal shift closure, Ultimo API or authoritative live equipment state
is claimed. Operator configuration preserves labels and IDs independently of
analytics. Published history is durable; unsent form drafts are not persisted.

Documentation acceptance was already merged/pushed to origin. This implementation
remains on its story branch for owner review. The running local Docker stack is
unchanged; the prepared private catalog will load when the operator rebuilds it.

Backend/storage/contracts are committed as `0dc8c81`; the following UI/evidence
commit completes the same story branch. No implementation merge or push occurred.
