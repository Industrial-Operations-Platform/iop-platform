# IOP-238 — Reuse analytical reports during navigation

## Status and goal

Completed and published through develop to origin on 2026-11-13. The owner requested continuing the analytical loading
improvement after reviewing IOP-215's server cache and the repeated browser loads.
Keep visited reports available when switching tabs and returning to Data Analysis.

## Scope and acceptance

- [x] Reuse matching reports in bounded session memory, deduplicate simultaneous
  requests and retain the selected analysis view when returning from another module.
- [x] Separate authenticated sessions and complete source scopes. Clear results on
  explicit refresh, analytical preparation/import changes and observed revisions.
  Expire entries after five minutes and keep existing server authorization on reads.
- [x] Preserve filters, month comparisons, drill-down, pinned weekly/daily revisions,
  empty results and retry behavior. Late requests cannot refill an invalidated cache.
- [x] Update existing chart instances when values or callbacks change, preserving
  appearance changes, click selection, resizing and cleanup.
- [x] Verify request counts and invalidation through normal UI entry points,
  inspect desktop/narrow rendering, record evidence and commit locally.

Uses Accepted [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and the existing [query contract](../../architecture/analytics-query-poc.md).
[IOP-215](IOP-215-operational-refinements.md) records the previous server improvement.
External changes become visible on the next fresh read, explicit refresh or expiry.

## Evidence and remaining work

[Execution evidence](../completed/IOP-238-analytical-session-cache-plan.md).
The owner approved merging `feature/IOP-238-analytical-session-cache` into develop
and publishing both branches to origin. The atomic push succeeded and both remote
hashes were independently verified. [Publication evidence](../completed/IOP-238-publication-plan.md).
