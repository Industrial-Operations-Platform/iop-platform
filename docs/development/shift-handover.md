# Shift Handover setup and use

[IOP-168](../planning/items/IOP-168-shift-handover.md) implements the first operational
journal under [ADR-0036](../architecture/adr/ADR-0036-shift-handover.md). It uses the
existing local password login. No Ultimo connection or workforce schedule is needed.

## Local configuration

The local launcher creates `.local-platform/config/handover.json` once, with the
installation scope, six default categories, the external-system label `Ultimo` and
an initially empty location list. Existing files are preserved. This is private
operator configuration, mounted read-only into setup/API and selected with
`IOP_HANDOVER_CONFIG_FILE`. Native test installations may omit the file and receive
empty locations with the generic external-reference label. Invalid or foreign-scope
configuration fails startup; no locations are inferred from analytical imports.

Add confirmed operational locations before recording department/equipment work.
The following is an example only; IDs and labels should describe the actual site:

```json
{
  "organizationId": "local-org",
  "siteId": "local-site",
  "locations": [
    { "id": "workshop", "label": "Workshop", "parentId": "", "role": "department", "sectorKey": "" },
    { "id": "conveyor", "label": "Conveyor", "parentId": "workshop", "role": "area", "sectorKey": "" }
  ],
  "categories": [
    { "id": "safety", "label": "Safety" },
    { "id": "information", "label": "Information" },
    { "id": "successes", "label": "Successes" },
    { "id": "people", "label": "People" },
    { "id": "performance", "label": "Performance" },
    { "id": "problems", "label": "Problems" }
  ],
  "externalSystemLabel": "Ultimo"
}
```

Location IDs are unique opaque strings, up to 64 letters/digits/underscores/hyphens;
labels are up to 100 characters. An empty `parentId` denotes a root. Optional
intermediate nodes use `role: "location"`; parent references and cycles are checked.
There are at most 500 nodes and 30 categories. Department/area are form-selection
roles, not mandatory physical hierarchy depths. All fields in the example are
required; empty strings explicitly represent absent optional mapping/parent values.

Each category may additionally set `carryForward: true` or `false` to control its
unresolved entries in Department status. When omitted, the host adapter defaults
`problems` and `performance` to true and other IDs to false. Renaming a label does
not change this behavior; custom IDs should set the flag explicitly. It affects
presentation queries only and does not close, remove or migrate entries.

Use `sectorKey` on a department only when there is an explicit mapping to the key
returned by the analytical sector selector (currently the displayed sector label). It scopes imported equipment choices together with the exact configured area label;
it is not a physical identity or asset-validation claim. Start and handover share
the operational department selection independently of analytical availability.
Do not reuse IDs for different places. Retain category IDs and locations referenced
by existing entries so they remain selectable when correcting historical records.
Renamed labels do not overwrite retained entry snapshots.

After updating configuration or installing the story, the operator can run
`npm run local:up` to rebuild the local stack and apply migrations. This command
preserves volumes and configured credentials. Migration adds explicit handover
roles to active existing local profiles with current site access; disabled accounts
are not restored. New-user creation and profile changes maintain the same bundles.
No automatic publication or local stack restart is implied by code validation.

## Worker workflow

Open **Shift Handover** from the left navigation to **Meeting preparation** and select
a department and date. The same workspace offers **Journal** for only your entries
and **Department matrix** for shared operational follow-up. The selected date carries
between the meeting and Journal; Journal history search retains the server author
filter. Meeting cards stay compact; Journal uses expanded personal cards.

Each category's **+** opens its form for the selected day. New work defaults to the
author's actual dated Workforce assignment department, with manual override. Floating
support, unassigned days and leaders without a zone start with no department. Browsing
a different department or having a home department never changes that default.
Technicians and Task Force publish only today; coordinators retain historical dates.

