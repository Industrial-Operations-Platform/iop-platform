# IOP-089 — POC analytics query layer

## Final disposition — 2026-09-27

Completed through the explicitly authorized [IOP-147 integrated delivery](IOP-147-working-analytical-poc-plan.md).
Its execution record supplies the missing runtime implementation and verification.
The earlier steps and dated blockers below are historical; no separate active
continuation remains. This archive preserves the original branch and review evidence.

## Original execution record


Status: Blocked — ADR-0028 and the query contract are accepted; production
storage/host prerequisites remain pending. Authorized by the owner's 2026-09-26 request, limited to
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-089](../items/IOP-089-analytics-query-layer.md).
Branch: `docs/IOP-089-analytics-query-layer`, created from clean `develop` before edits.

## Scope and dependencies

Define the bounded OIP query contract and review the missing implementation gates.
IOP-043 supplies completed aggregate design; IOP-048 supplies internal reconciliation
evidence, not production facts; IOP-049 supplies pure classification, not durable
handoff. All three read story files are already English; no translation is needed.
ADR-0018 is Accepted, but its host activation remains unimplemented.

ADR-0023 requires concrete dimension references, revision consistency and bounded
pagination. Propose those mechanisms in ADR-0028 before dependent implementation,
following AGENTS.md and ADR-0007. Do not implement adjacent receiver/host stories,
invent acceptance, or treat disposable reconciliation storage as production storage.

## Changes and steps

1. Review accepted module, aggregate, filter, authorization and publication contracts.
2. Add `docs/architecture/adr/ADR-0028-poc-analytics-query-consistency.md` with
   alternatives and a bounded recommendation for references and consistent reads.
3. Add `docs/architecture/analytics-query-poc.md`: operations, measures, coverage,
   limits, errors and implementation acceptance scenarios independent of the UI.
4. Synchronize this item, backlog and delivery map with actual design/runtime status.
5. Validate documentation, commit the reviewable increment, and retain this plan
   active if decision/dependency gates remain. Ask separately for decision acceptance
   and authorized publication; do not merge or push by inference.

## Validation and evidence

Owner follow-up on 2026-09-26 explicitly accepts ADR-0028 and its linked contract
and authorizes merging `docs/IOP-089-analytics-query-layer` into `develop` and
pushing both branches to `origin`. Update acceptance references in the ADR, query
contract, item and delivery map; validate and commit on the story branch before
that authorized merge/publication. Remaining runtime dependencies keep this plan
active. No stage/master promotion or branch deletion is included.

Acceptance follow-up validation: all 59 relative links in the five updated files
resolve; ADR status and remaining blockers agree; `git diff --check` passed.
After fetching origin, develop and origin/develop matched exactly, and the story
contained only the two previously reviewed IOP-089 commits before this acceptance
update. Publication will use ordinary non-forced updates.

Completed documentation checks on 2026-09-26:

- Python relative-link check: 207 links across all six changed/new Markdown files
  resolve; ADR-0028 is unique and the backlog mirrors the item's Blocked status.
- `git diff --check`: passed.
- Literal IOP-043 walkthrough: 2 + 2 + 3 = 7 and 90 + 90 + 93,784 = 93,964;
  compared the query acceptance matrix with IOP-048's recorded 9 / 19 / 97,775 oracle.
  These are design checks, not newly executed analytical queries.
- Retained-attempt bound checked against the existing CSV preservation contract:
  1,000 receipts include successful and failed attempts.

`npm run check:secrets` passed for 414 indexed files; `git diff --cached --check`
also passed. No application changes were
made, so API/database suites were not run; they cannot verify an unimplemented
query service. No dependency story required translation. No adjacent work was changed.

## Closure

Keep IOP-089 open until executable independent queries and delivered-path isolation,
reconciliation and consistency are verified. Move this plan to completed only when
its implementation handoff is resolved or explicitly resliced. Decision acceptance
is complete; it does not close the runtime acceptance criteria.
