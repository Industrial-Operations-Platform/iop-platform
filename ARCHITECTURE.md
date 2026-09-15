# Architecture baseline

IOP is a generic industrial operations platform. OIP is its Operational
Intelligence module, not the product boundary. This repository is documentation
only; the following decisions guide future implementation.

## Accepted foundations

- [ADR-0001](docs/architecture/adr/ADR-0001-modular-monolith.md): modular monolith with explicit module ownership.
- [ADR-0002](docs/architecture/adr/ADR-0002-monorepo.md): this monorepo is the single main platform repository.
- [ADR-0003](docs/architecture/adr/ADR-0003-postgresql.md): PostgreSQL is the primary relational database.
- [ADR-0004](docs/architecture/adr/ADR-0004-authentication-abstraction.md): provider-independent authentication boundary.
- [ADR-0005](docs/architecture/adr/ADR-0005-customer-isolation.md): generic domain with customer-scoped configuration and data.
- [ADR-0006](docs/architecture/adr/ADR-0006-backend-stack.md): TypeScript/Node.js with NestJS for the backend.

## Boundaries and flow

Future web, API and worker directories represent delivery/processing hosts for
one modular platform. They do not establish independently owned microservices.
Modules own business behavior and persistence; hosts compose them. Workers may
execute background jobs using the same module contracts and release baseline.

Industrial data flows from read-only source adapters through RAW capture,
validation and normalization into owning modules and analytical read models.
IOP may write its own handovers, maintenance records and configuration, but does
not issue industrial control commands or write back to source systems in v1.

Keep customer names, location labels, equipment codes, map data and integration
settings in customer-scoped configuration/data. Put vendor protocols and schema
translation in integration adapters. No customer-specific branching, types or
hard-coded hierarchy levels belong in the generic domain.

## Architecture map

- [System context](docs/architecture/system-context.md): actors, external systems and trust boundaries.
- [Modules](docs/architecture/modules.md): ownership and collaboration rules.
- [Conceptual data model](docs/architecture/data-model.md): identities, relationships and normalization.
- [Product scope](docs/product/scope-v1.md) and [roadmap](ROADMAP.md): proposed capabilities and sequencing.

The historical PDFs named in [README](README.md) inform the analytics and locator
model. Their SQL, deployment examples and pilot-specific choices are not adopted
as platform implementation requirements. The foundational ADRs record accepted choices; ADR-0007 records the repository
workflow required by the owner.

## Required repository workflow

[ADR-0007](docs/architecture/adr/ADR-0007-planned-workflow.md) is Accepted:
work from a requested backlog item, write its execution plan before changes and
preserve completion evidence. See [workflow](docs/planning/workflow.md).
This does not accept any pending technology choice.

## Accepted backend

The owner accepted TypeScript on Node.js with NestJS under ADR-0006. The
[current IOP-002 review](docs/planning/items/IOP-002-backend-review.md) covers both
options against the analytics-only v1 scope and confirmed maintainer experience.
Future API/worker composition follows explicit module contracts. No framework
scaffold or application code exists yet. Frontend and tooling are accepted under ADR-0009/0010.

## Intentionally undecided

ORM and migration tooling; module code layout; identity provider, protocols and session handling;
physical tenancy and database enforcement; hosting and network topology; job and
cross-module delivery mechanisms; map storage/rendering; event grain and source
contracts; retention, performance, availability and recovery targets.

Resolve these with scoped plans and ADRs where they affect boundaries. No
application scaffolding, database schema, containers or dependency manifests are
part of this baseline.

## Accepted frontend and development tooling

[ADR-0009](docs/architecture/adr/ADR-0009-local-delivery-tooling.md) selects npm
workspaces, scoped Conventional Commits, Husky/lint-staged, Prettier/ESLint and
TypeScript checks, plus Compose and multi-stage local container builds.
[ADR-0010](docs/architecture/adr/ADR-0010-frontend-charting-testing.md) selects
React + TypeScript + Vite, Apache ECharts, Jest for frontend/backend, React Testing
Library, Supertest, Playwright and Testcontainers PostgreSQL. Jest has independent
configuration from Vite. IOP-002 is complete as design; commands and runtime
verification belong to bootstrap stories. No tooling is implemented yet.


## Accepted API strategy

[ADR-0011](docs/architecture/adr/ADR-0011-api-contract-strategy.md) selects REST/JSON,
major versions in business API paths starting at `/api/v1`, and RFC 9457 Problem
Details errors. Dedicated Nest transport DTOs and explicit metadata generate a
reviewed OpenAPI artifact; browser bindings derive from that artifact. Runtime
validation and owning-module invariants remain necessary.

Internal module contracts are independent of HTTP and identity providers. Every
operation documents and enforces its permissions and customer/site scope. Detail
collections use bounded cursor pagination; analytical responses preserve metric,
period, unit and coverage semantics. Breaking contract changes require explicit
compatibility review and normally a new major version.

IOP-003 is complete as design. OpenAPI dialect/tool versions, endpoint schemas and
limits, exact error catalogs and runtime conformance checks remain implementation
work. No API or generated contract exists yet.


## Accepted Organization/Site scope

[ADR-0012](docs/architecture/adr/ADR-0012-organization-site-scope.md) names
Organization as the canonical customer data/configuration boundary. An organization
owns zero or more sites; each site has exactly one organization, a stable opaque
identity, a configurable name and explicit time-zone context. Locations and source
labels are configurable data, not additional authorization scopes.

Operations explicitly require organization scope (`organizationId`) or site scope
(`organizationId`, `siteId`). Validate ownership and permission independently;
missing site scope never broadens access. Users/RBAC owns authorization, Platform
Core owns scope identity and each receiving module enforces scoped references.
Scope follows imports, jobs, derived results and other data paths. Organization
membership alone does not grant all-site access.

IOP-004 is complete as design. Physical tenancy, permission inheritance, HTTP scope
transport and detailed temporal/lifecycle behavior remain separate decisions.