Select an area to choose a **Betriebsmittelkennzeichen** from imported codes. This
identifies a component, such as a sensor or motor. Use **Find component** and
**More components** for the bounded list (50 per page). Reported condition aligns
with the identifier select; lookup feedback and pagination remain below that row.
Arbitrary new codes are rejected by the API. Unchanged older references remain
readable/correctable even if absent from current imports. Equipment references are
still unverified external identifiers, not canonical assets. Reports without equipment
remain available when no codes are imported. Reporting damaged, blocked or inspection-
needed equipment is recorded through **Technical issue**. Blocked/nonoperating
conditions become Performance and other technical reports become Problems; both
are tracked automatically. Safety hides and rejects the equipment/condition fields.

Expand details for the Ultimo-generated code, challenge, cause, measure, completion
and feedback dates. Codes remain text, preserving leading zeros. An issue can be
published before cause, responsibility or deadlines are known. Its assignee is a
current site user. Meeting discussion and Start highlighting are separate choices.

Use **Search history** in Department matrix or Journal to open text, date,
location, category and status filters. Matrix column filter icons additionally
support occurrence/due-date ranges, external reference substring, responsible person
(including unassigned) and issue state/reported condition. What? and Details have no
column filters. Apply combines filters; Clear filter removes only that column's
criteria. Headers remain available when nothing matches. Search stays closed during
entry creation. **Journal** filters by
the authenticated author on the server, including later pages; Department matrix
keeps the tabular view. **Meeting preparation** is a six-section category canvas for
the selected day and department, including empty sections. Each compact card shows
only its title and department; open it for the full problem fields and history.
Each section has independent full counts and pagination (20 entries per page).
The separate **Department status** disclosure shows only unresolved carry-forward
topics (Problems/Performance by default), including earlier days through today.
Selecting a historical daily date does not hide current pending work. Resolve an
issue to remove it from this section while preserving its history.
Other categories remain on their own day and in searchable history, except active
Information, which follows its inclusive display period.

For **Team Leader**, the tab is **Daily overview**. It defaults to today and includes
all authors and departments at the authorized site for the selected day. It does not
inherit department, personal-history or search filters and does not mix earlier open
issues into the daily canvas. Its Department status disclosure has its own department
selector; that selector does not narrow the daily canvas. The date labels the entry's occurrence date, not the
instant of a later follow-up. This presentation does not grant additional access.
The calendar is beside the daily section heading and changes every daily category.
Start uses the current-day Workforce assignment or home department; explicit
other-department browsing remains available.

Entry detail prioritizes the current report, latest follow-up and immutable history.
The heading always names the current tab, for example **Shift Handover / Department
matrix**. Opening a report adds **Details** to that path. Select the preceding tab
name to return to the same view with its department, meeting date, search filters
and already-loaded pages retained. Select **Shift Handover** in the breadcrumb or
the sidebar for an explicit return to Meeting preparation with today's date and the selected department. Entries load when opened and
update automatically after saving changes; there is no manual refresh control.
**Add follow-up** opens a modal with an optional issue-state transition. **Close issue**
prefills Resolved and requires a resolution outcome; **Reopen issue** retains prior
resolution evidence. An informational entry can first be tracked as an issue. Only
authors, assignees and coordinators may change issue state; other workers can add
notes. Follow-up and its state change commit as one revision without modifying the
original. **Correct entry** remains a separate, reasoned action for factual mistakes.

Start presents open issues and attention counts for the chosen department, prioritizing
blocked reports or overdue action/feedback dates. These are report-based signals,
not inferred equipment health. Centered summary cards precede inline Needs attention,
Open reports and Shift Handover selectors. One collection is visible at a time,
with up to three shared summary cards and access to the complete filtered list.
Open reports excludes issues that need attention; server counts and full-list links
use the same partition. Expanded previews emphasize
location, state, equipment reference and labelled deadlines; Journal uses the same
expanded cards, while Meeting retains compact title/location cards. History actions pair a label with a count badge;
refresh uses the shared busy-aware icon/text control.
Highlights follow the selected/assigned department; the analytical snapshot is
compact and full tables remain in Data Analysis.

