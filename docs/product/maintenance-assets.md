# Maintenance Management and Digital Asset Record

[IOP-194](../planning/items/IOP-194-maintenance-asset-history.md) implements the
owner-requested M8 and M10 increment, integrated into develop and published to
origin on 2026-10-06. Further owner product testing and physical verification remain
pending; integration does not imply final product acceptance.
M9 maps and placements remain deferred. See the [operator guide](../development/maintenance-assets.md).

## Maintenance

Technical work records contain title/details, configured location, optional
registered asset, maintenance category, manual repair target, multiple exact scoped
equipment identifiers, priority, responsible site person/team, due date, external
reference, status and work outcome. Locations are the existing configured tree;
customer labels and department/area roles are configuration, not universal levels.
Teams come from Workforce and users from the scoped Users/RBAC directory.

Open, In progress, Blocked and Done are explicit states. Blocked requires an
explanation; Done requires an outcome. Reopening completed work requires a reason
and preserves its earlier outcome in immutable history. Changes require the
expected revision; stale saves return a conflict and never overwrite newer work.
Creation retries with the same identity, initial content and reason recover the
current version of the same logical record without creating another revision.
There is no physical-delete endpoint or inferred equipment-health status.

The board, records list and personal work view share server-filtered data. Status,
priority, configured location, asset, responsible person/team, due-date bounds and
text search apply before total counts and stable pagination. Status counters
apply the other filters while excluding the selected status. Labels in retained
revisions are snapshots; an edited catalog does not rewrite historical evidence.
Administrators configure priority labels/ranks through versioned settings.

## Repair scope and Shift Handover

Corrective is the default category; Preventive covers planned work and Inspection
covers checks without an assumed repair. A repair target describes the component
or work to perform, independently of the signals used to identify the affected
zone. For example, a cassette or motorized roller may need repair while nearby
sensor identifiers provide the evidence. A configured location and manually chosen
exact equipment identifiers define the current scope; no code-prefix, text,
spatial-radius or physical-identity inference is performed.

Maintenance reads related Shift Handover entries, including entries displayed in
Department matrix, through the Handover owner's contract. These are the same
records, not copies. The internal report list distinguishes included repair members, excluded reports
with reasons and other related context. It retains details, identifiers and follow-up; opening a report and returning preserves the maintenance selection.
Entries without an equipment identifier can provide zone-wide context.

Every scoped pending issue must be explicitly included or excluded before work is
completed. Exclusions require a retained explanation. Included pending issues are
resolved with the maintenance outcome and work reference, in the same scoped
transaction as completion; their attributed Handover histories remain intact.
A stale included revision, unreviewed newly arriving issue, revoked permission or
write failure prevents partial completion. Already resolved issues are not reopened;
excluded or unrelated issues are not modified. Reopening Maintenance does not
silently reopen previously resolved Handover issues. Up to 30 equipment identifiers
and 100 report decisions can be retained per work record. More than 100 pending
scoped issues produces an explicit capacity error instead of partial closure.

Administrator and Team Leader assign people/teams. Contributors may propose unassigned work and
update authored/assigned work; assignment does not grant global Handover coordination.
Only an assigned worker, Administrator or Team Leader can resolve included reports through the
maintenance scope. Once a person or team is assigned, only Administrator or Team Leader can change
the location, equipment identifiers or asset defining that scope. Workers see their current unfinished assignments on Start and
assignment activity in the bell; edits without a changed assignment are not new
assignment events. This is in-app activity, not email or push delivery.

The board defaults to all unfinished work, regardless of age, and Done work from
the previous and current site-local Monday-based weeks. Explicit historical search
can change the completed-work window. Status selection hides other board columns
and presents matching cards in three columns on wide screens, wrapping on smaller
screens. Other filters continue to apply on the server before pagination.

## Asset identity and history

