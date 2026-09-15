# IOP-005 — Design tenancy and data isolation

## Status

Completed — design accepted by the owner on 2026-09-15 under
[ADR-0013](../../architecture/adr/ADR-0013-tenancy-data-isolation.md).
Baseline documentation is synchronized; runtime implementation remains future work.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal and business value

Define how data belonging to different organizations and sites is isolated before
building the reusable platform. Keep identity, permission, scope and identity
providers separate.

## Context and current state

Only documentation and placeholders exist. Accepted ADR-0012 establishes
Organization as the customer boundary and Site as its operational scope. PostgreSQL
and NestJS are accepted; ADR-0013 now selects shared-table layout and enforcement.
The requested historical `active/IOP-002-backend-stack.md` path is absent; the
permanent [backend review](IOP-002-backend-review.md) and ADR-0006 hold current context.

The original task contained no enumerated alternatives. The requested evaluation
covers shared tables, schemas per organization, databases per organization,
dedicated deployments and hybrid routing, plus application-only versus combined
database enforcement. ADR-0013 selects shared tables with explicit scope,
scoped constraints and RLS for the current solo-maintainer analytics v1.
The owner explicitly accepted the recommendation on 2026-09-15.

## Desired state and requirements

- An accepted, reviewable physical tenancy and enforcement decision.
- Scope preserved across reads, writes, relationships, imports, jobs, analytics,
  caches, files and exports when implemented.
- Concrete failure/concurrency scenarios and explicit operational limitations.
- Generic core terminology; customer/source logic stays in configuration/adapters.

## Acceptance criteria

- [x] Organization/site data isolation design explicitly accepted by the owner.
- [x] Options, recommendation, scenarios and decision boundaries documented.
- [x] Proposal documentation checked and evidence recorded.
- [x] Accepted architecture, module guidance, data model and glossary synchronized.

## Architecture constraints and dependencies

[IOP-004](IOP-004-platform-scope-model.md) is complete as design and integrated.
Follow Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md),
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md) and
[ADR-0012](../../architecture/adr/ADR-0012-organization-site-scope.md).
Proposed ADRs are not binding. RBAC, identity/session and detailed ingestion/job
mechanics remain separate work; no adjacent story is activated.

## Security, data and API considerations

Validate action permission and explicit organization/site ownership independently.
Prevent foreign references, missing-scope broadening and pooled context leakage.
Document privileged-role, shared-resource and backup limitations. Keep diagnostics
free of foreign data under ADR-0011. Industrial sources remain read-only.
No secrets, production records or customer maps belong in this repository.
No schemas, policies, endpoints or UI are implemented by this task.

## Non-goals

Application scaffolding, migrations, infrastructure, ORM selection, identity
providers, RBAC grant definitions, hosting or adjacent product capabilities.

## Validation and evidence

The [completed proposal plan](../completed/IOP-005-tenancy-evaluation-plan.md)
records official-source review, design walkthroughs, links, IDs, status consistency
and whitespace checks. No runtime isolation or performance tests ran; no runner
exists. The [acceptance plan](../completed/IOP-005-tenancy-acceptance-plan.md)
records the completed baseline synchronization and its validation.

## Documentation impact and remaining implementation

ADR-0013, ARCHITECTURE.md, modules, data model, glossary and affected ADR references
reflect acceptance. Item and backlog are complete as design. Future implementation
must verify the ADR scenarios with real policies, schema and runtime credentials.
No application, migration, deployment or adjacent story is authorized by closure.
