# IOP-096 — Fixture drill-down

Status: Completed (fixture increment only). Authorized by the owner's request to work on IOP-096 within
the POC. Branch: `feature/IOP-096-fixture-drilldown`, created from clean develop.
Story: [IOP-096](../items/IOP-096-analytics-drilldown.md).

## Scope and dependencies

Extend IOP-097's existing opt-in fictional preview with sector → area → source
equipment → message navigation, selection restoration and explicit synthetic
import/line provenance. Keep the existing area shortcut. Reuse accepted
[filter semantics](../../architecture/adr/ADR-0023-poc-analytics-filters.md),
[equipment](../../product/source-equipment-analytics-poc.md) and
[area](../../product/area-analytics-poc.md) contracts. These dependencies are
already integrated and written in English; no translation is necessary.

IOP-094/095 specifications and IOP-097 fixture filters are available. Production
IOP storage, executable IOP-089 queries and ADR-0018 host activation still block
runtime acceptance. No endpoint, production aggregation, authorization mechanism,
physical asset registry or adjacent implementation is added. The five existing
fictional rows remain independent of the imported CSV oracle.

## Files and steps

1. Extend `apps/web/src/FixtureFilters.tsx` using the existing fixture selection;
   add per-dimension inspect actions and labelled navigation history. Show exact
   message tuples, scope, coverage, both measures and fictional provenance.
2. Add provenance to `apps/web/src/fixture-filters.ts`; preserve existing measures.
3. Extend `apps/web/test/FixtureFilters.spec.tsx` and add an e2e drill-down scenario
   for the full path, return, exclusions, zero and unclassified/repeated labels.
4. Update the story, backlog, delivery map and web README with delivered limits;
   record evidence and archive this plan when the fixture increment is complete.

## Validation

Run `npm run typecheck`, `npm test` and relevant Playwright checks. Check selection
restoration, full fixture contributors/totals, provenance and no business requests.
Check relative documentation links and `git diff --check`. Real pagination,
revision changes, failed reads and negative access remain runtime acceptance work;
the synchronous five-row fixture is not evidence for those scenarios.

## Closure

Keep the parent Blocked and runtime criteria unchecked. Commit the validated
fixture increment locally; publication requires separate owner authorization.

## Recorded evidence — 2026-09-26

- Node 24.21.0 and npm 10.9.2 from the existing `/tmp/iop-020-bin` tooling.
  Initial shell Node 20 failed ESM startup; sandboxed listeners failed with EPERM.
  Repeated with the supported runtime and permitted local listeners; no application
  workaround or dependency change was needed.
- `npm run typecheck`: passed for API, web and database tooling.
- `npm test`: passed; 9 secrets checks, 247 API tests, 22 web tests and 77 database
  configuration tests, plus builds and generated contract comparison.
- `npm run test:e2e --workspace @iop/web -- --grep 'fixture|fictional|invalid and empty'`:
  6 passed. Full keyboard drill-down/return at 375 and 1366 px, existing filters at
  640/768/1366 px and invalid/empty selection behavior. No business requests issued.
  Screenshot inspection at 375 px confirmed wrapping and readable controls without
  horizontal overflow. Browser outputs remain ignored under `apps/web/test-results/`.
- Component tests verify repeated line provenance, preserved exclusions and missing
  dates, direct/stepwise return, unclassified versus mapped labels, area-scoped
  equipment and matching zero records. Existing fixture arithmetic remains unchanged.
- Documentation: 210 relative Markdown links resolved; item/backlog Blocked status
  matched and `git diff --check` passed.
- Runtime pagination, revision races, failed business reads, database authorization
  and real CSV reconciliation were not tested or implemented in this UI increment.

The fixture increment is complete. Parent/item/backlog remain Blocked with runtime
criteria unchecked. Archive this plan and commit the scoped changes locally.
