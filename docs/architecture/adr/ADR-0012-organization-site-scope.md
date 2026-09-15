# ADR-0012: Explicit Organization and Site scope

## Status

Accepted — explicitly approved by the owner on 2026-09-15. Prepared under
[IOP-004](../../planning/items/IOP-004-platform-scope-model.md).
The original evaluation was proposed on 2026-09-14; acceptance updates the logical
scope baseline without selecting physical tenancy or detailed RBAC.

## Context

The accepted model has customer-owned sites, provider-independent identity and
customer isolation across module operations. The completed IOP-001 defines CSV
preparation, analysis and presentation with individual, scoped access. A single
pilot must not make its customer names, source labels or plant hierarchy generic
platform assumptions. Site context is already relevant without Asset Locator.

The seed task asks for an Organization/Site model but enumerates no alternatives.
The options below are project design judgments against the repository's accepted
requirements, not performance measurements or externally validated requirements.
Read [architecture](../../../ARCHITECTURE.md), [modules](../modules.md),
[data model](../data-model.md) and [glossary](../../product/glossary.md).

## Alternatives considered

| Model | Benefit | Cost or limitation for IOP | Recommendation |
| --- | --- | --- | --- |
| Organization only; sites are labels/filters | Small initial model for one customer and one plant. | Does not adequately represent the already required site ownership, time context and site access boundary; labels cannot identify authorization scope. | Reject for the logical model. |
| Organization owns Sites; locations remain configurable | Makes the existing customer/site boundary explicit, supports multiple sites and keeps operational labels outside access identity. | Requires validating both organization and site and distinguishing organization operations from site operations. | Select. |
| Generic recursive scope tree | Allows arbitrary business units and nested access scopes. | Introduces node types, inheritance and ancestor authorization rules without an accepted need; risks treating physical/source hierarchies as access hierarchies. | Defer until a concrete requirement justifies a separate decision. |

Physical shared tables, schemas, databases and dedicated deployments are a
separate axis, owned by IOP-005. None is selected by this logical model.

## Decision

### Vocabulary, identity and ownership

Use **Organization** as the canonical name for the customer data/configuration
boundary already described in ADR-0005. Customer is business vocabulary for that
organization, not a second domain entity. Tenant describes isolation/deployment
concerns and does not introduce a second ownership hierarchy here. An organization
need not correspond to an identity-provider tenant or to a legal company record.

An Organization has a stable opaque canonical ID and a configurable display name.
It owns zero or more Sites, permitting configuration before the first site exists.
A Site has a stable opaque canonical ID, exactly one owning organization, a display
name and explicit time-zone context. Zero sites means no site operations are
available; the platform must not create an implicit wildcard site.

Canonical IDs must be unambiguous within the platform; their encoding/generation
and database representation remain implementation decisions. Names and external
codes are mutable data and cannot serve as authorization keys. Even an unambiguous
site ID is not proof of its organization or permission to access it.

A Location is a configurable subdivision within a Site, not an additional access
scope in this decision. Hall, area and equipment labels from a source do not create
sites or locations automatically. Mappings belong in configuration/adapters, and
source groupings need not match surveyed physical locations.

Renaming an organization/site preserves its identity and references. Moving an
existing site to another organization is not an ordinary update: it would change
the isolation boundary for historical records. Such a transfer requires a separately
approved migration design; no transfer operation is authorized here. Deletion,
archival, retention and time-zone change semantics remain separate lifecycle work.

### Module responsibilities and logical contracts

| Owner | Responsibility under this decision |
| --- | --- |
| Platform Core | Organization/Site identities, ownership and scoped configuration; publish site lookup/ownership contracts. |
| Authentication | Map verified provider identities to platform principals under ADR-0004. |
| Users and RBAC | Resolve membership and permission for an explicit operation and organization/site target. |
| Owning business module | Declare required scope, enforce it for records and references, and own its domain invariants. |
| Integrations | Resolve source labels using configured mappings and carry validated scope into receiving-module contracts. |

