# IOP-097 — Shared fixture filters

Status: Completed — fixture UI increment; parent remains Blocked.
Authorization: owner's 2026-09-26 request to work on IOP-097 within the POC.
Branch: `feature/IOP-097-fixture-filters`, created from clean `develop` before edits.
Scope: [IOP-097](../items/IOP-097-analytics-filters.md), limited by the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).

## Dependencies and selected increment

IOP-008/ADR-0016 and ADR-0023 are accepted. IOP-089 is now Blocked with
Accepted ADR-0028 and a bounded query contract, superseding this item's older
Proposed dependency wording. IOP-043 supplies completed aggregate design;
IOP-048 has internal reconciliation evidence; IOP-049 supplies pure classification.
Production OIP storage, queries and ADR-0018 host activation remain missing.
Read dependency stories are already English; no translations are needed.

Implement the explicitly permitted independent fixture UI increment. Keep the
existing disconnected/state preview and add an opt-in fictional filter preview.
One page-session selection serves overview and detail, including navigation via
import. Draft dates/dimensions apply atomically; exclusions, unclassified values,
reset and drill-down/back remain visible. A tiny fixed fictional dataset illustrates
matching totals and coverage; it is not an API contract, production OIP query
implementation, access check or import/reconciliation certification.

## Files and steps

1. Add `apps/web/src/fixture-filters.ts` and `FixtureFilters.tsx` for isolated
   fictional data, calendar-label validation, shared draft/applied selection,
   exact selection preview, coverage and reversible drill-down. No new dependency,
   endpoint, generated contract, architectural pattern, chart or persistence.
2. Integrate in `App.tsx` and `style.css`, retaining existing preview behavior.
   Use labelled native controls and readable laptop/tablet/compact layouts.
3. Add focused web unit/component and browser tests for calendar bounds, OR/AND,
   exclusion conflicts, missing coverage versus empty matches, repeated labels,
   unclassified records, atomic edits and navigation/reset/back. Verify no business
   requests, keyboard use and layout. Keep production denial/revision/pagination
   evidence explicitly pending; the fixed synchronous fixture has no late responses.
4. Update web README, IOP-097 item, its backlog row, delivery map and architecture's
   IOP-097 summary to describe this increment and remaining gates accurately.

## Validation and closure

Run web type checks/unit tests, root `npm test` and browser tests with existing
tooling; inspect preview screenshots. Check changed Markdown links, status/IDs,
`git diff --check` and staged secret checks. Record actual evidence, archive this
plan when the fixture increment finishes and commit locally. Keep the parent
Blocked and real-data acceptance unchecked. Ask separately before publication.

## Evidence — 2026-09-26

- `npm run typecheck`: passed across web, API and database tooling.
- Root `npm test`: passed (9 secret checks, 247 API, 20 web and 77 database
  configuration unit tests), including builds and generated health-contract parity.
- `npm run test:e2e --workspace @iop/web`: all 16 browser tests passed in 42.3s,
  including four new filter scenarios and the existing navigation/state/accessibility
  suite. New checks cover keyboard selection, atomic apply, invalid/empty outcomes,
  scope-preserving reset, reversible drill-down and navigation through import.
- Verified fixed literal totals: latest date 8 occurrences / 90,140 seconds / four
  records; both dates 10 / 90,200 / five. Unclassified and repeated rows remain;
  mapped zero measures do not become missing imports.
- Inspected `apps/web/test-results/filters-640.png` and `filters-768.png`: controls,
  active selections, coverage and results readable without clipping. Browser layout
  checks also pass at 1366px. Screenshots remain ignored validation artifacts.
- Initial sandboxed HTTP/browser attempts could not bind local sockets (EPERM);
  reruns with approved execution permissions passed. Used the existing Node runtime
  at `/private/tmp/iop-017-runtime/node_modules/.bin` for full validation.
- No database integration run: no storage/API code changed. No production
  authorization, asynchronous response, cursor, revision refresh or end-to-end
  CSV reconciliation evidence is claimed. Those remain the parent delivery gates.

Documentation validation passed: 251 relative links resolved, item/backlog remain
Blocked with production criteria unchecked, and `git diff --check` passed. No merge or push is authorized by this increment.
