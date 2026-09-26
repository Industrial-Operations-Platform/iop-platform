# IOP-127 — POC disposition

Status: Completed. Authorized by the owner's request to work on IOP-127 only
within the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-127-poc-disposition`, created from clean `develop`.
Item: [Synthetic maintenance](../items/IOP-127-demo-maintenance.md).

## Changes and steps

1. Record that maintenance fixtures have no delivery slice in the analytical POC;
   set IOP-127 to Deferred with the existing scope decision as its reason.
2. Translate the entire IOP-127 context and direct dependencies
   [IOP-124](../items/IOP-124-demo-assets.md) and
   [IOP-073](../items/IOP-073-maintenance-board.md) to English as required by the
   workflow. Dependency edits are translation-only; preserve their status and criteria.
3. Synchronize the IOP-127 backlog row and link this review from the item. Expected
   files are these three items, `backlog.md` and this plan (active, then completed).

IOP-124 supplies physical asset fixtures and IOP-073 supplies the maintenance board.
Both remain Proposed and are explicitly deferred from POC delivery. Their own
prerequisites are future work; no transitive implementation is activated. Existing
scope documents already settle disposition and need no edits. No code, fixtures,
schema, API, UI or architectural decision changes are included.

## Validation and evidence

Check relative Markdown file links in changed documents, preserved story IDs and
dependency links, matching item/backlog status, complete English translation and
`git diff --check`. Review the diff for the exact five-file documentation scope.
Runtime tests are not applicable to this documentation-only increment.

Validation on 2026-09-26: manual diff review confirmed English translations,
unchanged dependency statuses/criteria and exactly the planned documentation scope.
Relative-link and status/ID assertions passed for all five changed documents;
`git diff --check` passed. No runtime tests were run because behavior is unchanged.

The issues/tasks acceptance criterion remains unchecked: deferral is not delivery.
The scenario/decision and synchronized-evidence criteria will be checked only for
this bounded review, with their documentation-only scope stated in the item.

## Closure

Record actual validation, move this plan to completed and commit the reviewed
documentation increment. IOP-127 remains Deferred; its implementation requires a
future request beyond the POC and defined dependency contracts. Ask for publication
approval naming the story branch, develop and origin after the local commit.
