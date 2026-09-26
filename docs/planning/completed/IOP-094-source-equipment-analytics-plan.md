# IOP-094 — POC source equipment analytics

Status: Completed — specification slice only; parent IOP-094 remains Blocked.
Authorized by the owner's 2026-09-26 request to work on
[IOP-094](../items/IOP-094-asset-analytics.md), limited to
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-094-source-equipment-analytics`, created from clean `develop`
before file edits.

## Changes and steps

1. Reuse completed IOP-090/091 measure specifications and Accepted ADR-0023/0028
   selection/query semantics. IOP-089 has no executable queries; production OIP
   facts and ADR-0018 host activation remain missing. Do not implement adjacent
   prerequisites or introduce physical assets.
2. Add `docs/product/source-equipment-analytics-poc.md` with exact scoped
   area/equipment grouping, contributing messages, shared navigation, coverage,
   safe outcomes and literal reconciliation expectations. No new architecture,
   schema, endpoint, UI or metric is introduced.
3. Update `docs/planning/items/IOP-094-asset-analytics.md`,
   `docs/planning/backlog.md` and `docs/planning/poc-delivery.md` with specification
   evidence and concrete runtime gates. Read stories IOP-094/090/091/089/095 are
   already English; no translation-only changes are necessary.
4. Independently decode the two valid synthetic CSVs and compare every normalized
   row to `fixtures/analytical-poc/expected.json`; verify equipment partitions,
   messages, filters, repeated lines and zero measures using exact arithmetic.
5. Check changed Markdown links, IDs/statuses, `git diff --check` and
   `npm run check:secrets`; record results, move this finished specification plan
   to `completed/` and commit locally. Keep the runtime parent Blocked.

## Validation and delivery gates

Specification checks must reconcile nine records, 19 reported occurrences and
97,775 seconds, retaining source-area identity and unclassified records. Document
same-designation/different-area and message-tuple disambiguation as additional
runtime scenarios, not properties proven by the baseline fixture. Include denied
access, pagination, revision changes, invalid references, missing imports and
filter-preserving drill-down/return.

After query/storage/host prerequisites exist, run `npm test`,
`npm run test:database` and relevant HTTP/browser checks through the real
authorized path. Resolve bounded grouped response delivery within IOP-089 before
implementation; a new architectural mechanism requires a Proposed ADR and owner
acceptance. Documentation/arithmetic evidence does not complete runtime acceptance.

## Executed evidence — 2026-09-26

- Independent Python `csv` decoding of both retained UTF-16 CSVs matched every
  normalized row in the literal oracle, including physical-line references and
  scoped classification. Exact arithmetic verified all five equipment/message
  groups, drill-down/return, matching zero, unclassified selection, exclusion,
  the five-filter case, incompatible filters and missing July 2.
  Full totals: 9 records, 19 reported occurrences and 97,775 seconds.
- No application code or architectural mechanism changed. Runtime suites were
  not run; fixture arithmetic does not prove persisted queries, pagination,
  authorization, UI behavior or additional synthetic runtime scenarios.

- Documentation validation: 210 relative links resolve across the five changed
  files; item/backlog Blocked statuses and completed-plan location agree.
  `git diff --check` and `git diff --cached --check` passed.
  `npm run check:secrets` passed for 428 indexed files.

## Closure

Specification and dependency handoff complete. The parent remains Blocked on
query/storage/host delivery and actual view reconciliation. Publication requires
separate approval under the shared workflow.
