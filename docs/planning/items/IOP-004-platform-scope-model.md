# IOP-004 — Design Organization/Site scope

## Status

Completed — owner accepted the logical scope model on 2026-09-15 under
[ADR-0012](../../architecture/adr/ADR-0012-organization-site-scope.md).

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define a generic Organization/Site scope model without customer-specific domain
logic, keeping identity, permission, operational scope and providers separate.

## User / business value

The team needs reviewable ownership and scope contracts before building a reusable
platform with customer/site access isolation.

## Context

Read [modules](../../architecture/modules.md), [data model](../../architecture/data-model.md),
[glossary](../../product/glossary.md) and [workflow](../workflow.md).
The owner requested evaluation and an ADR, with dependent documentation updated
if the decision is accepted. The original seed names no specific alternatives;
ADR-0012 compares organization-only, Organization/Site and a generic scope tree.

## Current state

Only the documentation baseline exists. Customer-owned sites and isolation are
accepted foundations, and the detailed Organization/Site model is accepted under ADR-0012. No runtime
implementation exists. The decision uses explicit Organization → Site ownership,
with configurable locations outside the authorization scope hierarchy.

## Desired state

An accepted generic model documents canonical identity, site ownership, explicit
operation scope and module responsibilities, with synchronized architecture docs.

## Requirements

- Deliver only the logical Organization/Site design for IOP-004.
- Evaluate alternatives and explain the recommendation and its consequences.
- Keep provider identity, membership, permission and target scope distinct.
- Describe positive and negative scope/reference scenarios without implementing them.
- Preserve the boundaries of physical tenancy, detailed RBAC and temporal design.

## Acceptance criteria

- [x] Generic Organization/Site model accepted without customer-specific dependencies.
- [x] Evaluation plan and ADR document options, scenarios and necessary decisions
  without expanding the task.
- [x] Accepted architecture/model/glossary documentation synchronized with validation
  evidence. Acceptance evidence is recorded in the completed closure plan.

## Domain considerations

ADR-0012 defines Organization as the existing customer boundary; each Site belongs
to exactly one Organization. Source labels and configurable locations are data,
not identity or additional permission scopes. Physical tenancy and detailed RBAC remain separate decisions.

## Architecture constraints

Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md) and
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md) apply.

## Security considerations

Scope selectors are not grants. Check organization/site access and relevant
references, including indirect data paths. Use fictional examples and no production
data or secrets. Industrial integrations remain read-only.

## Data considerations

Logical ownership and propagation only; physical tenancy and database enforcement
belong to [IOP-005](IOP-005-tenancy-and-data-isolation.md).

## API considerations

Describe transport-independent scope contracts under ADR-0011; no endpoints or
scope transport selected. Missing scope must not mean unrestricted access.

## UI considerations

Keep applied report scope visible; no selector UI or frontend behavior implemented.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md) is Completed and establishes the
analytical v1 and individual scoped access. The accepted backend/API baselines are
available on develop. No other story integration is required for this evaluation.

## Non-goals

Application code, schemas, migrations, endpoints, infrastructure, physical tenancy,
role/permission matrix, identity providers, detailed time semantics, arbitrary
scope trees, site-transfer workflows or new v1 reporting capabilities.

## Validation

Review links, IDs, statuses, scope consistency and ADR scenarios. See the
[completed evaluation plan](../completed/IOP-004-platform-scope-model-plan.md)
for evidence and limitations. No runtime or security tests have been executed.

## Documentation impact

This item, its [backlog](../backlog.md) row, ADR-0012, architecture baseline, modules,
data model and glossary are synchronized. The
[completed acceptance plan](../completed/IOP-004-scope-acceptance-plan.md) records
closure evidence; the earlier evaluation remains historical evidence.

## Open questions

No design-closure questions remain. Physical enforcement, RBAC grant inheritance
and temporal mechanics remain with their existing stories and are not implemented here.

## Evaluation evidence

On 2026-09-14 the requested evaluation produced Proposed ADR-0012 with three
alternatives, logical contracts, consequences and twelve design walkthroughs.
The owner explicitly accepted the ADR on 2026-09-15 and authorized merge to develop
and push to origin. The acceptance slice synchronizes the baseline and completes
the parent as design only; no runtime isolation or pilot measurement is claimed.
