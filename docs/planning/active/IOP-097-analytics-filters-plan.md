# IOP-097 — POC date/filter model plan

Status: Blocked — documentation increment validated; ADR-0023 awaits acceptance.
Authorized by the owner's request to work on IOP-097 within
the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-097-analytics-filters`, created from clean `develop` on 2026-09-25.
Permanent scope: [IOP-097](../items/IOP-097-analytics-filters.md).

## Changes and steps

1. Review direct dependencies: IOP-008 is Completed as design (Accepted ADR-0016);
   IOP-089 remains Proposed with no analytical operation. Its canonical aggregates,
   reconciliation and mappings depend on IOP-043/048/049, also Proposed in backlog.
   ADR-0018 remains Proposed and independently gates runtime business access.
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

## Closure

Commit the validated documentation increment automatically. IOP-097 remains open
until consistent filters have executable evidence in both analytical views.
Record the concrete proposal/dependency gates and ask for the decision and
publication authorization separately; acceptance of an ADR is not push permission.

The proposal/translation increment is complete. Keep this plan active because its
decision gate remains open. After ADR-0023 acceptance, plan the independent fixture
UI slice or integrate with IOP-089 when its contracts exist; do not implement the
adjacent dependencies under this story. Runtime access still has the separate
ADR-0018 gate. No plan deviation or scope expansion.
