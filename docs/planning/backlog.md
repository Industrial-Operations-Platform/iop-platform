# IOP backlog index

This index records existing work; permanent contexts own scope and status.
Execution plans live in `active/`, and completed evidence in `completed/`.
See the [workflow](workflow.md).

## Current delivery — 2026-10-06

The original local CSV → analysis → presentation POC is delivered. Later
owner-authorized increments add local login/four-profile administration, Shift
Handover, M6 Workforce, M8 Maintenance and M10 Digital Asset Record. IOP-194 was
integrated into develop and published to origin on 2026-10-06; its owner product
review and physical verification remain pending. Follow the
[delivery map](poc-delivery.md) for evidence and the [roadmap](../../ROADMAP.md)
for the consolidated remaining-work inventory before selecting another story.

The charts were accepted as Data Analysis v1 on 2026-09-27. IOP-130 remains
In progress for measurement consolidation, not missing usefulness feedback.
Component acceptance, implementation completion and publication are distinct
from whole-platform release (IOP-138).

IOP-001–006 and IOP-008 are Completed design. Deferred IOP-025–027/029–030 have
delivered local slices but retain broader lifecycle scope. IOP-028/031 local
login/admin are Completed through later delivery. General Audit, corporate
identity, workers, full asset hierarchy/survey, formal shift closure, external
connections and operating/release controls remain open. M9 is explicitly Deferred.
IOP-009's separate review decision is not integrated by this documentation audit.

The [legacy map](legacy-backlog-map.md) preserves the original task numbering.
IDs are never reused. Completing a POC slice does not close unfinished parent work.

Audit snapshot: **194 indexed stories — 138 Completed, 40 Proposed, 15 Deferred
and 1 In progress (IOP-130)**. Completed includes design/governance and bounded
local delivery, not whole-platform release. The **56 unfinished stories** retain
their specific remaining criteria. IOP-195 records this documentation review.

## M1 — Product & Architecture Definition

| Task context | Status |
| --- | --- |
| [IOP-001 — Validate v1 personas and pilot workflow](items/IOP-001-v1-personas-and-pilot-workflow.md) | Completed |
| [IOP-002 — Select backend, frontend and tooling](items/IOP-002-technology-stack.md) | Completed |
| [IOP-003 — Define API style and contracts](items/IOP-003-api-contract-strategy.md) | Completed |
| [IOP-004 — Design Organization/Site scope](items/IOP-004-platform-scope-model.md) | Completed |
| [IOP-005 — Design tenancy and data isolation](items/IOP-005-tenancy-and-data-isolation.md) | Completed |
| [IOP-006 — Design the RBAC model](items/IOP-006-rbac-model.md) | Completed |
| [IOP-007 — Design authentication for later shared use](items/IOP-007-authentication-model.md) | Deferred |
| [IOP-008 — Define the time and time-zone model](items/IOP-008-time-and-timezone-model.md) | Completed |
| [IOP-009 — Retain future audit design](items/IOP-009-audit-model.md) | Proposed |
| [IOP-010 — Design background jobs for later delivery](items/IOP-010-background-job-model.md) | Deferred |
| [IOP-011 — Define CSV preservation for the POC](items/IOP-011-file-storage-model.md) | Completed |
| [IOP-012 — Define the CSV source contract](items/IOP-012-source-integration-contract.md) | Completed |
| [IOP-013 — Define local health and diagnostic logging](items/IOP-013-observability-baseline.md) | Completed |
| [IOP-014 — Define the local POC security baseline](items/IOP-014-security-baseline.md) | Completed |

## M2 — Development Platform Foundation

