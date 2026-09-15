# ADR-0013: Shared tables with explicit scope and row-level security

## Status

Accepted — explicitly approved by the owner on 2026-09-15. Prepared for [IOP-005](../../planning/items/IOP-005-tenancy-and-data-isolation.md).
Acceptance is reflected in the architecture baseline and the completed IOP-005 item.

## Context

Organization is the customer boundary; Site is its operational scope under
[ADR-0012](ADR-0012-organization-site-scope.md). PostgreSQL, a modular monolith and
NestJS are accepted. The [backend review](../../planning/items/IOP-002-backend-review.md)
records one maintainer and a CSV → normalization → analytics v1. No customer count,
volume benchmark, contractual physical separation or recovery target is established.
The seed item contains no enumerated alternatives; the following comparison makes
explicit the options left open by ADR-0005 and the conceptual data model.

The objective is to prevent accidental cross-organization and cross-site access,
including omitted query filters, inconsistent references and pooled-context reuse.
Customer labels and source schemas remain configuration/adapters. This decision
must not select RBAC grants, an identity provider, ORM, queue or hosting topology.

## Alternatives evaluated

These fit/cost assessments are design judgments, not measured performance results.
Physical layout and enforcement are separate axes.

| Layout | Isolation and benefits | Costs and limitations | Assessment for v1 |
| --- | --- | --- | --- |
| Shared database and shared tables | One migration baseline and connection pool; explicit scope supports the accepted logical model. RLS can reinforce application checks. | Common operational failure/resource boundary; each table and data path needs scope enforcement. Per-organization restore requires selective recovery design. | Recommend with application authorization, constraints and RLS together. |
| Schema per organization | Separate namespaces and configurable privileges; easier object-level organization inventory. | Repeated migrations and routing; a schema is not a database boundary. Site authorization remains necessary. A broadly privileged runtime can still reach other schemas. | No established benefit sufficient to justify the added lifecycle work. |
| Database per organization | Separate connection and database privilege boundaries; organization backup/restore can be managed separately. | Database provisioning, migration coordination and pool routing per organization; sites still share an authorization boundary inside each database. A shared cluster still shares resources and administrators. | Reconsider when independent recovery or stronger credential isolation is required. |
| Dedicated application and database deployment per organization | Can separate runtime credentials, upgrades and infrastructure according to deployment design. | Repeated operational management; dedicated deployment does not remove site checks or ensure a generic domain. | Reconsider for an explicit customer isolation or hosting requirement. |
| Hybrid shared/dedicated routing | Can serve different isolation requirements. | Adds both operating models and migration/routing complexity before a demonstrated need. | Defer; no hybrid routing layer in v1. |

