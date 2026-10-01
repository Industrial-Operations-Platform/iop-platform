# IOP-187 — Table content and summary refinement

Status: Completed

Authorization: [owner refinement](../items/IOP-187-compact-workforce-tables.md).
Continue `fix/IOP-187-compact-workforce-tables`, originally created from `develop`;
the owner is refining the same unmerged story after commit `5bb878f`.

## Changes and steps

1. Shared presentation: center all column headers, retain left-aligned first body
   cells and centered remaining cells. Add a reusable `TableText` presentation
   component that justifies prose above two rendered lines and responds to resize.
   Use it for handover excerpts/title text and analytical table descriptions,
   source text and diagnostics; short values retain column alignment.
2. Shift Handover adapters: left-align the What? button without changing its
   metadata; stack status badges. Use one category badge mapping in matrix, summary
   and detail, adding a shared warning tone for Safety. Emphasize personal card
   entry dates and responsible names using existing typography roles.
3. Workforce `PlanBoard.tsx`: names only for daily leaders; name/shift summaries for
   floating support/maintenance. Preserve record selection and full details.
4. Synchronize shared component README, visual identity, item and backlog. Run
   frontend tests/build and architecture guards. Run existing browser journeys
   and inspect desktop/mobile matrix, cards, categories and short/long prose,
   including resize across the two-line threshold.
5. Record evidence, validate documentation links/statuses, complete the item and
   move this plan to completed; commit the coherent refinement locally.

Ownership: shared design and feature React adapters only. Reuses ADR-0032 and the
existing component composition pattern; no domain rules, API, persistence or new
architecture. Category presentation maps stable IDs in the outer Handover adapter;
configured labels remain intact. No translation edits are required.

## Validation and evidence

Validated on 2026-10-01 with Node 24.21.0:

- Frontend Jest: 21 suites / 91 tests passed, including identity/component guards.
- API `hexagonal-boundaries`: 12 checks passed.
- Frontend TypeScript/production build passed; the existing bundle-size advisory
  remains.
- Existing administration/workforce, handover navigation and analytical month
  comparison browser suites: seven journeys passed at 1440/375px, with handover
  also checked at 820px. Fixture records now include floating support and a blocked
  issue. The handover journey exercises prose changing between more than two and
  two lines as the viewport changes, then restores the original width. Its first
  fixture remained three lines at the shell's maximum width; shortening the sample
  to cross the intended threshold made the resize check pass without a code change.
- Inspected `/tmp/iop-187-day-{1440,375}.png`,
  `/tmp/iop182-matrix-{1440,820}.png`, `/tmp/iop182-matrix-status-375.png` and
  `/tmp/iop182-mine-{1440,820}.png`: centered first headers, left-leading titles,
  justified excerpts, stacked states, compact duty summaries and emphasized
  personal facts with colored categories. Bounded mobile scrolling and existing
  keyboard/detail navigation checks passed.

Browser runs used `/tmp/iop-187-playwright.config.cjs` on isolated port 4176 with
deterministic HTTP fixtures. No running Docker service or persistent data changed.

## Outcome and closure

Presentation remains in the shared design library and React adapters. The shared
prose component observes rendered size and disconnects its observer on unmount;
short text inherits its column alignment. Handover category IDs choose presentation
tones without changing configured labels, application rules or data contracts.
No architecture or translation changes were required. Item/backlog and canonical
design guidance are synchronized; local links, statuses and `git diff --check`
passed before committing. Publication/merge and Docker activation remain unapproved.
