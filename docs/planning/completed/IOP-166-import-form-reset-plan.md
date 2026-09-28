# IOP-166 — Execution plan

Status: Completed

Authorization: owner's reported import-form bug and request to fix it.
Branch: `fix/IOP-166-import-form-reset`, created from `develop`.
Scope: [IOP-166](../items/IOP-166-import-form-reset.md).

## Changes and steps

1. Update `apps/web/src/features/analysis/adapters/react/ImportWorkspace.tsx`
   to clear both browser selection and React state only for `succeeded` uploads.
   Retain the review and existing refresh/recovery behavior. Ownership stays in
   the analysis React adapter; no domain rules, ports or boundaries change.
2. Extend `apps/web/test/import-administration.spec.tsx` to verify successful
   reset with refreshed history, selection of the next file, genuine duplicates,
   and selection preservation for unsuccessful outcomes.
3. Synchronize this plan, the item and `docs/planning/backlog.md`; commit the fix.

## Validation and evidence

- The new regression failed before implementation: the native input still held
  one file after successful import and history refresh (expected zero).
- `npm test --workspace @iop/web -- --testPathPatterns import-administration`:
  9 tests passed after the fix, including unsuccessful outcomes and transport errors.
- `npm test --workspace @iop/web`: 13 suites, 61 tests passed, including shared
  presentation boundary checks.
- `npm run build --workspace @iop/web`: TypeScript validation and Vite build passed;
  Vite reported its existing large-chunk warning.
- `npm test --workspace @iop/api -- --testPathPatterns hexagonal-boundaries`:
  8 architecture checks passed, covering backend and frontend dependency direction.
- `git diff --check` and planning link, ID, status and completed-plan checks passed.
- Validation used the available Node 24.21.0 runtime via
  `PATH=/private/tmp/iop-147-bin:$PATH`. The initial shell Node 20 run could not
  load ECharts ESM and ran no tests; no dependency changes were needed.

The file input remounts after success to reset browser-owned selection alongside
React state. The review remains mounted and history still refreshes. No API,
database, authentication or deployment changes. Browser/Docker validation was not
run; behavior was verified through the React component tests.
