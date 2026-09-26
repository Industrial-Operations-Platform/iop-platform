# IOP-121 — Responsive baseline

## Status

Blocked — POC presentation baseline implemented; data-backed views, filters and
contributing records are not available for final validation. See the
[continuation plan](../active/IOP-121-responsive-continuation-plan.md).

## Milestone and goal

M15 — UX & Operational Experience. Make the local analytical POC usable on laptops
and tablets within [POC scope](../../product/scope-poc.md) and the
[delivery map](../poc-delivery.md). Broader cross-module delivery remains deferred.

## User / business value and context

Technicians, managers and administrators need coherent, accessible workflows.
Scope: cross-module user experience; see [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). The original owner-requested outline
is refined to this selected POC slice; backlog membership alone is not authorization.

## Current and desired state

The existing Import CSV, Executive Overview and analytical detail previews reflow
across laptop/tablet viewports. Navigation and state controls remain reachable,
with visible scope, coverage and simulation disclosures. Data-backed analytical
views are not yet connected and need responsive validation when delivered.

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
- [ ] Data-backed POC views, filters and records are validated on laptop/tablet.

## Architecture and domain constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt decisions.
Views consume authorized contracts without divergent copies of entities.

## Security and API considerations

Verify customer/site scope and permissions for relevant operations and references.
Exclude secrets, drawings and production data; industrial integrations remain
read-only. Record material changes when applicable. Reuse authorized read/search
contracts; pagination and limits belong to the selected endpoint scope. This
presentation slice makes no API changes or runtime access-control claims.

## UI considerations

Evaluate keyboard use, labels, contrast and empty/error/loading states against
verifiable laptop/tablet targets. Retain existing colors, labels and focus styles;
full accessibility delivery remains separate.

## Dependencies

[IOP-116](IOP-116-navigation.md) supplies integrated navigation;
[IOP-120](IOP-120-ui-states.md) supplies integrated simulated analytical states.
Their relevant presentation capabilities are available without completion of
future runtime integration. Real analytical contracts and views remain prerequisites
for the final data-backed responsive validation, not this independent slice.
Dependencies identify required capabilities, not numerical implementation order.

The remaining validation needs [IOP-089](IOP-089-analytics-query-layer.md)
analytical reads, [IOP-094](IOP-094-asset-analytics.md) detail capabilities,
[IOP-097](IOP-097-analytics-filters.md) filters and validated scoped local access
under Accepted ADR-0018. Acceptance of the design does not deliver these runtime
capabilities; their implementation is outside this story.

## Non-goals

Adjacent tasks, acceptance of open decisions by inference, or the entire milestone.
No customer-specific core labels, administration, login, import processing, new
metrics, charts or business filters. No physical-device or accessibility certification.

## Validation and documentation

Use accepted tooling for expected, error and recovery scenarios. Test access denial
when relevant runtime access exists. Record actual results in the
[execution record](../completed/IOP-121-responsive-ui-plan.md); synchronize this item,
[backlog](../backlog.md) and plan. Update contracts, models, guides or ADRs only
when this task changes their content.

## Open questions

No open decision for the independent presentation slice. Final data-backed layout
checks await owning POC delivery; this increment does not complete the end-to-end POC.