| Task context | Status |
| --- | --- |
| [IOP-015 — Local Docker development environment](items/IOP-015-local-development-environment.md) | Completed |
| [IOP-016 — Bootstrap backend](items/IOP-016-backend-bootstrap.md) | Completed |
| [IOP-017 — Bootstrap frontend](items/IOP-017-frontend-bootstrap.md) | Completed |
| [IOP-018 — Local configuration and environments](items/IOP-018-configuration-management.md) | Completed |
| [IOP-019 — PostgreSQL + migrations](items/IOP-019-database-bootstrap.md) | Completed |
| [IOP-020 — Testing foundation](items/IOP-020-testing-foundation.md) | Completed |
| [IOP-021 — CI baseline](items/IOP-021-ci-baseline.md) | Proposed |
| [IOP-022 — API error model](items/IOP-022-api-error-model.md) | Completed |
| [IOP-023 — Audit infrastructure](items/IOP-023-audit-infrastructure.md) | Proposed |
| [IOP-024 — Worker infrastructure](items/IOP-024-worker-infrastructure.md) | Proposed |

## M3 — Platform Core

| Task context | Status |
| --- | --- |
| [IOP-025 — Organization model](items/IOP-025-organization-model.md) | Deferred |
| [IOP-026 — Site model](items/IOP-026-site-model.md) | Deferred |
| [IOP-027 — User model](items/IOP-027-user-model.md) | Deferred |
| [IOP-028 — Local authentication adapter](items/IOP-028-local-authentication.md) | Completed |
| [IOP-029 — Authorization/RBAC](items/IOP-029-rbac-enforcement.md) | Deferred |
| [IOP-030 — User/site membership](items/IOP-030-membership-model.md) | Deferred |
| [IOP-031 — Admin foundation](items/IOP-031-administration-foundation.md) | Completed |

## M4 — Asset Domain

IOP-194 completes lifecycle, exact aliases and registry search. Type/component text
and manual within-area grouping provide partial coverage; they do not implement
full composition, managed type catalogs, controller relations or physical surveys.

| Task context | Status |
| --- | --- |
| [IOP-032 — Asset hierarchy model](items/IOP-032-asset-hierarchy.md) | Proposed |
| [IOP-033 — Asset type model](items/IOP-033-asset-types.md) | Proposed |
| [IOP-034 — Asset lifecycle](items/IOP-034-asset-lifecycle.md) | Completed |
| [IOP-035 — Asset parent relationships](items/IOP-035-asset-parent-relations.md) | Proposed |
| [IOP-036 — Controller relationships](items/IOP-036-controller-relations.md) | Proposed |
| [IOP-037 — Asset aliases](items/IOP-037-asset-aliases.md) | Completed |
| [IOP-038 — Asset metadata](items/IOP-038-asset-metadata.md) | Proposed |
| [IOP-039 — Asset survey workflow](items/IOP-039-asset-survey.md) | Proposed |
| [IOP-040 — Asset search](items/IOP-040-asset-search.md) | Completed |

## M5 — Industrial Data Foundation

| Task context | Status |
| --- | --- |
| [IOP-041 — RAW ingestion model](items/IOP-041-raw-ingestion-model.md) | Completed |
| [IOP-042 — Import batch model](items/IOP-042-import-batches.md) | Completed |
| [IOP-043 — Event canonical model](items/IOP-043-canonical-event-model.md) | Completed |
| [IOP-044 — Event-to-asset mapping](items/IOP-044-event-asset-mapping.md) | Proposed |
| [IOP-045 — CSV source adapter](items/IOP-045-csv-adapter.md) | Completed |
| [IOP-046 — Data validation](items/IOP-046-import-validation.md) | Completed |
| [IOP-047 — Deduplication/idempotency](items/IOP-047-import-idempotency.md) | Completed |
| [IOP-048 — Reconciliation](items/IOP-048-data-reconciliation.md) | Completed |
| [IOP-049 — Source aliases/mappings](items/IOP-049-source-mappings.md) | Completed |

## M6 — Workforce & Shift Management

| Task context | Status |
| --- | --- |
| [IOP-050 — Technician/team profiles](items/IOP-050-workforce-profiles.md) | Completed |
| [IOP-051 — Team model](items/IOP-051-team-model.md) | Completed |
| [IOP-052 — Shift type configuration](items/IOP-052-shift-types.md) | Completed |
| [IOP-053 — Shift instances](items/IOP-053-shift-instances.md) | Completed |
| [IOP-054 — Workplace/assignment targets](items/IOP-054-assignment-targets.md) | Completed |
| [IOP-055 — Technician assignments](items/IOP-055-shift-assignments.md) | Completed |
| [IOP-056 — Springer/floating assignment](items/IOP-056-floating-assignments.md) | Completed |
| [IOP-057 — Personal schedule view](items/IOP-057-my-schedule.md) | Completed |
| [IOP-058 — Team Leader planning view](items/IOP-058-team-planning-view.md) | Completed |
| [IOP-059 — Assignment history](items/IOP-059-assignment-history.md) | Completed |

