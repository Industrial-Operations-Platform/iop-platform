# IOP-222 — Start Information execution

Completed locally. Authorized by the owner's 2026-11-07 request.
Branch: `feature/IOP-222-start-information`, created from clean `develop`.
[Permanent scope](../items/IOP-222-start-information.md).

## Implementation

1. Keep Information outside the profile slot in `WorkspaceApp` / `StartOverview`;
   render Profile first in both operational and Administrator Start compositions.
2. Replace Information's MeetingCanvas with a compact shared Panel and the existing
   EntrySummaryCards presentation, three initial previews, full-collection dialog,
   display-through metadata, manual refresh, automatic refresh and bounded paging.
   Feature CSS only arranges shared-token components; no new palette or typography.
3. Add German presentation strings and correct the five exact retained November
   demo Information records in Railway using current revisions and the existing
   Handover correction use case. Keep private operational scripts/evidence ignored.
4. Cover profile ordering, Information preview/full-collection/detail behavior,
   paging/refresh errors and responsive light/dark rendering. Run frontend build,
   relevant unit/browser tests, design and architecture guards; inspect screenshots.
5. Record actual evidence, archive this plan, synchronize the item/index and commit
   locally. Ask for approval before merge/push/deployment.

## Boundaries and review

Host owns cross-feature ordering; Shift Handover owns notice presentation. React
invokes the existing HandoverApplication; validation and corrections remain in
server use cases. Reuse the shared card system rather than duplicating report
cards. Repository workflow, architecture, ADR-0007/0008/0032 and visual identity
were reviewed. No unrelated active IOP-219 work is included.

## Validation

- `npm run build --workspace @iop/web`: passed, including TypeScript and all four
  design guards; only the existing bundle-size advisory remains.
- Focused frontend unit checks (`information-notices`, `start-overview`,
  `meeting-canvas`, `design-boundaries`): four suites / 12 tests passed. Verified
  three previews, original text rather than audit-note excerpts, full collection,
  exact detail identity, paging deduplication, failed-refresh recovery, stale page
  rejection and profile/fallback ordering.
- API `hexagonal-boundaries`: all 26 checks passed. No server source changed.
- Playwright: all eight scenarios passed against the production preview. Six new
  scenarios covered five German notices, first-card/profile order, light/dark at
  1440px/390px, Administrator/Technician compositions, no document overflow,
  collection contents, Escape/focus return and exact detail navigation. Two existing
  category-workflow scenarios passed at 1440px/375px. No browser errors occurred.
- Inspected desktop light Start, mobile dark Start, desktop dark collection and
  mobile light collection screenshots under ignored
  `apps/web/test-results/start-information/`. Shared card/panel typography, dates,
  wrapping and selected-appearance surfaces remained consistent.
- The first preview-owning test process needed its own Vite child stopped to
  finish Windows cleanup; it then exited successfully. A separate run reusing the
  same preview also exited successfully with eight passing scenarios in 9.2s.
  Temporary preview configuration and operational scripts remain ignored.
- Corrected exactly five retained November Information demo records in Railway:
  German titles/details, each at revision 2. The current use case verified each
  corrected snapshot. IDs, author, publication/display dates and prior revisions
  remain retained. Private evidence is in `tmp/november-demo-translate-apply.json`;
  the durable fixture manifest stays in `/data/demo-fixtures/`.
- `git diff --check` passed. Reviewed host slot ownership, shared-card reuse,
  application-only data access, current-revision corrections and refresh lifecycle.

## Closure

Implementation and requested data corrections are complete. The new UI is available
in the local build; Railway still serves the previous UI. Merge/push/deployment
require explicit owner approval under the repository workflow. No remote code refs,
permissions, schema or unrelated demo records were changed.
