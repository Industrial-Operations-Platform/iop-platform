# Maintenance and Asset History operation

Scope: [product contract](../product/maintenance-assets.md). Implementation and
validation: [IOP-194](../planning/items/IOP-194-maintenance-asset-history.md).
Run the existing local stack using [running-poc](running-poc.md).

## Setup and workflow

The owning migrations add Maintenance/Asset storage and explicit site-role bundles.
The owner-authorized `20261006000000-admin-operational-access` migration restores
exactly `maintenance-coordinator`, `assets-reader` and `assets-administrator` for
active Administrators with at least one current site grant, including earlier
inactive flags for those three bundles. Other role revocations, inactive memberships
and fully revoked site access remain unchanged. The migration also adds scoped
equipment lookup indexes. Normal account creation/profile changes and initial
Administrator bootstrap use the same fixed role catalog. API startup never
implicitly runs migrations.

Use the repository's setup/migrate procedure for this branch before opening its
UI. Preserve the existing PostgreSQL volume; ordinary start/stop does not erase
history. Running a new database schema is independent from merging the branch.
The user's shared installation is not a test database.

1. Sign in as Administrator, Team Leader or Task Force and open Assets. Register an equipment
   reference with its exact Betriebsmittelkennzeichen,
   name equal to its code and configured location. Keep it unverified until validation evidence exists.
2. Add deliberate exact source aliases when imported or handover codes are known
   to refer to that asset. Preserve source namespace, case, code and location
   context. Matching descriptions alone are insufficient evidence.
3. Open Maintenance, create technical work and select its location, asset,
   priority and responsibility. Work may be recorded without an asset when identity
   is unresolved; this does not fabricate a canonical mapping.
4. Use the record's **Move maintenance** actions for Open/In progress/Blocked/Done.
   **Mark as done** opens a completion review: record the outcome, confirm all tasks
   and the shown workplace/equipment, then review every pending related report.
   Blocked and reopening require a reason. **Edit** changes record information.
   Administrators and Team Leaders assign/reassign site work; contributors update authored/assigned work.
5. Open a work record to inspect its attributed revisions. On a stale-save
   conflict reload the current record and review the newer changes before retrying.
6. Open the asset's digital record, choose dates/source filters and inspect
   Maintenance, Handover and authorized analytical evidence. Source actions open
   the original context. Follow subsequent pages to inspect all matching history.

No analytics imports still permits registered assets and technical work.
No alias means no inferred Handover/analytical history. Technicians open assigned
Maintenance from Start or the activity bell and use the Handover workspace;
their sidebar has no Maintenance entry. Digital asset records require
Administrator, Team Leader or Task Force. Missing source grants appear as denied coverage.
Retired assets retain their digital record; historical references survive catalog
and profile changes.

Source coverage can report an unavailable non-database adapter. A database or
authorization failure returns a sanitized service-unavailable response for the
whole request; retry starts a freshly authorized transaction. It never presents
an aborted database transaction as a complete timeline.

## Repair workflow and assignment activity

1. Open or propose Maintenance work. Choose Corrective (default), Preventive or
   Inspection, the configured location and a concrete repair target. A component
   absent from the sensor catalog can be described here without fabricating a sensor.
2. Select one or several exact equipment identifiers for the manual repair zone.
   Preserve source text such as `=11+11.11.02-B102.1` and its department/area context.
   There is no prefix/radius selection; the scope prepares that future functionality.
3. Review Related operational reports. Open a report to inspect the existing
   Handover detail and follow-up, then return to the same maintenance context.
   Department matrix entries are these same Handover records.
4. Administrator or Team Leader assigns a site person/team. Workers find unfinished
   maintenance inside Your assignment below Profile on Start, and new assignment
   activity in the existing bell. Day/Week and Assignment date select work due in
   that period, also retaining overdue work (before today in the site time zone)
   and work without a due date. Cards use two desktop columns with stacked metadata;
   the department summary stays available in both period views. Viewing an assignment
   preserves its work destination. This is an in-app notice; no email is sent.
