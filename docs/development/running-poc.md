# Run and demonstrate the analytical POC

The application supports **CSV → persistent history → analytical report templates**, with individual local accounts. The Docker installation uses temporary password
authentication under [ADR-0035](../architecture/adr/ADR-0035-transitional-authentication.md).
It remains a loopback-only demonstration; corporate login and hosted/shared use are deferred.

## Primary local installation — Docker Compose

Prerequisites: Node 24.21.0/npm 10.9.2 for the small host launcher, and Docker with
Compose supporting `up --wait`. No host dependency installation is required for
this path; application builds, migrations and seed imports run inside containers.
Port 8080 must be available. From the repository root:

```sh
npm run local:up -- /absolute/path/to/wincc_local_20260729_123555.backup
```

Run `npm run local:admin` once to issue the initial administrator login in your
terminal. Open **http://127.0.0.1:8080**, sign in as **admin**, change the initial
password and sign in again. Frontend, API and
PostgreSQL are three separate services. Only the frontend is published to loopback;
API and database ports remain internal. A temporary setup container provisions roles,
executes migrations and imports the seed before the API starts. Business composition
lives in `apps/api/src/host`, with hexagonal modules/features in API and web.

The seed uses only `analytics.fact_hitliste` joined to the backup's five `core`
catalogs. It imports **42,220 rows across 78 dates (May 1–July 28, 2026), frequency
212,411, 56,391,042 exact seconds (939,850.7 minutes)** from the supplied archive.
The initial `public.hitliste` prototype is excluded. Its additional 467 rows are
not silently added to the requested analytics dataset. Original duration strings
supply exact seconds; rounded archive minutes are not summed. Sector classification
uses the configured five hall lists, with explicit unclassified fallback.

Private `.local-platform/seed/manifest.json` records the archive digest, per-day
hashes/totals and original analytics/source IDs in derived CSV record order.
These daily CSVs are **backup-derived seed inputs**, not original WinCC daily exports.
The application retains them through the same immutable import pipeline as uploads.
Backup SQL is read as COPY data and never executed. Neither the private data nor
credentials enter Git or image build contexts.

```sh
npm run local:stop
npm run local:up
npm run local:status
```

Subsequent starts reuse the private seed and persistent
`iop-platform-local_platform-data` volume. All files and existing dates are checked
before importing missing dates. Matching retained bytes are skipped; conflicts stop
initialization without replacing records. Later CSV uploads remain intact. A failed
multi-day seed can leave already completed days; rerunning verifies/skips those
before continuing. Ambiguous import outcomes require inspection, never automatic
replay. `local:up` stops API/web during initialization, then rebuilds and starts them.
Keep `.local-platform/` with its database volume; do not regenerate lost credentials
or use `docker compose down -v` to troubleshoot. Earlier native installations remain
separate. To start empty, omit the backup on the first `local:up`.

Executive Overview uses one calendar month for its KPIs. All investigation views
(Halle, Bereich, Equipment, Error and Daily/monthly) expose a collapsed **Months**
control with checkboxes for one or more complete months, including nonconsecutive
months. Applied months remain active when navigating or drilling into detail views.
Bereich adds sector and area; Equipment adds the code; Error and Daily/monthly add
finer dimensions. Grouping does not clear these filters. Returning to a broader view
removes incompatible dimension filters. The collapsed summary lists selected months
and counts active restrictions, including a restricted month selection.
**Clear filters** is always outside the disclosure and resets to all available
months without dimension filters. Changes become visible in the local installation
after rebuilding/restarting its web and API services, then reloading the browser.

## Start overview

After signing in, Start shows the current user's name and profile and the latest
imported month's Data Analysis summary. Select a Sector / Halle to see its recorded
Bereich groups; **Open Data Analysis** opens the full reporting workspace. Refresh
the overview after new imports. Totals retain the report's calendar exclusions and
coverage; alarm duration is not downtime or evidence of equipment condition.

Weekly shifts/departments, technician publications and blocked/restored equipment
are explicitly unavailable placeholders. No operational records are fabricated from
alarm data.

## Local accounts and profiles

