# Architecture baseline

IOP is a generic industrial operations platform. OIP is its Operational
Intelligence module, not the product boundary. The repository includes the minimal
[IOP-016 API host](apps/api/README.md); the following decisions also guide future
implementation. Business modules and persistence remain unimplemented.

## Immediate delivery boundary

The owner-approved [local analytical POC](docs/product/scope-poc.md) precedes
shared-use v1. Deliver manual CSV preparation, verified analysis and presentation;
login, external connections, full audit, workers and operational modules are later
work. An accepted design does not require building every future capability now.
Keep the accepted stack, module ownership, source adapter, organization/site IDs,
scoped constraints/RLS and temporal semantics for the implemented slices.

[ADR-0018](docs/architecture/adr/ADR-0018-local-poc-execution-context.md) is Proposed:
it describes a bounded local execution adapter without human login. The product
scope is approved, but this mechanism and its narrow exception to verified identity
are not yet accepted. Do not disable authorization/RLS or treat an implicit pilot
site as trusted context. Dependent runtime business access waits for an accepted
mechanism; independent bootstrap/parser/UI work may proceed under its own plans.
See the [delivery map](docs/planning/poc-delivery.md) for exact slices and deferrals.

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
Future API/worker composition follows explicit module contracts. IOP-016 implements
the NestJS host with process health only. Frontend and tooling are accepted under
ADR-0009/0010.

## Intentionally undecided

ORM and migration tooling; module code layout; identity provider, protocols and session handling;
hosting and network topology; job and
cross-module delivery mechanisms; map storage/rendering; event grain and source
contracts; retention, performance, availability and recovery targets.

Resolve these with scoped plans and ADRs where they affect boundaries. IOP-016 adds
API scaffolding and dependency manifests only; database schemas and containers
remain future work.

## Accepted frontend and development tooling

[ADR-0009](docs/architecture/adr/ADR-0009-local-delivery-tooling.md) selects npm
workspaces, scoped Conventional Commits, Husky/lint-staged, Prettier/ESLint and
TypeScript checks, plus Compose and multi-stage local container builds.
[ADR-0010](docs/architecture/adr/ADR-0010-frontend-charting-testing.md) selects
React + TypeScript + Vite, Apache ECharts, Jest for frontend/backend, React Testing
Library, Supertest, Playwright and Testcontainers PostgreSQL. Jest has independent
configuration from Vite. IOP-002 is complete as design; commands and runtime
verification belong to bootstrap stories. IOP-016 supplies npm workspace build,
type checks and Jest/Supertest coverage; hooks, lint/format checks and containers
remain future scoped implementation.


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
work. IOP-016 supplies a generated OpenAPI 3.0.0 health contract and bootstrap error
responses; business contracts, browser bindings and the full error catalog remain
future work.


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

IOP-004 is complete as design. HTTP scope transport and detailed temporal/lifecycle
behavior remain separate decisions. ADR-0014 defines explicit grants without inheritance.


## Accepted tenancy and data isolation

[ADR-0013](docs/architecture/adr/ADR-0013-tenancy-data-isolation.md) selects shared
PostgreSQL tables with explicit Organization/Site scope, application authorization,
scoped relational constraints and row-level security (RLS). Organization-owned rows
have non-null organization identity; site-owned rows also have non-null site identity.
Scoped references prevent inconsistent organization/site ownership.

Customer tables require enabled/forced RLS and a non-owner runtime role without
bypass privileges. Each scoped database unit uses a pinned transaction connection
with validated transaction-local context; missing scope denies access. Organization
scope never grants all-site access. Imports, jobs, analytics and any future caches,
files or exports preserve scope and enforce access independently of row policies.

Shared storage shares resources and recovery impact. Application-set RLS context
does not protect against compromised backend credentials or privileged operators.
IOP-005 is complete as design; schema, policy SQL, driver/pool verification and
runtime isolation tests remain implementation work. Hosting and ORM remain undecided;
RBAC grants are defined separately by ADR-0014.


## Accepted scoped authorization

[ADR-0014](docs/architecture/adr/ADR-0014-scoped-rbac.md) selects explicit module-owned
permissions in three fixed role bundles: site-scoped `analytics-reader` and
`site-operator`, and organization-scoped `organization-access-admin`. Assignments
combine only at the matching target; no role hierarchy, wildcard or automatic site
inheritance exists. Active users and organization membership are prerequisites,
not grants. Team Leader and Taskforce share the reader bundle.

The access administrator may delegate the fixed roles within its organization,
including explicit site access to itself, but has no implicit site data access,
cross-organization authority or RLS bypass. Ordinary administration must preserve
an active organization access admin. Removing membership revokes its assignments;
rejoining does not restore them automatically.

Users/RBAC evaluates current permission on each operation; receiving modules enforce
resource scope and domain conditions. New job chunks/retries and result retrieval
recheck access. A login token is not a permission snapshot. Already-authorized work
may finish; access mutations must serialize authority checks with changes.

IOP-006 is complete as design. The pilot uses a small fixed catalog and explicit
assignments; no custom-role UI, policy engine or enterprise identity integration
is required. Authentication/session implementation remains IOP-007. No runtime
authorization or concurrency tests have run.


## Accepted temporal model

[ADR-0016](docs/architecture/adr/ADR-0016-time-and-timezone-model.md) distinguishes
UTC instants, local calendar values, periods and durations. Sites have explicit
IANA zones; source interpretation belongs in scoped adapter configuration.
Instant contracts use an RFC 3339 profile with millisecond precision and UTC `Z`
output; persistence uses `timestamptz(3)` with separate zone/provenance metadata.

Resolved intervals use `[start, end)`. Reports retain site calendar context across
viewer devices; gaps and repeated local times require explicit resolution or remain
unresolved. Future overnight shifts retain local intent and independently resolved
UTC bounds, so elapsed hours can vary across clock changes. Historical periods are
not silently reinterpreted after zone/rule changes; ordinary site-zone replacement
is disallowed after temporal use pending an explicit correction plan.

IOP-008 is complete as design. CSV filename dates remain source labels until their
window and zone are confirmed; no occurrence timestamps, shift assignments or
24-hour coverage are inferred. Runtime/library validation, source contracts and
shift implementation remain separate work.