5. Before saving Done, provide the actual repair outcome and review every pending
   scoped report. Include issues addressed by the work or exclude them with a
   reason. Reload reports if another worker changed or added an issue. Excluded
   and unrelated reports remain open; the complete reviewed closure commits
   together with the Maintenance history.

The board shows all unfinished work and previous/current-week completions by
site-local calendar dates. Historical search lets you select other completed-work
windows. Selecting one status hides the other columns and expands its result cards.
Asset access is available to Administrator, Team Leader and Task Force.
Administrator also retains user/priority administration and maintenance coordination. A narrow equipment reference in Maintenance is not an Asset
module permission grant.

## Local placeholder data

With this branch running in the local Docker installation:

```sh
npm run local:maintenance-demo -- --preview
npm run local:maintenance-demo -- --apply
npm run local:maintenance-demo -- --inspect
```

Preview performs no writes. Apply freezes an ignored private manifest at
`.local-platform/maintenance-assets-demo.json` before creating records through
the normal module applications and current permissions. Keep this manifest:
retries resume unfinished histories, preserve later owner edits and add no
duplicates. A divergent unfinished history stops for inspection rather than
overwriting an edit. The command refuses other execution environments and does
not change credentials, priorities, team configuration or analytical facts.
Newly prepared training data uses an existing eligible operator. Retained manifests
remain historical exercises: after catalog reconciliation use inspection rather than
replaying obsolete training names or reinstating archived examples. Replay never
impersonates an author whose current grants were revoked.
Fresh exercises explicitly exclude existing operational problems from fictional
work, so a simulated completion never resolves real reports.

The five-department fixture contains 10 fictional assets and 30 maintenance
exercises marked `[DEMO]` / `DEMO-194-`. Use the existing local accounts at
`http://127.0.0.1:8080`; search `[DEMO]` in Maintenance or `DEMO-194-` in Assets.
Catalog reconciliation has retired all 12 training asset identities, including
the two linked-workflow examples. Assets opens with current records: select
**Retired** or **All states** before searching for these examples. Their earlier
unverified and simulated validated states remain in revision history. The
Maintenance/Handover exercises remain available without changing their source records.

- Compare board/list views and filter Open, In progress, Blocked and Done.
  Test overdue/today/future dates, priorities, person/team assignments and the
  second page. The area checklist is deliberately unassigned and asset-free.
- Inspect the blocked bearing replacement, completed sensor test and reopened
  recurring inspection. Their revision histories explain blockers, outcomes,
  reopening and coordinator reassignment.
- Open a retired inspection conveyor's digital record and its Maintenance events;
  source links return to the work record. Inspect earlier unverified and simulated
  validated snapshots in its revisions, and the spare drives' preserved histories.

These are training records, including simulated validation notes. They have no
source aliases: Handover/analytical history is empty for these fictional assets
until an explicit verified mapping exists. This expected result does not imply
an adapter failure. Existing Handover and analytical data remains untouched.

### Linked workflow placeholders

Run `npm run local:linked-maintenance-demo -- --preview`, then `--apply` and
`--inspect`, against the running local Docker stack. This separate fixture keeps
its frozen identities in `.local-platform/linked-maintenance-demo.json`. Preserve
that ignored manifest: retries resume incomplete histories and retain later owner
changes. It uses existing active Team Leader and Technician accounts without
changing credentials or grants.

Search `[DEMO LINKED]` in Maintenance and Handover, or `DEMO-LINKED-194-` in Assets.
Select **Retired** or **All states** to find the archived Asset examples.
Two fictional equipment references were registered as unverified with exact Handover aliases; four
problem reports and four assigned work records cover all statuses and categories.
The completed cassette exercise resolves one included demo report, excludes two
demo reports and leaves the unrelated report open. Pre-existing reports are
explicitly excluded; their content and state remain unchanged. The fixture-only
code lookup supplies fictional identifiers without changing imported analytics.
The Technician's Start shows three unfinished assignments and their notices.
Each manifest retains its historical installation baseline. Loading this supplement
intentionally changes the older fixture's installation-wide checksum; supplemental
inspection records preservation of the combined earlier dataset.

