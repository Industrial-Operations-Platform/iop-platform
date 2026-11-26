# IOP-245 — Locator return navigation plan

Status: Completed locally on 2026-11-26. Authorized by the owner's navigation defect report.
Branch: `fix/IOP-245-locator-return-navigation`, from clean develop `c2f6a70`.
[Scope](../items/IOP-245-locator-return-navigation.md).

## Changes and steps

1. Record the request and backlog entry. In `LocatorWorkspace.tsx`, distinguish
   returning to the current filtered overview/search from returning to the module
   home. Use the existing `SectionHeading` trail and shared actions to expose both
   paths above the viewer. Move the existing return action out of the bottom-only
   revision panel and retain its draft-discard text.
2. Reset the workspace to the unfiltered overview on a sidebar home visit without
   an exact scene/asset target. Invalidate outstanding detail requests so late
   responses cannot reopen a scene after returning home. Preserve explicit asset
   entry and camera continuity through the existing adapter lifecycle.
3. Extend German resources, Locator component regressions and existing Locator
   Playwright fixtures to cover grouped/filtered return, all scenes, sidebar
   reentry, search/deep entry, pending requests and draft discard. Inspect actual
   desktop/mobile screenshots and run relevant design/architecture/localization
   checks plus the web build. No API/persistence changes are planned.
4. Record evidence, check links/IDs/statuses and whitespace, complete the item and
   backlog, archive this plan and create a scoped local commit. Publication remains
   subject to the owner's separate approval.

Expected files: this item/plan, backlog, LocatorWorkspace.tsx, locator-de.ts,
locator.spec.tsx and locator-resources.spec.ts. Reuse existing host `homeVisit`
composition and shared identity; no new architectural pattern or story translation
is required. Add files only for necessary validation if recorded here first.

## Validation and evidence

Implemented a heading trail back to the retained overview/group or asset search,
with Back and All scenes actions above the viewer. The module heading and sidebar
restore the unfiltered overview. Existing request invalidation prevents late scene
responses from reopening a view after returning home. Camera continuity and the
Administrator-only guide/editor paths retain their existing ownership.

- Web Locator, view-state, geometry, localization and operational-access suites:
  66 tests passed, including eight new navigation cases covering retained filters,
  search return, module/sidebar reset, late requests, exact asset entry and explicit
  draft discard without saving.
- `npm.cmd run build --workspace @iop/web` passed TypeScript, all four design guard
  cases and Vite compilation. The existing large-chunk advisory remains.
- Shared architecture suite: all 26 cases passed with
  `npm.cmd test --workspace @iop/api -- --runTestsByPath test/hexagonal-boundaries.spec.ts`.
  No API/persistence implementation changed; full API/database suites were not run.
- Locator Playwright suite: all 14 scenarios passed. The three new cases exercise
  filtered group return, all scenes and actual sidebar reentry at 1440px English,
  390px English/Administrator and 390px German/dark. Existing hover, WebGL fallback,
  component selection and private-reference cases also passed. Browser requests
  used intercepted synthetic fixtures; no live business data was changed.
- Inspected `locator-return-navigation.png` screenshots in ignored
  `apps/web/test-results/` for the three new cases. Heading/actions follow the shared
  identity, fit both widths and remain above the viewer; overflow assertions passed.
- Clean-code review confirms presentation state stays in the existing React
  adapter, with shared heading/actions and existing host visit composition. No
  customer labels, transport contracts, permissions or architecture patterns changed.

Item/backlog completed and plan archived. All 254 local links in the item, plan
and backlog resolve; IDs/statuses are consistent and `git diff --check` passed.
No merge, push, deployment or private-model activation is included.
