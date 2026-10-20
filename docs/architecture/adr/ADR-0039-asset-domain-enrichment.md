# ADR-0039 — Asset domain enrichment and reviewed canonical mapping

## Status

Accepted for [IOP-209](../../planning/items/IOP-209-asset-domain-completion.md)
under the owner's explicit 2026-10-14 delegation of all development decisions in
[IOP-203](../../planning/items/IOP-203-platform-completion.md). This record selects
the concrete model within that delegated authority, reusing Accepted ADR-0032 and
ADR-0037; it does not accept unrelated historical proposals or claim plant verification.

## Decision

Assets owns versioned sidecar records keyed by existing stable asset identity.
Legacy `AssetContent`, exact code registration and aliases remain compatible.
Site catalogs define type labels, containment/controller capabilities and additional
typed metadata fields. Manufacturer/model/serial are structured optional strings;
other values follow the configured text/number/date/boolean schema. Used types or
metadata definitions cannot silently disappear or reinterpret current records.

One optional parent expresses composition with no fixed level names. It must be
scoped, current and containment-capable; self/indirect cycles are rejected under the
existing Assets site lease. Separately typed `controlled-by` relationships require
current controller-capable targets, retain channel context and never define location.
Registry retirement keeps historical references; new links to retired identities fail.

Survey Pending/Validated/Rejected is an attributed software review with notes and
evidence references, independent of registry lifecycle and physical Locator placement.
Validation/rejection requires evidence and a reason. Software decisions cannot prove
that a physical plant survey occurred. Revisions preserve all earlier decisions.

Source mappings use exact immutable source ID/namespace/area/code tuples, with
versioned Pending/Approved/Rejected reviews and explicit candidate identities.
Approval requires exactly one non-retired validated registry identity. Multiple
pending candidates remain Ambiguous; absent mappings remain Unmapped. No fuzzy match,
code-prefix interpretation or asset creation by source text is permitted.

OIP owns derived per-source-fact canonical links and their immutable projection
history. Mapping edits and import publication invoke a narrow owner port on the same
pinned transaction; original RAW bytes, facts and line provenance are never rewritten.
Canonical Pareto includes complete source totals and explicit unresolved measures;
the mapped subset cannot masquerade as complete coverage. Frequency/alarm seconds
retain their original aggregate grain and do not establish downtime or causality.

Administrator, Team Leader and Task Force use existing assets.read grants and
current-profile checks. Under the owner's IOP-217 restriction, only a current
Administrator with assets.manage can register identities or change types, models,
survey reviews, aliases or source mappings. The Asset management configuration
workspace is Administrator-only; authorized operational reference and Digital Asset
Record reads remain available to the other advanced profiles.
Mapping review, source lookup and Pareto independently require
Assets/source analytics permissions. A separate receiving-owned import publication
port uses current imports.submit only to consume compact reviewed decisions and
prepare derived links. It exposes no registry directory or public Asset response;
native importers need no additional Asset grants.
Schemas use exact scoped foreign keys, forced RLS and explicit column grants;
frameworks/SQL/transport remain adapters. Actual types, dimensions, physical surveys,
canonical review decisions and plant exposure are operating-team inputs.

## Owner-requested configuration restriction — 2026-10-20

[IOP-217](../../planning/items/IOP-217-admin-configuration-demos.md) explicitly
restricts sources of truth and configuration to Administrator. This supersedes
the original Team Leader/Task Force management permission. Existing scoped read
contracts and source-owned operational records retain their permissions. The
server checks the current profile as well as grants, and a forward migration
revokes obsolete management assignments for existing non-administrator profiles.