## Current equipment catalog

The reported-code chooser appears first in registration. Choose department/Halle,
area/Bereich and one exact source identifier; search or follow additional pages.
The resulting asset name equals its code. Record component type and manual within-
area group/location details separately, such as buffer 1/2. Use an exact manual
identifier for a component absent from WinCC; do not invent source aliases.

Analytical Source ID, sector, area and equipment code are conditioned dropdowns.
They retain exact source identity. For example the retained local catalog maps
`=12+12.01.02-B102.6` to source `hitliste`, sector `Halle A T2` and area `Pick Tower 1`.
The previous manually registered `=11+11.11.02-B102.6` belongs to `Halle A T3` /
`LB-Puffer`; its identity and manual metadata remain retained.

Unverified means physical identity needs checking; Validated requires evidence;
Retired preserves history while removing the asset from current selection. These
states do not describe location health or current machine operation. The directory
starts with current assets; All states and Retired expose historical identities.

The explicitly invoked local initial-inventory tool uses the normal Assets application:

```sh
npm run local:asset-catalog -- --preview
npm run local:asset-catalog -- --apply
npm run local:asset-catalog -- --inspect
```

Preview freezes `.local-platform/asset-equipment-catalog.json` with private source/
configuration evidence and expected revisions, without database writes. Apply reuses
that manifest, archives superseded training records and registers missing codes as
unverified. Resume checks every retained prefix before further writes; later owner
edits win. Inspection reports source/work/history preservation. A changed source or
configuration rejects the frozen manifest; new codes can still be registered through
the normal scoped form. Keep the manifest for reconciliation evidence.

The 2026-10-06 reconciliation retained 5,643 current equipment identities from
5,793 source contexts and archived 12 training identities, for 5,655 total records.
It preserved the manually registered identity and metadata, all 21 original Asset
revisions, 34 Maintenance records / 82 revisions, 67 Handover entries / 134 revisions,
and 60,735 analytical facts / 104 publications. Repeat application wrote no records
or revisions and reported unchanged protected data. These are delivery-time counts;
later operational edits can change them.

The catalog supports 10,000 identities and paginated source choices. It does not
infer component type, physical hierarchy or placement. M09 remains deferred by the
owner; source evidence, Handover problems and Maintenance interventions complement
one another through source links rather than copied report narratives.

## Implementation boundaries

API modules: `apps/api/src/modules/maintenance` and `modules/assets` own pure
domain/application rules, transaction ports and PostgreSQL adapters. Inbound
controllers/DTOs and cross-module wiring live in `apps/api/src/host`. Workforce,
Users/RBAC, Handover and OIP expose narrow scoped owner adapters; the asset timeline
does not take ownership of their records. REST contracts live in the generated
OpenAPI artifact and browser bindings, outside pure domain/application layers.

Browser features: `apps/web/src/features/maintenance` and `features/assets`
provide pure application/gateway contracts with HTTP and React adapters. The host
shell owns navigation and source destinations. All views compose the existing
shared design library, date/location controls and localization resources.

## Validation

Use the pinned Node/npm versions and isolated test fixtures in the
[testing guide](testing-poc.md): `npm run typecheck`, `npm test`,
`npm run test:database` and `npm run test:e2e`.
Domain/use-case tests exercise transitions, ownership, outcomes, revisions,
aliases, deterministic pagination and source authorization. Real-role PostgreSQL
tests exercise durability, migration/provisioning, scoped rows, immutable revisions,
atomic rollback and optimistic concurrency. Browser evidence distinguishes
intercepted UI fixtures from actual PostgreSQL journeys.

Actual commands/results and material limitations belong in the linked execution
record; this guide does not claim unexecuted checks or owner product acceptance.