Open **Users & profiles** as Administrator to create users, assign one of the four
profiles, or disable/reactivate a local account. Search by name or username. Click
User, Profile or Status to cycle ascending, descending and unsorted; multiple
criteria retain their displayed priority. Use the pencil beside Delete to edit an
account; the static name no longer opens editing. Username and user ID are read-only;
name, profile and access save atomically. The list also offers enable/disable and
an accessible trash action for logical deletion. Name changes appear on the next
load of Workforce and Handover views through the account ID; saved revision
history retains the names recorded at the time.
Only Administrator has user
administration and import/preparation tools. Administrator, Task Force and Team Leader
can open Data Analysis. Technician has an operational Start page and Shift Handover,
without analytical navigation, summaries or API access. Existing Technician analytical
grants are removed at their configured site by the next database migration.
The API enforces these permissions even when called directly.

Each new user receives an initial password shown once at creation. Deliver it to
that user securely; they must choose a different password of 15–128 characters on
first sign-in. There is no public registration or default password. Login is bounded
to 20 attempts per minute for this installation and five failed attempts lock the
account for 15 minutes. Sessions expire after eight hours; a new login replaces the
previous session. Logout, password change and access changes revoke sessions.
At least one active administrator must remain.

`npm run local:admin` refuses to replace an existing login. For explicit recovery
of the installation's original administrator, use `npm run local:admin -- --reset`;
this issues a new initial password, restores its local administrator access and
revokes its sessions. It requires an active identity owned exclusively by the
configured organization and site. General user password recovery is deferred;
there is no email service or corporate account binding yet.

Local setup never reseeds existing account memberships after authentication is
initialized. Existing platform IDs, analytical authorship and history are retained.
User administration is limited to this installation's one organization/site; adding
shared or multiple-site identities requires a separately reviewed integration.
The legacy native demonstration selector remains only in explicit demo mode and
is rejected by the Docker password-mode API. Never expose this HTTP stack to the
LAN or internet; remote deployment requires HTTPS and secure cookies.

## Import, prepare and analyze

1. Switch to **Administration → Data administration → Import files**, select
   `Hitliste-YYYYMMDD.csv`, confirm the displayed reporting date and press **Import CSV**.
   Input is UTF-16 LE with BOM, semicolon-separated, at most 5 MiB. Existing reporting
   dates cannot be replaced. Review errors, duplicates and interrupted outcomes.
2. Review the import outcome, saved/rejected counts and diagnostics. Known accepted
   dates block another upload; the server also rejects duplicate races. Use **Data analysis**
   to return to reports and select the desired month or comparison months.
3. Start in **Executive Overview**, then choose Halle, Bereich, equipment, errors or daily/monthly.
   Group by any source field; change the measure and day/week/month period. Filter
   a sector, location, equipment or message with exact values; suggestions show up
   to 200 values and an exact typed value can reach others. Commas are part of values.
4. Select a chart point/bar or a group in **Explore data** to filter it. **Clear filters**
   restores all available months without dimension filters. Tables expose rankings, periods and
   trends; administrators review original files and source rows in **Files & source rows**.
5. In **Import & prepare → Data preparation**, edit normalization, area-to-sector rules
   and explicit corrections.
   **Save historical preparation** persists the profile and applies it to historical
   reports. It never edits retained originals or immutable import-time facts. A stale
   editor/report version is rejected; refresh before continuing.
6. Restart the application and select **Administrator** to demonstrate
   persistence. Full totals use all matching records, not only the current page.

The report range is bounded to 3,660 days; pages contain 50 contributing rows,
rankings/scatter up to 100 groups and comparison/heatmap series up to 10 groups.
Executive KPIs use the full filtered data, independently of ranking and row limits.
Pareto is deferred to a future feature inside Executive Overview; there is no Pareto tab.
Only admitted coverage appears; missing days are gaps rather than zero activity.
Source frequency is an integer. Duration is summed as exact seconds and divided by
60 before display rounding; it is **not plant downtime**. Filename dates do not
prove a complete reporting window. No rates, causal conclusions or screenshot
improvement targets are invented.

## Normalized analytical storage

