# IOP-202 — Platform quality review

Reviewed on 2026-10-09 against `develop` `8aabbd2` and the isolated
`feature/IOP-202-platform-quality-theme` branch.
[Scope](../items/IOP-202-platform-quality-theme.md) and
[execution evidence](../completed/IOP-202-platform-quality-theme-plan.md).

## Coverage and interpretation

The structural scan covers all API/browser domain and application imports, shared
presentation dependencies, source styles/token references and generated transport
bindings. Source inventory: 101 API files (14,275 lines), 146 browser files
(28,836 lines, including 4,110 generated schema lines), 30 database files and 21
scripts; database/script counts include tests. Targeted source review examines
composition roots, scoped use-case ports, error sanitization, shared controls,
account/popover lifecycle, table prose, chart rendering and presentation resources.
Executable regressions cover the delivered behaviors; this is not a claim that
every line has been manually proven correct or every historical acceptance repeated.

All 146 Completed backlog entries have a permanent context with a completion marker
and linked execution/decision evidence. All local Markdown links in `docs/`,
`ARCHITECTURE.md` and `ROADMAP.md` resolve. The register below confirms documentary
closure/traceability. Decision/design/documentation items are verified against their
records; implementation items additionally rely on module regressions summarized
in the execution plan. Historical product acceptance and prior validation remain
attributed to their original evidence, not inferred from current unit tests.

## Findings and remedies

| Finding | Resolution |
| --- | --- |
| Workspace identity was light-only; surface color doubled as button text | Central semantic dark palette, independent action/notification foreground tokens, native color scheme and browser preference subscription |
| Charts used fixed light tokens and default ECharts labels/controls | Selected identity covers series, axes, legends, tooltips, visual maps and zoom; appearance changes remount charts without report requests |
| Final visual inspection found a pale dark-mode modal backdrop and clipped axis title | Independent overlay token darkens dialog context; aligned axis titles stay inside the plot, with SVG bounds checks |
| Translated series had English-only legend keys | Localize the matching legend keys; verify English/German in both appearances |
| Scatter/month comparisons repeatedly searched arrays | Stable keyed color/monthly-point maps replace repeated linear lookups |
| Secondary canvas labels and white primary-action labels fell below 4.5:1 | Adjust shared muted/primary tokens; assert contrast on intended semantic surfaces in both modes |
| Metric cards and very wide workspaces lacked balanced alignment | Center shared metric contents, bound/center workspace content and descriptions; retain narrative/form alignment and content-aware table justification |
| Light keyboard-focus outline needed stronger surface contrast | Shared amber focus role now passes 3:1 against canvas/surface; dark focus keeps its brighter role |
| Real database/browser journeys predated explicit IOP-201 sign-in | Reuse a test access helper and open the existing dialog; preserve authentication/permission assertions |
| Old browser fixtures omitted Handover context or ambiguously matched current/history text | Supply the empty module context and scope Maintenance checks to the current narrative |
| Capacity fixture opened 201 authorization connections at once | Seed sequentially; retain the bounded, exhaustive review/capacity assertion |
| Default shell selected Node 20 instead of required Node 24 | Run verification with installed Node 24.21.0/npm 10.9.2; no dependency or engine changes |

Domain/application ownership, authorization checks, pinned transactions, immutable
revisions, source semantics and schemas retain their accepted boundaries. Long host
compositions and the existing large analytical bundle remain review opportunities;
file length alone does not justify a speculative business rewrite. Pending
physical asset verification, formal shift identity, general Audit, release controls
and Proposed ADRs retain their existing scope/status.

## Completed-work traceability register

Each row confirms context, mirrored completion marker and resolving linked evidence.
It does not independently certify whole-platform product/release acceptance.

