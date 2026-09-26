# IOP-097 — POC date/filter model plan

Status: Blocked — ADR-0023 accepted; analytical contracts and runtime access remain pending.
Authorized by the owner's request to work on IOP-097 within
the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-097-analytics-filters`, created from clean `develop` on 2026-09-25.
Permanent scope: [IOP-097](../items/IOP-097-analytics-filters.md).

## Changes and steps

1. Review direct dependencies: IOP-008 is Completed as design (Accepted ADR-0016);
   IOP-089 remains Proposed with no analytical operation. Its canonical aggregates,
   reconciliation and mappings depend on IOP-043/048/049, also Proposed in backlog.
   ADR-0018 is now Accepted (2026-09-26); implementation and validation still
   gate runtime business access.
   The web host has navigation placeholders only. No prerequisite branch is merged here.
2. Define a bounded OIP-owned filter contract in Proposed ADR-0023: reporting-date
   labels, sector/area/source-equipment/message selection, explicit exclusions,
   unclassified records, scope, coverage and consistent overview/detail navigation.
   This introduces a shared analytical request/result convention; pause dependent
   implementation until acceptance under AGENTS.md and ADR-0007.
3. Update `items/IOP-097-analytics-filters.md` in English with POC acceptance and
   remaining delivery gates. Translate the entire direct dependency
   `items/IOP-089-analytics-query-layer.md` without changing its scope/status.
   IOP-008 is already English and needs no edit.
4. Synchronize only the IOP-097 row in `backlog.md`; retain this active plan while
   the proposal awaits a decision. No application, schema, metric, import, scope
   document or adjacent-story implementation changes.

## Owner acceptance increment — 2026-09-26

The owner explicitly accepted ADR-0023 after reviewing the proposed behavior.
Continue on the existing story branch; do not merge or publish without approval.
Before edits, scope this increment to this plan, ADR-0023, the IOP-097 item and
`ARCHITECTURE.md`. Record acceptance, check the contract acceptance criterion and
synchronize the architecture summary. The backlog already mirrors Blocked and
needs no change. Preserve the original proposal evidence below as historical.
Validate relative links, status/criteria consistency and `git diff --check`, then
commit locally. No runtime implementation or adjacent-story edits are included.

## Validation and evidence

Review date bounds, leap dates, browser-zone independence, missing imports,
unclassified and repeated labels, include/exclude conflicts, drill-down/back,
stale responses, invalid input and scope denial as design scenarios in ADR-0023.
Check changed Markdown relative links, IDs/status consistency, English translation,
`git diff --check`, branch ancestry and diff scope. Documentation-only work does
not require API tests; do not report design walkthroughs as executed runtime tests.

Evidence, 2026-09-25:

- `git diff --check`: passed. A Python relative-link check across all five changed/
  new Markdown files resolved 187 local links with no missing targets.
- Status assertions passed: item/backlog IOP-097 Blocked, IOP-089 still Proposed,
  ADR-0023 Proposed. Reviewed the IOP-089 diff as translation-only; all sections,
  links, requirements and status are preserved. Both stories are now in English.
- `git merge-base --is-ancestor develop HEAD`: passed. Initial working tree was
  clean; the final change scope is the five files listed in this plan.
- Reviewed all 13 ADR-0023 scenario rows against ADR-0011/0016 and POC constraints:
  invalid input never broadens a query, missing imports remain coverage gaps,
  exclusions remain visible, and scope checks precede options/results. No new
  metric, source window, authorization bypass or physical asset dependency.
- No runtime, API, database or UI tests run: no executable files changed, and no
  analytical implementation or security verification is claimed.

Acceptance evidence, 2026-09-26:

- `git diff --check` passed; all 62 relative links in the four changed documents
  resolved. Status assertions verified Accepted ADR-0023, its checked contract
  criterion, unchecked implementation criteria and matching Blocked item/backlog.
- Manual diff review confirmed acceptance/documentation changes only. No runtime
  tests ran because no executable files changed. No merge or push performed.
- This acceptance increment is complete; the parent implementation plan remains
  active and Blocked by the contracts/access prerequisites above.

## Closure

Commit the validated documentation increment automatically. IOP-097 remains open
until consistent filters have executable evidence in both analytical views.
ADR-0023 acceptance is recorded; publication remains separately authorized.
Keep this plan active while analytical contracts and runtime access are pending.
A later fixture UI slice can use the accepted semantics; full delivery still
requires IOP-089 and implementation/validation of Accepted ADR-0018. Do not implement
adjacent dependencies under this story. Acceptance does not complete IOP-096/097.

## Authorized integration — 2026-09-26

The owner authorized merging this story into develop and pushing both branches
to origin. Resolve the backlog conflict with IOP-096 and IOP-097 both Blocked;
retain this branch's accepted IOP-097 context over the older translation-only copy.
Synchronize IOP-096's item and active plan only to remove the now-resolved filter
proposal gate; its other implementation gates remain. Validate merged Markdown
links, statuses, conflict markers and whitespace before completing the merge.

Integration validation passed: 244 relative file links across 8 changed
documents, no conflict markers, consistent Blocked story/backlog statuses and
Accepted ADR-0023. `git diff --check` passed. No executable files changed.
