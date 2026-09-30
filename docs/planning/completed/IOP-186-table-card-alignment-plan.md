# IOP-186 — Table headings and operational card alignment

Status: Completed

Authorization: owner request of 2026-10-01, captured in the
[item](../items/IOP-186-table-card-alignment.md).
Branch: `fix/IOP-186-table-card-alignment`, created from clean `develop`.

## Changes and steps

1. Update `apps/web/src/design/components/components.css` so column/group headers
   in `thead` and their sortable controls center in both axes. Retain body-cell
   presentation, including descriptive row headers used for names and entry titles.
2. Update Workforce `adapters/react/workforce.css` and `PlanBoard.tsx`: remove
   the left-aligned day-heading override, center daily leader headings, and give
   schedule person names and supporting cells consistent existing typography.
3. Correct `features/shift-handover/adapters/react/handover.css` so the existing
   dedicated `EntrySummaryCards` grid fills its content width without inheriting
   generic button centering. Keep all compact/expanded uses and long text bounded.
4. Synchronize the shared component README, visual identity, item and backlog.

Ownership: shared presentation library and Workforce/Shift Handover React adapters.
No application/domain, API, persistence or architectural changes. Existing accepted
ADR-0032 boundaries and identity tokens apply. The dependency story read is already
English; no translation edits are required. No active plans were found.

## Validation and evidence

Validated on 2026-10-01 using installed Node 24.21.0:

- `npm test --workspace @iop/web`: 21 suites, 91 tests passed, including shared
  identity and component-boundary guards. After restricting the final CSS rule to
  column/group headings, the two `design-boundaries` checks passed again.
- `npm test --workspace @iop/api -- --testPathPatterns hexagonal-boundaries`:
  12 checks passed, covering API and frontend inward dependencies.
- `npm run build --workspace @iop/web`: TypeScript and production build passed;
  the existing large-bundle advisory remains.
- Existing `administration-workforce-ui.spec.ts` and `handover-navigation.spec.ts`:
  five browser journeys passed at 1440/375px and 1440/820/375px respectively,
  repeated successfully after the final CSS refinement. Navigation, detail opening,
  schedule editing, keyboard interactions and page overflow assertions passed.
- Visually inspected `/tmp/iop-185-{matrix,day}-{1440,375}.png`,
  `/tmp/iop182-{journal,mine}-{1440,375}.png`, `/tmp/iop182-matrix-1440.png`, and
  `/tmp/iop183-start-{1440,375}.png`: centered column/group labels and daily shift
  headings, emphasized schedule names, left-aligned card content and narrow wrapping.
- `git diff --check` and changed-document local links/status consistency passed.

The default shell initially selected unsupported Node 20; validation was rerun
with the repository's Node 24. The existing API occupied port 3000. Browser checks
used `/tmp/iop-186-playwright.config.cjs` with an isolated preview on 4176 and the
existing deterministic HTTP fixtures, preserving the running application.

## Outcome and closure

The card regression came from generic button `justify-content: center` acting on
an intrinsic-width grid. The dedicated summary-card component now defines a bounded,
full-width column and its own content alignment. Column-header centering stays in
the shared table stylesheet and does not change body row labels or entry titles.
All acceptance criteria are complete; item/backlog and identity guidance agree.
No architecture/API/data changes or translation edits were needed. This increment
is ready for a local commit and owner review; publication and Docker activation
remain outside this request.