The reporting database follows the normalized backup reference in
[ADR-0033](../architecture/adr/ADR-0033-relational-hitliste-analytics.md).
`analytics.fact_hitliste` references `analytics.sektor`, `bereich`, `betriebsmittel`,
`meldetext`, `meldung_typ` and `meldegruppe`. Its `sektor_id` is the current prepared
classification, not a label calculated only in the browser. The same stored
relationships drive every report. Original files and immutable source facts remain
available for provenance and reconstruction.

For the Docker installation, rerun `npm run local:up`. For optional native
installations, stop the launcher and rerun the matching setup/start commands below.
Setup applies forward
migrations without replacing admitted files. Administrator startup backfills the
relational projection using the saved preparation profile; later uploads and
profile saves update it within their existing transaction. There is no backup
restoration or silent dropped-row join. Reports refuse incomplete/stale projections;
restart with Administrator configured to prepare them. A reader-only principal
cannot perform reconstruction. Current POC configuration exposes Administrator only.

## Executive indicators and stable visual identity

Only **Executive Overview** shows configured Meldetext KPI cards. Administrators
choose the messages, labels, measures and optional goals under **Import & prepare →
KPI settings & goals**. The monthly overview compares daily averages with the saved
goal or the global historical average; see the monthly overview instructions below.

Counts of source/admitted/rejected rows and file bytes appear in **Import & prepare**
for the reviewed file; unknown counts are labelled rather than treated as zero.
These are import diagnostics, not executive performance indicators.

Preserve the [IOP visual identity](../design/visual-identity.md) when changing views.

## Mapping your own source labels

Use **Import & prepare → Data preparation → Save historical preparation** to edit sector rules and
explicit value corrections in the database. The saved profile applies to historical
reports, preserves originals and rejects stale editor versions. Unknown source areas
remain included as unclassified. Changes never replace an admitted reporting date.

For low-level import-time mapping configuration, stop the matching installation
before editing its private file: `.local-platform/config/mappings.json` for Docker,
`.local-demo/mappings.json` or `.local-analysis/mappings.json` for native launchers.
Keep organization/site/source IDs aligned with that installation's scope file, update
`mappingRevision` and preserve sector-key meaning. These settings affect future
import-time facts; use the database reporting profile for historical interpretation.
The current POC keeps only Administrator; future provider integration replaces the
principal/session adapter in `apps/api/src/host/`.

## Optional native development installation

Prerequisites: Node 24.21.0, npm 10.9.2 and a running Docker daemon. Ports 54329
(database), 3000 (API) and 5173 (web) must be available. From the repository root:

```sh
nvm install
nvm use
npm ci
npm run demo:setup
npm run demo:start
```

Open **http://127.0.0.1:5173**. Select **Administrator**.
Keep the launcher running; Ctrl+C stops both application processes. PostgreSQL
stores history in the dedicated `iop-poc-data` volume and survives application
restarts. After restarting Docker, run `docker start iop-poc-postgres` before
`npm run demo:start`, or rerun setup while the application is stopped.

Setup creates a labelled `iop-poc-postgres` container, provisions separate database
roles, applies migrations, seeds the fictional organization/site and the Administrator
account, and registers an empty installation for safe reset. Reruns preserve imports,
credentials and configuration. It refuses an unknown conflicting container and
never deletes a volume or database. Runtime uses the non-owner `iop_runtime` role.

Generated `.local-demo/` files are ignored and private: database credentials,
configured scope, allowed users/origins, mappings and the reset dataset identity.
Do not commit or share them. Existing operator configuration elsewhere is untouched.
The default setup uses IOP-125's fictional scope, not an external customer connection.

## Optional native reference-data installation

For the owner's source CSVs and five hall lists, use a separate persistent installation:

```sh
npm run analysis:setup
npm run analysis:load-reference
npm run analysis:start
```

This uses `.local-analysis/`, container `iop-analysis-postgres`, volume
`iop-analysis-data`, PostgreSQL port 54339 and the same API/web ports 3000/5173.
Stop the other launcher first. Existing `.local-demo` data is not erased or mixed.
The reference loader admits the three authorized repository CSVs through the real
importer and skips already-admitted examples. It verifies 1,446 rows, frequency
8,496 and 1,629,521 exact seconds. It does not restore the supplied backup.

