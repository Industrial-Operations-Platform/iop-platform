# IOP-007 — Design authentication

## Status

In progress — basic prototype login and provider independence confirmed; revised
ADR-0015 session details remain Proposed.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal and business value

Define a basic working login for the owner's independent prototype and retain a
replaceable authentication boundary for future corporate Azure/Entra integration.
Corporate tenant access is currently unavailable. Prioritize the functional
prototype; an identity-management product is not required.

## Context and current state

The repository contains documentation only. Individual login, the TypeScript/NestJS
backend and scoped RBAC are accepted. The owner selected basic local login as the prototype direction. Detailed session
mechanisms remain proposed; no authentication implementation exists. See [modules](../../architecture/modules.md), the
[backend review](IOP-002-backend-review.md) and [workflow](../workflow.md).
The obsolete active backend-stack document is now preserved as
[backend evaluation](IOP-002-backend-evaluation.md).

## Desired state and requirements

- Deliver only IOP-007's authentication/session design and decision.
- Keep identity, permissions, organization/site scope and provider concerns separate.
- Use basic local login behind ADR-0004's provider boundary for the prototype;
  corporate provider access must not block it.
- Require login/logout, current-user resolution, manually provisioned accounts,
  password hashing, session validation and existing scoped permission checks.
- Preserve a local subject-to-platform-user mapping and a future provider boundary.
  Defer registration, recovery-token/email flows, MFA and account-linking UI.
- Update the accepted architecture only after explicit decision acceptance.

## Evaluation result

[Proposed ADR-0015](../../architecture/adr/ADR-0015-authentication-sessions.md)
records the owner-selected local prototype adapter and recommends opaque
server-side sessions in PostgreSQL and a future server-mediated Entra OIDC adapter.
The ADR compares identity and session alternatives, records tradeoffs and negative
scenarios, and keeps platform permissions outside provider tokens. This is a
partially owner-confirmed direction with proposed session details, not an
implemented security guarantee.

## Acceptance criteria

- [x] Authentication/session model and local/Entra alternatives documented.
- [x] Evaluation plan records scenarios, dependencies and validation within scope.
- [x] Proposal, item/backlog and completed evaluation evidence are synchronized.
- [x] Owner clarifies basic prototype login and future third-party direction.
- [ ] Remaining ADR-0015 technical choices are explicitly accepted or revised.
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

## Owner clarification and remaining decision

The owner wants a working independent prototype with basic login as a temporary
adapter; the preferred later provider is the company's Azure/Entra system, currently
unavailable. This selects the local-first direction and defers enterprise identity
features. See the [scope revision plan](../completed/IOP-007-prototype-scope-plan.md).

The revised ADR retains proposed server-side cookie sessions, PostgreSQL persistence
and 30-minute idle/8-hour absolute limits. These details are not inferred to be
accepted from the scope clarification. Implementation remains separately scoped.
