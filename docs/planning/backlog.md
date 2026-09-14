# IOP backlog index

Este archivo indica **qué trabajo existe**; cada enlace abre su contexto permanente.
Los criterios y dependencias viven en `items/`, los pasos actuales en `active/` y
la evidencia de ejecución terminada en `completed/`. Ver [workflow](workflow.md).

Status: IOP-001 In progress (pilot priority confirmed; detailed validation pending);
IOP-002 In progress (backend complete: TypeScript + NestJS accepted in ADR-0006;
frontend/tooling remain open; [CSV/reporting evidence](../product/csv-and-reporting-reference.md)
is captured for that evaluation and linked ingestion/analytics contexts;
[local delivery/tooling review](items/IOP-002-delivery-tooling-review.md) records
confirmed requirements and Proposed ADR-0009). IOP-139 Completed
(planning migration). IOP-140 Completed (English project-language rule).
All other tasks are Proposed; no application implementation exists.
The owner has narrowed v1 to CSV → preparation → analysis → presentation.
Asset Locator, maps and plant surveys are deferred, not v1 prerequisites. The broader
inventory includes future platform work, not v1 commitments. Use the current
[v1 scope](../product/scope-v1.md) before activating any item.
El alcance final de v1 se valida con IOP-001; este inventario no promete las 138
entregas en v1 ni autoriza ejecución automática. Hitos son agrupaciones, no waterfall.

La numeración ampliada sustituye la baseline inicial de 15 tareas:
[tabla de equivalencias e historial](legacy-backlog-map.md). No reutilizar IDs a
partir de esta migración. IOP-017 es frontend; IOP-032 es asset hierarchy;
IOP-040 es asset search; la release es IOP-138.

## M1 — Product & Architecture Definition

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-001 — Validate v1 personas and pilot workflow](items/IOP-001-v1-personas-and-pilot-workflow.md) | In progress |
| [IOP-002 — Select backend, frontend and tooling](items/IOP-002-technology-stack.md) | In progress |
| [IOP-003 — Definir estilo API y contratos](items/IOP-003-api-contract-strategy.md) | Proposed |
| [IOP-004 — Diseñar scope Organization/Site](items/IOP-004-platform-scope-model.md) | Proposed |
| [IOP-005 — Diseñar tenancy/data isolation](items/IOP-005-tenancy-and-data-isolation.md) | Proposed |
| [IOP-006 — Diseñar modelo RBAC](items/IOP-006-rbac-model.md) | Proposed |
| [IOP-007 — Diseñar autenticación](items/IOP-007-authentication-model.md) | Proposed |
| [IOP-008 — Definir manejo temporal](items/IOP-008-time-and-timezone-model.md) | Proposed |
| [IOP-009 — Diseñar audit trail](items/IOP-009-audit-model.md) | Proposed |
| [IOP-010 — Diseñar background jobs](items/IOP-010-background-job-model.md) | Proposed |
| [IOP-011 — Definir file/map storage](items/IOP-011-file-storage-model.md) | Proposed |
| [IOP-012 — Definir source integration contract](items/IOP-012-source-integration-contract.md) | Proposed |
| [IOP-013 — Definir observability baseline](items/IOP-013-observability-baseline.md) | Proposed |
| [IOP-014 — Definir security baseline](items/IOP-014-security-baseline.md) | Proposed |

## M2 — Development Platform Foundation

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-015 — Crear Docker development environment](items/IOP-015-local-development-environment.md) | Proposed |
| [IOP-016 — Bootstrap backend](items/IOP-016-backend-bootstrap.md) | Proposed |
| [IOP-017 — Bootstrap frontend](items/IOP-017-frontend-bootstrap.md) | Proposed |
| [IOP-018 — Configuración y environments](items/IOP-018-configuration-management.md) | Proposed |
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
| [IOP-028 — Local authentication adapter](items/IOP-028-local-authentication.md) | Proposed |
| [IOP-029 — Authorization/RBAC](items/IOP-029-rbac-enforcement.md) | Proposed |
| [IOP-030 — User/site membership](items/IOP-030-membership-model.md) | Proposed |
| [IOP-031 — Admin foundation](items/IOP-031-administration-foundation.md) | Proposed |

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
| [IOP-091 — Downtime KPI](items/IOP-091-downtime.md) | Proposed |
| [IOP-092 — Trend analysis](items/IOP-092-event-trends.md) | Proposed |
| [IOP-093 — Pareto analysis](items/IOP-093-pareto.md) | Proposed |
| [IOP-094 — Asset analytics](items/IOP-094-asset-analytics.md) | Proposed |
| [IOP-095 — Area analytics](items/IOP-095-area-analytics.md) | Proposed |
| [IOP-096 — Drill-down](items/IOP-096-analytics-drilldown.md) | Proposed |
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
| [IOP-103 — CSV integration](items/IOP-103-csv-integration.md) | Proposed |
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
| [IOP-125 — Synthetic event history](items/IOP-125-demo-events.md) | Proposed |
| [IOP-126 — Synthetic workforce](items/IOP-126-demo-workforce.md) | Proposed |
| [IOP-127 — Synthetic maintenance](items/IOP-127-demo-maintenance.md) | Proposed |
| [IOP-128 — Demo reset](items/IOP-128-demo-reset.md) | Proposed |

## M17 — v1 Validation & Release

| Contexto de tarea | Estado |
| --- | --- |
| [IOP-129 — End-to-end scenario](items/IOP-129-end-to-end-scenario.md) | Proposed |
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
