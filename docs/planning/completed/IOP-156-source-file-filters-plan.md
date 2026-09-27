# IOP-156 execution plan

Status: Completed
Branch: `feature/IOP-156-source-file-filters`, from develop at `9ca8a37`.
Context: [IOP-156](../items/IOP-156-source-file-filters.md).

## Steps and expected files

1. Extend bounded source-row filter contracts/domain validation and PostgreSQL
   adapter; return file-wide suggestions (up to 200 per field) and total file count.
   Apply parameterized predicates before page/sort; keep full-file integrity checks.
2. Extract reusable value-filter presentation from ReportFilters and compose it in
   source-file filters with the existing form/disclosure/field/button components.
   Align shared table headers without changing identity or removing button hit areas.
3. Cover filters, file switches, pagination/sorting, empty state, authorization,
   special values and Sunday records. Update generated API/browser contracts.
4. Run root and database tests, local Docker/browser checks including measured header
   alignment and responsive filters, then synchronize concise docs and commit.

Files: API source-rows domain, PostgreSQL data explorer, host DTOs/tests; web report
and file filters, shared table CSS, models/tests; generated contracts; database tests;
component docs, scope/operator/API docs and this story/backlog/delivery record.
No migration, new dependency or new architectural pattern.

## Outcome and validation

- Added bounded, literal per-column filters before server sorting/pagination, whole
  file counts and up to 200 suggestions per column. Text retains source punctuation
  and leading zeroes; numeric filters validate finite nonnegative values. Duration
  filtering matches displayed minutes rounded to two decimals. Full-file projection
  integrity and existing scope/permissions still apply, including Sunday files.
- Extracted `ValueFilter` into the shared presentation library, used by Taskforce
  `ReportFilters` and the new `SourceFileFilters`. Unique native suggestion/hint IDs,
  existing disclosure/form/actions and wrapping fields retain the project identity.
  Filters survive sort/page actions, reset on file switches and reset pagination on
  apply/clear. Matching/total counts and empty-result guidance are visible.
- Shared table headings vertically center plain and interactive labels; sortable
  buttons retain their 44px hit areas. Visual review caught a long German filter
  label overlapping its neighbor on mobile; the shared value control now wraps labels.
- `npm test` passed: API 287, frontend 47, database configuration 77 and scripts 18
  tests; builds and generated contract checks passed. After the visual correction,
  frontend tests passed again (14 suites / 47 tests) and the Docker web build passed.
- `npm run test:database` passed: 12 suites / 176 tests, 100.9 seconds. Regression
  verifies nine simultaneous criteria locate line 236 beyond the first page and
  beyond 200 message suggestions; combined filters, page three, full-file suggestions,
  empty matches, numeric minutes and SQL-like literal text. Existing authorization,
  revision, Sunday evidence and projection checks remain passing.
- `npm run local:up` and the final web-only rebuild passed. The seed reconciled
  42,220 rows over 78 dates, frequency 212,411 and 56,391,042 exact seconds, with
  0 imported and 78 unchanged dates. No local history or KPI settings were changed.
- Real read-only Playwright checks passed on Docker: all nine header text centers
  align exactly (0px spread); nine filters locate line 57 from page two in a 681-row
  file; sorting and pagination retain filters; clear, no-match and file-switch behavior
  work; a Sunday file retains 26 browsable rows. The shared Taskforce Bereich filter
  still works. No browser errors or page overflow at 1440/1024/768/390 widths. Desktop
  and mobile screenshots reviewed; long labels stay within their columns.
- Canonical scope, operator/API guide and component reference synchronized. Final
  whitespace checks passed; all 333 Markdown files have valid targets/anchors,
  and secret hygiene passed for 558 indexed files.
  No migration, new dependency or identity-token change; existing chunk-size advisory
  remains unchanged.

IOP-155 was published to origin/develop and its story branch under the approval
received with this request. IOP-156 publication awaits its own approval.
