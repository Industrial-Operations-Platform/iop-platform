# ADR-0006: TypeScript and NestJS for the v1 backend

## Status

Proposed

Evaluated 2026-09-13 under [IOP-002](../../planning/items/IOP-002-backend-evaluation.md).
Awaiting acceptance; this recommendation does not yet select the backend.

## Context

IOP is an API-first modular monolith with PostgreSQL, a small team, Docker-based
local development, future Microsoft Entra ID integration and later background
jobs. Its scope includes many transactional workflows as well as Operational
Intelligence. The five accepted foundational ADRs remain binding.

The task compares Python + FastAPI and TypeScript + NestJS for maintainability,
speed, ecosystem, testing, persistence, authentication, jobs and Codex-assisted
work. The [comparison and sources](../../planning/items/IOP-002-backend-evaluation.md)
record the evidence. Assume comparable language experience; productivity and
Codex-friendliness assessments are judgments, not measured results.

## Decision

Recommend TypeScript on Node.js with NestJS for the IOP v1 backend. Its explicit
module imports/exports and dependency injection fit the platform's existing
ownership boundaries and reduce the number of conventions the team must invent.
[Nest module documentation](https://docs.nestjs.com/modules) describes those
mechanisms; they do not enforce all domain or data boundaries by themselves.

If accepted, apply this stack to the future API and backend worker host, within
the same modular platform. Keep business rules independent of HTTP, identity
providers and customer adapters. Expose deliberate module contracts; do not
export persistence internals or treat the shared database as a cross-module API.

Maintain PostgreSQL, customer isolation, read-only industrial integrations and
the authentication abstraction. Future Entra integration remains an adapter;
Users/RBAC continues to own platform permissions. No application scaffolding is
part of this decision.

## Consequences

- Consistent composition and TypeScript checking should aid review across many
  modules, at the cost of framework learning and more setup than a minimal API.
- TypeScript types do not replace runtime validation. Module wiring does not
  replace import discipline, customer-scoped authorization or database checks.
- Keep provider details and mutable customer/request context out of generic
  singleton state. Verify isolation in requests, jobs and persistence later.
- Durable ingestion and CPU-heavy work need explicit execution and reliability
  design; choosing NestJS neither selects a queue nor mandates microservices.
- Python's data-processing ecosystem remains a reason to revisit specialized
  needs, not justification for adding a second runtime/service now.
- Frontend, ORM/migration tools, Node/Nest versions, package manager, HTTP adapter,
  API conventions, identity libraries/sessions, job infrastructure, detailed module
  paths, physical tenancy and deployment topology remain undecided. Record
  versions and actual development/test commands during a later setup task.

## Alternatives considered

**Python + FastAPI:** viable, with concise API construction, validation/OpenAPI,
router/dependency composition and Python data tooling. Prefer it if team Python
expertise or concrete Python processing requirements outweigh the value of Nest's
application conventions. It would need explicit project conventions for domain
services and worker composition; it is not limited to small applications.

**Both stacks initially:** adds dependency, deployment and contract coordination
cost for a small team without a demonstrated need. Not recommended for v1.

Revisit this recommendation before implementation if team experience or validated
workload requirements invalidate its assumptions. No performance ranking is
claimed without representative measurements.