| Completed context | Evidence reviewed |
| --- | --- |
| [IOP-001 — Validate v1 personas and pilot workflow](../items/IOP-001-v1-personas-and-pilot-workflow.md) | [completed plan](../completed/IOP-001-v1-personas-and-pilot-workflow-plan.md) |
| [IOP-002 — Select backend, frontend and tooling](../items/IOP-002-technology-stack.md) | [completed backend plan](../completed/IOP-002-technology-stack-plan.md) |
| [IOP-003 — Define API style and contracts](../items/IOP-003-api-contract-strategy.md) | [Completed evaluation plan](../completed/IOP-003-api-contract-strategy-plan.md) |
| [IOP-004 — Design Organization/Site scope](../items/IOP-004-platform-scope-model.md) | [completed evaluation plan](../completed/IOP-004-platform-scope-model-plan.md) |
| [IOP-005 — Design tenancy and data isolation](../items/IOP-005-tenancy-and-data-isolation.md) | [completed proposal plan](../completed/IOP-005-tenancy-evaluation-plan.md) |
| [IOP-006 — Design the RBAC model](../items/IOP-006-rbac-model.md) | [completed evaluation plan](../completed/IOP-006-rbac-evaluation-plan.md) |
| [IOP-008 — Define the time and time-zone model](../items/IOP-008-time-and-timezone-model.md) | [evaluation plan](../completed/IOP-008-time-and-timezone-evaluation-plan.md) |
| [IOP-009 — Retain future audit design](../items/IOP-009-audit-model.md) | [completed proposal plan](../completed/IOP-009-audit-model-plan.md) |
| [IOP-011 — Define CSV preservation for the POC](../items/IOP-011-file-storage-model.md) | [completed plan](../completed/IOP-011-csv-preservation-plan.md) |
| [IOP-012 — Define the CSV source contract](../items/IOP-012-source-integration-contract.md) | [completed plan](../completed/IOP-012-csv-source-contract-plan.md) |
| [IOP-013 — Define local health and diagnostic logging](../items/IOP-013-observability-baseline.md) | [completed plan](../completed/IOP-013-local-health-logging-plan.md) |
| [IOP-014 — Define the local POC security baseline](../items/IOP-014-security-baseline.md) | [completed plan](../completed/IOP-014-security-baseline-plan.md) |
| [IOP-015 — Local Docker development environment](../items/IOP-015-local-development-environment.md) | [execution plan](../completed/IOP-015-local-development-environment-plan.md) |
| [IOP-016 — Bootstrap backend](../items/IOP-016-backend-bootstrap.md) | [execution plan](../completed/IOP-016-backend-bootstrap-plan.md) |
| [IOP-017 — Bootstrap frontend](../items/IOP-017-frontend-bootstrap.md) | [execution plan](../completed/IOP-017-frontend-bootstrap-plan.md) |
| [IOP-018 — Local configuration and environments](../items/IOP-018-configuration-management.md) | [completed execution plan](../completed/IOP-018-configuration-management-plan.md) |
| [IOP-019 — PostgreSQL + migrations](../items/IOP-019-database-bootstrap.md) | [completed implementation plan](../completed/IOP-019-database-bootstrap-plan.md) |
| [IOP-020 — Testing foundation](../items/IOP-020-testing-foundation.md) | [completed plan](../completed/IOP-020-poc-testing-foundation-plan.md) |
| [IOP-022 — API error model](../items/IOP-022-api-error-model.md) | [execution plan](../completed/IOP-022-api-error-model-plan.md) |
| [IOP-028 — Local authentication adapter](../items/IOP-028-local-authentication.md) | [execution evidence](../completed/IOP-165-transitional-access-plan.md) |
| [IOP-031 — Admin foundation](../items/IOP-031-administration-foundation.md) | [execution evidence](../completed/IOP-165-transitional-access-plan.md) |
| [IOP-034 — Asset lifecycle](../items/IOP-034-asset-lifecycle.md) | [execution evidence](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-037 — Asset aliases](../items/IOP-037-asset-aliases.md) | [execution evidence](../completed/IOP-194-equipment-catalog-refinement-plan.md) |
| [IOP-040 — Asset search](../items/IOP-040-asset-search.md) | [execution evidence](../completed/IOP-194-equipment-catalog-refinement-plan.md) |
| [IOP-041 — RAW ingestion model](../items/IOP-041-raw-ingestion-model.md) | [completed plan](../completed/IOP-041-raw-ingestion-model-plan.md) |
| [IOP-042 — Import batch model](../items/IOP-042-import-batches.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-043 — Event canonical model](../items/IOP-043-canonical-event-model.md) | [completed plan](../completed/IOP-043-canonical-event-model-plan.md) |
| [IOP-045 — CSV source adapter](../items/IOP-045-csv-adapter.md) | [execution record](../completed/IOP-045-csv-adapter-plan.md) |
| [IOP-046 — Data validation](../items/IOP-046-import-validation.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-047 — Deduplication/idempotency](../items/IOP-047-import-idempotency.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-048 — Reconciliation](../items/IOP-048-data-reconciliation.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-049 — Source aliases/mappings](../items/IOP-049-source-mappings.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-050 — Technician/team profiles](../items/IOP-050-workforce-profiles.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-051 — Team model](../items/IOP-051-team-model.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-052 — Shift type configuration](../items/IOP-052-shift-types.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-053 — Shift instances](../items/IOP-053-shift-instances.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-054 — Workplace/assignment targets](../items/IOP-054-assignment-targets.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-055 — Technician assignments](../items/IOP-055-shift-assignments.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-056 — Springer/floating assignment](../items/IOP-056-floating-assignments.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-057 — Personal schedule view](../items/IOP-057-my-schedule.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-058 — Team Leader planning view](../items/IOP-058-team-planning-view.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-059 — Assignment history](../items/IOP-059-assignment-history.md) | [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-061 — Handover categories](../items/IOP-061-handover-categories.md) | [execution evidence](../completed/IOP-168-shift-handover-implementation-plan.md) |
| [IOP-062 — Handover entries](../items/IOP-062-handover-entry.md) | [execution evidence](../completed/IOP-168-shift-handover-implementation-plan.md) |
| [IOP-064 — Open issues](../items/IOP-064-open-issues.md) | [execution evidence](../completed/IOP-194-linked-maintenance-plan.md) |
| [IOP-065 — Handover summary](../items/IOP-065-handover-summary.md) | [execution evidence](../completed/IOP-190-daily-handover-plan.md) |
| [IOP-068 — Maintenance record model](../items/IOP-068-maintenance-record.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-069 — Maintenance status workflow](../items/IOP-069-maintenance-status.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-070 — Priority model](../items/IOP-070-maintenance-priority.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-071 — Ownership](../items/IOP-071-maintenance-ownership.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-072 — Asset link](../items/IOP-072-maintenance-asset-link.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-073 — Maintenance Board](../items/IOP-073-maintenance-board.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-074 — Filter/search](../items/IOP-074-maintenance-filtering.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-075 — Maintenance history](../items/IOP-075-maintenance-history.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-084 — Asset timeline model](../items/IOP-084-asset-timeline.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-085 — Event history](../items/IOP-085-asset-event-history.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-086 — Maintenance history](../items/IOP-086-asset-maintenance-history.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-087 — Handover history](../items/IOP-087-asset-handover-history.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-088 — Asset detail page](../items/IOP-088-asset-detail-page.md) | [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md) |
| [IOP-089 — Analytics query layer](../items/IOP-089-analytics-query-layer.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-090 — Event frequency KPI](../items/IOP-090-event-frequency.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-091 — Accumulated alarm duration (POC)](../items/IOP-091-downtime.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-092 — Trend analysis](../items/IOP-092-event-trends.md) | [IOP-148 execution evidence](../completed/IOP-148-analytical-workspace-plan.md) |
| [IOP-094 — Source equipment analytics (POC)](../items/IOP-094-asset-analytics.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-095 — Area analytics](../items/IOP-095-area-analytics.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-096 — Analytical drill-down (connected POC delivered)](../items/IOP-096-analytics-drilldown.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-097 — Date/filter model (connected POC delivered)](../items/IOP-097-analytics-filters.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-103 — Manual CSV delivery validation](../items/IOP-103-csv-integration.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-109 — Secrets handling](../items/IOP-109-secret-management.md) | [execution plan](../completed/IOP-109-poc-secrets-plan.md) |
| [IOP-110 — Input validation](../items/IOP-110-input-validation.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-116 — App navigation](../items/IOP-116-navigation.md) | [completed evidence](../completed/IOP-116-navigation-plan.md) |
| [IOP-117 — Role-aware home](../items/IOP-117-role-home.md) | [execution evidence](../completed/IOP-192-operational-cards-account-plan.md) |
| [IOP-120 — Empty/error/loading states](../items/IOP-120-ui-states.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-121 — Responsive baseline](../items/IOP-121-responsive-ui.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-122 — Accessibility baseline](../items/IOP-122-accessibility.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-123 — Synthetic organization](../items/IOP-123-demo-organization.md) | [execution plan](../completed/IOP-123-demo-organization-plan.md) |
| [IOP-125 — Synthetic analytical CSV fixtures](../items/IOP-125-demo-events.md) | [completed plan](../completed/IOP-125-analytical-fixtures-plan.md) |
| [IOP-126 — Synthetic workforce](../items/IOP-126-demo-workforce.md) | [execution evidence](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-127 — Synthetic maintenance](../items/IOP-127-demo-maintenance.md) | [disposition evidence](../completed/IOP-127-poc-disposition-plan.md) |
| [IOP-128 — Demo reset](../items/IOP-128-demo-reset.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-129 — POC end-to-end demonstration](../items/IOP-129-end-to-end-scenario.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-132 — Data reconciliation](../items/IOP-132-final-reconciliation.md) | [IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-136 — User documentation](../items/IOP-136-user-guide.md) | [IOP-147 evidence](../completed/IOP-147-working-analytical-poc-plan.md) |
| [IOP-139 — Planning workflow](../items/IOP-139-planning-workflow.md) | [Completed execution plan](../completed/IOP-139-planning-workflow-plan.md) |
| [IOP-140 — English project language](../items/IOP-140-english-project-language.md) | [Plan](../completed/IOP-140-english-project-language-plan.md) |
| [IOP-141 — Story branches and review workflow](../items/IOP-141-branch-workflow.md) | [Plan](../completed/IOP-141-branch-workflow-plan.md) |
| [IOP-142 — Align delivery with a fast analytical POC](../items/IOP-142-poc-delivery-scope.md) | [plan](../completed/IOP-142-poc-delivery-scope-plan.md) |
| [IOP-143 — Local agent instructions and concise documentation](../items/IOP-143-concise-workflow.md) | [plan](../completed/IOP-143-concise-workflow-plan.md) |
| [IOP-144 — Recommend four next POC stories](../items/IOP-144-poc-next-stories.md) | [plan](../completed/IOP-144-poc-next-stories-plan.md) |
| [IOP-146 — Review POC coverage and closure dependencies](../items/IOP-146-poc-readiness-review.md) | [Readiness review](../completed/IOP-146-poc-readiness-review.md) |
| [IOP-195 — Reconcile delivered capabilities and remaining development](../items/IOP-195-development-status.md) | [completed plan](../completed/IOP-195-development-status-plan.md) |
| [IOP-197 — Integrate retained branches into develop and origin](../items/IOP-197-branch-integration.md) | [completed plan](../completed/IOP-197-branch-integration-plan.md) |
| [IOP-145 — Preserve owner-supplied CSV reference files](../items/IOP-145-csv-reference-files.md) | [plan](../completed/IOP-145-csv-reference-files-plan.md) |
| [IOP-147 — Complete the working analytical POC](../items/IOP-147-working-analytical-poc.md) | [IOP-146](../completed/IOP-146-poc-readiness-review.md) |
| [IOP-148 — Historical analysis workspace and import preparation](../items/IOP-148-analytical-workspace.md) | [plan](../completed/IOP-148-analytical-workspace-plan.md) |
| [IOP-149 — Containerized local platform and historical seed](../items/IOP-149-local-stack-history.md) | [plan](../completed/IOP-149-local-stack-history-plan.md) |
| [IOP-150 — Reusable frontend identity components](../items/IOP-150-reusable-ui.md) | [plan](../completed/IOP-150-reusable-ui-plan.md) |
| [IOP-151 — Consolidate current platform documentation](../items/IOP-151-documentation-cleanup.md) | [plan](../completed/IOP-151-documentation-cleanup-plan.md) |
| [IOP-152 — Complete and verify the local analytical POC](../items/IOP-152-poc-readiness.md) | [plan](../completed/IOP-152-poc-readiness-plan.md) |
| [IOP-153 — Monthly Executive Overview and comparative KPIs](../items/IOP-153-monthly-executive.md) | [execution](../completed/IOP-153-monthly-executive-plan.md) |
| [IOP-154 — Taskforce view and file administration](../items/IOP-154-taskforce-administration.md) | [execution](../completed/IOP-154-taskforce-administration-plan.md) |
| [IOP-155 — Exclude Sundays from analysis](../items/IOP-155-analysis-calendar.md) | [execution](../completed/IOP-155-analysis-calendar-plan.md) |
| [IOP-156 — Source-file filters and aligned headers](../items/IOP-156-source-file-filters.md) | [execution](../completed/IOP-156-source-file-filters-plan.md) |
| [IOP-157 — Dependent source-file filters](../items/IOP-157-dependent-file-filters.md) | [execution](../completed/IOP-157-dependent-file-filters-plan.md) |
| [IOP-158 — Import administration workspace](../items/IOP-158-import-administration.md) | [execution](../completed/IOP-158-import-administration-plan.md) |
| [IOP-159 — Brand navigation to Start](../items/IOP-159-brand-start-navigation.md) | [execution](../completed/IOP-159-brand-start-navigation-plan.md) |
| [IOP-160 — Monthly Halle comparison and collapsed filter reset](../items/IOP-160-month-comparison.md) | [execution](../completed/IOP-160-month-comparison-plan.md) |
| [IOP-161 — Visible trend time controls](../items/IOP-161-trend-time-controls.md) | [execution](../completed/IOP-161-trend-time-controls-plan.md) |
| [IOP-162 — Consistent monthly filters in the running workspace](../items/IOP-162-shared-month-filters.md) | [execution](../completed/IOP-162-shared-month-filters-plan.md) |
| [IOP-163 — Selected-month component totals and Pareto charts](../items/IOP-163-component-pareto.md) | [execution](../completed/IOP-163-component-pareto-plan.md) |
| [IOP-164 — Hexagonal boundaries and artifact cleanup](../items/IOP-164-hexagonal-cleanup.md) | [Execution plan](../completed/IOP-164-hexagonal-cleanup-plan.md) |
| [IOP-165 — Operational home and transitional access](../items/IOP-165-operational-home.md) | [login layout evidence](../completed/IOP-165-login-layout-plan.md) |
| [IOP-166 — Reset the file selection after successful import](../items/IOP-166-import-form-reset.md) | [execution](../completed/IOP-166-import-form-reset-plan.md) |
| [IOP-167 — Restrict user management to administration mode](../items/IOP-167-users-administration-mode.md) | [completed execution plan](../completed/IOP-167-users-administration-mode-plan.md) |
| [IOP-168 — Operational Shift Handover](../items/IOP-168-shift-handover.md) | [Completed discovery plan](../completed/IOP-168-shift-handover-discovery-plan.md) |
| [IOP-169 — Handover board and guided follow-up](../items/IOP-169-handover-board.md) | [Execution plan](../completed/IOP-169-handover-board-plan.md) |
| [IOP-170 — Administrator workspace and profile views](../items/IOP-170-administrator-workspace.md) | [completed execution plan](../completed/IOP-170-administrator-workspace-plan.md) |
| [IOP-171 — Restrict Technician analytical access](../items/IOP-171-technician-access.md) | [completed execution plan](../completed/IOP-171-technician-access-plan.md) |
| [IOP-172 — Department summary spacing](../items/IOP-172-department-summary-spacing.md) | [execution evidence](../completed/IOP-172-department-summary-spacing-plan.md) |
| [IOP-173 — Handover demonstration data](../items/IOP-173-handover-demo-data.md) | [execution evidence](../completed/IOP-173-handover-demo-data-plan.md) |
| [IOP-174 — Handover navigation and layout](../items/IOP-174-handover-navigation-layout.md) | [execution evidence](../completed/IOP-174-handover-navigation-layout-plan.md) |
| [IOP-175 — Consistent handover detail heading](../items/IOP-175-handover-detail-heading.md) | [plan](../completed/IOP-175-handover-detail-heading-plan.md) |
| [IOP-176 — Handover detail action spacing](../items/IOP-176-handover-action-spacing.md) | [plan](../completed/IOP-176-handover-action-spacing-plan.md) |
| [IOP-177 — Enforce the shared platform visual identity](../items/IOP-177-platform-visual-identity.md) | [plan](../completed/IOP-177-platform-visual-identity-plan.md) |
| [IOP-178 — Consistent journal cards and contextual detail navigation](../items/IOP-178-handover-cards-navigation.md) | [plan](../completed/IOP-178-handover-cards-navigation-plan.md) |
| [IOP-179 — Distinguish entry titles from section headings](../items/IOP-179-handover-entry-title-style.md) | [plan](../completed/IOP-179-handover-entry-title-style-plan.md) |
| [IOP-180 — Polish operational summaries and shared visual hierarchy](../items/IOP-180-operational-visual-polish.md) | [plan](../completed/IOP-180-operational-visual-polish-plan.md) |
| [IOP-181 — Refine operational selection, matrix and personal entries](../items/IOP-181-handover-view-polish.md) | [plan](../completed/IOP-181-handover-view-polish-plan.md) |
| [IOP-182 — Structured entry details and neutral Start selection](../items/IOP-182-entry-detail-neutral-start.md) | [plan](../completed/IOP-182-entry-detail-neutral-start-plan.md) |
| [IOP-183 — Compact Start category tabs](../items/IOP-183-compact-start-tabs.md) | [plan](../completed/IOP-183-compact-start-tabs-plan.md) |
| [IOP-184 — M6 Workforce delivery](../items/IOP-184-m6-workforce.md) | [Execution plan](../completed/IOP-184-m6-workforce-plan.md) |
| [IOP-185 — Administration and Workforce interface consistency](../items/IOP-185-administration-workforce-ui.md) | [Execution plan](../completed/IOP-185-administration-workforce-ui-plan.md) |
| [IOP-186 — Table headings and operational card alignment](../items/IOP-186-table-card-alignment.md) | [Execution evidence](../completed/IOP-186-table-card-alignment-plan.md) |
| [IOP-187 — Compact Workforce matrices and shared table alignment](../items/IOP-187-compact-workforce-tables.md) | [Execution evidence](../completed/IOP-187-compact-workforce-tables-plan.md) |
| [IOP-188 — User directory controls and current operational names](../items/IOP-188-user-directory-refinements.md) | [Execution plan](../completed/IOP-188-user-directory-refinements-plan.md) |
| [IOP-189 — Local test-account password reset](../items/IOP-189-local-test-passwords.md) | [Execution plan](../completed/IOP-189-local-test-passwords-plan.md) |
| [IOP-190 — Daily Handover views and focused table filters](../items/IOP-190-daily-handover.md) | [Execution plan](../completed/IOP-190-daily-handover-plan.md) |
| [IOP-191 — Operational controls and contextual navigation](../items/IOP-191-operational-controls.md) | [Execution plan](../completed/IOP-191-operational-controls-plan.md) |
| [IOP-192 — Operational cards, account controls and entry notifications](../items/IOP-192-operational-cards-account.md) | [Execution evidence](../completed/IOP-192-operational-cards-account-plan.md) |
| [IOP-193 — Compact account menu and pending department matrix](../items/IOP-193-compact-account-pending-matrix.md) | [execution evidence](../completed/IOP-193-compact-account-pending-matrix-plan.md) |
| [IOP-194 — Maintenance Management and Digital Asset Record](../items/IOP-194-maintenance-asset-history.md) | [execution plan](../completed/IOP-194-linked-maintenance-plan.md) |
| [IOP-196 — Personal Start and operational workflows](../items/IOP-196-personal-operational-workflows.md) | [plan](../completed/IOP-196-personal-operational-workflows-plan.md) |
| [IOP-198 — Start assignment layout and operational presentation](../items/IOP-198-start-assignment-layout.md) | [plan](../completed/IOP-198-start-assignment-layout-plan.md) |
| [IOP-199 — Handover category workflows](../items/IOP-199-handover-category-workflows.md) | [completed plan](../completed/IOP-199-handover-category-workflows-plan.md) |
| [IOP-200 — Project state and native development travel guide](../items/IOP-200-native-development-guide.md) | [completed plan](../completed/IOP-200-native-development-guide-plan.md) |
| [IOP-201 — Minimal presentation home and existing sign-in](../items/IOP-201-platform-landing.md) | [Initial delivery](../completed/IOP-201-platform-landing-plan.md) |
