# ADR-0036 — Durable handover before workforce and canonical assets

## Status

Accepted by the owner on 2026-09-29, under [IOP-168](../../planning/items/IOP-168-shift-handover.md).
The owner explicitly approved this decision and authorized implementation.

## Context

The owner requested technician posts, department/equipment history, issue follow-up,
meeting preparation and selected Start highlights. Temporary login is sufficient.
The [product specification](../../product/shift-handover.md) captures the request.
Workforce shift assignments, validated Asset Management identities and general
audit delivery are not implemented. Existing analytical catalogs identify imported
source values and can be rebuilt; they cannot own durable handover identity.

Accepted ADR-0032 already defines the hexagonal architecture. This decision addresses
new cross-module reference ownership, record history and permission contracts,
rather than selecting another framework or redesigning authentication.

## Decision

### Ownership and references

Shift Handover owns a site-scoped journal of entries, follow-up and revisions in
its own PostgreSQL schema. Publish entries immediately; omit persisted drafts and
formal handover closure in this first increment. A date-based meeting view groups
entries without inventing M6 shift instances. Issues survive every meeting date.
Future formal shift records and closure remain IOP-060/066 work.

Platform Core owns a bounded configured location tree with stable opaque IDs,
parent IDs and display labels at one organization/site. Department and area are
pilot presentation roles over configured nodes; the core does not require a
universal Hall/Area depth. Initial configuration is operator-provided and validated
at setup, without a location-management UI. A missing catalog produces an honest
configuration state; do not silently derive physical locations from analytics.
Optional mappings to analytical sector keys are scoped configuration, not identity.

An entry stores selected location IDs and display snapshots. References to equipment
are scoped external identifiers with a source namespace, code and location context.
Keep an explicit unverified state and stable handover reference identity; reuse an
exact scoped tuple, never fuzzy-merge codes. If location is unknown, allow an
unverified reference under the selected department. Codes in different areas are
not automatically the same asset. Preserve case/text and original snapshots; a
later correction preserves the previous reference in revision history.

This reference index belongs to handover evidence: it supplies no asset lifecycle,
hierarchy, validation or canonical equipment status. Asset Management later owns
explicit alias resolution through a port. Do not use analytics row IDs as foreign
keys, query its internal tables from this module, or let projection rebuilds erase
history. History is initially labelled equipment-reference history; unresolved
aliases cannot promise a complete canonical asset history.

Future Workforce lookup supplies an optional shift ID and default location through
a receiving-owned port. Keep the actual selected work location and allow override.
Do not implement an empty scheduling service or fabricate shift bounds now.

### Record lifecycle and durability

Each entry has an opaque ID, organization/site, platform author ID, server creation
instant, occurrence calendar date, category, summary, optional details/context,
optional issue fields and monotonically increasing revision. Categories and external
system labels are scoped configuration; Ultimo codes are opaque reference text.

Use append-only revision/activity rows with actor, server instant, action and the
changed content/state. Update the current projection and append its revision in
one authorized database transaction; failed writes commit neither. Initial create,
correction, follow-up, state transition and highlight change all leave evidence.
Published entries have no hard-delete endpoint. This is local module history,
not acceptance or implementation of the broader audit infrastructure proposal.

Corrections require the expected revision and an explanation; stale writes return
a conflict rather than overwriting another worker. Create requests carry an
actor/site-scoped idempotency key, retained with a payload fingerprint: repeat of
the same request returns the existing entry; reuse with different content fails.
Follow-up is additive. Resolve requires an outcome; reopen retains earlier
resolution evidence. Resolving an issue does not automatically mark equipment
safe or restored, and a repair report does not close unrelated issues.

Calendar dates use `date`; creation/update instants use `timestamptz(3)` under
ADR-0016. Do not manufacture observation timestamps from date-only input. Due and
feedback dates remain independent. Inactive authors remain referenced in history.
Use scoped composite constraints, forced RLS, explicit predicates and non-owner
runtime grants under ADR-0013/0026. No ordinary delete privilege. Bound text,
query windows and pages; return stable cursor pagination with explicit coverage.

### Authorization extension

Keep current authentication and platform IDs. Introduce explicit site-role bundles;
never expand `analytics-reader` into operational write permission or trust profile
labels sent by the browser. Accepted grants are:

| Bundle / permission | Allowed behavior |
| --- | --- |
| `handover-contributor`: `handover.read` | Read journal, revisions, meeting views and highlights in the exact site |
| `handover-contributor`: `handover.contribute` | Create entries, correct own entries, add attributed follow-up; progress/resolve/reopen issues authored by or assigned to the caller |
| `handover-coordinator`: `handover.coordinate` | Correct site entries with a reason, assign responsibility, manage issue state and set/withdraw Start highlights |

