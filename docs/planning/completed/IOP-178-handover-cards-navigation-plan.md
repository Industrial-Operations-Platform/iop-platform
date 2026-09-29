# IOP-178 — Journal cards and view-aware breadcrumbs

Status: Completed and published; local Docker activated. Owner-authorized UI correction, 2026-09-29.
Branch: `fix/IOP-178-handover-cards-navigation`, from clean develop at `fa0b82b`.
Scope: [item](../items/IOP-178-handover-cards-navigation.md).

## Changes and steps

1. Extract MeetingCards into the feature-owned `EntrySummaryCards.tsx`; consume it
   in `MeetingCanvas.tsx`, `CategoryBoard.tsx` and the meeting pending list in
   `HandoverWorkspace.tsx`. Rename its scoped CSS to reflect shared summary use.
   Keep the existing shared Button/Panel identity and configured labels.
2. Extend `HandoverHeading.tsx` with the current view and optional return action;
   pass both module-home and view-return callbacks through `EntryDetail.tsx`.
   Closing detail clears only its selection, preserving workspace tab/filter/page
   state. Keep explicit module-home reset separate.
3. Update the existing handover browser journey to cover Journal/Meeting card
   equality, visible paths and return to every tab, including date and search
   retention, pagination and keyboard navigation. Include Daily overview coverage
   in the existing administrator journey. Build and run web/architecture checks;
   inspect desktop/mobile screenshots and preserve the IOP-176 action spacing.
4. Synchronize navigation/card behavior in `docs/development/shift-handover.md`
   and `docs/design/visual-identity.md`. Check links, IDs, statuses and diff;
   record evidence, archive this plan and commit locally.

The existing React adapter owns selection/presentation; domain/application and
shared component boundaries stay unchanged under Accepted ADR-0032/0036.
Publication and local Docker activation were explicitly approved and completed;
see the [activation record](IOP-178-publication-plan.md).

## Evidence and closure

- `EntrySummaryCards` now owns the common Journal/Meeting card markup and scoped
  CSS. Journal keeps its three-entry preview, category creation and history count;
  full report metadata remains in detail. Removed the obsolete preview-button rule.
- Headings show the active tab and add Details when a report is open. View return
  clears only the selected detail, while explicit module/sidebar home still resets
  to Journal. Existing selection and page state stay in the feature React adapter.
- Web build/typecheck passed on Node 24.21.0 (existing bundle-size warning).
  All 74 web tests and all 10 hexagonal-boundary tests passed.
- Four desktop/mobile browser scenarios passed at 1440px/375px. Coverage includes
  computed Journal/Meeting card equality, return to all four tabs, retained meeting
  date/department, loaded second matrix page, search text, sidebar/module reset,
  keyboard return, Daily overview label and existing action spacing/form checks.
- Inspected `/tmp/iop178-journal-{1440,375}.png` and
  `/tmp/iop178-detail-375.png`. Long breadcrumb paths wrap within mobile width.
- Logs: `/tmp/iop178-build.log`, `/tmp/iop178-web-tests.log`,
  `/tmp/iop178-boundaries.log`, `/tmp/iop178-browser.log`.
- Documentation links, IDs/statuses and diff whitespace verified. No domain/API or
  live-data changes. [Publication and Docker activation](IOP-178-publication-plan.md)
  are complete.