There is no hard-delete action. On a revision conflict, return to the Journal and
reopen the entry before applying the change. On an interrupted publication, retry the unchanged form to recover the
saved entry instead of creating a duplicate.

All four profiles can read and contribute to unrestricted categories. Information
requires coordinator grants and a permitted publisher profile, defaulting to Team
Leader, including corrections and follow-up.
Authors can correct their entries; authors/assignees can progress their issues. Team Leader and
Administrator can additionally correct site entries with a reason, reassign issues,
and publish/withdraw Start highlights. Every request checks current scoped grants;
profile labels in the browser do not grant authority. The native impersonation
mode does not automatically receive operational roles or a profile directory.

## Optional local demonstration entries

The legacy IOP-173 generator predates IOP-199 Safety/Success/publication rules and
must not be used to prepare or apply new fixtures with these workflows. Updating
that optional generator is outside this story. Preserve existing demo records and
the private manifest; `npm run local:handover-demo -- --inspect` remains read-only.
Demo writing is never part of startup, migrations or analytical import.

Each configured department receives twelve `[DEMO]` entries: six for the seed day
and six from 1–90 days earlier. Existing active contributors alternate as authors
and responsible people. Examples include all categories, open/in-progress/resolved
issues, reopening with earlier resolution evidence, overdue work and Start highlights.
Equipment comes from current imported choices. `DEMO-ULTIMO-*` values are fictional
references, not codes issued by Ultimo. All operational descriptions are synthetic.

The local operator adapter uses existing application rules and runtime permissions,
with a fixture-only clock to simulate historical contributions. Login, server date
rules, credentials and grants remain unchanged. Preserve the private
`.local-platform/handover-demo.json` manifest: it freezes dates, identities, scenarios
and baseline digests. Reruns reuse request keys, resume unchanged fixture histories,
and preserve subsequent user edits. They do not refresh dates or create duplicates.
The command verifies original handover snapshots/history and analytical totals.
These examples are persistent shared records; there is no automatic removal or
destructive reset. Do not treat `[DEMO]` reports as actual equipment conditions.

## Storage, API and verification

`shift_handover.entries` stores the current projection and original request identity;
`equipment_references` retains exact scoped code/namespace/location identities;
`revisions` retains immutable attributed snapshots. Current entry reads resolve
author/responsible names by account ID through the scoped Users/RBAC directory;
latest follow-up names resolve through revision actor IDs. Disabled/deleted
references remain readable without restoring access. Historical snapshots keep
their original names, and missing directory entries use the saved label.
Dates and creation instants are
separate. Same-site composite references, forced RLS and narrow runtime privileges
protect storage. Ordinary runtime cannot delete entries or update revision rows.
Corrections and their revision append commit atomically, with expected-revision
checks and actor/site-scoped idempotency for creation. The existing analytics-only
maintenance command does not erase this operational history.

The versioned API provides `GET /api/v1/handover/context` and POST operations under
`/api/v1/handover/{query,entries,change,history,equipment,default-location,completion-targets}`. OpenAPI owns transport schemas;
server domain/use cases own rules. Query pages expose full matching counts and a
next cursor; revision history exposes `nextBefore`. No request accepts client
organization/site selectors or trusted client authorship. Scope comes from the
configured host and actor from the existing authenticated session.

Validation commands use the repository Node 24.21.0 runtime:

```sh
npm run typecheck
npm test
npm run test:database
```

The database suite includes an isolated real PostgreSQL/Playwright handover journey
and writes screenshots to `/tmp/iop-169-browser`. It does not modify the operator's
running stack. The [implementation plan](../planning/completed/IOP-168-shift-handover-implementation-plan.md)
records actual executed evidence and remaining limitations.


## In-app new-entry notifications

The header bell polls the existing scoped query every 30 seconds while the page is
visible, plus on focus and manual refresh. `notificationsAfter` is an optional exact
UTC timestamp: query results include colleague publications and subsequent revisions
mentioning or assigning the caller, exclude self-authored revisions/deleted entries,
sort by `notificationAt` independently of the entry's calendar date, and retain full totals
and bounded pagination. Every read retains existing authorization and site isolation.

