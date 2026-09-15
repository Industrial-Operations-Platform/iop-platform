# ADR-0006: TypeScript and NestJS for the v1 backend

## Status

Accepted

Revised under [IOP-002's current backend review](../../planning/items/IOP-002-backend-review.md).
The owner explicitly accepted TypeScript + NestJS after confirming stronger
TypeScript/Node.js experience. The earlier proposal remains available
in [historical evaluation](../../planning/items/IOP-002-backend-evaluation.md) and Git.

## Context

IOP remains an API-first modular monolith with PostgreSQL, Docker-based local
development, provider-independent authentication and later background execution.
The owner clarified a solo development team, an existing Python CSV preparation
pipeline and analytics-only v1. The broader platform's transactional workflows and
Asset Locator are deferred; the initial evaluation assumed earlier workflow breadth.

The current review covers all eight requested criteria with official sources.
The owner confirmed stronger TypeScript/Node.js maintenance/debugging experience.
NestJS-specific experience and existing Python-script reuse/quality remain unverified.
No performance or productivity benchmark has been run.

## Decision

Use TypeScript on Node.js with NestJS for the v1 backend. For a solo maintainer, the confirmed TypeScript/Node experience and
Nest's explicit module/provider conventions outweigh FastAPI's closer fit to the
existing Python script, whose reuse benefit has not been established.

Preserve explicit module ownership and contracts under ADR-0001. Keep domain and
normalization services independent of HTTP routes, source schemas and identity
providers. Future workers may use the same module composition without becoming
separate business microservices. Worker infrastructure and delivery semantics
remain separate decisions.

PostgreSQL remains the relational foundation. Authentication adapters map verified
identities to platform principals; Users/RBAC owns scoped permissions. Customer
labels and industrial source behavior stay in configuration/adapters. No existing
script is copied into core without review. Industrial integration remains read-only.

## Consequences

- NestJS adds framework/dependency-wiring concepts; TypeScript experience does not
  remove the need to learn Nest. Keep module boundaries deliberate and reviewable.
- Existing Python transformations may need reimplementation. Review their behavior
  and expected outputs before estimating work or considering code reuse.
- TypeScript checking does not replace runtime input validation, scoped authorization
  or analytical correctness. Verify normalization, reconciliation and replay rules.
- Module/provider encapsulation does not prevent all direct imports or cross-module
  database access; enforce the accepted domain ownership independently.
- Heavy analytics and durable imports need explicit execution/failure-recovery design;
  selecting NestJS does not automatically select Redis, a queue or microservices.
- Frontend, ORM, migration tools, versions, package manager, API style, identity/session
  libraries, job mechanism, physical tenancy and deployment remain undecided.
  No scaffolding or runnable dev/test commands are created in this task.

## Alternatives considered

**Python + FastAPI:** viable and attractive for the CSV/analytics scope, with access
to Python data tooling and possible reuse after reviewing the existing script.
Its scope advantage does not outweigh the sole maintainer's confirmed TypeScript
experience absent evidence of Python-only processing or prohibitive translation cost.
Reconsider if that evidence emerges. FastAPI can support a modular monolith.

**Python processing plus a NestJS API now:** adds runtime, contract and operational
coordination for a solo team without a demonstrated need. Not proposed.

The original NestJS proposal emphasized broad workflow scope. This review retains
the recommendation primarily because of confirmed maintainer experience; it does
not pull deferred modules into v1. This decision does not authorize implementation.
See the [current comparison](../../planning/items/IOP-002-backend-review.md) for
sources and tradeoffs. Acceptance came from the owner's explicit decision, not from a commit or branch merge.

## Subsequent tenancy decision

Physical tenancy and database enforcement, left open when this record was accepted,
are now selected by Accepted [ADR-0013](ADR-0013-tenancy-data-isolation.md). It adopts
shared tables, scoped constraints and RLS alongside application authorization.
This does not select RBAC grants, identity/session handling, ORM or hosting.
