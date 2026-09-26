# IOP-121 — Responsive baseline

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The actual uploaded dataset, filters, shared navigation and contributing tables are checked in Chromium at laptop/tablet/narrow widths, with contained table scrolling and preserved selection. Screenshots were visually inspected.

## Requirements

- Deliver only IOP-121's selected outcome: laptop/tablet usability.
- Compose existing modules as appropriate to the role; visible navigation does
  not grant server permissions.
- Preserve readable content without page-wide horizontal scrolling at 1366×768,
  768×1024 and 1024×768; support narrow 640×480 CSS viewport reflow.
- Keep navigation, preview and recovery controls reachable with at least 44px
  height. Preserve state across tablet orientation changes and keyboard recovery.
- Validate real filters, results and contributing records when available; do not
  introduce fictional charts, metrics or imports to close this story.

## Acceptance criteria

- [x] Existing POC navigation and analytical states are usable on laptop/tablet.
- [x] The plan documents scenarios and necessary choices without expanding scope.
- [x] Presentation validation evidence and synchronized documentation exist.
- [x] Data-backed POC views, filters and records are validated on laptop/tablet.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-116](IOP-116-navigation.md), [IOP-120](IOP-120-ui-states.md), [IOP-089](IOP-089-analytics-query-layer.md), [IOP-094](IOP-094-asset-analytics.md), [IOP-097](IOP-097-analytics-filters.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-121-responsive-continuation-plan](../completed/IOP-121-responsive-continuation-plan.md)
- [IOP-121-responsive-ui-plan](../completed/IOP-121-responsive-ui-plan.md)
