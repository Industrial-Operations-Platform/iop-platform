# IOP-203 — Existing browser fixture compatibility

## Scope and branch

Completed bounded fixture increment on the root-owned
`feature/IOP-203-platform-completion` branch.
The owner-delegated [item](../items/IOP-203-platform-completion.md) and Accepted
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md) authorize
combined verification. Root explicitly assigns these fixture edits; root creates
the final commit. No application, generated contract, build or real plant data edits.

The existing full E2E log `/private/tmp/iop-203-final-e2e.log` shows historical
strict route fixtures reject the new background `/api/v1/overview/context` request.
Actual local application UI QA passes; these failures concern test contract coverage.

## Files and steps

- Read generated OverviewContext DTO and each existing fixture's session/profile,
  source permissions, locations/time zone and fixed dates.
- Add explicit exact overview-context response branches in affected files under
  `apps/web/e2e/`, using a reviewed typed fixture helper when it avoids duplication.
- Keep unknown-route failures, all existing assertions and mocked source semantics.
  No wildcard acceptance, real API passthrough or invented physical source data.
- Run representative desktop/narrow/profile/landing/appearance/analysis fixtures
  against the existing build with purpose-built Playwright. Root reruns the full E2E
  suite afterward. Record actual failures/results and additional justified fixtures.

## Evidence and handoff

Added the typed `apps/web/e2e/overview-fixture.ts` helper and exact context branches
in administration-workforce-ui, administrator-workspace, daily-handover,
handover-category-workflows, handover-navigation, maintenance-assets-fixture,
month-comparison, operational-shell, personal-operational-workflows,
platform-landing and start-overview. Context fields come from the generated DTO;
each caller keeps its existing locations, time zone, date and source authorization.
The helper checks the exact route, POST method and empty JSON body. Existing unknown
route failures and assertions are retained. No application data was changed.

- `npm run typecheck --workspace=@iop/web`: passed.
- `npm run test:e2e --workspace=@iop/web -- administrator-workspace.spec.ts maintenance-assets.spec.ts platform-landing.spec.ts month-comparison.spec.ts`:
  **23 passed**, 36.0 seconds, against the existing build on 2026-10-14. Coverage
  includes desktop/narrow administration, role visibility, maintenance and Digital
  Asset Record, authentication/recovery, focus/reduced motion and dark analytical
  comparison plots.
- `git diff --check`: passed. Manual diff review confirms that no existing assertion
  was removed and no unknown request became an accepted wildcard or API passthrough.
- The focused runner exited successfully and released its API and preview servers;
  no listeners remained on ports 3000 or 4173 before root's complete `test:poc` run.

Root owns the full final gate and commit. No root files were committed by this
subtask; all unrelated root changes are preserved. This evidence closes the bounded
fixture compatibility increment, while the parent IOP-203 remains open until its
complete validation and delivery documentation finish.
