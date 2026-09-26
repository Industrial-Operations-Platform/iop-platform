# IOP-122 — Accessibility baseline

## Status

In progress — POC preview baseline; real analytical UI validation pending.

## Milestone and goal

M15 — UX & Operational Experience. Basic keyboard navigation, contrast and labels
for the [local POC](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md), so technicians, managers and administrators can
use coherent, accessible flows. Broader cross-module accessibility is future scope.

## Context and current state

Scope: Cross-module user experience. See [modules](../../architecture/modules.md)
and [planning workflow](../workflow.md). The original outline is refined for the
owner-requested POC; backlog membership alone does not authorize implementation.
Navigation and simulated analytical states exist; real import/results/filters are
not connected. The desired state preserves keyboard access, readable contrast,
labels and understandable feedback as the analytical UI becomes available.

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
- [ ] Accessibility of delivered real analytical controls and data verified.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs remain proposals, not permission to adopt decisions.

## Security, data and API considerations

Verify customer/site permissions and scope in relevant operations/references.
Exclude secrets, floor plans and production data; industrial integrations remain
read-only. Record material changes where applicable. Views consume authorized
contracts without divergent entity copies. Reuse search/read contracts; pagination
and limits belong only to the selected scope. This UI slice changes no API and
makes no runtime authorization claim.

## Dependencies

[IOP-116](IOP-116-navigation.md) supplies integrated navigation;
[IOP-120](IOP-120-ui-states.md) supplies integrated simulated states. Its runtime
integration remains pending and does not block independent preview improvements.
Dependencies identify required capabilities rather than numerical execution order.

## Non-goals

Adjacent stories, inferred acceptance of open decisions or the entire milestone.
No login, administration, real import/analytics implementation or full accessibility
certification. Wider cross-module verification remains beyond the POC.

## Validation and documentation

Evaluate keyboard operation, labels, contrast and empty/error/loading states on
laptops/tablets with the accepted tooling. Include expected and recovery paths;
access denial applies when relevant runtime operations exist. Record actual results,
synchronize this item, [backlog](../backlog.md) and execution plan, and update other
contracts/models/guides only if affected.

## Open questions

No blocking decision for the existing preview. Real data controls and assistive
technology verification need evidence when the analytical UI is delivered.

Preview evidence: [completed execution record](../completed/IOP-122-accessibility-plan.md).
