# IOP-196 — Personal operational workflows execution plan

Status: Completed. Authorized by the owner's 2026-10-06 request.
Branch: `feature/IOP-196-personal-operational-workflows`, created from `develop`.
Scope: [permanent item](../items/IOP-196-personal-operational-workflows.md).

## Changes and steps

1. Workforce owns pure calendar/statistics derivation from complete bounded boards;
   Workforce exposes an authorized personal-summary endpoint; host composes personal
   Start cards (including Administrator) with independent Maintenance/Handover reads.
   Update `features/workforce`, `host/WorkspaceApp`, Start presentation and localization.
2. Handover owns attention exclusion and revision-based personal closure counts,
   coordinator category rules, bounded image/mention validation and revision-backed
   notification delivery. Update its API domain/application/PostgreSQL adapter,
   host catalog/contracts and browser models/forms/details/notifications. Keep the
   local Handover demo adapter compatible by selecting a coordinator for restricted
   categories when preparing new manifests; never rewrite existing manifests.
3. Correct `HandoverHighlights` department defaults/other-department browsing and
   `HandoverWorkspace` daily date placement/current pending selection.
4. Maintenance browser application and React adapters add focused status actions
   using the existing save/revision contract and reusable `RepairScope` review.
5. Regenerate OpenAPI/browser bindings; update product/operator/ADR-0036 refinements
   and visual contract where the requested behavior supersedes earlier descriptions.

No schema migration or new architectural pattern is expected: additional bounded
content stays inside existing durable snapshots/revisions. Historical content lacking
new optional fields remains readable. Inspected dependency stories are already in
English; no translation-only edits are required.

## Validation and evidence

Validated on Node 24.21.0 with the installed lockfile dependencies:

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | API, web and database TypeScript passed |
| `npm test` | API 412, web 143 and database configuration 77 tests passed; builds, design/architecture guards and browser contract check passed |
| PostgreSQL Jest: `shift-handover`, `maintenance`, `assets`, `handover-demo` | 54 tests passed in 4 suites with disposable PostgreSQL and real scoped roles; included the real Handover browser journey |
| `npm run test:e2e --workspace @iop/web` | All 37 Chromium scenarios passed, including IOP-196 at 1440/375px |
| Real Nest/Supertest JSON budgets | Four checks passed: 150 KB accepted for Handover entries/change; 200 KB rejected; ordinary query retains 100 KiB limit |
| `npm run check:secrets`, `git diff --check`, documentation links | Passed; local links, IOP-196 identity and mirrored completion status checked |

New evidence covers configured Information authority and denied writes, bounded raster
content, exact-site mentions, updated recipient notification timestamps, distinct
attention/open totals, resolution-revision monthly counts, calendar rollover and
repeated-duty/weekend deduplication. Existing Maintenance tests retain atomic
included-report closure, scope review, stale revisions and source permissions.

Desktop/narrow screenshots were visually inspected for Start, historical daily review
and completion. Artifacts: `/tmp/iop-196-{start,week,daily-history,maintenance-completion}-{1440,375}.png`.
The mobile daily grid needed an explicit zero-minimum column; the final build does
not widen the page. Horizontal module-tab scrolling remains intentional. Temporary
source-report navigation suspends the completion modal while retaining its state.

## Outcome and closure

Implemented the complete requested refinement under existing owning ports/snapshots;
no migration, new grant or new architectural pattern was introduced. Administrator
retains its account/data overview alongside personal cards. New demo manifests use
coordinators for restricted categories; existing private manifests are unchanged.

Source commits: `4a33350` (API/contracts/context) and `22bcedc` (UI/localization/browser
regressions). Product/operator/design/data-model documentation and ADR-0036 refinement
are synchronized with the final behavior. Item/backlog are Completed and this plan
is retained under completed/. Owner product review and publication remain separate.

Counts describe recorded schedules/assignments, not attendance. Images are bounded
resized previews rather than retained original uploads. Notification read state is
browser-local. No persistent operator data, running Docker stack, remote refs or
long-lived branches were changed during implementation. The subsequent owner
request to unify every branch into develop and origin explicitly authorizes
publication; [IOP-197](../items/IOP-197-branch-integration.md) records its execution.
