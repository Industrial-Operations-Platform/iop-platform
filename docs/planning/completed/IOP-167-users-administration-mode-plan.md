# IOP-167 — Execution plan

Completed. Owner-authorized visibility correction; see the
[item](../items/IOP-167-users-administration-mode.md).
Branch: `fix/IOP-167-users-administration-mode`, created from clean `develop`.

## Changes and steps

1. In `apps/web/src/host/WorkspaceApp.tsx`, use the same administration-mode and
   existing permission condition for user navigation and panel rendering.
   Ownership stays in the cross-feature React workspace shell; server permission
   enforcement and access application/domain boundaries remain unchanged.
2. Extend `apps/web/test/workspace-readiness.spec.tsx` coverage for initial Start,
   analytical mode, entering user administration and returning to Taskforce view.
   Confirm missing user-management permission still hides the feature.
3. Synchronize this plan, permanent item and backlog, then commit locally.

## Validation and evidence

- `npm test --workspace @iop/web`: 13 suites and 63 tests passed, including
  architecture checks and navigation with/without user-management permission.
- `npm run build --workspace @iop/web`: type checking and production build passed;
  existing bundle-size warning remains.
- Used the existing Node 24.21.0 runtime with
  `PATH=/private/tmp/iop-147-bin:$PATH`. An initial shell Node 20 run passed the
  targeted tests but could not load ECharts ESM in another suite; the supported
  runtime passed the complete web suite.
- Documentation links, IDs, statuses and `git diff --check` verified.
- Navigation and content share one presentation condition. No API, permission,
  persistence or architectural-boundary changes. Docker was not rebuilt.

## Closure

Acceptance is complete; item/backlog synchronized and plan archived for review.
The owner subsequently approved publication and the Docker update; see the
[follow-up evidence](IOP-167-local-publication-plan.md).
