# Domain glossary

| Term | Meaning in IOP |
| --- | --- |
| IOP | Industrial Operations Platform; the whole reusable product. |
| OIP | Historical Operational Insights Platform; retained technical identifier of the analytical module within IOP. |
| Data Analysis | Current product-facing name of the OIP analytical module; its charts were accepted by the owner as local v1 on 2026-09-27. |
| Organization | Canonical customer data/configuration boundary with stable opaque identity; owns zero or more Sites under ADR-0012. |
| Customer | Business vocabulary for an Organization, not a separate domain entity. |
| Tenant | Isolation/deployment vocabulary; maps to Organization in the shared-table layout accepted by ADR-0013, without adding another ownership hierarchy. |
| Site | Operational scope with stable opaque identity, exactly one owning Organization, configurable name and explicit time-zone context. |
| Location | Configurable physical subdivision of a site; local names are data, not additional authorization scopes. |
| Asset | Stable registered equipment/component identity with explicit verification status; imported message text alone does not validate physical identity. |
| Asset hierarchy | Parent/child composition or functional grouping; distinct from physical placement. |
| External identifier | Source-scoped alias mapped to a canonical entity; not assumed globally unique. |
| Asset Locator | Module for finding an asset's physical placement and functional context. |
| Map / placement | Versioned site diagram and an asset marker with normalized coordinates. |
| Event occurrence | One observed condition with source identity and available timestamps. |
| Event aggregate | Source-reported count and duration for a stated period and grouping; not individual occurrences. |
| Message definition | Reusable event text/category; may relate to multiple assets. |
| RAW record | Preserved source representation with import and source provenance. |
| Normalization | Validated conversion to canonical identifiers, types, units and time semantics while retaining provenance. |
| Operational intelligence | Analysis of events and operational context to support human decisions. |
| Shift | Planned or actual work interval in site time context. |
| Workforce profile | Site-scoped team/home-zone association for a platform user; separate from authentication. |
| Personal schedule | Imported or administrator-entered daily availability/status; does not determine the workplace. |
| Assignment | Dated operational duty and interval within personal availability, optionally carrying a zone and phone responsibility. |
| Floating support | Generic duty allowing rotation between zones; Springer is local presentation vocabulary. |
| Phone responsibility | Exclusive holder during an interval, referenced by a stable zone or maintenance identity. |
| Logical deletion | Removal from active views and access while retaining original records, names and revision history. |
| Handover | Structured transfer of operational context and open issues between shifts. |
| Digital Asset Record | Source-authorized read view combining explicit stable asset identity with Maintenance, Handover and analytical evidence; not a new event owner. |
| Registered asset | Deliberately created stable site identity whose validation state distinguishes unverified evidence from validated physical identity. |
| Maintenance record | Corrective, preventive or inspection work concerning a location/component, with reviewed equipment/report scope, status, responsibility and outcome. |
| Repair scope | Explicit configured location, exact equipment identifiers and included/excluded source problems for one maintenance record; not inferred from proximity or code prefixes. |
| Equipment identifier | Exact source equipment code with namespace/location context; provisionally represents a system part, pending physical verification. |
| Authentication | Verification of identity; distinct from permission decisions. |
| Scope | Explicit operation target: Organization or Organization/Site; target identity does not grant permission. |
| Membership | Relationship between a platform user and an organization; active membership is required but grants no permission by itself under ADR-0014. |
| RBAC | Role-based access control; fixed permission bundles are assigned at explicit organization or site scope under ADR-0014, without inheritance. |
| Permission | Module-owned operation identifier with a required scope and bounded behavior. |
| Role assignment | Association of a user with a known role and one explicit organization or site target; assignments compose only at matching scope. |
| Audit record | Trace of actor, action, scope, subject and time for a material change or security event. |
| Integration adapter | Translation boundary between a source system and platform contracts. |

Historical vocabulary such as Halle, Bereich, Betriebsmittelkennzeichen,
Meldetext and Hitliste describes source labels or structures. Map these through
configuration/adapters to locations, asset aliases, message definitions and event
aggregates. Neither their names nor their hierarchy depths are core requirements.
WinCC is an example integration source, not a platform domain dependency.

Organization/Site semantics are accepted in [ADR-0012](../architecture/adr/ADR-0012-organization-site-scope.md).

Tenancy and persistence isolation are accepted in [ADR-0013](../architecture/adr/ADR-0013-tenancy-data-isolation.md).

The fixed pilot authorization matrix is accepted in [ADR-0014](../architecture/adr/ADR-0014-scoped-rbac.md).


## Temporal vocabulary

Accepted [ADR-0016](../architecture/adr/ADR-0016-time-and-timezone-model.md) defines:

| Term | Meaning in IOP |
| --- | --- |
| Instant | Exact point on the timeline; canonical contracts use millisecond precision and UTC output. |
| Local date | Calendar date without time or offset; a reporting label does not imply an occurrence at midnight. |
| Local date-time | Wall-clock value requiring a zone and ambiguity resolution before identifying an instant. |
| IANA time zone | Named civil-time rules used by a site or source; stored separately from exact instants. |
| UTC offset | Difference from UTC at a particular instant; not a regional time-zone identity. |
| Reporting period | Known half-open interval with interpretation metadata, or an explicitly unresolved source period label. |
| Half-open interval | Includes its start and excludes its end: `[start, end)`. |
| Elapsed duration | Difference between resolved instants in a stated unit; distinct from accumulated alarm duration. |
| Shift business date | Local start date labeling a shift instance or assignment, including overnight shifts. |
| Time ambiguity | A local clock value is missing or repeated because of an offset change; requires explicit handling. |


- **Asset verification status**: lifecycle of a registered identity: Unverified until
  physically checked, Validated with evidence, Retired when removed from current
  work selection. It does not describe location health.
- **Within-area asset grouping**: manually recorded component/group or location
  details inside a configured Bereich, such as a buffer designation. It is not an
  inferred equipment hierarchy or spatial map placement.