PostgreSQL schemas are namespaces with privilege controls; unsafe `search_path`
trust can affect object resolution. A namespace alone is not the desired security
boundary. See [PostgreSQL schemas](https://www.postgresql.org/docs/18/ddl-schemas.html).

| Enforcement | Assessment |
| --- | --- |
| Application filters only | Simple initial setup, but one omitted filter can expose foreign rows; reject as the sole defense. |
| RLS only | Cannot establish business permission or protect files/caches; reject as the sole defense. |
| Application checks + scoped constraints + RLS | Recommend: business authorization, reference integrity and row filtering address different failures. Requires verification against the actual runtime role and transaction mechanism. |

## Decision

### Storage and reference integrity

Use shared PostgreSQL tables for multiple organizations. Tenant means Organization
for this layout; it adds no new entity or hierarchy. Physical schemas may later
organize module ownership, but are not per-customer isolation in this proposal.
Do not introduce customer-specific tables or per-site databases.

Require an explicit storage classification for every table/read model:

- Organization-owned rows carry a non-null `organizationId`.
- Site-owned rows carry non-null `organizationId` and `siteId`.
- Truly platform-global identity/reference data is separately classified and
  accessible only through narrow owner contracts; it must not become a container
  for unscoped customer data. Identity discovery and membership resolution need
  explicit authorization contracts in IOP-006/007, not a global business-data bypass.

Constrain each site to its organization. For site-local relationships, use scoped
candidate keys and composite foreign keys including organization, site and target
identity. Organization-level references include organization and target identity.
A site row referencing organization configuration must enforce the same organization;
the operation separately authorizes use of that configuration. Do not use nullable
site values as a wildcard in a mixed-scope relationship. Declare source alias and
idempotency uniqueness within the owning scope and source namespace, not globally.

These are requirements for future schema design, not DDL. PostgreSQL supports
multi-column uniqueness and foreign keys; nullable referencing columns can avoid
matching checks, so mandatory scope columns must be non-null. See
[PostgreSQL constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).
Module contracts still own reference validation; foreign keys do not authorize
cross-module table access. Scope ownership is immutable in ordinary writes;
reassignment/organization transfers require separate migration approval.

### Authorization and row policies

The application resolves authenticated actor, action, ownership and permission
before business access. Every receiving module also constrains its queries and
references to the validated target. UI selectors, IDs and provider claims are not
grants. RLS adds a database check against that target, not a second RBAC system.

Enable and force RLS on customer-owned base tables, with explicit read/delete
visibility and insert/update checks. Require matching organization and, for site
tables, matching site. An organization operation does not authorize all site rows.
Missing, malformed or incompatible database context must deny access. A future
cross-site read requires a separate, explicit nonempty authorized site set in one
organization; do not ship a wildcard policy or multi-site write mode for v1.

PostgreSQL RLS defaults to deny when enabled without a policy. Superusers and
`BYPASSRLS` roles bypass it; owners normally bypass unless forced. Policy composition
can widen access through permissive OR conditions. `TRUNCATE` and integrity checks
are outside row filtering. Therefore require a non-owner runtime role without
bypass, DDL, truncate or privileged role-switch access; separate migration/backup
credentials from API/workers. Review every policy combination. See
[PostgreSQL RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).

Treat views, functions, partitions and materialized/derived read paths as explicit
review gates: no runtime grant until their effective access preserves the same
scope. Do not assume a base-table policy protects every derived object. Keep errors
free of foreign identifiers and database diagnostics under ADR-0011.

### Transaction and connection contract

Use one explicit database transaction and its pinned connection for each scoped
unit of database work, including reads. A trusted persistence boundary installs
validated context transaction-locally before any customer query. All participating
repositories use that transaction handle; none may silently obtain another pooled
connection. Do not use a mutable process-global current organization or session-wide
scope. Nest request context alone is not evidence of database isolation.

PostgreSQL `SET LOCAL` lasts for the transaction; rollback to a preceding savepoint
can undo it. See [PostgreSQL SET](https://www.postgresql.org/docs/18/sql-set.html).
Require clean pool session defaults, never mixing session-level scope with local
scope, and test the exact driver/pool implementation. Establish context before
savepoints; a retry creates a fresh transaction and installs freshly validated
context. Never switch organizations/sites inside a live transaction. Roll back
before returning failed work to the pool; discard a connection if cleanup cannot
be established. No long database transaction is implied for parsing a whole file:
each admitted chunk must independently satisfy the same contract.

Application-set context protects against omitted filters, not an attacker who can
execute arbitrary SQL as the runtime role and replace that context. Parameterized
queries and a trusted backend remain required. This design does not isolate data
from compromised application credentials, database administrators, backups or
shared-resource contention. Stronger threat models require reconsidering layout
and credentials rather than claiming RLS solves them.

### Imports, jobs and data outside base tables

A configured authorized site determines an import target; source labels cannot
redirect it. RAW, rejected input, normalized records, import status and provenance
retain that scope. Unresolved site mapping stops normalized admission. Any staging
before site resolution requires a restricted, explicitly owned staging contract;
never expose it as global RAW data. Exact staging and batch mechanics stay deferred.

Jobs carry actor/action and explicit target; execution and result retrieval apply
current authorization policy. Every job chunk/retry installs its own validated
transaction context. No general worker bypass role is introduced. Service identity,
revocation timing and durable execution remain IOP-006/007 and job-design concerns.

Derived analytics and stored projections retain scope and apply it before
aggregation. Caches include organization/site plus relevant query and permission
context and still authorize retrieval. Files, exports and job results have scoped
ownership metadata and access checks; opaque URLs or IDs alone grant nothing.
Logs/audit must retain safe scope context without disclosing source payloads through
unrestricted diagnostics. These are requirements if those paths are implemented,
not selection of a cache, object store, export feature or audit schema.

### Operational consequences and reconsideration

One database reduces repeated provisioning/migration work, but shares load and
failure impact. RLS is not a resource quota. Scope columns, constraints and policy
review add storage/index/query costs that need measurement with real analytics.
Backups must capture complete data through separately controlled operational access;
restore into an isolated recovery environment and verify scope before exposure.
Do not promise per-organization point-in-time recovery from shared tables. Retention,
recovery targets, encryption/key topology and hosting remain separate design work.

Reopen this choice if independent customer restore, dedicated credentials/runtime,
residency requirements or measured resource interference demand stronger separation.
Retain stable Organization/Site IDs and module contracts, but do not claim moving to
dedicated storage is automatic or build that routing now.

## Design walkthroughs and implementation evidence required

These are reviewed expected outcomes, not executed security or concurrency tests.
A/B are fictional organizations; A1/A2/B1 are their sites.

| Scenario | Expected result / future verification |
| --- | --- |
| Authorized A/A1 reads and writes | Application permits action; constraints and policies accept only A/A1 data. Include a positive control so deny-all is not mistaken for success. |
| Query omits organization/site predicate | With A/A1 context, actual runtime role still cannot read/update/delete A2 or B1. Verify lists, direct IDs, joins and aggregates. |
| Insert/upsert or ownership-changing update targets A2/B1 | Policy checks and immutable-scope rules reject it; verify bulk and conflict paths too. |
| A/A1 references A2 or B1 asset/import | Scoped foreign key and module validation reject the reference, including concurrent writes; errors disclose no foreign row. |
| Missing context or organization context used for site data | Deny, never default to a pilot site or all sites. Organization configuration still has a positive authorized case. |
| Two concurrent A1/B1 requests use the pool | Each transaction sees only its target; no process/session context cross-talk. |
| A1 transaction commits, rolls back, times out or is cancelled; B1 reuses connection | B1 installs fresh context and sees no A1 rows. Unscoped follow-up cannot inherit A1; uncertain cleanup discards the connection. |
| Savepoint rollback or retry | Context cannot disappear into permissive access; failed/missing context denies and retried work revalidates. |
| Same external code/file imported in two sites | Independent scoped identities/idempotency; no cross-site deduplication or redirection. |
| Job actor loses access before execution/result download | Current authorization denies; stored target and result ID do not grant access. |
| Cached report/export requested from another scope | Retrieval denies and cache/file lookup cannot return another scope's content. |
| New customer table, permissive policy or privileged view is added | Schema/privilege review and negative tests must fail until scope protection is verified; use actual runtime credentials, not the owner. |
| Future multi-site read requests unauthorized A2 | Reject the requested set; no silently incomplete report. No cross-organization business operation. |
| Shared backup is restored | Operational recovery verifies completeness and isolation before application access; runtime RLS is not a backup authorization system. |

Future implementation must exercise these cases with the accepted PostgreSQL
Testcontainers/Jest stack and API checks where relevant. Also verify parameterized
SQL, effective grants, derived-object behavior and query plans. No runner, policy,
schema or performance measurement exists here; accepting this ADR accepts design,
not proof of runtime isolation.

## Acceptance boundary and sources

The owner explicitly accepted this decision. Architecture, modules, data model,
glossary and IOP-005 status are synchronized under the
[acceptance plan](../../planning/completed/IOP-005-tenancy-acceptance-plan.md).
IOP-005 is complete as design. No other story is activated. ORM/migrations, RBAC,
identity, HTTP scope transport and deployment remain separate decisions.

Official PostgreSQL 18 documentation linked above was consulted on 2026-09-15.
The documentation version is a reference, not selection of IOP's database version.

## Subsequent RBAC decision

Accepted [ADR-0014](ADR-0014-scoped-rbac.md) defines the pilot permission matrix,
explicit organization/site role assignments without inheritance, delegation and
revocation semantics. Users/RBAC evaluates current permissions independently of
authentication and RLS. Identity/session mechanisms and detailed persistence
implementation remain separate work.
