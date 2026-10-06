# Platform modules

## POC applicability

The [local POC scope](../product/scope-poc.md) and [delivery map](../planning/poc-delivery.md)
select the first analytical slices. The broader model below is not a requirement
to implement every module, entity or lifecycle before the demonstration. Preserve
scope and data invariants in delivered paths. The local selector is implemented
under ADR-0018/0030/0034. [IOP-165](../planning/items/IOP-165-operational-home.md)
implements temporary authenticated access and user administration under accepted
[ADR-0035](adr/ADR-0035-transitional-authentication.md). Shift Handover supplies operational entries and selected Start highlights under
ADR-0036. Workforce is implemented under [IOP-184](../planning/items/IOP-184-m6-workforce.md); Maintenance and supporting stable Assets/Digital Asset Record are delivered under IOP-194, integrated into develop and published to origin on 2026-10-06; owner product review remains pending. M9 Asset Locator and full M4 capabilities remain deferred. Existing identity, authorization and RLS requirements still apply.

[IOP-168](../planning/items/IOP-168-shift-handover.md) captures the requested first
Shift Handover increment. [ADR-0036](adr/ADR-0036-shift-handover.md) defines its accepted
durable references and permissions before Workforce/Asset delivery; the first journal increment implements it. See the [product contract](../product/shift-handover.md).

These are logical ownership boundaries, not generated packages or services.
See [architecture](../../ARCHITECTURE.md) and the [glossary](../product/glossary.md).

| Module | Owns | Uses through explicit contracts |
| --- | --- | --- |
| Platform Core | Organization/Site identities and ownership, scoped configuration, module composition | No customer adapter or business-module internals |
| Users and RBAC | Users, organization memberships, scoped role assignments and authorization evaluation | Core context; authenticated principal |
| Authentication | Identity-provider boundary, local credentials, throttling and revocable sessions | Provider adapters; user identity mapping contract |
| Workforce and Shift Management | Teams, shift definitions, assignments | Core sites; user references |
| Shift Handover | Handover notes, open issues, acknowledgements | Shifts, users, asset and maintenance references |
| Maintenance Management | Categorized work, manual repair scopes, include/exclude decisions, assignments, status and outcomes | Assets/users/team directories; Handover-owned related-entry and scoped resolution contracts |
| Asset Management | Canonical assets, types, hierarchy, controller relationships, validation and alias mappings | Core site context; source identifiers from Integrations |
| Asset Locator | Versioned maps, placements and location search views | Asset and site contracts; no duplicate asset registry |
| Data Analysis (OIP) | Canonical event occurrences/aggregates, message definitions, asset/message associations and analytical projections | Normalized input contracts, assets, shifts and maintenance context |
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
core. ADR-0026 defines the first API-local Users/RBAC/Platform Core placement and pinned
site-operation handoff. Broader module placement, invocation and reliable
audit/event delivery still need design; a broker or
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
receiver-owned ingestion contracts. ADR-0026 implements the first bounded API-local authorization contracts and
transaction handoff; broader placement and delivery mechanisms remain undecided.


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

IOP-029 implements the bounded site-ownership and current-permission interfaces
under Accepted ADR-0026; the other responsibilities remain logical contracts. Delivered HTTP operations bind the configured organization/site through the host;
broader multi-site transport remains separate design. Accepted [ADR-0014](adr/ADR-0014-scoped-rbac.md) defines grants
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
Local identity bootstrap/recovery, scoped transaction coordination and profile
administration are implemented under ADR-0026/0027/0035. Corporate provider binding
and general Audit delivery remain future contracts.


## Temporal responsibilities

Accepted [ADR-0016](adr/ADR-0016-time-and-timezone-model.md) assigns site IANA zone
configuration to Platform Core, source interpretation/RAW provenance to Integrations,
event/aggregate and reporting-period semantics to OIP, and shift intent and
instances to Workforce. Each module validates its temporal invariants and preserves
explicit organization/site scope; shared conversion helpers do not own business rules.

Contracts distinguish millisecond UTC instants from local dates and schedules.
Resolved intervals are half-open; local boundary ambiguity is explicit. Reports
preserve site zone, period, grain, coverage and interpretation context across API,
workers and any future caches/exports. Unknown source windows remain visible.
Receiving modules must not infer occurrence/shift evidence from date-only aggregates.
Site-zone corrections after use require reviewed reprocessing; completed periods
retain their interpretation. Workforce runtime resolution and scheduling are delivered under IOP-184.
Cross-site reporting and reviewed site-zone corrections remain separate scope.


## Implemented POC authorization boundary

IOP-029 implements Users/RBAC's current exact-target lookup and Platform Core's
site-ownership contract in `apps/api/src/modules/`, composed by the pinned
`persistence/site-operation.ts` helper. Consumers receive an immutable actor/target
and scoped query handle only after authorization. Lookup and authorized business
selectors are distinct; runtime reads are limited to the columns specified in
[ADR-0026](adr/ADR-0026-poc-authorization-lookup.md). Repositories must use the supplied
handle and enforce domain references. IOP-147 activates local business paths under ADR-0018/0030; IOP-165 adds the
ADR-0035 local password/session adapter. All delivered business modules reuse
current authorization; public health remains process liveness only.


## Internal POC import batch boundary

IOP-042 implements Integrations-owned receipt, quota, outcome and date-claim storage
under [ADR-0027](adr/ADR-0027-poc-import-publication.md). Its API-local internal
service reuses ADR-0026 authorization/transactions and invokes an injected owning
OIP publication/reconciliation contract. IOP-042 originally delivered only the internal lifecycle slice. IOP-045/147/148
subsequently supply CSV decoding, the OIP receiver, HTTP activation and reporting. See the [batch model](import-batches-poc.md) and
[internal integration guide](../../infra/database/README.md#internal-import-batches-iop-042).

Workforce owns personal availability, teams, shift definitions, assignments and
revision history. Its source decoder belongs to Integrations; scoped people come
from Users/RBAC through host composition. See [Workforce](../product/workforce.md).

## Maintenance and Digital Asset Record — IOP-194

Maintenance owns work/status/priority/ownership and immutable revision evidence.
Its responsibility directory uses Workforce-owned teams, Users/RBAC-owned scoped
people and Asset-owned stable references through host composition. Assets owns
identity, exact aliases and the digital-record read orchestration. Dedicated
source adapters remain within Maintenance, Handover and OIP; no consumer joins
another module's private tables or writes its evidence. Access is current and
source-specific. See the [product contract](../product/maintenance-assets.md) and
[implementation guide](../development/maintenance-assets.md).

## Future audit responsibilities

Accepted [ADR-0017](adr/ADR-0017-audit-model.md) assigns record validation,
persistence and disposal to Audit; emitting modules own event meaning and safe
change fields. When implemented, material changes and their records share one
scoped transaction/connection through explicit contracts. Security observations
have separate outage behavior; Audit never coordinates business workflows.

The owner deferred this capability beyond the pilot. Its absence is not a pilot
mutation or release blocker. Audit inspection adds no implicit permission to
current roles. General job delivery and authentication remain separate decisions.
