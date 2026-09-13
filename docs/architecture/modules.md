# Platform modules

These are logical ownership boundaries, not generated packages or services.
See [architecture](../../ARCHITECTURE.md) and the [glossary](../product/glossary.md).

| Module | Owns | Uses through explicit contracts |
| --- | --- | --- |
| Platform Core | Customer/site context, generic configuration, module composition | No customer adapter or business-module internals |
| Users and RBAC | Users, memberships, roles, scoped permissions | Core context; authenticated principal |
| Authentication | Identity-provider boundary and identity-to-principal mapping | Provider adapters; user identity mapping contract |
| Workforce and Shift Management | Teams, shift definitions, assignments | Core sites; user references |
| Shift Handover | Handover notes, open issues, acknowledgements | Shifts, users, asset and maintenance references |
| Maintenance Management | Maintenance records, status, work outcomes | Assets, users; external references via Integrations |
| Asset Management | Canonical assets, types, hierarchy, controller relationships, validation and alias mappings | Core site context; source identifiers from Integrations |
| Asset Locator | Versioned maps, placements and location search views | Asset and site contracts; no duplicate asset registry |
| Operational Intelligence (OIP) | Canonical event occurrences/aggregates, message definitions, asset/message associations and analytical projections | Normalized input contracts, assets, shifts and maintenance context |
| Integrations | Source adapters, import runs, RAW provenance, source mapping and validation | Receiving modules' ingestion contracts |
| Audit and activity tracking | Audit records and activity projections | Explicit records emitted by modules, with actor and customer context |

## Collaboration rules

Each module owns writes to its data. Other modules use published interfaces and
purpose-built read contracts; sharing PostgreSQL does not grant access to another
module's internal tables. Cross-module references carry canonical identifiers and
customer scope. Composition wires modules together without adding their business
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
