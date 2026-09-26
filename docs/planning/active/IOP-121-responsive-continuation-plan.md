# IOP-121 — Data-backed responsive validation continuation

Status: Blocked — data-backed analytical views, filters and contributing records
are not implemented.
Authorization: owner's 2026-09-26 request, limited to the POC.
Branch: `docs/IOP-121-responsive-continuation`, created from clean `develop` before edits.
Item: [IOP-121](../items/IOP-121-responsive-ui.md).

## Scope and dependencies

Follow the [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). The integrated
[presentation slice](../completed/IOP-121-responsive-ui-plan.md) already supplies
laptop/tablet reflow, reachable controls and orientation/keyboard checks. Preserve
its implementation and evidence; the remaining criterion requires delivered data.

Reviewed IOP-116 navigation and IOP-120 state previews are integrated. IOP-120's
runtime integration remains Blocked. Reviewed IOP-089 analytical queries and
IOP-094 equipment analytics remain Proposed; IOP-097 filters remain Blocked despite
Accepted ADR-0023. ADR-0018 is Accepted, but scoped runtime access still needs
implementation and validation. Older dependency references to Proposed ADR-0018
are historical. All reviewed story files are English; no translation is needed.
The current OpenAPI exposes only `/health`; the web views explicitly have no
business data connected. Do not implement these adjacent prerequisites here.

## Files and steps

1. Create this plan before other edits, then update only the IOP-121 item and
   backlog to reflect the concrete blocker and link this continuation.
2. Re-run existing responsive browser scenarios and check changed Markdown links,
   status consistency and whitespace. Record actual results and commit this
   documentation increment locally. No new architecture or application changes.
3. Resume once owning stories supply data-backed overview/detail views, filters,
   contributing records and validated scoped access. Refine this plan against
   delivered contracts before implementation; expected files are existing web
   view components, `apps/web/src/style.css`, `apps/web/e2e/responsive.spec.ts`
   and `apps/web/README.md`, plus story/backlog and this record.
4. Correct demonstrated layout issues within those views. Preserve selections,
   scope, units, coverage and metric limits, keeping controls reachable. No new
   metrics, import processing, administration, login or fabricated data to close
   the story.

## Validation and closure

Current review: build the existing hosts and run the five existing responsive
Playwright scenarios. This verifies the presentation baseline, not runtime data.
Check relative links in the three changed Markdown files and `git diff --check`.

On resumption, validate 1366×768, 768×1024, 1024×768 and 640×480 CSS viewports:
no page-wide horizontal scrolling; readable results/records and long labels;
controls at least 44px high; keyboard recovery; selection and focus preservation
through orientation changes; overview/detail navigation and delivered loading,
error, empty and recovery behavior. Use reconciled synthetic or authorized data
from the owning delivery, preserving coverage distinctions and contributing-record
traceability. Run `npm run typecheck`, `npm test` and `npm run test:e2e` after changes.

Keep the parent Blocked and this plan active until the remaining data-backed
criterion is verified. Then synchronize item/backlog and move this plan to
completed. Physical-device and full accessibility certification remain outside scope.

## Review evidence — 2026-09-26

- `npm run build` passed for API, web (including TypeScript) and database tooling.
- `npm run test:e2e --workspace @iop/web -- responsive.spec.ts`: all five existing
  Chromium scenarios passed in 33.2 seconds. All four viewports, preview states,
  long-text wrapping, touch controls, orientation and keyboard recovery passed.
  Used the existing Node/npm links in `/private/tmp/iop-121-bin`; the sandboxed
  server startup failed, then the approved local-server/browser run passed.
- OpenAPI and API controller inspection confirm `/health` is the only endpoint;
  current web source explicitly declares disconnected business data.
- Relative Markdown links in all three changed documents, matching Blocked
  statuses and `git diff --check` passed. No application changes were needed.

The documentation increment is complete. Runtime acceptance remains unverified;
this continuation stays active and the previous completed slice remains intact.