## M7 — Shift Handover

IOP-168/169 and later refinements complete configured categories, entries,
carry-forward issues and meeting summaries. Shift-bound records/previous-shift
selection, formal closure and explicit canonical entry-to-asset references remain
open. IOP-194 adds source-alias history reads and reviewed repair issue resolution.

| Task context | Status |
| --- | --- |
| [IOP-060 — Handover record](items/IOP-060-handover-record.md) | Proposed |
| [IOP-061 — Handover categories](items/IOP-061-handover-categories.md) | Completed |
| [IOP-062 — Handover entries](items/IOP-062-handover-entry.md) | Completed |
| [IOP-063 — Asset-linked handover](items/IOP-063-handover-asset-link.md) | Proposed |
| [IOP-064 — Open issues](items/IOP-064-open-issues.md) | Completed |
| [IOP-065 — Handover summary](items/IOP-065-handover-summary.md) | Completed |
| [IOP-066 — Handover closure](items/IOP-066-handover-closure.md) | Proposed |
| [IOP-067 — Previous-shift view](items/IOP-067-previous-shift-overview.md) | Proposed |

## M8 — Maintenance Management

| Task context | Status |
| --- | --- |
| [IOP-068 — Maintenance record model](items/IOP-068-maintenance-record.md) | Completed |
| [IOP-069 — Maintenance status workflow](items/IOP-069-maintenance-status.md) | Completed |
| [IOP-070 — Priority model](items/IOP-070-maintenance-priority.md) | Completed |
| [IOP-071 — Ownership](items/IOP-071-maintenance-ownership.md) | Completed |
| [IOP-072 — Asset link](items/IOP-072-maintenance-asset-link.md) | Completed |
| [IOP-073 — Maintenance Board](items/IOP-073-maintenance-board.md) | Completed |
| [IOP-074 — Filter/search](items/IOP-074-maintenance-filtering.md) | Completed |
| [IOP-075 — Maintenance history](items/IOP-075-maintenance-history.md) | Completed |

## M9 — Asset Locator

Explicitly Deferred by the owner, confirmed on 2026-10-06. Catalog/manual grouping
work under IOP-194 does not implement maps or spatial placements.

| Task context | Status |
| --- | --- |
| [IOP-076 — Map model](items/IOP-076-map-model.md) | Deferred |
| [IOP-077 — Map upload](items/IOP-077-map-upload.md) | Deferred |
| [IOP-078 — Normalized coordinates](items/IOP-078-normalized-map-coordinates.md) | Deferred |
| [IOP-079 — Asset placement](items/IOP-079-asset-placement.md) | Deferred |
| [IOP-080 — Locator UI](items/IOP-080-asset-locator-ui.md) | Deferred |
| [IOP-081 — Locator search](items/IOP-081-locator-search.md) | Deferred |
| [IOP-082 — Ambiguous aliases](items/IOP-082-ambiguous-assets.md) | Deferred |
| [IOP-083 — Unmapped assets](items/IOP-083-unmapped-assets.md) | Deferred |

## M10 — Asset History / Digital Asset Record

| Task context | Status |
| --- | --- |
| [IOP-084 — Asset timeline model](items/IOP-084-asset-timeline.md) | Completed |
| [IOP-085 — Event history](items/IOP-085-asset-event-history.md) | Completed |
| [IOP-086 — Maintenance history](items/IOP-086-asset-maintenance-history.md) | Completed |
| [IOP-087 — Handover history](items/IOP-087-asset-handover-history.md) | Completed |
| [IOP-088 — Asset detail page](items/IOP-088-asset-detail-page.md) | Completed |

## M11 — OIP / Operational Intelligence

