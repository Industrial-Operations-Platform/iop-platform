# IOP backlog index

This index records existing work; permanent contexts own scope and status.
Execution plans live in `active/`, and completed evidence in `completed/`.
See the [workflow](workflow.md).

## Immediate target: analytical POC

The owner approved a local single-operator CSV → analysis → presentation POC,
with login and external connections deferred. Follow [POC scope](../product/scope-poc.md)
and the [complete delivery map](poc-delivery.md) before activating a story.
Only relevant slices are prerequisites; M1–M17 are a future capability inventory.
The proposed local execution mechanism does not implicitly waive accepted RLS/RBAC.

IOP-001–006 and IOP-008 are Completed as design on this branch. Local API and web
host implementation is completed under IOP-016/017. IOP-007, IOP-010, IOP-028
and IOP-031 are Deferred beyond
the POC. Other Proposed implementation stories are selected only through their
POC slices or remain future work as mapped. Completed governance work is listed
below. The IOP-009 future audit acceptance remains on its separate review branch;
this change does not merge it or change that acceptance history.

The [legacy map](legacy-backlog-map.md) preserves the original task numbering.
IDs are never reused. Completing a POC slice does not close unfinished parent work.

## M1 — Product & Architecture Definition

| Contexto de tarea | Estado |
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
| [IOP-011 — Define CSV preservation for the POC](items/IOP-011-file-storage-model.md) | Proposed |
| [IOP-012 — Define the CSV source contract](items/IOP-012-source-integration-contract.md) | Proposed |
| [IOP-013 — Define local health and diagnostic logging](items/IOP-013-observability-baseline.md) | Proposed |
| [IOP-014 — Define the local POC security baseline](items/IOP-014-security-baseline.md) | Completed |

## M2 — Development Platform Foundation

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-015 — Local Docker development environment](items/IOP-015-local-development-environment.md) | Completed |
| [IOP-016 — Bootstrap backend](items/IOP-016-backend-bootstrap.md) | Completed |
| [IOP-017 — Bootstrap frontend](items/IOP-017-frontend-bootstrap.md) | Completed |
| [IOP-018 — Local configuration and environments](items/IOP-018-configuration-management.md) | Proposed |
| [IOP-019 — PostgreSQL + migrations](items/IOP-019-database-bootstrap.md) | Proposed |
| [IOP-020 — Testing foundation](items/IOP-020-testing-foundation.md) | Proposed |
| [IOP-021 — CI baseline](items/IOP-021-ci-baseline.md) | Proposed |
| [IOP-022 — API error model](items/IOP-022-api-error-model.md) | Proposed |
| [IOP-023 — Audit infrastructure](items/IOP-023-audit-infrastructure.md) | Proposed |
| [IOP-024 — Worker infrastructure](items/IOP-024-worker-infrastructure.md) | Proposed |

## M3 — Platform Core

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-025 — Organization model](items/IOP-025-organization-model.md) | Proposed |
| [IOP-026 — Site model](items/IOP-026-site-model.md) | Proposed |
| [IOP-027 — User model](items/IOP-027-user-model.md) | Proposed |
| [IOP-028 — Local authentication adapter](items/IOP-028-local-authentication.md) | Deferred |
| [IOP-029 — Authorization/RBAC](items/IOP-029-rbac-enforcement.md) | Proposed |
| [IOP-030 — User/site membership](items/IOP-030-membership-model.md) | Proposed |
| [IOP-031 — Admin foundation](items/IOP-031-administration-foundation.md) | Deferred |

## M4 — Asset Domain

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-032 — Asset hierarchy model](items/IOP-032-asset-hierarchy.md) | Proposed |
| [IOP-033 — Asset type model](items/IOP-033-asset-types.md) | Proposed |
| [IOP-034 — Asset lifecycle](items/IOP-034-asset-lifecycle.md) | Proposed |
| [IOP-035 — Asset parent relationships](items/IOP-035-asset-parent-relations.md) | Proposed |
| [IOP-036 — Controller relationships](items/IOP-036-controller-relations.md) | Proposed |
| [IOP-037 — Asset aliases](items/IOP-037-asset-aliases.md) | Proposed |
| [IOP-038 — Asset metadata](items/IOP-038-asset-metadata.md) | Proposed |
| [IOP-039 — Asset survey workflow](items/IOP-039-asset-survey.md) | Proposed |
| [IOP-040 — Asset search](items/IOP-040-asset-search.md) | Proposed |

## M5 — Industrial Data Foundation

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-041 — RAW ingestion model](items/IOP-041-raw-ingestion-model.md) | Proposed |
| [IOP-042 — Import batch model](items/IOP-042-import-batches.md) | Proposed |
| [IOP-043 — Event canonical model](items/IOP-043-canonical-event-model.md) | Proposed |
| [IOP-044 — Event-to-asset mapping](items/IOP-044-event-asset-mapping.md) | Proposed |
| [IOP-045 — CSV source adapter](items/IOP-045-csv-adapter.md) | Proposed |
| [IOP-046 — Data validation](items/IOP-046-import-validation.md) | Proposed |
| [IOP-047 — Deduplication/idempotency](items/IOP-047-import-idempotency.md) | Proposed |
| [IOP-048 — Reconciliation](items/IOP-048-data-reconciliation.md) | Proposed |
| [IOP-049 — Source aliases/mappings](items/IOP-049-source-mappings.md) | Proposed |

