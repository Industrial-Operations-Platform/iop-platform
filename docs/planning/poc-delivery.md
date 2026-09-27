# POC delivery status

The current local platform is implemented and technically verified through IOP-156,
with the IOP-158 administration refinement. Start with
`npm run local:up`; the [operator guide](../development/running-poc.md) owns execution
instructions and seed reconciliation. The [POC scope](../product/scope-poc.md) owns
product requirements. This page records delivery and outstanding acceptance.

## Delivered capability and evidence

| Capability | Implementation evidence |
| --- | --- |
| Persistent CSV import, original-file review, duplicate/error handling, exact analytical measures and scoped access | [IOP-147](completed/IOP-147-working-analytical-poc-plan.md) |
| Historical preparation, sector mapping, report templates and frontend/backend hexagonal boundaries | [IOP-148 workspace](completed/IOP-148-analytical-workspace-plan.md) |
| Local administrator account, executive-only KPIs, deferred Pareto and fixed visual identity | [IOP-148 refinement](completed/IOP-148-executive-overview-plan.md) |
| Normalized analytics catalogs and main Hitliste fact with physical sector FK | [IOP-148 relational model](completed/IOP-148-relational-hitliste-plan.md) |
| Separate Docker services, analytics-only backup seed and progressive collapsible filters | [IOP-149](items/IOP-149-local-stack-history.md) |
| Reusable frontend controls, surfaces and navigation | [IOP-150](completed/IOP-150-reusable-ui-plan.md) |
| Invalid-date recovery, selected-measure chart correctness and preparation save integrity and responsive active navigation; final Docker/history verification | [IOP-152](completed/IOP-152-poc-readiness-plan.md) |
| Monthly area ranking, daily matrix/trend and persistent administrator-selected Meldetext KPIs with goal/history comparisons | [IOP-153](completed/IOP-153-monthly-executive-plan.md) |
| Empty Start page, default Taskforce view, administrator tools, dropdown selectors and sortable per-file source rows | [IOP-154](completed/IOP-154-taskforce-administration-plan.md) |
| Sunday exclusion across reports and KPI averages, eligible chart calendars, preserved Sunday source files and complete seed verification | [IOP-155](completed/IOP-155-analysis-calendar-plan.md) |
| Aligned file-table headers and complete-file column filters reusing Taskforce controls | [IOP-156](completed/IOP-156-source-file-filters-plan.md) |
| Dedicated import administration, date confirmation, inspection outcomes and separate preparation/KPI settings without report duplication | [IOP-158](completed/IOP-158-import-administration-plan.md) |

Full-history totals come from persisted data, independently of the displayed page.
Original CSV fields and durations remain traceable. Source-reported frequency is
not a count of individual stored incidents; accumulated alarm duration is not plant
downtime. Missing reporting dates do not mean zero failures.

## Open acceptance

IOP-130 remains **In progress** for owner-observed usefulness. The earlier IOP-147
experience received negative feedback; IOP-148–154 implement the subsequent requested
corrections. Technical completion and publication do not substitute for that review.
See the [backlog](backlog.md) for the canonical item and all other task statuses.
Deferred administration, authentication and operational modules are not POC blockers.

## Historical evidence

Completed plans retain their validation results and limitations at the time of
execution. The [September 26 readiness audit](completed/IOP-146-poc-readiness-review.md)
describes the pre-integration baseline; its runtime blockers were resolved by IOP-147.
It is not an outstanding-work checklist. Native fixture/reset tools and `?preview=1`
remain optional developer support; current acceptance uses the real import/report
workflow described in the operator guide.
