# IOP-029 — Authorization/RBAC

## Status

Proposed

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M3 — Platform Core. Proposed delivery slice.

## Goal

Enforce scoped permissions independently of identity-provider details.

## User / business value

Administrators and users need access to authorized organizations and sites.

## Context

Scope: Platform Core, Authentication and Users/RBAC. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented, and its detailed design has not been accepted.

## Desired state

Enforce scoped permissions independently of identity-provider details.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Retain operation-level permission checks and foreign-scope rejection. If ADR-0018 is
  accepted, the POC uses its minimum seeded principal/membership/grant slice of
  IOP-027/030, without requiring their full lifecycle or IOP-007 login. Full shared-user
  enforcement remains parent scope; no allow-all guard is authorized.

## Acceptance criteria

- [ ] Enforce scoped permissions independently of identity-provider details.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Organization represents the generic customer/tenant; identity, membership and permissions have distinct responsibilities.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt the decision.

## Security considerations

Verify permission and customer/site scope for relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Preserve scope in entities and relationships; define uniqueness and lifecycle before migrating.

## API considerations

Public operations must verify identity, permission and scope; do not expose unauthorized operations during bootstrap.

## UI considerations

Show only permitted scopes and clear access errors; hiding controls does not replace authorization.

## Dependencies

[IOP-006](IOP-006-rbac-model.md), [IOP-026](IOP-026-site-model.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the following criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before activating implementation.
