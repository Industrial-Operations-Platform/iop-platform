# IOP-120 — Empty/error/loading states

## Status

In progress — independent POC state preview implemented; runtime integration pending.

## Milestone

M15 — UX & Operational Experience. POC presentation slice.

## Goal

Consistent empty, error and loading experiences for Executive Overview and analytical
detail within the [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). Broader cross-module UX remains future scope.

## User / business value

Technicians, managers and administrators need coherent, accessible flows that do
not confuse unavailable data, missing imports and filters without matches.

## Context

Scope: Cross-module user experience. See [modules](../../architecture/modules.md)
and [planning workflow](../workflow.md). The original owner-requested outline is
refined here for the explicitly requested POC slice; backlog membership alone
does not authorize implementation.

## Current and desired state

The existing web navigation now offers shared, explicitly simulated analytical
states. Actual import/analytical endpoints and filters are not connected. The
desired runtime experience reuses clear states with safe recovery and no invented
metrics. See the [slice execution record](../completed/IOP-120-ui-states-plan.md).

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
- [ ] Runtime states and recovery validated against delivered analytical endpoints.

## Domain and data considerations

Compose existing modules according to role; navigation does not grant permissions.
Views consume authorized contracts without divergent entity copies. Missing imports
are not zero-fault periods; accumulated alarm duration is not plant downtime.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt decisions.

## Security considerations

Verify customer/site scope and permissions in relevant operations and references.
Exclude secrets, drawings and production data. Industrial integrations remain
read-only; record material changes when applicable. The preview makes no server
access-control claim.

## API and UI considerations

Reuse authorized read/search contracts; pagination and limits belong only to the
selected endpoint scope. Evaluate keyboard use, labels, contrast and empty/error/
loading states on laptops and tablets with verifiable targets. No API changes
are needed for the independent preview.

## Dependencies

[IOP-017](IOP-017-frontend-bootstrap.md) and
[IOP-022](IOP-022-api-error-model.md) are completed and integrated.
[IOP-116](IOP-116-navigation.md) supplies existing POC destinations.
Dependencies identify contracts/capabilities, not numerical implementation order.
Real analytics contracts and validated runtime access remain prerequisites for
runtime state integration, not for the independent presentation slice.

## Non-goals

Adjacent stories, inferred acceptance of open decisions or delivery of the entire
milestone. No customer names in the core, real filters, import processing, metrics,
login, administration or business error contracts invented by the UI.

## Validation and documentation

The plan defines executable expected/error/recovery scenarios using accepted tools;
access-denial testing applies when relevant runtime access exists. Record actual
results, not fictional tests. Synchronize this item, [backlog](../backlog.md) and
execution plan; update contracts, models, guides or ADRs only when affected.

## Open questions

No outstanding decision for the independent preview. Endpoint-specific failures,
real retries and filter recovery require owning analytical contracts before runtime
integration. This slice does not complete the POC or broader cross-module delivery.
