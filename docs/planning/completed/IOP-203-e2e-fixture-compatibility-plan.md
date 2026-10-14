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

### Follow-up scope recorded before edits

Root's complete final gate passed API (509 tests), web (192 tests) and all 31
PostgreSQL suites (319 tests). Browser tests passed 56 of 57; the 390px Maintenance
navigation test at `maintenance-assets.spec.ts:142` selected the same blocked reason
both in the current detail and retained revision history. The initial focused run
passed because asynchronous history completion had not always preceded that check.

Root assigns a narrow test-only correction: inspect the current detail's existing
semantic boundary and scope the same exact text assertion there. Preserve all text,
history and assertions; no positional first/nth match or application/build edits.
The only added code scope is `apps/web/e2e/maintenance-assets.spec.ts`. Validate the
affected navigation repeatedly and then all 57 E2E tests against the existing build
without concurrent servers. Root owns final documentation/commit. Actual plant data
remains unchanged.

The current snapshot is directly inside `section.iop-panel`; retained snapshots are
nested inside native revision `<details>` elements. Use that existing boundary.
Also await and assert the retained revision's exact blocked-reason text so the
regression always checks the current detail while its duplicate history exists,
rather than depending on which response finishes first.

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

The follow-up changes only the final persisted blocked-reason check in
`maintenance-assets.spec.ts`: it first verifies one retained history paragraph with
the original exact text, then verifies the same text in the current detail's direct
panel content. Historical and current content coexist before the assertion, making
the former strict-mode failure deterministic and proving the corrected boundary.
Every existing assertion and text remains; no production or fixture response changed.

- `npm run test:e2e --workspace=@iop/web -- maintenance-assets.spec.ts --grep 'Maintenance and digital asset record navigation' --repeat-each=5`:
  **10 passed**, 34.3 seconds, for the final history-present regression (five 1440px
  and five 390px executions).
- `npm run test:e2e --workspace=@iop/web`: **all 57 passed**, 1.7 minutes, exit zero,
  against the existing build. This includes the previously failing 390px case and
  all historical appearance, Handover, Maintenance, Asset, analysis, landing and
  workspace-startup cases.
- Final `git diff --check`: passed. The API and database final phases were not rerun;
  root's previously passing API/web/PostgreSQL evidence remains applicable because
  this correction changes only a browser-test selector and assertion.

Root owns delivery documentation and commit. No root files were committed by this
subtask; all unrelated root changes are preserved. This evidence closes the bounded
fixture compatibility increment and completes the remaining browser validation for
root's full final gate. Parent IOP-203 closure remains root-owned.