## M6 — Workforce & Shift Management

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-050 — Technician/team profiles](items/IOP-050-workforce-profiles.md) | Proposed |
| [IOP-051 — Team model](items/IOP-051-team-model.md) | Proposed |
| [IOP-052 — Shift type configuration](items/IOP-052-shift-types.md) | Proposed |
| [IOP-053 — Shift instances](items/IOP-053-shift-instances.md) | Proposed |
| [IOP-054 — Workplace/assignment targets](items/IOP-054-assignment-targets.md) | Proposed |
| [IOP-055 — Technician assignments](items/IOP-055-shift-assignments.md) | Proposed |
| [IOP-056 — Springer/floating assignment](items/IOP-056-floating-assignments.md) | Proposed |
| [IOP-057 — Personal schedule view](items/IOP-057-my-schedule.md) | Proposed |
| [IOP-058 — Team Leader planning view](items/IOP-058-team-planning-view.md) | Proposed |
| [IOP-059 — Assignment history](items/IOP-059-assignment-history.md) | Proposed |

## M7 — Shift Handover

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-060 — Handover record](items/IOP-060-handover-record.md) | Proposed |
| [IOP-061 — Handover categories](items/IOP-061-handover-categories.md) | Proposed |
| [IOP-062 — Handover entries](items/IOP-062-handover-entry.md) | Proposed |
| [IOP-063 — Asset-linked handover](items/IOP-063-handover-asset-link.md) | Proposed |
| [IOP-064 — Open issues](items/IOP-064-open-issues.md) | Proposed |
| [IOP-065 — Handover summary](items/IOP-065-handover-summary.md) | Proposed |
| [IOP-066 — Handover closure](items/IOP-066-handover-closure.md) | Proposed |
| [IOP-067 — Previous-shift view](items/IOP-067-previous-shift-overview.md) | Proposed |

## M8 — Maintenance Management

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-068 — Maintenance record model](items/IOP-068-maintenance-record.md) | Proposed |
| [IOP-069 — Maintenance status workflow](items/IOP-069-maintenance-status.md) | Proposed |
| [IOP-070 — Priority model](items/IOP-070-maintenance-priority.md) | Proposed |
| [IOP-071 — Ownership](items/IOP-071-maintenance-ownership.md) | Proposed |
| [IOP-072 — Asset link](items/IOP-072-maintenance-asset-link.md) | Proposed |
| [IOP-073 — Maintenance Board](items/IOP-073-maintenance-board.md) | Proposed |
| [IOP-074 — Filter/search](items/IOP-074-maintenance-filtering.md) | Proposed |
| [IOP-075 — Maintenance history](items/IOP-075-maintenance-history.md) | Proposed |

## M9 — Asset Locator

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-076 — Map model](items/IOP-076-map-model.md) | Proposed |
| [IOP-077 — Map upload](items/IOP-077-map-upload.md) | Proposed |
| [IOP-078 — Normalized coordinates](items/IOP-078-normalized-map-coordinates.md) | Proposed |
| [IOP-079 — Asset placement](items/IOP-079-asset-placement.md) | Proposed |
| [IOP-080 — Locator UI](items/IOP-080-asset-locator-ui.md) | Proposed |
| [IOP-081 — Locator search](items/IOP-081-locator-search.md) | Proposed |
| [IOP-082 — Ambiguous aliases](items/IOP-082-ambiguous-assets.md) | Proposed |
| [IOP-083 — Unmapped assets](items/IOP-083-unmapped-assets.md) | Proposed |

## M10 — Asset History / Digital Asset Record

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-084 — Asset timeline model](items/IOP-084-asset-timeline.md) | Proposed |
| [IOP-085 — Event history](items/IOP-085-asset-event-history.md) | Proposed |
| [IOP-086 — Maintenance history](items/IOP-086-asset-maintenance-history.md) | Proposed |
| [IOP-087 — Handover history](items/IOP-087-asset-handover-history.md) | Proposed |
| [IOP-088 — Asset detail page](items/IOP-088-asset-detail-page.md) | Proposed |

## M11 — OIP / Operational Intelligence

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-089 — Analytics query layer](items/IOP-089-analytics-query-layer.md) | Proposed |
| [IOP-090 — Event frequency KPI](items/IOP-090-event-frequency.md) | Proposed |
| [IOP-091 — Accumulated alarm duration (POC)](items/IOP-091-downtime.md) | Proposed |
| [IOP-092 — Trend analysis](items/IOP-092-event-trends.md) | Proposed |
| [IOP-093 — Pareto analysis](items/IOP-093-pareto.md) | Proposed |
| [IOP-094 — Source equipment analytics (POC)](items/IOP-094-asset-analytics.md) | Proposed |
| [IOP-095 — Area analytics](items/IOP-095-area-analytics.md) | Proposed |
| [IOP-096 — Analytical drill-down](items/IOP-096-analytics-drilldown.md) | Proposed |
| [IOP-097 — Date/filter model](items/IOP-097-analytics-filters.md) | Proposed |

