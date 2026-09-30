# IOP-187 — Compact Workforce matrices and shared table alignment

Status: Completed

Authorization: [owner request and acceptance](../items/IOP-187-compact-workforce-tables.md).
Branch: `fix/IOP-187-compact-workforce-tables`, created from clean `develop`.

## Changes and steps

1. Update Workforce `adapters/react/PlanBoard.tsx` and `workforce.css` with a
   shared compact assignment slot and a zone-by-shift Other zones table. Keep the
   existing record selection/details and configured zone/shift labels.
2. Update shared `design/components/components.css` table alignment and badge
   padding; inspect feature overrides and adjust only conflicting table rules.
   Update Access user-table sizing/actions and Handover summary-card borders.
3. Synchronize `docs/design/visual-identity.md` and the shared components README.
4. Run frontend tests/build, API architecture checks and existing browser journeys;
   extend the relevant browser fixture/checks for matrix grouping, phone presence,
   details, table alignment and card styling. Inspect desktop/mobile screenshots.
5. Record results, check documentation links/statuses and diff whitespace, complete
   item/backlog, move this plan to completed and commit the validated increment.

Ownership: shared presentation library and Workforce, Access and Shift Handover
React adapters. No domain/application, transport, storage or architecture changes.
Existing accepted boundaries apply. Read dependency stories are already English;
no translation edits or unresolved prerequisite plans were found.

Publication/merge and running Docker activation are outside this implementation
request and require the owner's publication approval under the shared workflow.

## Validation and evidence

Validated on 2026-10-01 with Node 24.21.0:

- `npm test --workspace @iop/web`: 21 suites / 91 tests passed.
- `npm test --workspace @iop/api -- --testPathPatterns hexagonal-boundaries`:
  12 architecture checks passed.
- `npm run build --workspace @iop/web`: TypeScript and production build passed;
  the existing large-bundle advisory remains. After final CSS refinement, the
  build and both frontend design-boundary/identity checks passed again.
- `administration-workforce-ui.spec.ts` and `handover-navigation.spec.ts`: all five
  browser journeys passed, including a rerun against the final build. Viewports:
  1440/375px for administration/workforce and 1440/820/375px for handover.
  Extended the existing Workforce fixture to cover occupied/empty shift cells,
  assignments with/without phones, opening complete details from both matrices,
  keyboard entry and returning to the collection. Page overflow checks passed.
- Visually inspected `/tmp/iop-187-{matrix,day,users}-{1440,375}.png`,
  `/tmp/iop182-mine-{1440,375}.png` and `/tmp/iop182-matrix-1440.png`: compact
  names/icons, centered columns/actions, bounded scrolling, uniform card borders
  and closely padded badges. Screenshots use deterministic HTTP fixtures.

Browser validation used `/tmp/iop-187-playwright.config.cjs` and an isolated
preview on port 4176. The sandbox blocked the initial port bind; the approved
rerun succeeded. The running Docker application and persistent data were retained.

## Outcome and closure

Shared styling owns table alignment and badges. Workforce owns only its compact
record presentation and matrix composition; existing details, historical labels,
selection and data rules remain in their established layers. Removed the shared
summary-navigation top stripe as well as the My entries card stripe; preserved
hover/focus and semantic status colors. No API/domain changes or new architecture.
Item/backlog and identity guidance are synchronized. Local document links, IDs,
status consistency and `git diff --check` passed before the story commit.
