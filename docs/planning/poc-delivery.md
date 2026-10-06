# Local platform delivery status

Reviewed on 2026-10-06 under [IOP-195](items/IOP-195-development-status.md).
The local platform includes Data Analysis, authentication/administration, Shift
Handover, Workforce, Maintenance and Digital Asset Record through IOP-194. Start with
`npm run local:up`; the [operator guide](../development/running-poc.md) owns execution
instructions and seed reconciliation. The [POC scope](../product/scope-poc.md) owns
product requirements. This page records delivery and outstanding acceptance.

## Delivered capability and evidence

| Capability | Implementation evidence |
| --- | --- |
| Persistent CSV import, original-file review, duplicate/error handling, exact analytical measures and scoped access | [IOP-147](completed/IOP-147-working-analytical-poc-plan.md) |
| Historical preparation, sector mapping, report templates and frontend/backend hexagonal boundaries | [IOP-148 workspace](completed/IOP-148-analytical-workspace-plan.md) |
| Local administrator account, executive-only KPIs and fixed visual identity; original Pareto deferral superseded by IOP-163 below | [IOP-148 refinement](completed/IOP-148-executive-overview-plan.md) |
| Normalized analytics catalogs and main Hitliste fact with physical sector FK | [IOP-148 relational model](completed/IOP-148-relational-hitliste-plan.md) |
| Separate Docker services, analytics-only backup seed and progressive collapsible filters | [IOP-149](items/IOP-149-local-stack-history.md) |
| Reusable frontend controls, surfaces and navigation | [IOP-150](completed/IOP-150-reusable-ui-plan.md) |
| Invalid-date recovery, selected-measure chart correctness and preparation save integrity and responsive active navigation; final Docker/history verification | [IOP-152](completed/IOP-152-poc-readiness-plan.md) |
| Monthly area ranking, daily matrix/trend and persistent administrator-selected Meldetext KPIs with goal/history comparisons | [IOP-153](completed/IOP-153-monthly-executive-plan.md) |
| Empty Start page, default Taskforce view, administrator tools, dropdown selectors and sortable per-file source rows | [IOP-154](completed/IOP-154-taskforce-administration-plan.md) |
| Sunday exclusion across reports and KPI averages, eligible chart calendars, preserved Sunday source files and complete seed verification | [IOP-155](completed/IOP-155-analysis-calendar-plan.md) |
| Aligned file-table headers and complete-file column filters reusing Taskforce controls | [IOP-156](completed/IOP-156-source-file-filters-plan.md) |
| Dependent file-filter choices, automatic descendant clearing and validated draft previews | [IOP-157](completed/IOP-157-dependent-file-filters-plan.md) |
| Dedicated import administration, date confirmation, inspection outcomes and separate preparation/KPI settings without report duplication | [IOP-158](completed/IOP-158-import-administration-plan.md) |
| Shared monthly filters, overlaid comparison, time controls and selected-month component Pareto | [IOP-160](completed/IOP-160-month-comparison-plan.md), [IOP-161](completed/IOP-161-trend-time-controls-plan.md), [IOP-162](completed/IOP-162-shared-month-filters-plan.md), [IOP-163](completed/IOP-163-component-pareto-plan.md) |
| Hexagonal cleanup and current connected workspace | [IOP-164](completed/IOP-164-hexagonal-cleanup-plan.md) |
| Individual local login, four-profile administration, current grants and retained identities | [IOP-165 access](completed/IOP-165-transitional-access-plan.md), [IOP-171 permissions](completed/IOP-171-technician-access-plan.md) |
| Handover journal, configured categories, issues, revisions, matrices and meeting canvas | [IOP-168](completed/IOP-168-shift-handover-implementation-plan.md), [IOP-169](completed/IOP-169-handover-board-plan.md), [meeting canvas](completed/IOP-169-meeting-canvas-plan.md) |
| Workforce schedules/imports, teams, assignments, floating duties and history; manual weekly planning | [IOP-184](completed/IOP-184-m6-workforce-plan.md), [weekly schedules](completed/IOP-184-weekly-schedules-plan.md) |
| Daily Handover, contextual navigation, current names, personal Start/activity and shared identity refinements | [IOP-188](completed/IOP-188-user-directory-refinements-plan.md), [IOP-190](completed/IOP-190-daily-handover-plan.md), [IOP-192](completed/IOP-192-operational-cards-account-plan.md), [IOP-193](completed/IOP-193-compact-account-pending-matrix-plan.md) |
| M8 work lifecycle and M10 stable registry/source-authorized history | [IOP-194 implementation](completed/IOP-194-maintenance-asset-history-plan.md) |
| Reviewed repair scope, assignment activity and atomic included-Handover issue resolution | [IOP-194 linked workflow](completed/IOP-194-linked-maintenance-plan.md) |
| Explicit synthetic assets/work, exact scoped catalog and manual component/group metadata | [IOP-194 fixtures](completed/IOP-194-demo-data-plan.md), [catalog review](completed/IOP-194-equipment-catalog-refinement-plan.md) |
| Owner-authorized Maintenance/Assets integration into develop and publication to origin | [IOP-194 publication](completed/IOP-194-publication-integration-plan.md) |
| Personal Start, assignment statistics, focused Maintenance status/completion and daily Information/media/person notices | [IOP-196](completed/IOP-196-personal-operational-workflows-plan.md) |

