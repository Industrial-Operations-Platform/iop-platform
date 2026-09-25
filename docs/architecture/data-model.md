# Conceptual data model

## POC applicability

The [local POC scope](../product/scope-poc.md) and [delivery map](../planning/poc-delivery.md)
select the first analytical slices. The broader model below is not a requirement
to implement every module, entity or lifecycle before the demonstration. Preserve
scope and data invariants in delivered paths. Login/user administration and future
operational modules are deferred; the local execution mechanism remains Proposed
in [ADR-0018](adr/ADR-0018-local-poc-execution-context.md), without changing accepted
identity, authorization or RLS requirements by implication.

This is primarily a conceptual baseline. The IOP-025 organization storage slice
is implemented as described below. PostgreSQL is accepted;
shared-table isolation is accepted under ADR-0013. Beyond that organization slice, physical module schemas, ID encoding/generation,
detailed constraints and indexing remain to be designed.
Module ownership is defined in [modules](modules.md).

## Relationships

| Area | Concepts and relationships |
| --- | --- |
| Core | Organization owns zero or more Sites and scoped configuration; each Site belongs to exactly one Organization and has explicit time-zone context. |
| Identity/access | Provider identity maps to a platform user; membership relates users to organizations; role assignments target an organization or its site. Active membership alone grants no access. Workforce membership is separate from authentication. |
| Workforce | Teams and users are assigned to shifts at sites; handovers reference shifts, authors and open issues. |
| Assets | A site has assets with types, optional parent assets and separately typed relationships such as controller links. Physical location is independent of composition. |
| Mapping | External references relate source identity and local scope to canonical assets; source codes alone are not global keys. |
| Locator | A map belongs to site/location context and has versions; a placement links an asset to one specific map version. |
| Maintenance | A maintenance record references an asset, responsible users, status and outcomes; handovers can link it. |
| Ingestion | A source has import runs and preserved RAW records; normalized records retain source/run/record references and mapping version. |
| Intelligence | Event occurrences or aggregates reference message definitions, source context and resolved assets where known. Assets and message definitions have an explicit many-to-many association. |
| Audit | Records reference organization/site scope, actor, action, subject, time and correlation context; activity views are derived separately. |

## Asset identity and locator

Canonical assets represent surveyed or otherwise validated equipment/components.
Imported equipment codes and alarm text can suggest candidates; they do not
prove that a physical asset exists or identify it uniquely. Track validation
status and evidence; unresolved mappings remain visible for review.

Do not impose a fixed site/hall/area/equipment hierarchy. Validate parent links
for cycles and scope. Controller links express relationships, not permission to
control equipment. A single generic message can apply to several assets, so a
message match alone must not select one asset automatically.

Retain the historical locator design: versioned map images, asset markers with
coordinates in [0, 1], and search by canonical code or scoped source alias. Define
coordinate origin/orientation before implementation. Placements refer to a map
version so replacing an image cannot silently reinterpret coordinates. A lookup
should show ambiguous, unvalidated or unmapped results honestly. Storage format,
map renderer and deep-link contract remain undecided.

## Event normalization and analytical integrity

Preserve RAW input and provenance before canonicalization. Validate required
values, trim configured textual dimensions, normalize units and represent source
time-zone/period semantics explicitly. Preserve original duration values alongside
converted values. Do not silently drop invalid rows through dimension joins;
record rejection/unresolved reasons and reconcile accepted plus rejected inputs.

Distinguish an individual occurrence from a Hitliste-style summary carrying a
date/period, count and accumulated duration. Aggregates cannot reconstruct exact
start/end times or shift membership. Frequency sums require compatible grain;
summed alarm duration is not automatically plant downtime because conditions
may overlap. Metric definitions must state grain, coverage and limitations.

Define source-scoped idempotency keys so re-imports do not duplicate facts; a
local RAW row ID alone does not deduplicate repeated file uploads. Correction,
replay and mapping-version semantics need explicit design. Reconcile counts and
frequency/duration totals against source data, explaining exclusions/corrections.
Trace every analytical result back to its contributing normalized and RAW records.

## Isolation invariants

Customer scope applies to records, aliases, joins, map access and derived views.
References must not cross customer boundaries; site-scoped operations also check
site access. Accepted [ADR-0013](adr/ADR-0013-tenancy-data-isolation.md) selects shared tables,
application authorization, scoped relational constraints and row-level security. Historical globally unique labels
and customer-specific table names are not imported as generic constraints.


## Organization/Site identity and scope

Accepted [ADR-0012](adr/ADR-0012-organization-site-scope.md) uses Organization for
the existing customer isolation boundary, without requiring correspondence to a
legal entity or provider tenant. Organization and Site IDs are stable, opaque and
unambiguous within the platform; names and external codes are mutable scoped data.
Rename preserves identity. A site transfer between organizations requires a
separately approved migration design and is not an ordinary update.

A Location is a configurable subdivision within a site, not an authorization node.
Source hierarchies do not automatically create sites or physical locations. Each
module classifies data as organization-owned or site-owned; a missing site is not
an unexplained wildcard. Site facts, import runs and RAW provenance resolve to one
organization/site context before admission as site data. Ambiguous or conflicting
mappings remain visible and prevent affected input from entering normalized site data.

Site operations validate both IDs and all references, including references to
another site within the same organization. Organization scope is valid only for
operations explicitly declared at that level. Any future cross-site analysis needs
an explicit nonempty authorized site set within one organization, with no silent
omission of unauthorized sites and no cross-organization query implied. Results
retain site, period and coverage context; multi-time-zone aggregation remains
subject to temporal and metric design.

