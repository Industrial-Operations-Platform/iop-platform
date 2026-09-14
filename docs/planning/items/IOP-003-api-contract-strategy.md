# IOP-003 — Define API style and contracts

## Status

Completed — API contract strategy accepted on 2026-09-14; implementation remains separately scoped.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Decide the API style, versioning, errors and boundary contract strategy.

## User / business value

The maintainer needs reviewable API conventions before building the reusable
platform and its analytics frontend.

## Context

The owner requested evaluation and an ADR, with dependent documentation updates
if the decision is accepted. The original seed named REST/other approach, but did
not enumerate alternatives. [ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md)
compares REST, GraphQL, tRPC and gRPC, plus versioning and contract-authoring options.
See [modules](../../architecture/modules.md) and [workflow](../workflow.md).

## Current state

IOP-002 is Completed: NestJS, React and the testing baseline are accepted.
No API or executable contract exists. The owner accepted REST/JSON,
OpenAPI generated from dedicated Nest transport DTOs/metadata, URI major versions
and RFC 9457 Problem Details. ADR-0011 is Accepted and the architecture/module guidance is synchronized.

## Desired state

An explicitly accepted API strategy with rationale and synchronized architecture
documentation, ready to guide separately authorized implementation stories.

## Requirements

- Deliver only API style, versioning, error and contract decisions for IOP-003.
- Keep identity, permissions, customer/site scope and provider details distinct.
- Preserve module ownership and the accepted CSV analytics v1 boundary.
- Obtain explicit acceptance before applying proposed conventions to the baseline.

## Acceptance criteria

- [x] API style, versioning, errors and contract strategy explicitly accepted.
- [x] Plan and ADR document relevant options, scenarios and decisions without scope expansion.
- [x] Evaluation validation evidence and planning status are synchronized.
- [x] Accepted architecture documentation synchronized after owner acceptance.

## Domain considerations

HTTP representations must not expose persistence entities or vendor schemas.
Internal contracts retain owner-controlled behavior and domain invariants.

## Architecture constraints

Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md) and
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) and
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md).
Proposed ADRs are not permission to implement a decision.

## Security considerations

Validate scoped permissions and references across operations. Never trust client
scope selectors as grants. Keep errors free of sensitive data. Industrial sources
remain read-only; no secrets or production data are required for this evaluation.

## Data considerations

Describe isolation and analytical representation implications without defining
physical schemas, exact metric contracts or reporting-period semantics.

## API considerations

ADR-0011 covers style, versioning, compatibility, OpenAPI authoring, runtime
validation, response conventions and errors. No endpoints are implemented.

## UI considerations

Consumer bindings derive from a reviewed HTTP artifact. No new frontend selection
or UI implementation; accepted React/reporting choices remain unchanged.

## Dependencies

[IOP-002](IOP-002-technology-stack.md) is Completed on develop.
Dependencies identify required decisions, not automatic implementation ordering.

## Non-goals

Applications, migrations, endpoints, infrastructure, source integration schemas,
identity/session selection, job mechanisms or customer-specific core logic.

## Validation

Primary-source capability review, design scenarios, local file links, IDs,
statuses and diff consistency. No runner or runtime contract exists yet.

## Documentation impact

This item, its [backlog](../backlog.md) row, ADR-0011, architecture/module guidance
and the completed evaluation/closure plans are synchronized.

## Open questions

No API strategy acceptance blockers remain. Exact generator/dialect versions
and endpoint-specific schemas/limits require future implementation/design work;
they are explicitly deferred and are not claimed as verified by this ADR.

## Evidence

[Completed evaluation plan](../completed/IOP-003-api-contract-strategy-plan.md).
The requested historical `active/IOP-002-backend-stack.md` path is absent; the
permanent IOP-002 context and Accepted ADR-0006 provide the current decision.
The owner explicitly accepted ADR-0011 on 2026-09-14. See the
[completed closure plan](../completed/IOP-003-api-contract-closure-plan.md) for
validation evidence. All design acceptance criteria are satisfied; no runtime
implementation or compatibility verification is claimed.
