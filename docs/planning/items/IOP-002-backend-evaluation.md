# IOP-002 — Backend evaluation evidence

Source specification: [IOP-002 technology stack](IOP-002-technology-stack.md).

This preserves the prior backend evaluation; it is evidence, not an execution plan.
Its recommendation is historical. The [current review](IOP-002-backend-review.md)
reassesses the clarified solo-team, analytics-only v1 and is the current proposal.

## Goal
Choose the backend technology for IOP v1.

## Context
- Modular monolith
- PostgreSQL
- Docker-based local development
- Small development team
- API-first platform
- Future Microsoft Entra ID integration
- Background jobs required later

## Options to evaluate
- Python + FastAPI
- TypeScript + NestJS

## Decision criteria
- maintainability
- development speed
- ecosystem
- testing
- database tooling
- authentication support
- background jobs
- Codex friendliness

## Deliverables
- comparison
- recommendation
- ADR
- update ARCHITECTURE.md if needed

## Non-goals
- no implementation yet

## Evaluation status

Original evaluation on 2026-09-13. Historical recommendation: TypeScript + NestJS.
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md) is Proposed,
pending acceptance. No implementation or framework selection is effective yet.
This evaluates the backend portion of IOP-002; frontend, detailed tooling,
host/module layout and executable development/test commands remain follow-up work.

## Assumptions and approach

Assume comparable team familiarity with Python and TypeScript; no skill inventory
or prototype measurements are available. Prefer long-term module consistency over
minimum endpoint boilerplate for this broad operational platform. Development
speed and maintainability judgments below are project-specific inferences, not
benchmarks. Docker-based local development is a task constraint, not a reason to
prefer either option. Neither option changes the accepted five foundational ADRs.

## Comparison

### Maintainability

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | Routers and dependencies support modular composition; the team must define domain boundaries and service conventions. |
| TypeScript + NestJS | Modules have explicit imports/exports and encapsulated providers, with dependency injection conventions. |

**Assessment for IOP:** Prefer NestJS for consistent structure across the platform's many modules; neither prevents direct imports or cross-module SQL.

### Development speed

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | Compact endpoint definitions and model-driven validation/OpenAPI support a quick initial API. |
| TypeScript + NestJS | More module/provider setup and framework concepts; repeatable conventions for additional workflows. |

**Assessment for IOP:** FastAPI likely wins the first small slice; NestJS may reduce repeated design choices as scope grows. Team experience can reverse this.

### Ecosystem

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | Direct access to Python data tooling such as pandas, useful for normalization and analytical exploration. |
| TypeScript + NestJS | Framework documentation covers application composition, authentication, database integrations and queues. |

**Assessment for IOP:** Prefer NestJS for the platform backend; Python's analytics advantage alone should not determine all of IOP.

### Testing

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | TestClient/pytest and dependency overrides support API and isolated dependency tests. |
| TypeScript + NestJS | Testing modules and provider overrides support unit/module tests and HTTP end-to-end tests. |

**Assessment for IOP:** Both suitable. Test database behavior against PostgreSQL and cover scope denial paths, regardless of framework.

### Database tooling

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | SQLAlchemy/SQLModel can support PostgreSQL; Alembic provides SQLAlchemy migrations. |
| TypeScript + NestJS | Database-agnostic; documented options include TypeORM and Prisma. |

**Assessment for IOP:** Both suitable. Evaluate transactions, explicit SQL, migrations and tenant enforcement separately; select no ORM here.

### Authentication support

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | Security dependencies integrate with API security schemes; provider verification still needs an adapter. |
| TypeScript + NestJS | Guards and authentication integrations offer a consistent request boundary; provider verification still needs an adapter. |

**Assessment for IOP:** Both can host the future Entra boundary. Neither makes token acquisition equivalent to API token validation or replaces IOP RBAC.

### Background jobs

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | Built-in BackgroundTasks suits small in-process work; heavier/distributed execution needs separate tooling. |
| TypeScript + NestJS | Documented BullMQ/Bull integrations provide a queue option, with Redis infrastructure. |

**Assessment for IOP:** Both viable. Do not select Redis, a queue or delivery guarantees through this backend decision.

### Codex friendliness

| Option | Evaluation |
| --- | --- |
| Python + FastAPI | Concise typed Python can be easy to review; explicit architecture and static-checking conventions would be needed. |
| TypeScript + NestJS | TypeScript checks and uniform module/provider conventions can make changes easier to constrain and review. |

**Assessment for IOP:** Slight preference for NestJS as an engineering inference, not measured Codex performance. Both require documentation and tests.

### References

Capability references: [Nest modules](https://docs.nestjs.com/modules),
[FastAPI application composition](https://fastapi.tiangolo.com/tutorial/bigger-applications/),
[FastAPI validation and OpenAPI](https://fastapi.tiangolo.com/features/),
[Nest OpenAPI](https://docs.nestjs.com/openapi/introduction) and
[Nest runtime validation](https://docs.nestjs.com/techniques/validation).
TypeScript types alone do not validate incoming requests.

Testing references: [FastAPI tests](https://fastapi.tiangolo.com/tutorial/testing/)
and [Nest testing](https://docs.nestjs.com/fundamentals/testing).
Persistence references: [FastAPI SQL](https://fastapi.tiangolo.com/tutorial/sql-databases/),
[Alembic](https://alembic.sqlalchemy.org/en/latest/) and
[Nest database integrations](https://docs.nestjs.com/techniques/database).
Python data tooling: [pandas](https://pandas.pydata.org/docs/).

Authentication references: [FastAPI security](https://fastapi.tiangolo.com/tutorial/security/),
[Nest authentication](https://docs.nestjs.com/security/authentication) and
[Microsoft access-token validation](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens).
The API must verify tokens intended for itself, including signature, issuer,
audience and lifetime, then map identity to platform membership and permissions.
An Entra tenant identifier is not automatically an IOP customer authorization.

Job references: [FastAPI BackgroundTasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
and [Nest queues](https://docs.nestjs.com/techniques/queues).
Durable imports need explicit retry, idempotency, failure handling and customer
context. Neither in-process callbacks nor framework choice settle these concerns.

## Recommendation and acceptance

Recommend TypeScript on Node.js with NestJS for the v1 backend. The deciding factor
is a consistent structure for the broader modular platform, not frontend language
reuse (the frontend is undecided) or assumed superiority in performance.

NestJS adds framework learning, decorators and dependency wiring. Keep domain
rules independent of transport/provider details, exports deliberate and shared
utilities small. Avoid a global shared module that bypasses domain ownership.
Retain read-only industrial adapters and provider-independent authentication.

Choose FastAPI instead if the team has substantially stronger Python experience
or validated near-term requirements depend heavily on Python-only processing.
No second backend or Python worker service is proposed now; any later need must
justify its operational cost and boundary design.

On acceptance, mark ADR-0006 Accepted and synchronize ARCHITECTURE.md and README.md
with the selected backend. Keep ORM/migration tooling, identity adapter/session
model, job infrastructure, versions, API contract conventions, physical tenancy,
frontend and detailed code layout open. This task creates documentation only.