A platform user can have memberships in more than one organization and access to
more than one site without duplicating the user's identity. This is model capacity,
not a requirement for a v1 membership-management UI. Membership alone does not
establish permission. Organization membership or a persona label must not imply
access to every site; IOP-006 will define grants and any explicit inheritance.

The conceptual scope contract has two distinct forms:

- Organization scope: `organizationId`, for an operation explicitly declared to
  concern organization-level data/configuration.
- Site scope: `organizationId` and `siteId`, with validated site ownership, for
  site operational data.

These forms are semantic contracts, not TypeScript definitions or endpoint schemas.
An omitted `siteId` does not convert a site operation into organization scope.
Each module operation declares its required form. Its inputs also identify the
platform actor and requested action through provider-independent contracts; the
scope target is separate from the permission decision. Authorization is evaluated
for that actor, action and target. Successful scope validation alone grants nothing.

A request's selectors, browser state, token claims or record IDs are untrusted
inputs. Before access, resolve the site/organization relation and authorize the
operation; the receiving module must constrain record lookup and all references
to the validated scope. Internal invocation and worker execution use the same
rules. No ambient global 'current customer' may silently substitute a missing scope.
Exact transport, authorization interfaces and concurrency/enforcement mechanics
remain implementation/design follow-ups.

### Operational data and cross-site reads

Site operational facts, import runs and their RAW provenance must resolve to one
organization/site context before being admitted as site data. An organization-level
configuration or membership record has an explicit organization owner; it is not a
site record with an unexplained null site. Modules must declare each record's logical
scope even if physical storage later derives it through constrained relationships.
Global infrastructure/reference data must be explicitly classified and must not
contain unscoped customer business data.

A single-site CSV import uses a configured, authorized target site; filenames and
source labels do not grant or override scope. Ambiguous, missing or contradictory
site mappings must stop admission of affected input to normalized site data and
remain visible for review. Exact RAW staging, rejection granularity and multi-site
batch orchestration belong to ingestion design, not this ADR.

Cross-site analysis, if subsequently required, must be an explicit operation within
one organization with a nonempty, validated set of authorized sites. It must not
interpret absent scope as all sites or silently drop requested unauthorized sites
and present the result as complete. A site's permission does not authorize
organization-wide configuration or another site's records. Cross-organization
business queries and platform-wide administrator bypasses are not introduced.
The model permits later multi-site analysis; it does not add it to v1.

Results must retain applied site/period/coverage context under ADR-0011. Different
site time zones cannot be silently collapsed into one local reporting day; detailed
time and aggregation semantics remain with IOP-008 and analytical contracts.

### Scope propagation and persistence implications

Carry the validated organization/site context through module references, queries,
imports, jobs, derived analytics, audit records and any future files, exports or
caches, as required by ADR-0005. Validate references against their owning module's
contract. Same-organization membership does not make a foreign-site reference valid
for a site-local operation. An explicitly designed cross-site relationship would
need its own invariant and permissions.

A background job records its actor/action and target context; submission-time
permission is not a permanent grant. Execution and result retrieval must follow
current authorization policy, including loss of access. Exact service-principal,
revocation and retry mechanics remain with authentication/RBAC/job design.
Cache partitioning or a file/job ID cannot substitute for authorization. Derived
results and lookup keys must distinguish scopes so identical source codes in two
sites do not collide or leak results.

Persistence must preserve organization/site ownership and prevent inconsistent
references. This is a logical invariant only: it does not choose duplicated scope
columns, composite foreign keys, row-level security, an ORM or a physical tenancy
layout. IOP-005 must provide concrete enforcement and failure/concurrency evidence
before implementation can claim isolation.

## Consequences and deferred decisions