Select **Administrator** in the header for both import/preparation and analysis.
Both launchers create this single default account. The local selector is
impersonation, not secure login; the provider boundary remains replaceable.
Existing installations preserve their private configuration: while stopped, limit
`.local-analysis/users.json` (or `.local-demo/users.json`) to the existing
`demo-operator` entry named `Administrator`. Keep origins and other configuration
unchanged. This only narrows the selector allowlist; it does not delete database
principals or their grants. The generic reader-only authorization capability and
its tests remain available for later scope, outside the current demo flow.

## Reproducible reference example

Use these checked-in, fictional files through the upload control:

- `fixtures/analytical-poc/valid/Hitliste-20260701.csv`: 6 records, frequency 12,
  accumulated duration 94,055 seconds.
- `fixtures/analytical-poc/valid/Hitliste-20260703.csv`: 3 records, frequency 7,
  accumulated duration 3,720 seconds.

Historical range **2026-07-01 to 2026-07-04 (exclusive)** gives **9 records,
frequency 19 and 97,775 accumulated seconds**. July 2 is a missing import.
Unclassified-only gives frequency 5 and 91 seconds. The independent expectations
are in [expected.json](../../fixtures/analytical-poc/expected.json).

Then upload `fixtures/analytical-poc/duplicate-changed/Hitliste-20260701.csv` and
`fixtures/analytical-poc/invalid/negative-frequency/Hitliste-20260702.csv` to show
preserved duplicate/validation outcomes without changing historical measures.

Alternatively, while the application is stopped, `npm run demo:fixtures` imports
both baseline files through the actual importer and verifies their totals. It
fails visibly if those dates already exist; it does not reset or replace anything.

## Native fixture reset and recreation

Stop `demo:start` first. Read the dataset ID from `.local-demo/dataset.json`, then:

```sh
npm run demo:reset -- <dataset-id>
```

This resets only the registered organization/site/source. It requires local mode,
matching installation identity and schema, no runtime connections, exclusive
maintenance access and consistent quota accounting. Other targets, source
configuration, organization/site identities and user grants remain intact. Missing
or mismatched conditions refuse without deleting data. No reset API exists.

To reset and reload the two reference CSVs through the importer:

```sh
npm run demo:recreate -- <dataset-id>
npm run demo:start
```

Cleanup is atomic; fixture reload is a separate phase. A reload failure is reported
as incomplete and does not claim that reset rolled back. Inspect history before
retrying; successful dates continue to reject duplicates. After an uncertain commit,
start the host and inspect the registered target's history before any repeat reset.
There is no automatic replay, volume removal or production backup/restore claim.

## Checks and troubleshooting

`npm run test:poc` runs type, unit, actual-role PostgreSQL and browser checks.
Install Chromium first with `npx playwright install chromium`. The database layer
includes a real-browser CSV/history journey against disposable PostgreSQL, separate
from browser tests with intercepted HTTP fixtures. Tests never reset this
operator installation. See [testing](testing-poc.md) and
[delivery evidence](../planning/completed/IOP-147-working-analytical-poc-plan.md).

- An inactive backend shows **Connect the local API**; use `npm run local:up`
  for the full stack, or the matching native launcher for native development.
- Access failure requires checking the selected seeded principal and current grants.
  Shared hosting, foreign origins and arbitrary scope are refused. The explicit
  local-container mode uses production-built images while retaining local identity.
- An interrupted attempt can be reviewed and explicitly recovered from Import &
  prepare once processing has stopped. Recovery checks durable outcome and never
  silently resubmits the bytes.
- Storage is bounded to 1,000 retained attempts and 256 MiB original bytes across
  the dedicated database. Rejected inputs also consume retention. The native fixture
  reset does not reset the main Docker history; do not bypass quotas or delete volumes.

## Monthly Executive Overview

Select the Administrator, choose Data analysis from the empty Start page and open Executive Overview. Expand the subtle Month
control to choose an imported calendar month from the dropdown (initially the latest imported month). Area
rankings and the daily heatmap use descending monthly frequency; scroll to inspect
more areas. The daily graph overlays frequency and alarm minutes with labelled axes.
Click a ranked area or heatmap cell to investigate that area in Bereich analysis.

