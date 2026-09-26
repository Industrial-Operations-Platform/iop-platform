# IOP-095 — POC area analytics

Status: Completed — specification slice only; parent IOP-095 remains Blocked.
Authorized by the owner's 2026-09-26 request to work on
[IOP-095](../items/IOP-095-area-analytics.md), limited to
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-095-area-analytics`, created from clean `develop` before edits.

## Changes and steps

1. Review dependencies: IOP-026's site seed is delivered; IOP-090/091 metric
   specifications are complete but runtime reconciliation is Blocked. IOP-089's
   accepted query design is not implemented; production OIP facts and ADR-0018
   host activation are missing. Do not implement adjacent prerequisites.
2. Add `docs/product/area-analytics-poc.md`: fixed area/sector comparison semantics,
   exact existing measures, shared selection, drill-down, coverage and literal
   fixture expectations. Reuse ADR-0023/0028 and aggregate equality. No schema,
   endpoint, architectural mechanism or additional metric is introduced.
3. Refine this story's scope, acceptance and dependency gates in
   `docs/planning/items/IOP-095-area-analytics.md`; synchronize
   `docs/planning/backlog.md` and `docs/planning/poc-delivery.md`.
   Read stories IOP-095/090/091/026/089 are already English; no translation needed.
4. Independently decode the two retained synthetic CSVs, reconcile normalized rows
   with `fixtures/analytical-poc/expected.json`, and verify area/sector partitions
   and filtered cases with exact integer arithmetic.
5. Check changed Markdown links, IDs, statuses, `git diff --check` and
   `npm run check:secrets`. Record actual evidence, move this finished specification
   plan to `completed/`, and commit locally. Keep the parent Blocked for runtime.

## Validation and delivery gates

The specification must preserve all nine source records, case-sensitive area
identity, repeated lines, unclassified membership, both measures and missing-date
coverage. Document expected drill-down/return, zero/empty, exclusion and access
denial scenarios. Documentation/arithmetic checks do not prove runtime queries.
After the prerequisites deliver, use `npm test`, `npm run test:database` and the
relevant browser/HTTP checks to reconcile the actual view and contributing pages
on one selection/revision. Grouped response delivery must fit the accepted query
boundary; any new architectural mechanism requires a Proposed ADR and acceptance
before dependent implementation. No API or UI code changes in this increment.

## Executed evidence — 2026-09-26

- Independent Python `csv` decoding of both retained UTF-16 CSVs matched all nine
  normalized oracle rows, including physical line references and scoped mappings.
  Exact integer arithmetic verified all four area groups, sector partitions,
  both comparison orders, message exclusion, area/equipment drill-down, the
  five-filter case, matching zero, incompatible filters and missing July 2.
  Full totals: 9 records, 19 reported occurrences, 97,775 seconds.
- No application code or architectural decision changed. Runtime suites were not
  run: documentation and fixture arithmetic cannot validate persisted queries,
  current grants/RLS, response pagination or UI behavior. Those remain acceptance
  gates, not completed evidence.

- Final documentation validation: 211 relative links resolve across the five
  changed files; item/backlog Blocked statuses and completed-plan location agree.
  `git diff --check` and `git diff --cached --check` passed.
  `npm run check:secrets` passed for 426 indexed files.

## Closure

Specification and dependency handoff complete. The parent remains Blocked until
its runtime prerequisites and view reconciliation are delivered. Publication requires
separate approval under the shared workflow.