Scope must survive queries, jobs, audit, caches, files and derived views. Current
authorization policy applies at job execution and result retrieval; stored context
is not a permanent grant. Physical enforcement follows Accepted ADR-0013; detailed schema implementation
remains future work, and membership/grant policy follows Accepted ADR-0014.


## Accepted storage requirements

Organization-owned rows carry non-null `organizationId`; site-owned rows also carry
non-null `siteId`. Classify platform-global identity/reference data explicitly and
expose it only through narrow owner contracts. Missing site is never a wildcard.
Constrain site ownership and use scoped candidate keys/composite foreign keys for
same-organization and site-local references. Source aliases and idempotency keys
include their owning scope and source namespace. Ordinary writes cannot reassign
scope ownership.

Customer base tables require enabled/forced RLS with visibility and write checks
against validated transaction-local scope. Application queries and authorization
remain scoped too. Derived views/projections and other access paths require their
own review before runtime grants. Verify pool reuse, rollback, concurrency and
foreign-reference rejection against actual runtime credentials before claiming
isolation; this document provides no DDL or executed security evidence.


## Accepted membership and role assignments

[ADR-0014](adr/ADR-0014-scoped-rbac.md) requires an active platform user and active
organization membership, plus current role assignments at the exact operation
scope. Assignments identify user, known role and organization; site-role assignments
also identify a site owned by that organization. Validate role/scope compatibility.
The pilot does not require a separate site-membership flag.

Role definitions are controlled application configuration with explicit permission
bundles. Memberships and assignments are organization-owned data; client/provider
strings cannot define arbitrary permissions. No assignment inherits to another site
or a newly created site. Removing membership revokes its assignments; restoration
requires new explicit grants. Other organizations' memberships remain independent.

An organization access administrator can delegate the fixed bundles within its own
organization, including explicit site access to itself, without implicit access to
site data. Ordinary access changes preserve at least one active access admin and
serialize relevant authority checks with mutations. Global identity disablement
still stops access and can require operator recovery. Detailed constraints, locking,
bootstrap/recovery and RLS lookup policies need implementation verification.


## Accepted temporal semantics

[ADR-0016](adr/ADR-0016-time-and-timezone-model.md) separates exact instants from
calendar dates and local schedule intent. Persist known instants as `timestamptz(3)`
and dates as `date`; keep site/source IANA zone and interpretation provenance
separately. Preserve RAW values, applied configuration revision and converter
rule/build identity with resolved bounds, offsets and relevant local labels.
System receipt/creation times do not replace source occurrence times. Missing or
ambiguous event times remain explicit quality states; timestamps are not unique IDs.

Known periods are half-open `[start, end)` with end after start. Derive elapsed
duration from instants, keeping it distinct from accumulated alarm duration.
Calendar days and months resolve in an explicit zone; do not assume fixed elapsed
length. Source date-only aggregates retain unknown window/zone semantics and cannot
be split into shifts, fabricated occurrences or proportional partial-period totals.

Future shift instances retain definition revision, local start-date label, zone,
local boundary intent including end-day offset, resolved UTC bounds and any explicit
disambiguation. Nonexistent local times are rejected/unresolved; repeated times
need an evidenced offset or recorded scheduling choice. Planned/actual intervals
remain distinct. This defines semantics without implementing workforce scheduling.

Configure site zones before temporal use; ordinary replacement after use is
unsupported. Corrections require reviewed reprocessing/migration and preserve old
provenance. Retain historical resolved periods through rule updates. Future cross-site
reports explicitly distinguish common instant windows from per-site local dates and
expose each site's bounds while preserving authorization. Physical tables, libraries,
source-window confirmation and runtime round-trip checks remain future work.


## Implemented organization storage (POC)

Accepted [ADR-0020](adr/ADR-0020-local-organization-bootstrap.md) supplies
`platform_core.organizations`: `organization_id` is a non-null, case-sensitive,
opaque text primary key and root scope; `display_name` is validated non-null text
and is not unique. Platform Core owns this table. IDs retain the existing bounded
configuration format. Zero sites are supported without creating implicit scope.

The initial local seed uses the migrator login with transaction-local scope and
forced SELECT/INSERT RLS; runtime has no business access. A matching rerun is a
no-op; a conflicting name is rejected. There is no update/delete path or policy.
IOP-026 supplies site constraints below; ordinary runtime authorization and business
module references remain later implementation. See [commands and evidence](../../infra/database/README.md).


## Implemented POC site persistence

IOP-026 implements Accepted [ADR-0021](adr/ADR-0021-local-site-bootstrap.md) as
`platform_core.sites`: opaque text `site_id` primary key, non-null `organization_id`
FK, `display_name` and explicit `time_zone`. A unique `(organization_id, site_id)`
key supports future scoped references without introducing business tables now.
Platform Core owns the table. Name/ID constraints and an invoker catalog-validation
trigger protect direct inserts; the command also validates the zone with Node Intl.

Forced RLS requires both seed selectors for migrator SELECT/INSERT. Identical seeds
leave the row unchanged; different owner/name/zone fails. Runtime has no business
grants. Site transfers, zone corrections, CRUD and lifecycle remain deferred.
See [commands and evidence](../../infra/database/README.md#initial-site-seed-iop-026).


## Accepted POC original CSV design

[ADR-0022](adr/ADR-0022-poc-csv-preservation.md) places bounded original CSV bytes
and scoped import provenance under Integrations in PostgreSQL. Original bytes and
mandatory metadata become durable together; a RAW receipt is distinct from successful
analytical admission. Scoped normalized references retain import identity and original
physical line numbers. See the [preservation contract](csv-preservation-poc.md) for
budgets, integrity, authorized retrieval and failure/reset semantics. This is accepted
design only; physical RAW/import tables and publication mechanics remain delivery work.
