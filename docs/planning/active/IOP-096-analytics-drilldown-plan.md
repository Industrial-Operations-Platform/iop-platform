# IOP-096 — POC analytical drill-down execution plan

Status: Blocked (implementation prerequisites below). Authorized by the owner's request to work on IOP-096 within
the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-096-analytics-drilldown`, created from `develop` before edits.
Permanent scope: [IOP-096](../items/IOP-096-analytics-drilldown.md).

## Changes and steps

1. Review the existing navigation, direct dependencies and applicable ADRs.
2. Translate the entire IOP-096, IOP-094, IOP-095 and IOP-097 story files to English
   under the workflow's translation-on-read rule. Dependency edits are translation
   only; their status and requirements remain unchanged.
3. Record the bounded navigation acceptance scenarios and concrete dependency
   gates in IOP-096. Synchronize its backlog status. No new architecture, metric
   definition, filter contract or adjacent implementation is introduced.
4. Validate documentation, record evidence and commit this documentation increment.
   Keep this plan active while implementation prerequisites remain unresolved.

Expected files: this plan, the four story files above and `../backlog.md`.
No application, schema, API, fixture or shared POC scope changes are planned.

## Dependencies and implementation boundary

- IOP-094 and IOP-095 are Proposed on develop; source-equipment and area analytical
  contracts/implementations are unavailable. Their metric dependencies IOP-090/091
  are also Proposed in the backlog; this review does not activate them.
- IOP-097 is Proposed on develop. Read-only review found commit `0e456cf` on
  `docs/IOP-097-analytics-filters`, absent from develop, containing Proposed
  ADR-0023. Integration and acceptance are distinct prerequisites; neither is
  inferred or performed here. Reconcile this branch's translation with that story
  during owner-authorized integration.
- The existing web application provides navigation placeholders, not analytical
  results. The visual-first delivery preference permits independent previews but
  does not accept the pending shared filter/navigation semantics.
- Runtime business access independently requires acceptance and implementation
  of ADR-0018 or an alternative. No login, asset survey or physical registry is
  added as a POC gate.

The [workflow](../workflow.md#branches-and-remote-publication) requires waiting
for owner integration of an unmerged prerequisite, or explicit authorization for
a dependent branch. Complete independent documentation now; do not implement
against the unmerged proposal or duplicate its contract.

## Validation and evidence

Documentation: `git diff --check`; check relative Markdown file links in changed
documents, IOP IDs, matching story/backlog status and dependency translation parity.
Implementation scenarios are recorded in the story; they are not executed tests.
After prerequisites are resolved, refine this plan with exact application files
and run `npm test`, `npm run typecheck` and `npm run test:e2e` for the delivered
navigation, reconciliation and relevant denial paths.

Recorded on 2026-09-26: `git diff --check` passed. A Python check over the six
changed documents resolved all 204 relative file links and verified the four
story IDs and matching backlog statuses. Manual diff review confirmed IOP-094,
IOP-095 and IOP-097 have translation-only changes. The workflow heading linked
above exists. Application tests were not run because no executable files changed;
the acceptance scenarios remain unexecuted. Dependency review and the bounded
documentation increment are complete; analytical implementation remains blocked.

## Closure

The documentation increment may be committed while the story is Blocked. Leave
acceptance unchecked until actual drill-down and validation are delivered. Move
the plan to completed only when its implementation gates and work are resolved.
