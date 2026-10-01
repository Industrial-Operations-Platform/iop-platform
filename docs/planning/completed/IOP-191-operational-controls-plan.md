# IOP-191 — Execution plan

Status: Completed

Authorized by the owner's six interface requests on 2026-10-02.
Branch: `feature/IOP-191-operational-controls`, created from clean `develop`.
Scope: [permanent item](../items/IOP-191-operational-controls.md).

## Changes and steps

1. Extend shared date/filter presentation, icon action and breadcrumb components
   in `apps/web/src/design/components/`, using existing identity tokens.
2. Compose aligned Handover controls and category/detail return navigation in its
   React adapters. Keep selected day and department on category return.
3. Refine Available profiles and move creation into a dedicated access React modal;
   keep validation, failure feedback and one-time credentials visible.
4. Refine personal assignment presentation in Workforce `PlanBoard.tsx` and styles;
   retain distinct schedule availability when its hours differ from assignments.
   Add the shared form footer spacing to `AssignmentForm.tsx`; reuse the date field
   in Workforce's date selector and assignment editor.
5. Update English/German resources, component documentation and visual identity.
   Extend nearest behavior/browser suites for modal and navigation transitions.

Ownership remains in existing access, Handover and Workforce presentation adapters;
shared controls have no business dependencies. No new architectural pattern or
story translation is needed: the three dependency contexts read are English.

## Validation and evidence

All commands used the installed Node 24.21.0 toolchain.

- `npm run build --workspace @iop/web`: passed (TypeScript and Vite). The existing
  large-bundle advisory remains; this UI slice does not change bundling policy.
- `npm test --workspace @iop/web`: 21 suites, 94 tests passed, including shared
  identity/dependency guards and localization. The new modal regression caught
  initial focus being captured before modal open; focusing the name after open
  now preserves both initial focus and restoration on cancellation.
- `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  12 tests passed. No API, domain, persistence or authorization behavior changed.
- Playwright `daily-handover.spec.ts`, `administration-workforce-ui.spec.ts` and
  `handover-navigation.spec.ts`: 7 scenarios passed at 1440/820/375px. After final
  personal-card/form alignment and native username-pattern refinement, both
  administration/Workforce desktop/mobile scenarios passed again.
- Browser evidence verifies same-row desktop department/date controls, native date
  changes, category/entry/empty-category breadcrumb returns with day/department
  preserved, modal keyboard open/Escape/focus restoration, invalid username
  rejection, one display of assignment hours, and at least 16px field/action
  separation. Unit cases verify creation failure drafts, success credentials,
  cancellation, and distinct availability/no-assignment states.
- Manually inspected synthetic screenshots: `/tmp/iop-191-profiles-1440.png`,
  `/tmp/iop-191-create-user-375.png`, `/tmp/iop-191-day-{1440,375}.png`,
  `/tmp/iop-191-assignment-form-1440.png`,
  `/tmp/iop-191-journal-category-{1440,375}.png` and
  `/tmp/iop-191-daily-375.png`. No page-width overflow; existing wide tables remain
  contained in their keyboard-scrollable viewports.
- Browser servers required local-listener permission. The default API port 3000
  was already occupied, so temporary configuration under `/tmp/iop-191-*` used
  isolated ports 3011/4175 and test-owned HTTP fixtures. Existing processes,
  operator data and containers were not changed.
- Clean-code review: shared controls depend only on React/design/localization;
  feature adapters retain selection, modal and display composition. Native date
  values retain calendar-day strings. No new architectural decision is required.
- Documentation relative links, IOP-191 item/backlog/plan statuses and
  `git diff --check`: passed.

## Closure

All acceptance criteria are complete. Item/backlog and shared design documentation
are synchronized; this plan is moved to `completed/`. Validated changes are committed
locally for review. Merge/push and operator activation await explicit authorization.
