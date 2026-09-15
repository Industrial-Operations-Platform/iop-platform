# IOP-006 — Design the RBAC model

## Status

Blocked — evaluation complete; explicit owner acceptance of
[ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md) is pending.
The proposed matrix is not yet part of the accepted architecture baseline.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Document the Role → Permission → Scope matrix and its authorization rules.

## User / business value

The team needs reviewable decisions before building a reusable business platform.
The pilot should deliver basic individual access with a small permission model,
leaving room for enterprise integration without implementing that integration now.

## Context

Scope: product and cross-module architecture. See [modules](../../architecture/modules.md)
and [planning workflow](../workflow.md). The original seed requests a matrix but
contains no enumerated alternatives. ADR-0014 compares global roles, scoped roles,
direct grants, attribute/relationship engines and provider-driven permissions.
The owner authorized evaluation and translation of items through IOP-006; later
items are translated when worked on. IOP-001–005 and IOP-002 supporting reviews
are already English and need no translation edits.

## Current state

Only the documentation baseline exists. ADR-0004 separates authentication from
permission decisions; ADR-0012 establishes Organization/Site and ADR-0013 establishes
persistence isolation. Detailed RBAC is not implemented or accepted.
The requested historical `active/IOP-002-backend-stack.md` is absent; use the
permanent [backend review](IOP-002-backend-review.md) and Accepted ADR-0006.

## Desired state

An accepted matrix and authorization contract describe pilot operations, scope,
role composition, delegation and denial behavior without selecting identity/session
implementation or building enterprise policy tooling.

## Requirements

- Deliver only the IOP-006 matrix and related authorization decisions.
- Keep identity, permissions, scope and identity providers separate.
- Preserve the confirmed analytics-only pilot responsibilities and ADR-0013 controls.
- Evaluate alternatives and record the recommendation without inferring acceptance.

## Acceptance criteria

- [x] Proposed Role → Permission → Scope matrix documented.
- [x] Plan/ADR cover options, failure scenarios and decisions without scope expansion.
- [x] Evaluation and translation evidence recorded; proposal documentation synchronized.
- [ ] Owner explicitly accepts the RBAC decision.
- [ ] Accepted architecture guidance synchronized after acceptance.

## Domain considerations

Use generic roles and module-owned permissions. Team Leader and Taskforce are
personas with the same analytical access, not customer-specific core role types.
One person can hold several explicit assignments at different scopes.

## Architecture constraints

Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md),
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md),
[ADR-0012](../../architecture/adr/ADR-0012-organization-site-scope.md) and
[ADR-0013](../../architecture/adr/ADR-0013-tenancy-data-isolation.md).
Proposed ADRs are proposals, not permission to treat a decision as accepted.

## Security considerations

Verify permission, current membership/assignments and explicit organization/site
ownership independently. Cover escalation, foreign references, revocation and
concurrent access changes. Trace material grant changes. No secrets, customer maps
or production records are required. Industrial integrations remain read-only.

## Data considerations

Describe membership/assignment ownership and integrity without creating a schema.
RLS filters scoped rows; it does not determine which business operations are granted.

## API considerations

Specify provider-independent permission checks and safe denial behavior. No endpoints.

## UI considerations

Describe permitted actions without introducing a role editor or administration UI.
Preserve the accepted file-based report configuration workflow.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md) and
[IOP-005](IOP-005-tenancy-and-data-isolation.md) are accepted as design.
The owner authorized a dependent IOP-006 branch from the unmerged IOP-005 branch.
Dependencies identify required contracts, not numeric implementation order.
Authentication/session selection remains IOP-007 and is not activated by this task.

## Non-goals

Applications, migrations, endpoints, infrastructure, credential/session selection,
enterprise federation, arbitrary policy engines, custom-role UI or customer logic
in the generic core. No implementation of later modules or translation of later items.

## Validation

Review consistency, relative links, IDs, statuses, English prose and design scenarios.
Do not invent runnable tests or claim executed authorization/security evidence.
See the [completed evaluation plan](../completed/IOP-006-rbac-evaluation-plan.md).

## Documentation impact

This item, its [backlog](../backlog.md) row, the proposal ADR and execution plan.
After explicit acceptance, synchronize architecture, modules, data model, glossary
and affected ADR references in a planned documentation increment.

## Open decision

Accept or revise ADR-0014's fixed scoped roles, permission matrix and explicit
organization-admin delegation authority. The proposal keeps basic pilot access
separate from future identity integration; no new authentication choice is implied.
