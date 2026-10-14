# IOP-210 — Independent source access during profile bootstrap

Status: Completed. Branch `feature/IOP-210-operational-search-overview`, continuing
validated IOP-210 commit `f710818` under the owner's IOP-203 authorization.
Parent explicitly requests the finite existing source-read fallback; no grants change.

## Scope and steps

1. Update host `overview-composition.ts` to retrieve the current scoped profile
   through the first authorized permission in the finite existing read catalog.
   Catch only SiteAccessDeniedError; infrastructure failures propagate without retry
   through another source. Exact current profile/source permission checks remain.
2. Extend the actual host-factory PostgreSQL regression to revoke Workforce access
   while preserving independently granted Assets/Handover/Maintenance availability.
   Verify complete denial still fails closed; keep credentials/data synthetic.
3. Run focused overview/architecture tests, API typecheck and real PostgreSQL
   regression. Record evidence, move this plan to completed and commit this increment.

## Files and validation

API `host/overview-composition.ts`, owning regression tests and this execution record.
No shared runtime/RBAC catalogs, provider tables, manifests or generated schemas change.
Real PostgreSQL uses an isolated disposable container; root integrated factory changes
are applied by cherry-pick, never a merge or push from this branch.

## Evidence — 2026-10-14

- Overview/profile/controller/composition/architecture: 37 tests in 6 suites passed.
- API build and TypeScript checks passed.
- Real PostgreSQL: 7 checks passed, including Workforce-only revocation with
  independent Assets/Handover/Maintenance source availability, then complete
  revocation denial. Technician/current-profile and foreign-site checks remain.
- Unit transport boundary verifies first authorized permission, finite denial and
  immediate propagation of infrastructure errors without alternate-source retry.
- Full API regression: 439 tests in 35 suites passed. No grants/catalogs changed.
- Staged whitespace and secret-hygiene checks passed before commit.