Full-history totals come from persisted data, independently of the displayed page.
Original CSV fields and durations remain traceable. Source-reported frequency is
not a count of individual stored incidents; accumulated alarm duration is not plant
downtime. Missing reporting dates do not mean zero failures.

## Open acceptance

On 2026-09-27 the owner accepted the revised charts as **Data Analysis v1** and
requested the next operational home/user increment under [IOP-165](items/IOP-165-operational-home.md).
The earlier IOP-147 negative feedback remains historical evidence. IOP-130 stays
**In progress** for consolidation of its measurement criteria, not missing usefulness
feedback. Component acceptance does not publish or release the whole platform.
See the [backlog](backlog.md) for the canonical item and all other task statuses.
Temporary local authentication and four-profile administration are implemented
through IOP-165 under accepted ADR-0035. Other deferred capabilities are not
automatically v1 analytical blockers. Start composes authorized analytical,
Handover, Workforce and Maintenance information; Technician profiles have
operational views without analytical access.

IOP-194 integration/publication completed on 2026-10-06. Further owner functional
testing, physical verification and the missing-component survey remain pending.
There is no whole-platform release, remote/shared deployment or stage/master
promotion implied by implementation or publication.

## Remaining development

The [roadmap](../../ROADMAP.md#remaining-development-and-validation) consolidates
the remaining outcomes and IDs; the [backlog](backlog.md) owns mirrored statuses.
Full asset hierarchy/types/metadata/survey, ingestion-time canonical mapping,
formal shift-bound Handover/closure, broader canonical Pareto, Improvement Tracking,
external integrations, CI/workers, general Audit, backup/restore/performance,
global search/unified area overview and shared-use release controls remain open.
M9 maps/placements are explicitly Deferred. Local login/admin, asset lifecycle/
aliases/search, journal categories/entries/issues/meeting summaries, role-aware
Start and synthetic Workforce/Maintenance exercises are already delivered.

## Historical evidence

Completed plans retain their validation results and limitations at the time of
execution. The [September 26 readiness audit](completed/IOP-146-poc-readiness-review.md)
describes the pre-integration baseline; its runtime blockers were resolved by IOP-147.
It is not an outstanding-work checklist. Native fixture/reset tools and `?preview=1`
remain optional developer support; current acceptance uses the real import/report
workflow described in the operator guide.

## Operational boundaries

[M6 Workforce](../product/workforce.md) is implemented under
[IOP-184](items/IOP-184-m6-workforce.md): schedules/imports, role-specific planning,
retained operational history, English/German presentation and platform identity.
This extends the local application without closing IOP-130 or changing analytical
metric semantics. Authentication and Shift Handover retain their existing ownership.
M8/M10 likewise retain owner-defined source ports: asset access never grants
analytical/Handover access, and alarm totals do not prove physical failure or downtime.
