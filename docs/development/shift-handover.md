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

Open **Shift Handover** from the left navigation and select a department. The Journal
board shows the three latest entries in each configured category, with full matching
counts and a **View history** action. Journal and Meeting preparation reuse the
same bordered summary cards: semibold blue entry titles and semibold muted department labels,
distinct from the bold navy category headings. Select
a card for its full report, date, author and status. Each category's **+** opens a modal form with
that category, the selected department and today's site-local date. Technicians and
Task Force publish only on the current date; Team Leader and Administrator can
select historical dates. The API enforces this rule independently of the browser.

Select an area to choose a **Betriebsmittelkennzeichen** from imported codes. This
identifies a component, such as a sensor or motor. Use **Find component** and
**More components** for the bounded list (50 per page). Reported condition aligns
with the identifier select; lookup feedback and pagination remain below that row.
Arbitrary new codes are rejected by the API. Unchanged older references remain
readable/correctable even if absent from current imports. Equipment references are
still unverified external identifiers, not canonical assets. Reports without equipment
remain available when no codes are imported. Reporting damaged, blocked or inspection-
needed equipment initially selects **Track as an open issue**, which can be reviewed
before publication.

Expand details for the Ultimo-generated code, challenge, cause, measure, completion
and feedback dates. Codes remain text, preserving leading zeros. An issue can be
published before cause, responsibility or deadlines are known. Its assignee is a
current site user. Meeting discussion and Start highlighting are separate choices.

Use **Search history** intentionally to open text, date, location, category and
status filters. Search stays closed during entry creation. **My entries** filters by
the authenticated author on the server, including later pages; Department matrix
keeps the tabular view. **Meeting preparation** is a six-section category canvas for
the selected day and department, including empty sections. Each compact card shows
only its title and department; open it for the full problem fields and history.
Each section has independent full counts and pagination (20 entries per page).
Earlier/current unresolved issues are available in a separate collapsed disclosure.

For **Team Leader**, the tab is **Daily overview**. It defaults to today and includes
all authors and departments at the authorized site for the selected day. It does not
inherit department, personal-history or search filters and does not mix earlier open
issues into the daily canvas. The date labels the entry's occurrence date, not the
instant of a later follow-up. This presentation does not grant additional access.
The selected department is shared with Start during the current session; M6 default
assignments are not yet connected.

Entry detail prioritizes the current report, latest follow-up and immutable history.
The heading always names the current tab, for example **Shift Handover / Department
matrix**. Opening a report adds **Details** to that path. Select the preceding tab
name to return to the same view with its department, meeting date, search filters
and already-loaded pages retained. Select **Shift Handover** in the breadcrumb or
the sidebar for an explicit return to Journal home with the selected department. Entries load when opened and
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
Open reports includes issues that also need attention. Expanded previews emphasize
location, state, equipment reference and labelled deadlines; Journal/Meeting retain
compact title/location cards. History actions pair a label with a count badge;
refresh uses the shared busy-aware icon/text control.
Site-wide highlights remain separate; the analytical snapshot is compact and the
full tables remain in Data Analysis.

There is no hard-delete action. On a revision conflict, return to the Journal and
reopen the entry before applying the change. On an interrupted publication, retry the unchanged form to recover the
saved entry instead of creating a duplicate.

All four profiles can read, publish and add attributed follow-up. Authors can
correct their entries; authors/assignees can progress their issues. Team Leader and
Administrator can additionally correct site entries with a reason, reassign issues,
and publish/withdraw Start highlights. Every request checks current scoped grants;
profile labels in the browser do not grant authority. The native impersonation
mode does not automatically receive operational roles or a profile directory.

## Optional local demonstration entries

With the local Docker stack running, `npm run local:handover-demo` previews a
bounded dataset without writing. `npm run local:handover-demo -- --apply` explicitly
inserts it; `npm run local:handover-demo -- --inspect` reports stored coverage.
This is never part of startup, migrations or analytical import.

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
`revisions` retains immutable attributed snapshots. Dates and creation instants are
separate. Same-site composite references, forced RLS and narrow runtime privileges
protect storage. Ordinary runtime cannot delete entries or update revision rows.
Corrections and their revision append commit atomically, with expected-revision
checks and actor/site-scoped idempotency for creation. The existing analytics-only
maintenance command does not erase this operational history.

The versioned API provides `GET /api/v1/handover/context` and POST operations under
`/api/v1/handover/{query,entries,change,history,equipment}`. OpenAPI owns transport schemas;
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
