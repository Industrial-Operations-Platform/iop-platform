# IOP-155 execution plan

Status: Completed
Branch: `feature/IOP-155-analysis-calendar`, from `develop` at `13561e7`.
Context: [IOP-155](../items/IOP-155-analysis-calendar.md).

## Scope and steps

1. Inject a validated analysis calendar through existing host composition. Configure
   Sunday exclusion for Hitliste; keep generic defaults unrestricted. Preserve
   complete projection checks, immutable facts and file-administration queries.
2. Apply the calendar consistently to modern and compatibility analytical reads,
   revisions, eligible imported dates, and KPI numerators/denominators.
3. Extend report metadata and generated contracts; reusable chart calendars consume
   the server policy. Clarify coverage using existing components and styles.
4. Add regression tests and update canonical scope/operator/query documentation.
   Run root tests, database integration, build/contract checks, local Docker smoke
   and documentation/secret checks. Record results and commit the completed story.

Expected files: API OIP domain/PostgreSQL queries, host composition/contracts;
frontend report models/chart and monthly presentation; API/web/database tests;
generated OpenAPI/bindings; product, API and operator docs; this story/plan/backlog.
Include scripts/local/initialize.cjs and scripts/demo.cjs: stored-data reconciliation
must explicitly read all retained dates, independently of the analytical calendar;
the Docker smoke exposed their dependency on previously unrestricted reports.
No changes to import acceptance, seed files, source-row browsing or design tokens.

## Outcome and validation

- Injected an immutable ISO-weekday calendar through host composition. Hitliste
  excludes Sunday; generic readers remain unrestricted. Modern and compatibility
  analytics apply the calendar to facts, date coverage, options and revisions.
  KPI totals and monthly/global denominators use eligible imported dates. Full
  projection completeness/version checks still cover excluded records.
- Reports carry excluded weekdays and eligible monthly day counts. Shared chart
  calendars omit excluded daily labels, preserving weekly/monthly anchors and
  missing eligible dates. A reusable React notice explains the policy with existing
  styling. No identity tokens, CSS, database schema or dependency changed.
- Offline seed/reference verification explicitly uses unrestricted scoped readers,
  retaining original-byte checks and complete projection reconciliation. Initial
  Docker validation exposed this dependency; after correction all 78 seed dates
  reconcile unchanged, including Sundays. Imports and administrator file/catalog
  access remain unchanged.
- `npm test`: API 286, frontend 46, database configuration 77 and script 18 tests
  passed; builds and generated browser contract check passed.
- Final `npm run test:database`: 12 suites / 176 tests passed in 101.9 seconds.
  Regression covers Saturday/Sunday/Monday, a Sunday-only month, imported zero
  measures, both KPI units/goals, legacy coverage/options, all aggregation periods,
  exact preserved Sunday bytes, admin file rows and excluded projection corruption.
  Calendar unit tests include leap months and DST dates; chart tests preserve gaps
  and month/week anchors. An overflow fixture moved its second sample from Sunday
  to Monday so it still exercises overflow. An initial container port-binding timeout
  did not recur when rerunning after Docker builds completed.
- `npm run local:up` succeeded: database/API/web healthy, 42,220 stored rows over
  78 dates, frequency 212,411 and 56,391,042 seconds; 0 imported, 78 unchanged.
  Independent SQL shows 69 eligible dates and 2,165 retained rows across 9 Sundays.
  July analysis: 15,024 rows, frequency 85,669, 20,257,376 seconds, 24 imported
  eligible dates out of 27; historical KPI denominator 69.
- Read-only Playwright check on the seeded Docker stack passed: report dates omit
  Sundays, monthly and historical KPI averages match an independent SQL oracle,
  Sunday 2026-07-05 remains browseable with all 26 rows and original-download link.
  Existing dropdowns, six report templates, administrator sorting/paging, mode
  switching and blank Start/reload pass. No browser errors or page overflow at
  1440/1024/768/390 widths. Executive and file screenshots reviewed; no settings
  saved or files imported during this local verification.
- Canonical scope, operator guide, API contract notes and delivery index synchronized.
  Final whitespace and script syntax checks passed; all 331 Markdown files have
  valid targets/anchors and secret hygiene passed for 554 indexed files. The
  existing build chunk-size advisory remains unchanged.

IOP-154 was published to origin/develop and its story branch under the owner's
approval before this story began. IOP-155 publication awaits its own approval.
IOP-130 owner usefulness acceptance remains open.
