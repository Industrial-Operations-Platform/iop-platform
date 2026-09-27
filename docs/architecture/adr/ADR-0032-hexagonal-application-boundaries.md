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

Apply this to the active analytical workspace and import flow incrementally. Reuse
existing infrastructure behind ports, document remaining legacy surfaces, and do
not claim a folder rename makes them hexagonal. Verify dependency direction and
exercise use cases with in-memory ports, alongside actual adapter integration tests.

## Consequences

PostgreSQL, React or chart adapters can be tested/replaced without rewriting domain
rules. There are more explicit contracts to maintain. Avoid duplicated domain
semantics across browser and server: the browser models report selection and
presentation, while the API owns validation, normalization and aggregate semantics.
This refines ADR-0001, ADR-0006 and ADR-0010 without changing the modular monolith.