| Task context | Status |
| --- | --- |
| [IOP-089 — Analytics query layer](items/IOP-089-analytics-query-layer.md) | Completed |
| [IOP-090 — Event frequency KPI](items/IOP-090-event-frequency.md) | Completed |
| [IOP-091 — Accumulated alarm duration (POC)](items/IOP-091-downtime.md) | Completed |
| [IOP-092 — Trend analysis](items/IOP-092-event-trends.md) | Completed |
| [IOP-093 — Pareto analysis](items/IOP-093-pareto.md) | Proposed |
| [IOP-094 — Source equipment analytics (POC)](items/IOP-094-asset-analytics.md) | Completed |
| [IOP-095 — Area analytics](items/IOP-095-area-analytics.md) | Completed |
| [IOP-096 — Analytical drill-down (connected POC delivered)](items/IOP-096-analytics-drilldown.md) | Completed |
| [IOP-097 — Date/filter model (connected POC delivered)](items/IOP-097-analytics-filters.md) | Completed |

## M12 — Improvement Tracking

| Task context | Status |
| --- | --- |
| [IOP-098 — Improvement action](items/IOP-098-improvement-action.md) | Proposed |
| [IOP-099 — Owner/target](items/IOP-099-improvement-target.md) | Proposed |
| [IOP-100 — Evidence](items/IOP-100-improvement-evidence.md) | Proposed |
| [IOP-101 — Before/after comparison](items/IOP-101-before-after-analysis.md) | Proposed |

## M13 — External Integrations

| Task context | Status |
| --- | --- |
| [IOP-102 — Integration registry](items/IOP-102-integration-registry.md) | Proposed |
| [IOP-103 — Manual CSV delivery validation](items/IOP-103-csv-integration.md) | Completed |
| [IOP-104 — WinCC adapter contract](items/IOP-104-wincc-adapter.md) | Proposed |
| [IOP-105 — Ultimo adapter contract](items/IOP-105-ultimo-adapter.md) | Proposed |
| [IOP-106 — Entra identity adapter](items/IOP-106-entra-adapter.md) | Proposed |
| [IOP-107 — Integration health](items/IOP-107-integration-health.md) | Proposed |

## M14 — Security & Reliability

| Task context | Status |
| --- | --- |
| [IOP-108 — Authorization test suite](items/IOP-108-authorization-tests.md) | Proposed |
| [IOP-109 — Secrets handling](items/IOP-109-secret-management.md) | Completed |
| [IOP-110 — Input validation](items/IOP-110-input-validation.md) | Completed |
| [IOP-111 — Audit verification](items/IOP-111-audit-verification.md) | Proposed |
| [IOP-112 — Backup process](items/IOP-112-backup.md) | Proposed |
| [IOP-113 — Restore process](items/IOP-113-restore.md) | Proposed |
| [IOP-114 — Performance baseline](items/IOP-114-performance-baseline.md) | Proposed |
| [IOP-115 — Failure handling](items/IOP-115-failure-recovery.md) | Proposed |

## M15 — UX & Operational Experience

| Task context | Status |
| --- | --- |
| [IOP-116 — App navigation](items/IOP-116-navigation.md) | Completed |
| [IOP-117 — Role-aware home](items/IOP-117-role-home.md) | Completed |
| [IOP-118 — Area overview](items/IOP-118-area-overview.md) | Proposed |
| [IOP-119 — Global search](items/IOP-119-global-search.md) | Proposed |
| [IOP-120 — Empty/error/loading states](items/IOP-120-ui-states.md) | Completed |
| [IOP-121 — Responsive baseline](items/IOP-121-responsive-ui.md) | Completed |
| [IOP-122 — Accessibility baseline](items/IOP-122-accessibility.md) | Completed |

## M16 — Demo / Pilot Dataset

| Task context | Status |
| --- | --- |
| [IOP-123 — Synthetic organization](items/IOP-123-demo-organization.md) | Completed |
| [IOP-124 — Synthetic asset structure](items/IOP-124-demo-assets.md) | Proposed |
| [IOP-125 — Synthetic analytical CSV fixtures](items/IOP-125-demo-events.md) | Completed |
| [IOP-126 — Synthetic workforce](items/IOP-126-demo-workforce.md) | Completed |
| [IOP-127 — Synthetic maintenance](items/IOP-127-demo-maintenance.md) | Completed |
| [IOP-128 — Demo reset](items/IOP-128-demo-reset.md) | Completed |

