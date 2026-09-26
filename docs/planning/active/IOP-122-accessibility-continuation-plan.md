# IOP-122 — POC accessibility continuation

Status: Blocked — real analytical controls and data are not delivered.
Authorization: owner's 2026-09-26 IOP-122 request, limited to the POC.
Branch: `docs/IOP-122-accessibility-continuation`, created from clean `develop`
before edits. Item: [IOP-122](../items/IOP-122-accessibility.md).

## Scope and dependencies

Follow the [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). Preserve the integrated
[preview accessibility evidence](../completed/IOP-122-accessibility-plan.md).
IOP-116 navigation is completed; IOP-120 supplies simulated states but its runtime
continuation is Blocked. Both dependency contexts are English; no translation is
needed. The existing accessibility branch is an ancestor of develop.

`apps/web/src/App.tsx` and `AnalyticalStates.tsx` contain navigation and simulated
states, without upload, functional filters, charts or result tables. The API source
and OpenAPI expose health only. ADR-0018 is Accepted, but local runtime access is
not implemented; older IOP-116 wording calling it Proposed is historical.
No new architecture decision is required for this review.

## Files and steps

1. Create this plan before other edits. Update only the IOP-122 item and its backlog
   status to record the missing capabilities and link this continuation.
2. Recheck existing keyboard, labels, focus recovery and contrast browser tests.
   Preserve existing implementation; do not invent analytical controls or start
   adjacent import, analytics, filter or authorization stories.
3. Resume when owning stories deliver POC analytical controls/data. Independent
   fixture controls can be reviewed as soon as available; real request/recovery
   checks also need analytical contracts and validated scoped local access.
4. Before implementation, refine this plan with the delivered components/contracts
   and exact files. Expected targets are web view/control components, styles,
   RTL/Playwright tests and web README, plus this item/backlog.
5. Verify names/descriptions, keyboard operation and focus through filters,
   overview/detail drill-down and return, loading/error/empty states and recovery.
   Verify chart data alternatives and table semantics with actual delivered data;
   retain units, coverage distinctions and metric limits. Check text contrast at
   least 4.5:1 and control/focus contrast at least 3:1 on laptop/tablet surfaces.

## Validation and closure

For this documentation increment, build current hosts and run the existing
`accessibility.spec.ts` Playwright suite; inspect OpenAPI paths and validate changed
Markdown links, IDs/status consistency and `git diff --check`. Record actual results
below. This is preview regression evidence, not real analytical UI acceptance or
screen-reader speech verification.

For delivered UI changes, run `npm run typecheck`, `npm test` and
`npm run test:e2e`, with manual assistive-technology verification of delivered
controls/data and status announcements. Record actual coverage and limitations.
Check the remaining item criterion and move this plan to completed only when its
real analytical accessibility scope is verified. Commit this documentation increment
while the parent/continuation remain Blocked. Publication requires owner approval.

## Review evidence — 2026-09-26

- `npm run build`: passed for API, web and database tooling using the existing
  runtime via `PATH=/private/tmp/iop-121-bin:$PATH`.
- `npm run test:e2e --workspace @iop/web -- accessibility.spec.ts`: 2 Chromium
  tests passed at 768px and 1366px, covering keyboard navigation, labels, polite
  status semantics, recovery focus and computed contrast. The first sandboxed
  attempt could not start the API listener; rerun with local listener permission
  passed. No application edits were needed.
- API controller inspection and `apps/api/contracts/openapi.json` confirm `/health`
  is the only current endpoint. Web source confirms only navigation/state previews.
- Relative links in all three changed Markdown files, item/backlog Blocked status
  consistency and `git diff --check` passed.
- Documentation review is complete; this plan stays active for the undelivered
  analytical UI. Existing preview evidence remains intact; real data controls and
  screen-reader speech remain unverified. No adjacent stories were implemented.