All four local profiles receive an explicit contributor assignment at their
configured site. Administrator and Team Leader additionally receive coordinator
assignments. The owner explicitly accepted this distinction; it is not inferred
from existing profile names. A contributor may nominate a responsible site user
when creating their own issue; subsequent reassignment is coordinator-controlled.
All contributors can mark their own topics for meeting discussion; discussion
does not grant Start prominence. Current membership/grants and reference ownership
are enforced independently for protected fields: an ordinary content correction
cannot change authorship, scope, responsibility or highlight state. Permissions
are checked for every operation; organization administration alone grants no site
data access. No location-based security scope is introduced.

An accepted implementation must explicitly migrate existing active local profiles
to these site assignments and update provisioning/profile changes and revocation.
Preserve organization/site boundaries and last-admin protection. Do not change
grant semantics silently, restore revoked memberships or enable the explicit
native demonstration selector to bypass the new permission checks.

### Application boundaries and presentation

- `modules/shift-handover/domain` owns entry/issue rules and revision conflicts.
  `application` owns publish, revise, follow-up, history, meeting and highlight
  use cases, and ports for transactional storage, authorized context and scoped
  reference lookup. Framework/database types stay outside those layers.
- PostgreSQL adapters use the existing pinned authorized transaction boundary;
  host controllers translate versioned REST DTOs, Problem Details and OpenAPI.
  Bounded scoped identity lookups expose only names/IDs needed for responsibility,
  not the administration directory or credentials.
- `features/shift-handover` owns framework-free browser orchestration with HTTP
  and React adapters. Reuse the shared design library and identity tokens. The
  browser does not decide permission, canonical identity or equipment health.
- The workspace host composes operational Start content with existing analytical
  content. Data Analysis does not import the handover feature or become required
  to publish/read handovers. Loading/failure of either source remains independent.

No event broker, global feed, separate service or new UI framework is needed.

## Alternatives and consequences

Waiting for complete M4/M6 blocks useful operational history. Browser-only storage
cannot preserve shared worker history. Reusing analytical IDs as assets would
couple evidence to rebuildable source projections. A bounded configured location
catalog and explicit unverified references allow early delivery, with later alias
resolution required for complete canonical equipment history.

Separate contributor/coordinator grants provide reviewable highlight management.
Visibility for all profiles does not by itself select mutation authority.

## Required verification before delivery

Verify domain/use-case behavior with replaceable ports, inward imports and shared
component boundaries. Real PostgreSQL tests must cover restart durability, scoped
references/RLS, privilege limits, atomic revisions, idempotent create, concurrent
conflicts, revocation and author preservation. Verify existing-profile migration,
new-user provisioning and profile transitions against the new fixed bundles.

API tests cover all permissions, server authorship, validation budgets, date-only
semantics, pagination, filters and sanitized errors. Browser tests cover the four
profiles, create/reload/history/follow-up, earlier open issues, highlight inclusion
and withdrawal, direct entry navigation, manual location override, empty/error
states and Start without analytical imports. Check desktop/narrow layouts and
keyboard navigation; run repository tests and OpenAPI generation consistency.

## Owner-requested refinement — 2026-09-29

[IOP-169](../../planning/items/IOP-169-handover-board.md) records the owner's explicit
choice to select equipment from current imported codes, filtered by configured
department/area. A handover-owned lookup port is implemented through host composition
and the analytical module's scoped read adapter. It returns exact code strings, never
analytical row IDs. New/changed references must match this selection; unchanged
historical references remain valid evidence after import/configuration changes.
This selection is not canonical asset validation and cannot assert current health.
No imports still allows site/department/area reports without equipment.

The owner also requested current-day publication for workers: contributors create
only on the current site-local date; coordinators may select historical dates.
Contributor corrections retain the original date. Idempotent recovery of a saved
request remains possible after midnight. A follow-up may atomically change issue
state under the existing author/assignee/coordinator rules, with a required note,
retained original snapshot and current latest-update summary.

## Integrated Technician access — 2026-09-29

The owner-approved IOP-169/170/171 publication retains the imported equipment picker
for handover contributors after Technician loses analytical access. The host adapter
checks `handover.read` for this bounded, location-filtered code lookup on the already
scoped transaction. It exposes identifiers for reporting only; analytical report,
source-row and availability endpoints continue to require their own permissions.
No new grant or unscoped catalog is introduced.

## Owner-requested daily views — 2026-10-01

[IOP-190](../../planning/items/IOP-190-daily-handover.md) makes Meeting preparation
the first/default tab, followed by Journal, Department matrix and My entries.
Journal and meeting query one selected calendar day. A separate Department status
disclosure queries unresolved entries through that day for categories whose scoped
catalog configuration enables `carryForward`. The host adapter defaults Problems
and Performance to this behavior; the generic domain contains no category-specific
rule. No entry is closed or deleted when it stops appearing in a daily view.