The model makes the existing isolation boundary explicit and supports a one-site
pilot without a customer-specific core. Its cost is carrying and checking scope
across every data path; typed IDs and explicit parameters alone cannot prove
isolation. An arbitrary hierarchy and site transfers remain unsupported until
separately justified.

IOP-005 owns physical isolation; IOP-006 the role/permission/scope matrix and grant
inheritance; IOP-007 identity/session design; IOP-008 detailed temporal semantics;
IOP-009 audit design. None of those stories is activated here. HTTP scope transport,
concrete DTOs, lifecycle operations and ingestion/job mechanics remain unselected.
No database, endpoint, UI or operational integration is implemented.

Acceptance is reflected in ARCHITECTURE.md, modules, data model and glossary.
IOP-004 is complete as design; the
[acceptance plan](../../planning/completed/IOP-004-scope-acceptance-plan.md)
records documentation validation. No runtime isolation claim follows from acceptance.

## Design walkthroughs and future verification

These are conceptual checks of the decision, not executed runtime/security tests.
Fictional organizations A/B and sites A1/A2/B1 are identifiers for these examples.

| Scenario | Expected result under the proposal |
| --- | --- |
| Organization A exists with no sites | Organization configuration may be authorized; site analytics cannot run without a real site. |
| User authorized to read A1 requests its report | Validate A1 belongs to A, permission and all contributing references; expose applied site/period context. |
| Same user requests A2 without a grant | Deny; membership in A and access to A1 do not imply A2 access. |
| User belongs to A and B and switches to B1 | Resolve and authorize B/B1 independently; no A data or cached scope follows the switch. |
| Request pairs organization A with site B1 | Reject mismatched ownership before data access; no foreign resource disclosure under ADR-0011. |
| Site operation omits site, even when A has only A1 | Reject missing scope; never broaden or implicitly infer a site. |
| A1 operation references an A2 or B1 record | Reject out-of-scope reference even with a valid canonical ID. |
| Two sites contain the same external equipment code | Distinct scoped mappings; code alone cannot select a canonical target. |
| CSV label conflicts with its configured A1 target | Surface unresolved/conflicting input; do not silently redirect it to another site. |
| A future A1+A2 query includes an unauthorized A2 | Deny the requested set; do not silently present an A1-only total as complete. |
| Access is removed before a job executes or its result is read | Apply current authorization policy; stored job context is not a grant. |
| Site renamed or organization transfer requested | Rename preserves IDs; transfer cannot be performed as a normal edit. |

Review found these expectations consistent with Accepted ADR-0001/0003/0004/0005,
ADR-0006's module boundary and ADR-0011's scope/error semantics. Future implementation
must exercise direct IDs, lists, joins, imports, jobs and derived results using actual
persistence and authorization mechanisms. No isolation/performance claim is made.

## Subsequent tenancy decision

Physical tenancy and database enforcement, left open when this record was accepted,
are now selected by Accepted [ADR-0013](ADR-0013-tenancy-data-isolation.md). It adopts
shared tables, scoped constraints and RLS alongside application authorization.
This does not select RBAC grants, identity/session handling, ORM or hosting.

## Subsequent RBAC decision

Accepted [ADR-0014](ADR-0014-scoped-rbac.md) defines the pilot permission matrix,
explicit organization/site role assignments without inheritance, delegation and
revocation semantics. Users/RBAC evaluates current permissions independently of
authentication and RLS. Identity/session mechanisms and detailed persistence
implementation remain separate work.


## Subsequent temporal decision

Accepted [ADR-0016](ADR-0016-time-and-timezone-model.md) defines UTC instants with
millisecond precision, explicit IANA site/source zones, separate calendar intent,
half-open resolved periods and explicit clock-change ambiguity handling. Reports
retain period/coverage context; historical interpretation is preserved. Site zones
cannot be ordinarily replaced after temporal use without a reviewed correction plan.
The source CSV window remains unverified; this does not implement shifts, select
a date library or add cross-site reports.
