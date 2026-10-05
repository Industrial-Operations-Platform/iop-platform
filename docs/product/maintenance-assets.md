# Maintenance Management and Digital Asset Record

[IOP-194](../planning/items/IOP-194-maintenance-asset-history.md) implements the
owner-requested M8 and M10 development increment on an isolated review branch.
M9 maps and placements remain deferred. See the [operator guide](../development/maintenance-assets.md).

## Maintenance

Technical work records contain title/details, configured location, optional
registered asset, priority, responsible site person/team, due date, external
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

## Asset identity and history

Assets are registered deliberately with stable site-scoped identity, code/name,
location and descriptive metadata. Unverified registration is distinct from
validated physical identity. Validation requires evidence. Retirement retains
history and identity and prevents new work from selecting a retired asset.
This support does not complete M4 composition/controller/survey capabilities.

Explicit aliases match source namespace, code and configured location context;
analytical aliases also identify their source. Exact comparisons preserve case and
text. Ambiguous aliases are rejected rather than fuzzily merged. Import catalogs
and alarm descriptions never automatically create or validate physical assets.
An alias correction leaves earlier evidence in asset revisions.

The digital record is an Asset-owned read projection of Maintenance, Handover and
Data Analysis. Each source owns its query adapter and original records; Asset
Management never writes their history or joins their private tables. The view
shows source coverage, missing mappings and denied source access explicitly.
Unavailable or denied sources have no displayed count; totals describe the
available source evidence and do not imply complete coverage of the asset.
The current registry supports up to 500 assets, reporting capacity explicitly.
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
| Technician | Read, create, update authored/assigned work | Read | Requires a separate analytical grant; absent in the fixed profile |
| Task Force | Read, create, update authored/assigned work | Read | Current `analytics.read` required |
| Team Leader | Contributor plus site coordination/reassignment | Read | Current `analytics.read` required |
| Administrator | Coordination and priority configuration | Register/edit/validate/retire and alias management | Current `analytics.read` required |

The server checks current membership/grants and exact site on every operation,
including source reads. Browser profile previews change presentation only.
Asset read permission never substitutes for Maintenance/Handover/Analysis access.
Revocation, logical user removal and later name changes preserve attributed history.
Forced RLS, scoped predicates and atomic projection/revision writes reuse the
accepted transaction patterns. Industrial connections remain read-only.
