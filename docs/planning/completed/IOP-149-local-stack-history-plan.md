# IOP-149 execution plan

Status: Completed
Branch: `feature/IOP-149-local-stack-history`, from published develop `7286674`.

## Scope and decisions

Implement the owner's local Docker stack, analytics backup seed and progressive
report filter request. The owner explicitly selected separate frontend/backend/
database containers and reusable application composition, superseding the native-only
local execution restriction for this bounded installation. Preserve local-only
identity, scoped permissions, immutable source facts and existing installations.

## Files and steps

1. Record the local container decision in ADR-0034 and update architecture guidance.
2. Move API composition out of `src/demo` and rename host concepts/imports; preserve
   compatibility for existing local launchers and HTTP contracts where needed.
3. Add a local Compose configuration, private configuration generator and explicit
   provisioning/seed tooling. Parse known COPY data from the backup without executing
   its SQL; join analytics facts to catalogs, derive dated CSV inputs through the
   existing importer, retain seed provenance, and reconcile all dates/measures.
4. Implement framework-free template/filter policies and React collapsible controls,
   independent grouping and consistent drill-down. Keep visual identity unchanged.
5. Update operator guidance, tests and delivery map with actual execution evidence.

## Validation

Run unit/build/contract checks, API tests, actual-role database checks and browser
checks. Exercise Docker startup, backup seed totals, sector classification, restart
idempotence, persisted uploads and progressive filter visibility/selection. Verify
private data exclusion, documentation links and clean committed state. Prior IOP-148
was explicitly approved and published to origin; new IOP-149 publication is separate.


## Delivered and verified

- Published explicitly approved IOP-148 (`7286674`) to develop and its story branch
  on origin, then implemented IOP-149 on its own branch.
- Added `compose.platform.yaml`, three runtime containers and a temporary setup
  container. `local:up` builds, provisions, checks/imports seed and starts the hosts;
  `local:stop` preserves the dedicated volume. Runtime receives no migrator or
  bootstrap password, and API/database have no published host ports.
- Moved API composition from `src/demo` to `src/host`, renamed runtime/controller
  types and moved the frontend HTTP adapter to `api/platform.ts`. Existing local
  identity HTTP routes remain compatible. Business domain/ports remain inward-owned.
- Extracted the authorized archive without executing SQL. Verified 42,220 analytics
  rows, 78 dates, frequency 212,411 and 56,391,042 seconds (939,850.7 minutes).
  Repeated starts verified 0 new dates and 78 unchanged; full database stop/start
  preserved totals. Original public-only rows remain excluded. Five mapped sectors
  are present; 474 rows with frequency 707 retain the explicit unclassified sector.
- Private manifest binds archive digest, generated UTF-16LE daily inputs, hashes,
  exact per-day measures and original analytics/source IDs. Preflight detects
  conflicting dates before publishing. A final single report snapshot verifies
  every seeded day and complete projection coverage. Later uploads are preserved.
- Implemented progressive, collapsed date/location/equipment/error controls and
  independent grouping. Broader views discard incompatible constraints and restore
  their visible default measure/period; drill-down opens an applicable detail view.
  Shared design tokens and executive-only KPI cards are unchanged.

## Evidence

- `npm run typecheck`: passed API, web and database types.
- `npm test`: passed 18 script checks, 277 API tests, 28 frontend tests, 77 database
  configuration tests, both builds and generated contract comparison. HTTP tests
  needed permission to bind local ports; the initial sandbox-only run was not used
  as evidence. Regenerated OpenAPI/browser types after host type renaming.
- Actual PostgreSQL suites: reporting workspace 10/10 and analytical POC 9/9,
  including real browser imports, history, permissions, projection and reset.
  Updated assertions exercise date-only views, progressive filters, independent
  grouping and removal of stale constraints. A missing exact accessible select
  label found by the first browser run was corrected and the suite passed.
- Local seed tests: 5/5 for idempotence, preserving later uploads, preflight conflict
  and damaged-file refusal, failed-import stopping and exact stored reconciliation.
- Docker Desktop: fresh dedicated volume, first seed, repeated initialization and
  full three-service stop/start passed. Live browser verified database totals,
  six sectors including fallback, filters/grouping, reload, no JavaScript errors
  and 390px responsive layout. Desktop/mobile screenshots reviewed locally.
- Initial seed reconciliation omitted the legacy query revision and stopped after
  one committed date. Fixed the verification, resumed without duplication, then
  replaced repeated legacy queries with one report snapshot for faster restarts.
- Source SQL extraction was removed after verification; private seed/configuration
  stay ignored. No backup data or credentials are included in images or commits.

## Limits and handoff

Local identity remains a development adapter. This is not production authentication
or a backup restore over another installation. Seed publication is atomic per day;
completed days survive a later failure and are verified on rerun. The existing
1,000-attempt/256-MiB retention limits remain. Earlier native installations and
health-only Compose configuration remain available separately. Wider pilot usefulness
is still tracked in IOP-130. Publication of this new story requires its own approval.