The existing scoped query port gains optional due-date, responsible-user, external
reference and condition predicates for matrix column filters. They apply before
counts and cursor pagination. What? and Details remain free of column controls.
This refines presentation and the existing query contract without a new architectural
boundary, storage model, permission or formal shift lifecycle.

## Owner-requested Maintenance integration — 2026-10-05

The owner's explicit [IOP-194 follow-up](../../planning/items/IOP-194-maintenance-asset-history.md)
connects corrective/preventive/inspection work to existing problem entries through
manual configured locations and multiple exact equipment identifiers. Department
matrix remains a view of these same entries. Equipment identifiers provisionally
represent system parts; neither this association nor nearby sensor reports validate
physical identity. Spatial/radius selection remains deferred with M9.

Maintenance owns the reviewed include/exclude repair scope. Completing authorized
work resolves only explicitly included pending issues with its outcome; exclusions
require a reason and leave the source unchanged. New/unreviewed scoped issues and
stale included pending revisions prevent accidental completion. Workers assigned to the
work receive this narrow completion authority, without a global Handover coordinator
grant. Team Leader controls assignments; Assets access is limited to Team Leader
and Task Force in this operational increment.

Reuse Accepted ADR-0027's narrow owning receiver contract on the existing pinned
scoped transaction. Handover retains its validation, writes and attributed revisions;
Maintenance never writes Handover tables itself. No independent nested commit,
broker, worker, general transaction framework or new architectural pattern is added.
Completion and included resolutions commit together. A site-scoped coordination
lease serializes Handover mutations against final scope review so concurrent new
reports cannot escape review. This refines the explicit unrelated-issue safeguard,
not formal shift closure, global Audit or analytical event ownership.


## Owner review corrections — 2026-10-06

The owner restores Administrator access to all delivered operational capabilities,
including Assets/M10 and Maintenance coordination. This supersedes the Administrator
exclusion in the 2026-10-05 increment. Site/profile activity and current authorization
still apply; other profiles retain their existing responsibilities.

The owner requests one current asset per exact equipment code, with name equal to
code, scoped Halle/Bereich source choices and manual within-area component/group
metadata. A deliberately invoked initial catalog preparation registers known source
identifiers as unverified. This is not automatic ingestion or physical validation.
Superseded training identities leave the current directory through retained retirement
revisions; analytical facts, reports and work histories stay owned by their modules.

Reuse the existing narrow source read ports and scoped transaction patterns for
contextual source dropdowns. Included reports are repair membership; related/excluded
reports provide context without closure authority. Repair drafts retain source links
instead of copying full report narratives. No new hierarchy or transaction framework
is introduced. M09 remains explicitly deferred while catalog/manual grouping proceed.

## Owner-requested personal/daily refinement — 2026-10-06

[IOP-196](../../planning/items/IOP-196-personal-operational-workflows.md) records the
owner's Information permission, image, mention and daily-date request. Information
uses a scoped `coordinatorOnly` category rule under existing coordinator grants.
Small bounded raster attachments and up to 20 validated site-person mentions extend
existing content snapshots; revisions retain earlier values. No new file service,
permission bundle, global feed or architectural pattern is introduced.

Existing scoped revision reads derive recipient notification times and previous-month
assigned resolution counts. Current pending carry-forward topics use today's upper
bound independently of historical daily selection, superseding the selected-day
upper bound in IOP-190. Start defaults to Workforce current/home department and
partitions attention from other open reports; department browsing remains explicit.
Maintenance status controls reuse its authorized save and reviewed atomic closure.

## Owner-requested category workflows — 2026-10-07

[IOP-199](../../planning/items/IOP-199-handover-category-workflows.md) records the
owner's explicit refinements. Scoped category workflows distinguish Safety without
components, condition-derived technical Problems/Performance, Success references,
Information display periods and Workforce-backed People. Information's current
publishing profile restriction defaults to Team Leader, in addition to coordinator
grants; it supersedes IOP-196's Administrator publication default. A current profile
is an additional configured restriction, never an alternative to active scoped grants.

Workforce's previously accepted receiving port now supplies the author's actual
zone assignment for the entry date; floating/unassigned/unzoned leaders have no
location default and every author retains manual override. Success publication
reuses the existing coordinated receiver pattern for selected report resolution
and Maintenance completion. Existing permissions, expected revisions, outcomes and
complete repair review remain mandatory. Both owners' histories and the Success
publish atomically; corrections never trigger a second closure. The coordination
lease precedes the Maintenance lease at both mutation entry points.

Information broadcasts use existing revisions and local read state; selected display
periods affect prominence, never history. Successful details acknowledge only their
seen activity, preserving other notices and later updates. Journal is the personal
filter of the shared workspace, replacing My entries. No new schema/service, grant
bundle, file store, formal shift closure or architectural pattern is introduced.