## M17 — v1 Validation & Release

| Task context | Status |
| --- | --- |
| [IOP-129 — POC end-to-end demonstration](items/IOP-129-end-to-end-scenario.md) | Completed |
| [IOP-130 — Pilot metrics](items/IOP-130-pilot-metrics.md) | In progress |
| [IOP-131 — Permission validation](items/IOP-131-permission-validation.md) | Proposed |
| [IOP-132 — Data reconciliation](items/IOP-132-final-reconciliation.md) | Completed |
| [IOP-133 — Performance acceptance](items/IOP-133-performance-acceptance.md) | Proposed |
| [IOP-134 — Deployment documentation](items/IOP-134-deployment-guide.md) | Proposed |
| [IOP-135 — Admin documentation](items/IOP-135-admin-guide.md) | Proposed |
| [IOP-136 — User documentation](items/IOP-136-user-guide.md) | Completed |
| [IOP-137 — Architecture review](items/IOP-137-architecture-review.md) | Proposed |
| [IOP-138 — v1 release](items/IOP-138-v1-release.md) | Proposed |

## Repository governance

| Task context | Status |
| --- | --- |
| [IOP-139 — Planning workflow](items/IOP-139-planning-workflow.md) | Completed |
| [IOP-140 — English project language](items/IOP-140-english-project-language.md) | Completed |
| [IOP-141 — Story branches and review workflow](items/IOP-141-branch-workflow.md) | Completed |
| [IOP-142 — Align delivery with a fast analytical POC](items/IOP-142-poc-delivery-scope.md) | Completed |
| [IOP-143 — Local agent instructions and concise documentation](items/IOP-143-concise-workflow.md) | Completed |
| [IOP-146 — Review POC coverage and closure dependencies](items/IOP-146-poc-readiness-review.md) | Completed |
| [IOP-195 — Reconcile delivered capabilities and remaining development](items/IOP-195-development-status.md) | Completed |
| [IOP-197 — Integrate retained branches into develop and origin](items/IOP-197-branch-integration.md) | In progress |

## Owner-supplied reference data

| Task context | Status |
| --- | --- |
| [IOP-145 — Preserve owner-supplied CSV reference files](items/IOP-145-csv-reference-files.md) | Completed |

## Current POC completion

