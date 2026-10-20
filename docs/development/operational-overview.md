# Global search and area overview

[IOP-210](../planning/items/IOP-210-operational-search-overview.md) composes existing
source-owned reads without a new database, search index or permission cache.
[IOP-119](../planning/items/IOP-119-global-search.md) owns the original global-search
outcome; [IOP-118](../planning/items/IOP-118-area-overview.md) owns area context.

## Global search

The shared header search finds configured areas, current registered assets (including
source aliases/metadata), Handover reports across journal history and Maintenance
work. Results are grouped by source with full matching source totals and finite
pages: 25 areas/assets, currently 20 source-owned Handover reports and up to 50
work records. The receiving Handover budget remains at most 50 records. Each source keeps its own
cursor; changing search/location resets pagination. Multiple asset/alias matches
remain separate choices. Configured areas beyond the first 25 can be found by
refining the query or selecting location scope.

The shared SearchControl focuses its disclosed input. Tab reaches native scope
controls and record buttons. Escape clears results and restores the search trigger;
outside selection dismisses the anchored result panel. Narrow layouts use a bounded
single-column viewport. Source actions navigate to their original details, retaining
the record's identity and location. Browser visibility never grants API access.

## Area context

Choose a configured department/area and journal date using shared controls.
The overview keeps these distinct:

- Current unresolved Handover issues, including older records.
- Journal entries whose calendar date matches the selected date.
- Current Maintenance work grouped by Open, In progress and Blocked; completed
  work cannot displace pending records from these bounded pages.
- Current registered Assets within configured ancestry.
- Optional exact analytical date/units/import coverage and actual formal-shift
  context, when the host supplies receiving-owned read ports.

Pending issues/work are current-state projections, not reconstructed historical
state at the selected journal date. The view does not establish live equipment
health. Accumulated alarm seconds are not plant downtime. No admitted import leaves
measures absent rather than inventing zero values.

Formal context uses an explicit current record selection. Its actual Workforce
interval and previous-shift contract remain source-owned; a calendar-day journal
cannot stand in for a previous shift. Missing configuration, missing exact analytical
location mapping and missing permissions stay visibly distinct. Records without
source navigation identity are displayed without an actionable detail button.

## Authorization and integration

Administrator, Team Leader and Task Force retain independently checked source grants.
The current Technician profile exposes configured areas/Handover here; broader
obsolete grants cannot override that view boundary. Workforce read can authorize
configured context, but does not grant Assets, Maintenance or analytics.
Every public source query rechecks its own current scope/permissions. Cross-source
queries use independent source transactions; this is not a single synchronized
snapshot. Revocation, source denial or failures provide no records for that source
and do not turn unavailable access into a zero count.

The Technician journal uses `handover.read` for both pending issues and entries on
the selected calendar date. A permitted date without entries is Available with no
matching records. Formal shift context remains independently restricted through
`handover.records.manage`; that denial does not deny the calendar-day journal.

`composePlatformOverview(pool, source, locations, modules)` is the root-ready host
factory. `source` contains organizationId/siteId/siteTimeZone; catalog locations may
carry their explicit sectorKey. `modules` contains assets/handover/maintenance and
optional formalHandover/reports public use cases. Current scoped profile and each
permission are obtained through runSiteOperation, evaluateSiteAccess and the
Users-owned sitePersonProfile query; no raw table access crosses this boundary.
The formal port matches FormalHandover.query/previous and does not require importing
its implementation. Record options carry full totals and the exact producer cursor;
area requests accept an optional recordCursor. Selecting a saved option resolves
its actual preceding interval, including overlap or a shift without a formal record.
Sub-location targets are explicitly unmapped until a source target exists.

OIP is queried only for a selected department with an explicit sectorKey; an area
label cannot become a source key by inference. The adapter returns full report totals
and admitted dates for the selected day. Area-specific analytical mapping remains
pending input; the underlying department source view remains available separately.

`composeOperationalOverview` receives scoped `assets`, `handover` and `maintenance`
use cases, trusted `profile(actor)` / `allowed(actor, permission)`, configured
`locations`, `timeZone` and `today`. Optional `analytics(actor, AreaInput)` and
`formalShifts(actor, AreaInput)` return receiver-defined display projections.
The adapter invokes source-owned public use cases and never joins another module's
private tables. Unknown provider behavior does not create an unrestricted fallback.

The host exposes `runtime.overview` and registers `OverviewController` at
`/api/v1/overview/context`, `/search` and `/area`. The browser factory is
`createOperationalOverviewApplication`; `GlobalSearch` and `AreaOverview` accept
an `onNavigate({source, id, locationId})` callback. The global component accepts
`sessionKey` for account changes; the area component accepts `initialLocationId`
and `homeVisit`. Compose `operationalOverviewGerman` in the shared German dictionary.

## Verification

Use-case tests cover current profile/grants, source races/failures, cursor forwarding,
location/date admission, source budgets, missing imports and absent formal context.
Web tests verify disclosure/focus/Escape, source navigation, pagination and area/date
selection. The real PostgreSQL suite creates source-owned Assets, Handover and
Maintenance fixtures, checks all profiles, cross-organization shared-code isolation,
current revocation and exact authorized source totals. Root integration owns
published contract generation and actual assembled desktop/narrow visual review.
