# Platform modules

These are logical ownership boundaries, not generated packages or services.
See [architecture](../../ARCHITECTURE.md) and the [glossary](../product/glossary.md).

| Module | Owns | Uses through explicit contracts |
| --- | --- | --- |
| Platform Core | Organization/Site identities and ownership, scoped configuration, module composition | No customer adapter or business-module internals |
| Users and RBAC | Users, organization memberships, scoped role assignments and authorization evaluation | Core context; authenticated principal |
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
organization membership is separate from permission; role assignments target
explicit organizations or sites under ADR-0014.

Each operation declares organization scope (`organizationId`) or site scope
(`organizationId`, `siteId`). The receiving module validates ownership, access and
all referenced records; internal calls and jobs follow the same rules. Missing
site scope never implies all sites. Integrations resolve source labels through
configured mappings and pass validated scope to receiving modules. Derived results,
files and caches preserve scope and cannot substitute for access checks.

These are logical responsibilities, not implemented interfaces. Scope transport
remains undecided. Accepted [ADR-0014](adr/ADR-0014-scoped-rbac.md) defines grants
without inheritance. Persistence enforcement follows Accepted
[ADR-0013](adr/ADR-0013-tenancy-data-isolation.md).


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


## Authorization responsibilities

Under ADR-0014, modules own named business permissions and resource invariants;
Users/RBAC owns the fixed role bundles, organization memberships, assignments and
current authorization decisions. Authentication supplies the platform principal,
while Platform Core validates organization/site identity and ownership.

OIP owns `analytics.read`; Integrations owns `imports.submit` and `imports.review`.
Owning configuration modules enforce `site-configuration.manage`; Users/RBAC owns
`access.manage`. The ADR's matrix defines each permission's bounded behavior and
scope. HTTP guards, internal callers, workers and configuration commands must all
use equivalent actor/action/target checks; RLS does not replace business permission.

Access changes require organization-scoped delegation checks, traceable mutations
and concurrency protection for authority revocation and last-admin removal.
Identity bootstrap/recovery, concrete transaction coordination and audit delivery
remain implementation contracts; no administrative UI or provider is selected.


## Temporal responsibilities

Accepted [ADR-0016](adr/ADR-0016-time-and-timezone-model.md) assigns site IANA zone
configuration to Platform Core, source interpretation/RAW provenance to Integrations,
event/aggregate and reporting-period semantics to OIP, and future shift intent and
instances to Workforce. Each module validates its temporal invariants and preserves
explicit organization/site scope; shared conversion helpers do not own business rules.

Contracts distinguish millisecond UTC instants from local dates and schedules.
Resolved intervals are half-open; local boundary ambiguity is explicit. Reports
preserve site zone, period, grain, coverage and interpretation context across API,
workers and any future caches/exports. Unknown source windows remain visible.
Receiving modules must not infer occurrence/shift evidence from date-only aggregates.
Site-zone corrections after use require reviewed reprocessing; completed periods
retain their interpretation. Library choice and runtime verification remain future
work; this decision does not activate scheduling or cross-site reports.

## Future audit responsibilities

Accepted [ADR-0017](adr/ADR-0017-audit-model.md) assigns record validation,
persistence and disposal to Audit; emitting modules own event meaning and safe
change fields. When implemented, material changes and their records share one
scoped transaction/connection through explicit contracts. Security observations
have separate outage behavior; Audit never coordinates business workflows.

The owner deferred this capability beyond the pilot. Its absence is not a pilot
mutation or release blocker. Audit inspection adds no implicit permission to
current roles. General job delivery and authentication remain separate decisions.
