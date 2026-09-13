# Conceptual data model

This is a conceptual baseline, not DDL or a migration plan. PostgreSQL is accepted;
physical schemas, identifiers, constraints and indexing remain to be designed.
Module ownership is defined in [modules](modules.md).

## Relationships

| Area | Concepts and relationships |
| --- | --- |
| Core | Customer owns sites and scoped configuration; a site has time-zone context and configurable physical locations. |
| Identity/access | Provider identity maps to a platform user; membership relates users to customers/sites and scoped roles. Workforce membership is separate from authentication. |
| Workforce | Teams and users are assigned to shifts at sites; handovers reference shifts, authors and open issues. |
| Assets | A site has assets with types, optional parent assets and separately typed relationships such as controller links. Physical location is independent of composition. |
| Mapping | External references relate source identity and local scope to canonical assets; source codes alone are not global keys. |
| Locator | A map belongs to site/location context and has versions; a placement links an asset to one specific map version. |
| Maintenance | A maintenance record references an asset, responsible users, status and outcomes; handovers can link it. |
| Ingestion | A source has import runs and preserved RAW records; normalized records retain source/run/record references and mapping version. |
| Intelligence | Event occurrences or aggregates reference message definitions, source context and resolved assets where known. Assets and message definitions have an explicit many-to-many association. |
| Audit | Records reference customer, actor, action, subject, time and correlation context; activity views are derived separately. |

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
site access. Technical enforcement (shared tables, separate schemas/databases,
row-level policies or a combination) is intentionally undecided under
[ADR-0005](adr/ADR-0005-customer-isolation.md). Historical globally unique labels
and customer-specific table names are not imported as generic constraints.
