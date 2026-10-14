# IOP-202 — Platform quality review and selectable appearance

Status: Completed. Authorized by the owner's 2026-10-09 request.
Branch: `feature/IOP-202-platform-quality-theme`, created from clean `develop`
`8aabbd2e36cabcb42681d313c949835b5dde2649` (also `origin/develop`).
Scope: [permanent item](../items/IOP-202-platform-quality-theme.md).

## Changes and steps

1. Inventory modules, inspect shared UI/host/chart adapters and run baseline checks.
   Reconcile Completed backlog entries with permanent contexts and linked evidence;
   record the review in `docs/planning/reviews/IOP-202-platform-quality-review.md`.
2. Extend `apps/web/src/design/identity.ts` with semantic light/dark palettes.
   Browser appearance subscription/storage belongs in `design/`, composed through
   `main.tsx`, `IdentityRoot`, a reusable appearance selector and `AccountControl`.
   Retain existing React presentation-adapter patterns; no domain/API/schema change.
3. Refine shared `components.css`/`base.css`, field/control feedback, balanced metric
   alignment and bounded text. Keep forms/narratives readable; do not globally
   center or justify all text. Reuse shared table-prose behavior.
4. Make ECharts options/mounting consume the selected identity, including legends,
   axes, tooltips, heatmaps and zoom controls. Reuse palette generation, preserve
   analytical values/drill-down behavior and re-render on appearance changes.
   Source review found repeated linear lookups for scatter colors/monthly points and
   untranslated legend names beside translated series: use keyed maps and localized
   legend labels in the same chart adapter. Adjust muted/primary token contrast,
   separate introduction colors from workspace surfaces, and verify both palettes.
5. Add meaningful preference/contrast/chart and browser regression coverage.
   Update architecture, visual identity, component README, operator/testing guides,
   delivery map/backlog and the item with actual evidence. If the audit discovers a
   further necessary defect, record files/remedy here before editing them.
   The disposable database/browser suite exposed stale access expectations after
   completed IOP-201: `infra/database/test/analytical-poc.spec.cjs`,
   `transitional-access.spec.cjs` and `shift-handover.spec.cjs` must open the explicit
   Sign in dialog before entering credentials/selecting a native demo identity,
   including after logout. Update these real-browser checks to the delivered flow;
   do not change authentication behavior to satisfy obsolete tests.
   Both synthetic native identities retain their seeded import grants and open the
   existing Administration overview; correct obsolete Start assertions in that
   same test and verify the selected identity without changing its stored grants.
   Reuse `infra/database/test/browser-access.cjs` for that access interaction.
   The broad browser regression also exposed a missing Handover context response
   in `apps/web/e2e/administration-workforce-ui.spec.ts`; add the explicit empty
   unrelated-module fixture. In `infra/database/test/shift-handover.spec.cjs`, seed
   the 201-record capacity scenario sequentially instead of opening 201 concurrent
   authorization connections; retain its complete-result/capacity assertions.
   Update `apps/web/e2e/handover-navigation.spec.ts` palette assertions to the
   contrast-refined shared primary token; retain its layout/navigation checks.
   Scope `apps/web/e2e/maintenance-assets.spec.ts` blocked-reason assertions to the
   current narrative instead of also matching its retained history copy. Strengthen
   the light keyboard-focus token and verify 3:1 focus/surface contrast.
   Final screenshot review found the modal backdrop incorrectly reused text ink,
   producing a pale overlay in dark mode. Add a shared independent overlay token,
   then repeat the affected dialog/design/appearance checks and visual inspection.
   Chart screenshot inspection found a clipped vertical-axis title; align axis
   names into the plot, localize the monthly unit and verify SVG label bounds.

Owning boundaries: shared browser design and host composition; analytics chart
adapter owns ECharts options. API and database are audited without speculative
business refactors. Dependencies read: IOP-150, IOP-164, IOP-177, IOP-193, IOP-201;
all are already English, so no translation-only edits are needed.

## Validation and evidence

Validation uses installed Node 24.21.0/npm 10.9.2. Initial default-shell Node 20
failed in Testcontainers/Undici; sandbox-only runs could not bind API sockets or
access Docker. Repeats used the required Node and approved local test access.
Disposable databases preserve the existing operator installation.

| Check | Result |
| --- | --- |
| Clean `develop` snapshot (`git archive` in `/tmp`, installed dependency links), `npm test` | Passed: 18 tooling/secret tests, 418 API, 149 web and 77 database unit tests; contract/design/build checks passed |
| `npm run typecheck` | Passed for API, browser and database; repeated after implementation |
| Story `npm test` | Passed: 18 tooling/secret tests, 418 API, 157 web, 77 database units, contract/build/design checks |
| Final full browser Jest run | Passed: 30 suites / 158 tests, including added appearance-adapter boundary guard |
| Final affected appearance/chart/design/component Jest run | Passed: 4 suites / 23 tests after overlay/axis/focus refinements |
| Final web production build | Passed with mandatory design checks; existing >500kB bundle warning remains |
| PostgreSQL integration | All 20 suites / 263 tests passed across the initial 17 unaffected suites and targeted repeats of the 3 corrected suites; final real CSV/browser suite passed 9/9 |
| Broad Playwright run and affected-case repeats | All 55 original/new workspace journeys passed after fixing 10 affected cases; 2 added public dark-dialog cases also passed (57 unique journeys) |
| Final dialog/chart browser verification | Passed: 18/18 appearance, chart and public access journeys after overlay/title refinements |
| Documentation and Git diff | Markdown links resolve; Completed contexts/status/evidence markers agree; `git diff --check` passes |

The initial integration run exposed obsolete sign-in/landing assertions, unbounded
capacity-fixture setup and one transient Docker port-binding timeout. Preserve the
17 unaffected PostgreSQL suites; repeats passed Handover/access (36 tests) and the
analytical suite (9 tests). Broad browser failures were addressed through fixtures,
scoped selectors, updated contrast-token expectations and the correct native System
appearance transition. One startup case was affected by overlapping a web rebuild;
it passed with the finished build and restarted test servers.

Actual light/dark desktop/narrow captures cover Administration, imports, analysis,
Handover, Workforce, Maintenance, Assets and Users at 1440/1024/390px, plus account
menus, Sign in/About and real analytical charts. Public artwork stays unchanged;
dialogs dim correctly and chart titles remain within SVG bounds. Local QA captures
are retained in `apps/web/test-results/IOP-202-*.png` and selected copies in
`/tmp/iop202-qa/`. The [review register](../reviews/IOP-202-platform-quality-review.md)
checks all 146 historically Completed items without reasserting product acceptance.

## Closure

All requested technical criteria are verified. Closed-work traceability has no
missing contexts, mismatched completion markers or broken local documentation links.
The final appearance is reviewed at desktop/narrow sizes; current import/report,
authentication, Handover, Workforce, Maintenance and Assets regression layers pass.

The original branch/base is retained, with no merge, remote publication, deployment
or operator-data reset. Historical physical/product/release acceptance remains open
under its existing items. No Proposed ADR was accepted or new business boundary
introduced. Existing bundle size and large composition files are documented review
opportunities, not claims of a full manual proof/refactor of every source line.

Local implementation, regression and documentation commits complete this increment;
publication requires explicit owner permission and must keep the branch separate.
