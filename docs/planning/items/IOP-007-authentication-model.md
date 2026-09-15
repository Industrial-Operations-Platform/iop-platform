# IOP-007 — Design authentication

## Status

In progress — evaluation complete; ADR-0015 awaits explicit owner acceptance.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal and business value

Document the authentication/session model, explicitly evaluate local POC login,
and define a future Entra ID contract. Provide a reviewable decision before
implementation of a reusable platform.

## Context and current state

The repository contains documentation only. Individual login, the TypeScript/NestJS
backend and scoped RBAC are accepted. Identity provider, credentials and sessions
are not yet selected. See [modules](../../architecture/modules.md), the
[backend review](IOP-002-backend-review.md) and [workflow](../workflow.md).
The obsolete active backend-stack document is now preserved as
[backend evaluation](IOP-002-backend-evaluation.md).

## Desired state and requirements

- Deliver only IOP-007's authentication/session design and decision.
- Keep identity, permissions, organization/site scope and provider concerns separate.
- Evaluate local credentials against an OIDC provider and early Entra integration;
  local POC login is not an already-approved exception to ADR-0004.
- Define identity mapping, provisioning/recovery, disabled-user behavior, session
  expiry/revocation and the future provider boundary.
- Update the accepted architecture only after explicit decision acceptance.

## Evaluation result

[Proposed ADR-0015](../../architecture/adr/ADR-0015-authentication-sessions.md)
recommends an explicitly enabled local password adapter for the pilot, opaque
server-side sessions in PostgreSQL and a future server-mediated Entra OIDC adapter.
The ADR compares identity and session alternatives, records tradeoffs and negative
scenarios, and keeps platform permissions outside provider tokens. This is a
recommendation, not an accepted design or implemented security guarantee.

## Acceptance criteria

- [x] Authentication/session model and local/Entra alternatives documented.
- [x] Evaluation plan records scenarios, dependencies and validation within scope.
- [x] Proposal, item/backlog and completed evaluation evidence are synchronized.
- [ ] Owner explicitly accepts or revises ADR-0015.
- [ ] Accepted architecture documentation is synchronized after acceptance.

## Domain and architecture constraints

Authentication supplies verified platform identity; Users/RBAC evaluates current
permission for an explicit organization/site target. Customer labels and provider
schemas stay outside the generic domain. Read Accepted
[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md),
[ADR-0012](../../architecture/adr/ADR-0012-organization-site-scope.md),
[ADR-0013](../../architecture/adr/ADR-0013-tenancy-data-isolation.md) and
[ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md).
Proposed ADRs do not authorize dependent implementation.

## Security and data considerations

Define credential/session lifecycle and narrow global identity access without
weakening scoped business authorization or RLS. Do not commit secrets or real
customer data. Document persistence implications without creating schemas.
Industrial integrations remain read-only.

## API and UI considerations

Specify login/session/logout behavior and safe failures without creating endpoints
or selecting an administrative UI. UI visibility cannot replace access checks.

## Dependencies and non-goals

Dependencies: [IOP-002](IOP-002-technology-stack.md) and
[IOP-006](IOP-006-rbac-model.md), both complete as design.
Implementation remains in separately requested [IOP-028](IOP-028-local-authentication.md)
and [IOP-106](IOP-106-entra-adapter.md). No application, migration, infrastructure,
MFA product, provider deployment or adjacent security-baseline work is included.

## Validation and documentation impact

See the [completed evaluation plan](../completed/IOP-007-authentication-evaluation-plan.md)
for link, status, whitespace and scenario-review evidence. No runtime tests exist.
The permanent item and [backlog](../backlog.md) remain In progress pending the
owner's decision. Baseline synchronization requires a subsequent acceptance slice.

## Open decision

Accept or revise ADR-0015, including local pilot credentials, operator-assisted
recovery, server sessions with proposed 30-minute idle/8-hour absolute limits,
and the future Entra contract. Acceptance has not been inferred from branch merges
or remote synchronization.
