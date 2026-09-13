# IOP-002 — Backend review for analytics-only v1

Status: evaluation complete; recommendation Proposed, awaiting owner review.
Source: [IOP-002](IOP-002-technology-stack.md). The original
[NestJS evaluation](IOP-002-backend-evaluation.md) is retained as historical evidence.

## Changed context and recommendation

The owner is the sole developer, already operates a Python CSV preparation/loading
process, and has narrowed v1 to CSV → normalization → analysis → presentation.
Asset Locator, surveys, shifts and maintenance are future scope. PostgreSQL,
modular-monolith boundaries, Docker local development and provider-independent
identity remain constraints. Individual login is required; Entra is a future need.

Recommend **TypeScript + NestJS**, subject to owner acceptance. The owner confirmed
TypeScript/Node.js as the stronger maintenance/debugging background. The narrower
analytics scope increases FastAPI's appeal, but for this solo-maintainer project
that does not outweigh the confirmed experience and Nest's structural conventions.

The earlier recommendation is retained with updated reasoning, rather than assuming
all long-term modules must ship in v1. The Python script remains uninspected: code
quality, reuse rights and translation effort are unknown. No performance benchmark
or model-specific coding advantage has been measured.

## Comparison

### Maintainability

| Option | Assessment |
| --- | --- |
| FastAPI | Routers and dependency composition support a modular API; explicit service, persistence and import-boundary conventions must be documented. |
| NestJS | Module imports/exports and provider injection supply stronger default application structure, but do not enforce all domain/data boundaries. |

NestJS retains the convention advantage. FastAPI can satisfy the accepted modular
monolith if domain rules remain outside routes and adapters. Sources:
[FastAPI composition](https://fastapi.tiangolo.com/tutorial/bigger-applications/),
[Nest modules](https://docs.nestjs.com/modules).

### Development speed

| Option | Assessment |
| --- | --- |
| FastAPI | Model-based validation and OpenAPI support compact API definitions; staying in Python may reduce translation work around the existing pipeline. |
| NestJS | More module/provider setup, with repeatable patterns as workflows grow; translating existing transformations may add effort. |

FastAPI offers concise API construction, but the owner-confirmed TypeScript/Node
experience favors NestJS for this maintainer. Review the existing transformations
as behavioral evidence before estimating translation effort. No reuse is assumed.
[FastAPI features](https://fastapi.tiangolo.com/features/).

### Ecosystem

| Option | Assessment |
| --- | --- |
| FastAPI | Python provides data-processing tools such as pandas alongside the API ecosystem. |
| NestJS | Node/Nest provides documented application integrations for databases, authentication and queues; CSV analytics does not require Python. |

Python offers a strong data-workflow fit, but this does not establish a Python-only
requirement or outweigh the confirmed maintainer experience. [pandas](https://pandas.pydata.org/docs/),
[Nest database integration](https://docs.nestjs.com/techniques/database).
Do not add pandas or a second backend without a demonstrated need.

### Testing

| Option | Assessment |
| --- | --- |
| FastAPI | TestClient/pytest and dependency overrides support API and isolated dependency tests. |
| NestJS | Testing modules and provider overrides support unit/module and HTTP tests. |

Both suitable. The meaningful tests will be CSV normalization, reconciliation,
replay/corrections and scope denial against PostgreSQL, not just endpoint startup.
[FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/),
[Nest testing](https://docs.nestjs.com/fundamentals/testing).

### Database tooling

| Option | Assessment |
| --- | --- |
| FastAPI | SQLAlchemy/SQLModel and Alembic are candidate relational/migration tools. |
| NestJS | Database-agnostic, with documented TypeORM and Prisma options. |

Both fit PostgreSQL. Select tooling separately based on transactions, explicit SQL,
migrations and isolation; framework selection does not settle physical tenancy.
[FastAPI SQL](https://fastapi.tiangolo.com/tutorial/sql-databases/),
[Alembic](https://alembic.sqlalchemy.org/en/latest/),
[Nest database integration](https://docs.nestjs.com/techniques/database).

### Authentication support

| Option | Assessment |
| --- | --- |
| FastAPI | Security dependencies can host the principal/authorization boundary; provider validation requires integration work. |
| NestJS | Guards and authentication integrations offer a structured request boundary; provider validation still requires integration work. |

Both suitable; neither automatically supplies an Entra adapter or the IOP RBAC
matrix. Verify API-intended access tokens, then map identity to platform membership
and permissions. [FastAPI security](https://fastapi.tiangolo.com/tutorial/security/),
[Nest authentication](https://docs.nestjs.com/security/authentication),
[Microsoft token validation](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens).

### Background jobs

| Option | Assessment |
| --- | --- |
| FastAPI | In-process BackgroundTasks is useful for small tasks; durable/heavy imports need a separately designed execution mechanism. |
| NestJS | Documented BullMQ/Bull integrations provide queue options with Redis, but that infrastructure is not implied by selecting NestJS. |

Both viable. Specify retries, idempotency, transaction boundaries and customer
context later; do not run expensive processing in an async request handler or
assume in-process tasks survive restarts. [FastAPI background tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/),
[Nest queues](https://docs.nestjs.com/techniques/queues).

### Codex friendliness

| Option | Assessment |
| --- | --- |
| FastAPI | Typed Python, small modules and explicit contracts can make changes reviewable alongside the data-processing workflow. |
| NestJS | TypeScript checking and repeated provider/module conventions can help constrain changes across a larger application. |

No measured winner. Treat this as reviewability, documentation and validation
quality, not a framework-specific guarantee of generated-code correctness. It does
not outweigh the maintainer's ability to understand and debug the result.

## Tradeoffs and acceptance boundary

NestJS requires more dependency wiring and framework concepts. TypeScript/Node
experience does not imply existing NestJS expertise, so allow for that learning.
Translation of the old pipeline may cost effort; review it for business rules and
reference outputs instead of copying customer-specific behavior into core.

FastAPI remains viable and deserves reconsideration if code review establishes an
important Python-only workload or prohibitive translation cost. Neither is currently
verified. Do not add a second backend/runtime solely to preserve hypothetical reuse.

If accepted, use TypeScript/Node.js with NestJS for the API and consistent backend
module composition for later workers. Heavy analytics and durable ingestion still
need explicit execution/retry design. No queue, ORM, frontend, identity library,
API style, tool version or deployment topology is selected here.

ADR-0006 remains Proposed pending explicit acceptance. The backend evaluation is
complete; the broader IOP-002 frontend/tooling criteria remain unmet. Do not close
the parent task or invent runnable commands to satisfy those criteria.

## Owner input recorded

The owner explicitly answered **TypeScript/Node.js** when asked which language/runtime
they know better for maintenance and debugging. This confirms experience, not acceptance
of NestJS itself. API-framework acceptance is the remaining backend decision.
