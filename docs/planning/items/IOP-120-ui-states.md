# IOP-120 — Empty/error/loading states

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The real default application handles connection, pending requests, admitted/rejected imports, no coverage, no matches and service failure/retry. Browser recovery returns focus to a stable heading; failed requests do not present stale analytical results.

## Requirements

- Deliver only IOP-120's selected POC outcome; compose existing modules as appropriate
  to the user's role. Visible navigation never grants server permission.
- Distinguish disconnected data, loading, failed requests, absent imported coverage
  and no matching records in both analytical views.
- Keep preview controls and recovery explicitly simulated; issue no business requests.
- Preserve metric/coverage limits and accessible labels, announcements and keyboard
  controls on laptop/tablet layouts.
- Connect real loading/error/recovery states when the owning endpoints exist, using
  IOP-022 errors without exposing raw server diagnostics. No authentication prerequisite
  for the independent preview; real operations still require scoped runtime access.

## Acceptance criteria

- [x] Consistent POC state presentation and reviewable recovery in both views.
- [x] Plan records scenarios and necessary choices without expanding scope.
- [x] Validation evidence and synchronized documentation for the preview slice.
- [x] Runtime states and recovery validated against delivered analytical endpoints.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-017](IOP-017-frontend-bootstrap.md), [IOP-022](IOP-022-api-error-model.md), [IOP-116](IOP-116-navigation.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-120-runtime-state-plan](../completed/IOP-120-runtime-state-plan.md)
- [IOP-120-ui-states-plan](../completed/IOP-120-ui-states-plan.md)