| Task context | Status |
| --- | --- |
| [IOP-147 — Complete the working analytical POC](items/IOP-147-working-analytical-poc.md) | Completed |
| [IOP-148 — Historical analysis workspace and import preparation](items/IOP-148-analytical-workspace.md) | Completed |
| [IOP-149 — Containerized local platform and historical seed](items/IOP-149-local-stack-history.md) | Completed |
| [IOP-150 — Reusable frontend identity components](items/IOP-150-reusable-ui.md) | Completed |
| [IOP-151 — Consolidate current platform documentation](items/IOP-151-documentation-cleanup.md) | Completed |
| [IOP-152 — Complete and verify the local analytical POC](items/IOP-152-poc-readiness.md) | Completed |
| [IOP-153 — Monthly Executive Overview and comparative KPIs](items/IOP-153-monthly-executive.md) | Completed |
| [IOP-154 — Taskforce view and file administration](items/IOP-154-taskforce-administration.md) | Completed |
| [IOP-155 — Exclude Sundays from analysis](items/IOP-155-analysis-calendar.md) | Completed |
| [IOP-156 — Source-file filters and aligned headers](items/IOP-156-source-file-filters.md) | Completed |
| [IOP-157 — Dependent source-file filters](items/IOP-157-dependent-file-filters.md) | Completed |
| [IOP-158 — Import administration workspace](items/IOP-158-import-administration.md) | Completed |
| [IOP-159 — Brand navigation to Start](items/IOP-159-brand-start-navigation.md) | Completed |
| [IOP-160 — Monthly Halle comparison and collapsed filter reset](items/IOP-160-month-comparison.md) | Completed |
| [IOP-161 — Visible trend time controls](items/IOP-161-trend-time-controls.md) | Completed |
| [IOP-162 — Consistent monthly filters in the running workspace](items/IOP-162-shared-month-filters.md) | Completed |
| [IOP-163 — Selected-month component totals and Pareto charts](items/IOP-163-component-pareto.md) | Completed |
| [IOP-164 — Hexagonal boundaries and artifact cleanup](items/IOP-164-hexagonal-cleanup.md) | Completed |
| [IOP-165 — Operational home and transitional access](items/IOP-165-operational-home.md) | Completed |
| [IOP-166 — Reset the file selection after successful import](items/IOP-166-import-form-reset.md) | Completed |
| [IOP-167 — Restrict user management to administration mode](items/IOP-167-users-administration-mode.md) | Completed |
| [IOP-168 — Operational Shift Handover](items/IOP-168-shift-handover.md) | Completed |
| [IOP-169 — Handover board and guided follow-up](items/IOP-169-handover-board.md) | Completed |
| [IOP-170 — Administrator workspace and profile views](items/IOP-170-administrator-workspace.md) | Completed |
| [IOP-171 — Restrict Technician analytical access](items/IOP-171-technician-access.md) | Completed |
| [IOP-172 — Department summary spacing](items/IOP-172-department-summary-spacing.md) | Completed |
| [IOP-173 — Handover demonstration data](items/IOP-173-handover-demo-data.md) | Completed |
| [IOP-174 — Handover navigation and layout](items/IOP-174-handover-navigation-layout.md) | Completed |
| [IOP-175 — Consistent handover detail heading](items/IOP-175-handover-detail-heading.md) | Completed |
| [IOP-176 — Handover detail action spacing](items/IOP-176-handover-action-spacing.md) | Completed |
| [IOP-177 — Enforce the shared platform visual identity](items/IOP-177-platform-visual-identity.md) | Completed |
| [IOP-178 — Consistent journal cards and contextual detail navigation](items/IOP-178-handover-cards-navigation.md) | Completed |
| [IOP-179 — Distinguish entry titles from section headings](items/IOP-179-handover-entry-title-style.md) | Completed |
| [IOP-180 — Polish operational summaries and shared visual hierarchy](items/IOP-180-operational-visual-polish.md) | Completed |
| [IOP-181 — Refine operational selection, matrix and personal entries](items/IOP-181-handover-view-polish.md) | Completed |
| [IOP-182 — Structured entry details and neutral Start selection](items/IOP-182-entry-detail-neutral-start.md) | Completed |
| [IOP-183 — Compact Start category tabs](items/IOP-183-compact-start-tabs.md) | Completed |
| [IOP-184 — M6 Workforce delivery](items/IOP-184-m6-workforce.md) | Completed |
| [IOP-185 — Administration and Workforce interface consistency](items/IOP-185-administration-workforce-ui.md) | Completed |
| [IOP-186 — Table headings and operational card alignment](items/IOP-186-table-card-alignment.md) | Completed |
| [IOP-187 — Compact Workforce matrices and shared table alignment](items/IOP-187-compact-workforce-tables.md) | Completed |
| [IOP-188 — User directory controls and current operational names](items/IOP-188-user-directory-refinements.md) | Completed |
| [IOP-189 — Local test-account password reset](items/IOP-189-local-test-passwords.md) | Completed |
| [IOP-190 — Daily Handover views and focused table filters](items/IOP-190-daily-handover.md) | Completed |
| [IOP-191 — Operational controls and contextual navigation](items/IOP-191-operational-controls.md) | Completed |
| [IOP-192 — Operational cards, account controls and entry notifications](items/IOP-192-operational-cards-account.md) | Completed |
| [IOP-193 — Compact account menu and pending department matrix](items/IOP-193-compact-account-pending-matrix.md) | Completed |

## Maintenance and Digital Asset Record delivery

| Task context | Status |
| --- | --- |
| [IOP-194 — Maintenance Management and Digital Asset Record](items/IOP-194-maintenance-asset-history.md) | Completed |