For this increment, one current asset represents one exact source equipment code
(Betriebsmittelkennzeichen); its name equals its code. Registration is deliberate,
with stable site-scoped identity, configured location and optional manually recorded
component type and within-area group/location details. Reported codes are selected
by configured department/Halle and area/Bereich. Codes absent from the source can
be registered manually; no cassette, roller or missing component is invented.
The owner-authorized initial catalog preparation creates unverified records from
known identifiers through the normal application. Imports and API startup do not
silently register assets. Unverified registration is distinct from validated physical
identity. Validation requires evidence. Retirement retains
history and identity and prevents new work from selecting a retired asset.
This support does not complete M4 composition/controller/survey capabilities.

Explicit aliases match source namespace, code and configured location context;
analytical aliases also identify their source. Exact comparisons preserve case and
text. Ambiguous aliases are rejected rather than fuzzily merged. Import catalogs
and alarm descriptions never automatically create or validate physical assets.
An alias correction leaves earlier evidence in asset revisions. New or changed
Handover/analytical aliases use the asset's exact code; configured location and
source facets constrain the available choices. Analytical Source ID is the source
feed identity, not an equipment code. Available source, sector and area choices
come from scoped source catalogs. Unknown physical identity remains unverified.

Unverified means the identifier's physical assignment has not been checked;
Validated requires documented evidence; Retired removes the asset from current
work selection while preserving its identity and history. These are asset lifecycle
states, not location health. The default directory shows current assets; historical
search can include retired identities. Superseded training records are archived,
not allowed to erase existing Maintenance/Handover evidence.

The digital record is an Asset-owned read projection of Maintenance, Handover and
Data Analysis. Each source owns its query adapter and original records; Asset
Management never writes their history or joins their private tables. The view
shows source coverage, missing mappings and denied source access explicitly.
Unavailable or denied sources have no displayed count; totals describe the
available source evidence and do not imply complete coverage of the asset.
The current registry supports up to 10,000 assets, reporting capacity explicitly.
Timeline windows span at most 366 calendar dates; pages contain up to 25 records,
with stable ordering for equal dates.
Source actions navigate to work records, journal entries or analytical evidence.

Maintenance/Handover creation and update instants are server metadata. Handover
occurrence dates and analytical reporting labels remain calendar dates. Analytical
rows retain frequency, exact accumulated alarm seconds and import/physical-line
provenance. A daily aggregate is not an individual fault or an observation at
midnight; accumulated duration is not plant downtime. Missing data is not zero.

## Permissions

These responsibilities extend the existing explicit site-bundle mechanism:

| Profile | Maintenance | Assets | Analytical timeline evidence |
| --- | --- | --- | --- |
| Technician | Read, propose unassigned work, update authored/assigned work | No access | Requires a separate analytical grant; absent in the fixed profile |
| Task Force | Read, propose unassigned work, update authored/assigned work | Register/read/edit equipment references | Current `analytics.read` required |
| Team Leader | Contributor plus site assignment/coordination | Register/read/edit equipment references | Current `analytics.read` required |
| Administrator | Contributor, assignment/coordination and priority configuration | Register/read/edit equipment references | Current `analytics.read` required |

The server checks current membership/grants and exact site on every operation,
including source reads. Browser profile previews change presentation only.
Asset read permission never substitutes for Maintenance/Handover/Analysis access.
Revocation, logical user removal and later name changes preserve attributed history.
Forced RLS, scoped predicates and atomic projection/revision writes reuse the
accepted transaction patterns. Industrial connections remain read-only.


## Complementary evidence and deferred locator

Data Analysis owns measured source aggregates. Shift Handover owns reported
problems and follow-up. Maintenance owns the chosen intervention, assignment,
repair scope and outcome. The digital record projects these original sources;
repair drafts link to reports instead of copying their narratives. Related context
is not automatically a member of a repair. At completion every included pending
report is resolved atomically; explicit exclusions remain outside the repair.
A later source correction/reopening retains its own attributed history.

M09 Asset Locator remains deferred by the owner's confirmation on 2026-10-06.
A catalog location and manually written buffer/component group do not constitute
a map, placement, spatial radius, controller hierarchy or physical survey.
