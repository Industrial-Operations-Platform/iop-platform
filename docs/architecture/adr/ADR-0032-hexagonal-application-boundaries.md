# ADR-0032 — Hexagonal backend and frontend boundaries

## Status

Accepted by the owner's explicit request for hexagonal backend and frontend
development during IOP-148, 2026-09-27.

## Decision

Within each business module/feature, dependencies point inward: adapters depend on
application ports and domain models; application use cases depend on domain and
ports they own. Domain code does not import frameworks, database drivers, transport
contracts, browser APIs or adapters. Use explicit constructor injection at the
composition root, without requiring a new dependency injection library.

The API uses inbound NestJS controllers and outbound PostgreSQL adapters. Application
ports describe business operations, not SQL connections. Adapters retain pinned
transactions, current authorization, scope predicates and RLS; moving business
rules must not weaken these guarantees. Source CSV decoding stays an integration
adapter, with customer mappings in scoped configuration.

The browser uses React presentation adapters, an HTTP gateway and an ECharts chart
adapter. Framework-free application code owns selection transitions and use-case
orchestration. HTTP schema generation remains at the transport boundary. Chart
options and component lifecycle do not define business measures. The server remains
the authority for full-history aggregation and permissions.

The owner reaffirmed on 2026-09-27 that this applies to every new module, feature
and subsequent code change, including authentication and user administration. Reuse
existing infrastructure behind ports, document remaining legacy surfaces, and do
not claim a folder rename makes them hexagonal. Verify dependency direction and
exercise use cases with in-memory ports, alongside actual adapter integration tests.

## Consequences

PostgreSQL, React or chart adapters can be tested/replaced without rewriting domain
rules. There are more explicit contracts to maintain. Avoid duplicated domain
semantics across browser and server: the browser models report selection and
presentation, while the API owns validation, normalization and aggregate semantics.
This refines ADR-0001, ADR-0006 and ADR-0010 without changing the modular monolith.

## Required implementation review

Keep domain rules and application use cases independent of frameworks and storage.
Declare narrow ports in the owning application layer and inject adapters at host
composition roots. Controllers validate transport and map errors; React renders
state and invokes use cases. Neither owns SQL, credentials policy or authorization.
Use descriptive English names, small cohesive functions, explicit input/output and
error contracts, and avoid duplicated rules, hidden side effects and speculative
abstractions. Customer vocabulary remains scoped data or adapter configuration.

Each execution plan identifies ownership and boundaries before edits. Verify inward
imports with the repository architecture tests, use-case behavior with replaceable
ports, and concrete adapter/security behavior with integration tests. Document an
intentional exception and its bounded migration path; do not silently bypass these
rules because a feature is temporary. Clean code is a review obligation, not a
claim established solely by folder names or a passing formatter.
