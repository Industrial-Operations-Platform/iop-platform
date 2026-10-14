# Site material Audit capture

[IOP-208](../planning/items/IOP-208-local-delivery-infrastructure.md) implements
the explicit same-transaction capture pattern in Accepted [ADR-0017](../architecture/adr/ADR-0017-audit-model.md)
and [ADR-0038](../architecture/adr/ADR-0038-local-operating-infrastructure.md).
This increments site operational coverage; it does not complete the separate
organization RBAC or platform-security event contracts.

`audit/index.ts` publishes the `SiteMaterialAudit` / `SiteMaterialEvent` port types
for other module owners; they do not reference a private Audit adapter.
`audit/adapters/postgres/site-material.ts` implements the narrow reusable callback
`siteMaterialAudit(tx, event)`. Each owner supplies a registered subject, stable ID,
semantic action, prior/current revision, controlled state and optional controlled
reason/source occurrence instant. The callback derives module and stable operation
identity, validates states and calls `appendAudit` through the supplied pinned
authorized transaction. Neither host clients nor a second connection select
authority or scope. Unknown event pairs are rejected by the application and
supplemental migration `20261014070000-site-material-audit.sql`; it adds no tables,
columns or grants and does not rewrite existing migration history.

No free-text note, title, name, manufacturer, serial, endpoint, source tuple,
credential reference, import filename or RAW/domain payload enters the callback.
Workforce records only active/removed and revision references, including schedules;
absence/health categories are excluded. Reporting profiles use the source and
new server-generated version as their subject identity because their existing
version contract uses UUIDs, rather than claiming a numeric source revision.

## Owner and host seams

Owning PostgreSQL directory/lookup ports expose optional `audit?: SiteMaterialAudit`
for existing isolated callers. Mandatory host composition passes `siteMaterialAudit`
for every current material path. An omitted compatibility callback is not claimed
as enabled Audit capture. IOP-203 assembly applies the reviewed owner/host increment
and validates the combined installation.

| Owner adapter | Capture / host injection |
| --- | --- |
| Handover `store.ts` / `AccessLookup.audit` | Canonical journal create/change/resolve/remove; `PlatformRuntime` lookup |
| Handover `formal-records.ts` / `FormalLookup.audit` | Create/correct/publish/close/acknowledge; formal composition |
| Handover `maintenance-issues.ts` | Delegated Maintenance resolution writes bypass the journal store; fifth callback argument, supplied by runtime's Maintenance `resolve` composition |
| Maintenance `store.ts` / `Directory.audit` | Records/completion and settings; shared runtime operational directory |
| Assets `store.ts` / `Lookup.audit` | Canonical registry revisions, including source registration and compatible edits; shared runtime operational directory |
| Assets `enrichment.ts` / `SourceDomainPorts.audit` | Model catalog, independent enrichment/controller relations/review and source-mapping decisions; AssetDomain composition |
| Workforce `store.ts` / `Directory.audit` | All four record kinds and removal; explicit runtime lookup |
| Improvement `store.ts` / `Directory.audit` | Action revisions, evidence/correction and comparison retention; Improvement composition |
| Locator `store.ts` / `LocatorLookups.audit` | Scene and calibration revision, after matching placement writes; Locator composition |
| Integrations `connections.ts` / `ConnectionAccess.audit` | Retained provider configuration enabled/disabled; Connections composition |
| Integrations `ImportBatches` constructor | Third callback argument captures receipt and actual terminal/recovery unit; runtime |
| OIP `OipReceiver` constructor | Third callback argument after the existing projection callback; emits after facts/profile/canonical projections, in the enclosing import transaction |
| OIP `PgReportingProfiles` constructor | Fourth callback argument after initial profile; applied configuration version and projections commit together; runtime |

The current `PlatformRuntime` operational directory covers Assets and Maintenance;
Workforce/Handover receive their own callback fields. Factory callbacks are mandatory
in formal, Improvement, Locator, Connections and AssetDomain composition. The OIP
publication callback still awaits profile projection then canonical asset publication;
Audit appends after that callback. Jobs already have mandatory owner lifecycle Audit.

Derived per-fact/per-alarm projections do not create individual Audit events: their
enclosing import, source-mapping or profile configuration action owns the material
unit. Report reads, inspection of business histories and health checks add no change
events. File configuration/reference activation has no shared PostgreSQL commit
boundary and remains explicit pending capture; file hash/version provenance is
retained separately and must not be described as atomic database Audit.

## Executed evidence and remaining contracts

The owning real PostgreSQL suite exercises actual journal/asset applications,
Workforce/formal lifecycle, Maintenance persistence, independent AssetDomain
sidecars, Improvement evidence/comparison, Locator, registry, OIP publication,
report configuration and delegated Maintenance resolution. Repeating idempotent
journal/asset creation or import recovery retains one event per committed unit.
Both an exception after append and actual runtime Audit INSERT denial roll back
Handover/Assets projection, revisions and event evidence. Sensitive-marker checks
inspect all captured events; unregistered event pairs fail at the database boundary.
The application/SQL catalogs have an independent parity check and reject source
content, unknown subjects, health absence states and invalid source time before SQL.

Organization membership/role events need their separate organization envelope and
operator target/storage class; existing Users/RBAC access audit is not counted as
this contract. Authentication/session/denial events need bounded admission,
suppression/outage evidence, separate platform authority and 90-day retention.
Distributed/chunk jobs, real providers, file activation, operator rotation and
scheduled purge/operational alerts retain their documented remaining scope.
