# Maintenance and Asset History operation

Scope: [product contract](../product/maintenance-assets.md). Implementation and
validation: [IOP-194](../planning/items/IOP-194-maintenance-asset-history.md).
Run the existing local stack using [running-poc](running-poc.md).

## Setup and workflow

The new owning migrations add Maintenance/Asset storage and extend explicit
site-role bundles for active profiles already granted access. They do not restore
inactive memberships or revoked grants. Normal account creation/profile changes
use the same fixed role catalog. The explicit initial administrator bootstrap
provisions the catalog too. API startup never implicitly runs migrations.

Use the repository's setup/migrate procedure for this branch before opening its
UI. Preserve the existing PostgreSQL volume; ordinary start/stop does not erase
history. Running a new database schema is independent from merging the branch.
The user's shared installation is not a test database.

1. Sign in as Team Leader or Task Force and open Assets. Register an equipment
   reference with its exact Betriebsmittelkennzeichen,
   name and configured location. Keep it unverified until validation evidence exists.
2. Add deliberate exact source aliases when imported or handover codes are known
   to refer to that asset. Preserve source namespace, case, code and location
   context. Matching descriptions alone are insufficient evidence.
3. Open Maintenance, create technical work and select its location, asset,
   priority and responsibility. Work may be recorded without an asset when identity
   is unresolved; this does not fabricate a canonical mapping.
4. Progress work, explain blockers and record an outcome when completing it.
   Team Leaders assign/reassign site work; contributors update authored/assigned work.
5. Open a work record to inspect its attributed revisions. On a stale-save
   conflict reload the current record and review the newer changes before retrying.
6. Open the asset's digital record, choose dates/source filters and inspect
   Maintenance, Handover and authorized analytical evidence. Source actions open
   the original context. Follow subsequent pages to inspect all matching history.

No analytics imports still permits registered assets and technical work.
No alias means no inferred Handover/analytical history. Technicians read Maintenance
and Handover in their own workspaces; digital asset records require Team Leader or
Task Force. Missing source grants appear as denied coverage.
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
4. Team Leader assigns a site person/team. Workers find unfinished assignments on
   Start and new assignment activity in the existing bell. Viewing an assignment
   preserves its work destination. This is an in-app notice; no email is sent.
5. Before saving Done, provide the actual repair outcome and review every pending
   scoped report. Include issues addressed by the work or exclude them with a
   reason. Reload reports if another worker changed or added an issue. Excluded
   and unrelated reports remain open; the complete reviewed closure commits
   together with the Maintenance history.

The board shows all unfinished work and previous/current-week completions by
site-local calendar dates. Historical search lets you select other completed-work
windows. Selecting one status hides the other columns and expands its result cards.
Asset access is limited to Team Leader and Task Force; Administrator retains user
and priority administration without operational Asset access or maintenance
assignment authority. A narrow equipment reference in Maintenance is not an Asset
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
After the permission refinement, newly prepared data uses an existing eligible
Team Leader. A retained manifest authored by a now-ineligible profile remains
inspectable; replay is refused rather than recreating records under another author.
Fresh exercises explicitly exclude existing operational problems from fictional
work, so a simulated completion never resolves real reports.

The five-department fixture contains 10 fictional assets and 30 maintenance
exercises marked `[DEMO]` / `DEMO-194-`. Use the existing local accounts at
`http://127.0.0.1:8080`; search `[DEMO]` in Maintenance or `DEMO-194-` in Assets.

- Compare board/list views and filter Open, In progress, Blocked and Done.
  Test overdue/today/future dates, priorities, person/team assignments and the
  second page. The area checklist is deliberately unassigned and asset-free.
- Inspect the blocked bearing replacement, completed sensor test and reopened
  recurring inspection. Their revision histories explain blockers, outcomes,
  reopening and coordinator reassignment.
- Open an inspection conveyor's digital record and its Maintenance events;
  source links return to the work record. Compare unverified and simulated
  validated assets, then show retired spare drives and their preserved history.

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
Two unverified fictional equipment references have exact Handover aliases; four
problem reports and four assigned work records cover all statuses and categories.
The completed cassette exercise resolves one included demo report, excludes two
demo reports and leaves the unrelated report open. Pre-existing reports are
explicitly excluded; their content and state remain unchanged. The fixture-only
code lookup supplies fictional identifiers without changing imported analytics.
The Technician's Start shows three unfinished assignments and their notices.
Each manifest retains its historical installation baseline. Loading this supplement
intentionally changes the older fixture's installation-wide checksum; supplemental
inspection records preservation of the combined earlier dataset.

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
