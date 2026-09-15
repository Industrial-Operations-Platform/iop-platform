# Platform modules

These are logical ownership boundaries, not generated packages or services.
See [architecture](../../ARCHITECTURE.md) and the [glossary](../product/glossary.md).

| Module | Owns | Uses through explicit contracts |
| --- | --- | --- |
| Platform Core | Organization/Site identities and ownership, scoped configuration, module composition | No customer adapter or business-module internals |
| Users and RBAC | Users, memberships, roles, scoped permissions | Core context; authenticated principal |
| Authentication | Identity-provider boundary and identity-to-principal mapping | Provider adapters; user identity mapping contract |
| Workforce and Shift Management | Teams, shift definitions, assignments | Core sites; user references |
| Shift Handover | Handover notes, open issues, acknowledgements | Shifts, users, asset and maintenance references |
| Maintenance Management | Maintenance records, status, work outcomes | Assets, users; external references via Integrations |
| Asset Management | Canonical assets, types, hierarchy, controller relationships, validation and alias mappings | Core site context; source identifiers from Integrations |
| Asset Locator | Versioned maps, placements and location search views | Asset and site contracts; no duplicate asset registry |
| Operational Intelligence (OIP) | Canonical event occurrences/aggregates, message definitions, asset/message associations and analytical projections | Normalized input contracts, assets, shifts and maintenance context |
| Integrations | Source adapters, import runs, RAW provenance, source mapping and validation | Receiving modules' ingestion contracts |
| Audit and activity tracking | Audit records and activity projections | Explicit records emitted by modules, with actor and organization/site context |

## Collaboration rules

Each module owns writes to its data. Other modules use published interfaces and
purpose-built read contracts; sharing PostgreSQL does not grant access to another
module's internal tables. Cross-module references carry canonical identifiers and
organization/site scope. Composition wires modules together without adding their business
rules to Platform Core.

Adapters normalize source formats into receiver-owned contracts. The receiving
module validates domain invariants. Audit receives records from operations; it
does not coordinate workflows. Operational Intelligence consumes operational
context and must not become a dependency required to perform core workflows.

`packages/contracts` is for deliberate boundary contracts, not exported internal
entities. `packages/shared` is for small domain-neutral utilities, not a second
core. Module code placement, invocation mechanisms, transaction coordination and
reliable audit/event delivery need design before implementation; a broker or
microservices are not implied.


## Contract strategy

Accepted [ADR-0011](adr/ADR-0011-api-contract-strategy.md) defines REST/JSON and
OpenAPI for the HTTP boundary. Dedicated transport DTOs map into owner-published
TypeScript interfaces and data structures; internal contracts remain independent
of HTTP and provider tokens. Sharing a process does not require internal HTTP calls.

Browser bindings derive from the reviewed OpenAPI artifact and must not import
Nest DTO classes, persistence entities or server internals. Transport validation
checks untrusted input; each receiving module still enforces domain invariants and
scoped references. Source adapters continue to translate vendor data into
receiver-owned ingestion contracts. Exact module placement, invocation and
transaction/delivery mechanisms remain undecided.


## Scope ownership

Accepted [ADR-0012](adr/ADR-0012-organization-site-scope.md) defines Organization
as the customer boundary and Site as its operational scope. Platform Core publishes
site identity/ownership contracts. Authentication supplies the platform principal;
Users/RBAC evaluates permission for the action and explicit target. A user's
membership is separate from permission and may span organizations/sites.

Each operation declares organization scope (`organizationId`) or site scope
(`organizationId`, `siteId`). The receiving module validates ownership, access and
all referenced records; internal calls and jobs follow the same rules. Missing
site scope never implies all sites. Integrations resolve source labels through
configured mappings and pass validated scope to receiving modules. Derived results,
files and caches preserve scope and cannot substitute for access checks.

These are logical responsibilities, not implemented interfaces. Exact grant
inheritance and scope transport remain undecided. Persistence enforcement follows
Accepted [ADR-0013](adr/ADR-0013-tenancy-data-isolation.md).


## Persistence isolation responsibilities

Under ADR-0013, each owning module classifies tables and derived data by scope,
constrains reads/writes and validates scoped references. Customer tables use shared
storage with scoped constraints and enabled/forced RLS. A trusted persistence
boundary installs validated transaction-local context on one pinned connection;
participating repositories must use that transaction handle. Module ownership and
business authorization remain necessary even when database policies filter rows.

API and workers use non-owner runtime credentials without RLS bypass; migration
and backup credentials are separate. Integrations retain scope through RAW and
normalization, and jobs revalidate access at execution and result retrieval.
Derived read paths, files and caches require explicit access review. The decision
does not select module layout, transaction coordination across modules or job tooling.