First use establishes a baseline. A browser-local timestamp per organization/site/
account remembers Mark all as read and up to 1,000 exact entry seen-time
acknowledgments; entry text and permissions are not cached. Successful detail reads
acknowledge only that entry through its observed update time. The query applies
`notificationReads` before full totals/pagination; later revisions still appear. The panel shows the latest 20 unread entry activities and opens their details.
Read state is local to this browser, with session-only fallback when storage is
unavailable. Mentioned/assigned-person follow-ups and Information broadcasts use the same
revision-backed feed. Maintenance acknowledges exact assignment-event revisions
when its detail loads successfully, including feed/detail races.
Maintenance assignment activity is composed separately in the bell. Cross-device
synchronization and external notifications remain outside this increment. Failed
reads never advance the checkpoint, and unavailable notifications have an explicit retry state.


## Operational department matrix

The optional `departmentMatrix` query flag selects the operational default. The API
application derives category IDs from the scoped catalog's `carryForward` setting,
and the date/time zone from its trusted clock/catalog. Its transaction read port
receives that scope; PostgreSQL applies it before totals and cursor pagination.
Carry-forward categories require open/in-progress issue state. Daily categories
require a publication instant on today's site-local date and a non-resolved state.
No entries are deleted or transitioned by this visibility rule.

The browser preserves operational scope through department/column filters and Load
more. Explicit history search, equipment history and Start collection deep links keep
full-history semantics; Clear search returns to operational scope. A publication at
22:00 UTC during Zurich summer time belongs to the next site day, regardless of its
selected occurrence date. Notifications continue reporting new publications in all
categories under their existing scope and read checkpoints.

## Information and media controls — IOP-196

Use the plus beside a daily category to publish for the selected day (coordinators
may backdate; contributors retain today's publication rule). Information plus/category
choices use the current category publication policy; IOP-199 defaults Information
to Team Leader only, still requiring coordinator grants. Direct API writes enforce
both checks.
Mention people selects notification recipients. Coordinators can attach two resized
images, shown in cards/details and retained in correction history. The Handover
entries/change JSON budget is 192 KiB; other JSON routes keep the 100 KiB limit.

`excludeAttention` selects ordinary open reports. `resolvedFrom`/`resolvedTo`
with `resolvedForMe` count assigned resolution transitions from immutable revisions.
`notificationAt` advances read checkpoints for updates without changing `createdAt`.

## Configured workflows and linked completion — IOP-199

Optional category `workflow` values are `safety`, `information`, `success`, `people`,
`technical-problem` and `technical-blocked`. The host supplies these defaults for
the six established IDs; custom IDs can declare their workflow explicitly. Category
labels remain site configuration. `publisherProfiles` restricts publishing in addition
to existing grants; Information defaults to `["team-leader"]`. Context returns the
server-derived `canPublish` flag for forms/add/correction controls.

`POST /api/v1/handover/default-location` accepts a date and returns the current
actor's assigned department or an empty ID. The source-owned Workforce adapter
checks current read access and exact actor scope. `completion-targets` provides
bounded, paginated technical-report or Maintenance references with completion
availability. Success content stores exact source/ID/expected-revision references;
server-produced `completedReferences` retains titles/location evidence.

Success publication and selected closures share the existing pinned transaction.
Handover validates/writes its reports; Maintenance validates work, outcome and the
complete current include/exclude repair review through its receiving contract.
The coordination lease precedes the Maintenance lease for writes, avoiding inverse
lock acquisition across the two entry points. No migration or independent nested
commit is introduced. Review unresolved work in Maintenance before publishing Success
when completion reports a scope/revision conflict; the failed publication closes nothing.

Information `displayUntil` is inclusive. The `displayOn` query applies occurrence
start and end dates without deleting expired entries. Meeting preparation and Start
read all active site Information independent of department browsing. Heading expansion
shows full retained content and images; People uses the same dated Workforce view.
Installation/activation still requires the operator's separate local stack command.
