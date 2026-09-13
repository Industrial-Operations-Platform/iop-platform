# Domain glossary

| Term | Meaning in IOP |
| --- | --- |
| IOP | Industrial Operations Platform; the whole reusable product. |
| OIP | Historical Operational Insights Platform; now the Operational Intelligence module within IOP. |
| Customer / tenant | Organization whose configuration and business data form an isolation boundary; physical tenancy is undecided. |
| Site | Customer-owned operational location with its own context and time zone. |
| Location | Configurable physical subdivision of a site; local names are data. |
| Asset | Canonically identified equipment or component, validated independently of imported message text. |
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
| Handover | Structured transfer of operational context and open issues between shifts. |
| Maintenance record | Work concerning an asset, with status, responsibility and outcome. |
| Authentication | Verification of identity; distinct from permission decisions. |
| RBAC | Role-based access control; roles grant permissions within an explicit scope. |
| Audit record | Trace of actor, action, scope, subject and time for a material change or security event. |
| Integration adapter | Translation boundary between a source system and platform contracts. |

Historical vocabulary such as Halle, Bereich, Betriebsmittelkennzeichen,
Meldetext and Hitliste describes source labels or structures. Map these through
configuration/adapters to locations, asset aliases, message definitions and event
aggregates. Neither their names nor their hierarchy depths are core requirements.
WinCC is an example integration source, not a platform domain dependency.
