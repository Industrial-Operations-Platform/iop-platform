# IOP-152 — POC completion and readiness

Status: Completed
Branch: `fix/IOP-152-poc-readiness`, from clean develop at `4ee268a`.
Item: [IOP-152](../items/IOP-152-poc-readiness.md).

## Steps and boundaries

1. Review current scope, visual identity, ADR-0032/0034, component contracts and
   actual source/test behavior; run the existing full POC verification.
2. Inspect the local Docker application with historical data on desktop and narrow
   screens. Exercise imports on disposable test storage; preserve operator history.
3. Fix verified gaps in the analysis application/adapters, shared components or
   local host/tooling as needed; record concrete findings before dependent edits.
   Keep identity tokens and accepted product/architecture decisions unchanged.
4. Add focused regressions for behavioral fixes; validate relevant layers and
   recheck actual Docker/browser operation. Update canonical delivery guidance only
   where affected; record measured evidence without claiming owner acceptance.
5. Complete this technical item, archive the plan and commit locally. Publication
   requires the repository's explicit approval convention.

Expected files: feature analysis adapters/application and tests, shared component
library/tests when defects are found, database/browser integration checks and this
item/plan/backlog/delivery status. No consulted story needs translation so far.

## Verified findings and corrective slice

Source inspection found three concrete behavior defects: invalid date ranges throw
synchronously before the report effect's rejection handler; the selected-measure bar
chart always renders frequency even when the server ranks by duration; preparation
rule/correction edits retain the prior saved confirmation and remain editable during
an outstanding save, allowing edits to be overwritten by its response.
Fix these in existing application/presentation adapters, with focused regressions
and a browser invalid-range/recovery check. Preserve palette and component styling.
The computer-use connector exposes no browser; use the repository's executable
browser checks and their rendered artifacts for visual verification.

## Completion evidence — 2026-09-27

Fixed all three findings within existing boundaries and shared controls. Invalid
ranges now reject through the asynchronous port and show the existing recoverable
alert. Selected-measure bars use the requested metric, unit and existing semantic
color. All preparation edits clear saved confirmation; controls disable during save
so its response cannot silently overwrite further edits. No palette, layout system,
API contract, persistence model or production data changed.

- Baseline `npm run test:poc` passed: tooling 18, API 277, web 31, database
  configuration 77, full PostgreSQL suite 173, preview Playwright 18 tests.
- Added regressions reproduced the date and chart failures before implementation.
  Final web suite: **35 tests / 12 suites passed**, including save/edit concurrency.
- Final `npm run typecheck` and `npm run test:database` passed: **173 tests / 12
  suites**, including actual browser uploads, duplicate handling, exact measures,
  invalid-date recovery, scoped denial and persistence. No operator database is used
  for test mutations. Build/contract checks pass; the existing bundle-size advisory
  remains, without claiming a performance certification.
- `npm run local:up` rebuilt the platform and verified **78 dates, 42,220 rows,
  frequency 212,411 and 56,391,042 exact seconds**. Zero dates imported, 78 unchanged.
  Web/API/database are healthy; web is available at `http://127.0.0.1:8080`.
- A read-only browser smoke check against that Docker stack verified all six report
  views with matching full totals, equipment filtering, independent grouping,
  duration selection, persistent reload and 390px layout. No page errors or horizontal
  document overflow. Manually inspected rendered overview/equipment and narrow import
  artifacts in `/private/tmp/iop152-visual/` and the disposable browser suite's
  `test-results/analytical-workspace/`; colors, cards and reusable controls are preserved.

The smoke harness initially awaited HTTP 200 although the reviewed report POST
contract returns 201. Corrected the harness and reran successfully; no API behavior
was changed to accommodate the check. The new UI test fixture initially omitted the
required totals key; corrected the fixture before its successful run.

IOP-152 completes technical readiness for the accepted local demonstration.
IOP-130 remains open for owner usefulness acceptance; login, Pareto and other deferred
features are not hidden blockers. Publication remains a separate approval step.
Final documentation/whitespace and staged-secret checks accompany the local commit.


Final artifact review found the active Daily/monthly button outside the narrow
navigation viewport after resizing from desktop. Extend the existing reusable
ViewNavigation to keep the selected button visible on selection/resize, preserving
styles and keyboard focus; verify geometry in the real browser before completion.

The reusable navigation now reveals the selected button on selection and resize,
without moving keyboard focus or changing tokens/CSS. Final web tests remain
35/35, web build passes, and the real PostgreSQL/browser journey passes 9/9 with
an explicit desktop-to-390px active-tab visibility assertion. Rebuilt only the
frontend container for this final correction; existing historical data is unchanged.

Final checks: 325 Markdown files have no broken local links/anchors; 151 indexed
items have unique IDs and matching statuses; staged whitespace and secret hygiene
passed (527 indexed files). The final Docker browser smoke check also passed after
the navigation change, with all six views and original historical totals intact.
