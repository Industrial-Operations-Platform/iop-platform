# IOP-122 — Accessibility baseline

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The real workflow uses named native controls, landmarks, headings, visible focus, status announcements and semantic data tables. Chromium checks keyboard filtering, stable recovery focus, control/text contrast and responsive content. This is a basic POC baseline, not assistive-technology certification.

## Requirements

- Deliver only the selected accessibility outcome for existing POC destinations.
- Preserve semantic landmarks, heading structure, named controls, state descriptions
  and polite status updates. Navigation must support keyboard use and visible focus;
  recovery must retain a usable focus destination when its button disappears.
- Verify text contrast of at least 4.5:1 and control/focus contrast of at least 3:1
  against adjacent surfaces in the current laptop/tablet interface.
- Validate real charts, tables, filters and runtime states when delivered, including
  appropriate accessible data alternatives. Preview evidence is not certification.
- Compose existing modules according to role; visible navigation grants no server
  permission. Do not introduce customer-specific labels into the generic core.

## Acceptance criteria

- [x] Basic navigation, contrast and labels validated in the existing POC preview.
- [x] Plan records scenarios and necessary choices without scope expansion.
- [x] Validation evidence and synchronized documentation for this increment.
- [x] Accessibility of delivered real analytical controls and data verified.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-116](IOP-116-navigation.md), [IOP-120](IOP-120-ui-states.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-122-accessibility-continuation-plan](../completed/IOP-122-accessibility-continuation-plan.md)
- [IOP-122-accessibility-plan](../completed/IOP-122-accessibility-plan.md)