Switch to **Administration → Data administration → KPI settings & goals** to add/remove up to eight Meldetext cards, select
prepared error text from the database dropdown, label and measure, and save. Goals are occurrences/day
or alarm minutes/day; changing measure clears the old goal. Leaving a goal blank
uses the daily average across all imported history, including the selected month.
The monthly average also divides by eligible imported dates, including dates without that
error. Cards retain month totals and explicitly label their reference. Missing
dates stay gaps; an entirely unimported month has no average. Below reference is
green, above is red, equal is neutral. A zero reference has no percentage change.
Settings survive reloads and Docker restarts. A conflicting edit requires reloading
saved settings before applying changes again.

All analyses exclude Sundays by CSV reporting date, including both KPI totals and
daily-average denominators. Daily graphs and heatmaps omit Sundays, and monthly
coverage shows eligible days (for example, July 2026 has 27). Missing eligible
dates remain gaps. Sunday imports remain available under **Files & source rows**;
the analysis calendar does not erase or reject them. The month dropdown contains
months with at least one eligible imported date.

## Operational views and administration

Administrators start on **Administration**, showing active/disabled account totals,
the latest received analytical file (including outcome) and the latest 20 recorded
account changes in the site time zone. Activity uses retained access audit; it is
not a cross-module audit feed. Create/manage users in **Users & profiles**. **Data administration**
opens the import workspace; **Data analysis** opens operational reports without hiding
administrative navigation. Settings remain available before the first import.
Preparation and KPI editors load independently when opened.

**View as** opens a selector for Administrator, Technician, Task Force and Team Leader.
An operational selection previews that profile's workspace layout and hides administrative
shortcuts. **Return to administration**, or selecting Administrator, restores the overview.
The preview is local presentation only: the signed-in account, server permissions,
accessible data and authorship do not change. It is not impersonation or a permission
test. Signing out or selecting another demo user clears the preview. Ordinary users
retain their operational Start page and do not see administrator controls.

Import review shows the filename/date, source/admitted/rejected row counts, bytes,
complete/partial inspection, valid/invalid inspected counts, import-time unclassified
and repeated rows, and bounded line/field diagnostics. Unknown counts stay unknown.
Repeated source rows are distinct from a duplicate date. Review received attempts
and recover their final outcome before retrying an interrupted upload. Changing the user or reloading starts with administrative tools
hidden. This is a presentation switch with the same server-side permission checks.

In **Files & source rows**, select an imported file. Expand **Column filters** to
enter exact values or choose suggestions for any displayed column. Apply combines
criteria with AND across the complete file, including rows beyond the current page.
Text matches retain accents, commas and leading zeroes; numeric duration matches
minutes rounded to two decimals as displayed (use a decimal point). Suggestions
show up to 200 values per column; manually entered values can match beyond that list.
The caption shows matching rows out of total file rows. Clear filters restores the
whole file. Choices update while editing, before Apply, following the order shown
in the form. Choosing a sector limits Bereich choices to that sector; choosing a
Bereich limits equipment choices. Each later filter follows the earlier criteria.
Changing a filter clears the following fields, including when clearing its value.
Manual values beyond the suggestion list remain supported if matching rows exist.
Apply is disabled while choices load, when validation fails, or when no rows match;
correct a value, clear the filters or retry a failed preview. Sorting/paging retain
applied filters; switching files clears them. Original data remains unchanged.

Click a column title once for
ascending order, again for descending, then again to remove that criterion. Arrows
and numbers indicate direction and priority when several columns are selected.
Sorting applies across the entire file; changing criteria or file returns to page
one. Prepared values reflect current rules; download the original for source evidence.
No contributing-row table appears inside analytical report tabs. The file list uses
the existing most-recent-1,000-import-attempts window.

### Private installation directories

`.local-platform` holds configuration and seed provenance for the current container
stack. `.local-demo` and `.local-analysis` belong to the optional native installations.
Do not delete one merely because its container is stopped: retained `iop-poc-data`
or `iop-analysis-data` volumes still need its credentials and installation identity.
IOP-164 retained all three after verifying that their associated volumes exist.
Build output in application/database `dist/` directories is disposable and regenerated
from current sources; it is not database state.

Workforce planning, manual schedule imports, German/English language selection and
synthetic workforce provisioning are documented in the [Workforce guide](workforce.md).