## M12 — Improvement Tracking

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-098 — Improvement action](items/IOP-098-improvement-action.md) | Proposed |
| [IOP-099 — Owner/target](items/IOP-099-improvement-target.md) | Proposed |
| [IOP-100 — Evidence](items/IOP-100-improvement-evidence.md) | Proposed |
| [IOP-101 — Before/after comparison](items/IOP-101-before-after-analysis.md) | Proposed |

## M13 — External Integrations

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-102 — Integration registry](items/IOP-102-integration-registry.md) | Proposed |
| [IOP-103 — Manual CSV delivery validation](items/IOP-103-csv-integration.md) | Proposed |
| [IOP-104 — WinCC adapter contract](items/IOP-104-wincc-adapter.md) | Proposed |
| [IOP-105 — Ultimo adapter contract](items/IOP-105-ultimo-adapter.md) | Proposed |
| [IOP-106 — Entra identity adapter](items/IOP-106-entra-adapter.md) | Proposed |
| [IOP-107 — Integration health](items/IOP-107-integration-health.md) | Proposed |

## M14 — Security & Reliability

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-108 — Authorization test suite](items/IOP-108-authorization-tests.md) | Proposed |
| [IOP-109 — Secrets handling](items/IOP-109-secret-management.md) | Proposed |
| [IOP-110 — Input validation](items/IOP-110-input-validation.md) | Proposed |
| [IOP-111 — Audit verification](items/IOP-111-audit-verification.md) | Proposed |
| [IOP-112 — Backup process](items/IOP-112-backup.md) | Proposed |
| [IOP-113 — Restore process](items/IOP-113-restore.md) | Proposed |
| [IOP-114 — Performance baseline](items/IOP-114-performance-baseline.md) | Proposed |
| [IOP-115 — Failure handling](items/IOP-115-failure-recovery.md) | Proposed |

## M15 — UX & Operational Experience

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-116 — App navigation](items/IOP-116-navigation.md) | Proposed |
| [IOP-117 — Role-aware home](items/IOP-117-role-home.md) | Proposed |
| [IOP-118 — Area overview](items/IOP-118-area-overview.md) | Proposed |
| [IOP-119 — Global search](items/IOP-119-global-search.md) | Proposed |
| [IOP-120 — Empty/error/loading states](items/IOP-120-ui-states.md) | Proposed |
| [IOP-121 — Responsive baseline](items/IOP-121-responsive-ui.md) | Proposed |
| [IOP-122 — Accessibility baseline](items/IOP-122-accessibility.md) | Proposed |

## M16 — Demo / Pilot Dataset

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-123 — Synthetic organization](items/IOP-123-demo-organization.md) | Proposed |
| [IOP-124 — Synthetic asset structure](items/IOP-124-demo-assets.md) | Proposed |
| [IOP-125 — Synthetic analytical CSV fixtures](items/IOP-125-demo-events.md) | Proposed |
| [IOP-126 — Synthetic workforce](items/IOP-126-demo-workforce.md) | Proposed |
| [IOP-127 — Synthetic maintenance](items/IOP-127-demo-maintenance.md) | Proposed |
| [IOP-128 — Demo reset](items/IOP-128-demo-reset.md) | Proposed |

## M17 — v1 Validation & Release

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-129 — POC end-to-end demonstration](items/IOP-129-end-to-end-scenario.md) | Proposed |
| [IOP-130 — Pilot metrics](items/IOP-130-pilot-metrics.md) | Proposed |
| [IOP-131 — Permission validation](items/IOP-131-permission-validation.md) | Proposed |
| [IOP-132 — Data reconciliation](items/IOP-132-final-reconciliation.md) | Proposed |
| [IOP-133 — Performance acceptance](items/IOP-133-performance-acceptance.md) | Proposed |
| [IOP-134 — Deployment documentation](items/IOP-134-deployment-guide.md) | Proposed |
| [IOP-135 — Admin documentation](items/IOP-135-admin-guide.md) | Proposed |
| [IOP-136 — User documentation](items/IOP-136-user-guide.md) | Proposed |
| [IOP-137 — Architecture review](items/IOP-137-architecture-review.md) | Proposed |
| [IOP-138 — v1 release](items/IOP-138-v1-release.md) | Proposed |

## Repository governance

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-139 — Planning workflow](items/IOP-139-planning-workflow.md) | Completed |
| [IOP-140 — English project language](items/IOP-140-english-project-language.md) | Completed |
| [IOP-141 — Story branches and review workflow](items/IOP-141-branch-workflow.md) | Completed |
| [IOP-142 — Align delivery with a fast analytical POC](items/IOP-142-poc-delivery-scope.md) | Completed |
