# Run and demonstrate the analytical POC

The application supports **CSV → persistent history → analytical report templates**, with one local Administrator. This is a single trusted
operator's loopback-only demonstration. Third-party authentication replaces the
local user selector before shared use; no password or enterprise login is claimed.

## Start a dedicated installation

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

## Reference-data installation and report workspace

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

1. Open **Import & prepare**, select `Hitliste-YYYYMMDD.csv` and press **Import CSV**.
   Input is UTF-16 LE with BOM, semicolon-separated, at most 5 MiB. Existing reporting
   dates cannot be replaced. Review errors, duplicates and interrupted outcomes.
2. Use **Analyze this file** for one date, or **Back to analysis** / **Refresh history**
   for the complete imported range. Dates are inclusive/exclusive as labelled.
3. Start in **Executive Overview**, then choose Halle, Bereich, equipment, errors or daily/monthly.
   Group by any source field; change the measure and day/week/month period. Filter
   a sector, location, equipment or message with exact values; suggestions show up
   to 200 values and an exact typed value can reach others. Commas are part of values.
4. Select a chart point/bar or a group in **Explore data** to filter it. **Clear filters**
   restores the range without dimension filters. Tables expose rankings, periods and
   contributing rows; authorized administrators can retrieve the original file/line.
5. In preparation, edit normalization, area-to-sector rules and explicit corrections.
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

## Executive indicators and stable visual identity

Only **Executive Overview** shows KPI cards. They identify the highest-frequency
sector, equipment code and error, plus the area with the highest accumulated alarm
duration. Each card shows the leader, its measure and its percentage of the complete
filtered total (frequency for three cards, exact alarm seconds for the area card).
Click the name to filter the report. Ties use deterministic label ordering; a zero
or empty denominator displays no leader or percentage. Equipment groups by the source
code across its locations, which remain independently filterable.

Counts of source/admitted/rejected rows and file bytes appear in **Import & prepare**
for the reviewed file; unknown counts are labelled rather than treated as zero.
These are import diagnostics, not executive performance indicators.

Preserve the [IOP visual identity](../design/visual-identity.md) when changing views.

## Mapping your own source labels

Edit `.local-demo/mappings.json` while the host is stopped, then restart it. Keep
its organization/site/source IDs aligned with `.local-demo/scope.json`. Configure
sectors and exact source-area membership; change `mappingRevision` when editing.
Preserve sector-key meaning across revisions. Unknown source areas are retained as
unclassified. Changes affect future import-time facts only: previous facts retain their frozen
classification. Use the explicit database reporting profile in Import & prepare to
change historical analytical interpretation. A changed mapping is not permission to replace
an existing reporting date.

Additional local users require the existing explicit user and membership seed
commands plus `.local-demo/users.json`; changing a browser value cannot create a
principal or grant access. Provider integration later replaces the principal/session
adapter in `apps/api/src/demo/`, preserving domain permissions and scoped transactions.

## Safe reset and recreation

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
from the original opt-in `?preview=1` fixture previews. Tests never reset this
operator installation. See [testing](testing-poc.md) and
[delivery evidence](../planning/completed/IOP-147-working-analytical-poc-plan.md).

- An inactive backend shows **Connect the local API**; use the demo
  launcher, not the independent health-only/container bootstrap.
- Access failure requires checking the selected seeded principal and current grants.
  Shared hosting, production mode, foreign origins and arbitrary scope are refused.
- An interrupted attempt can be reviewed and explicitly recovered from Import &
  prepare once processing has stopped. Recovery checks durable outcome and never
  silently resubmits the bytes.
- Storage is bounded to 1,000 retained attempts and 256 MiB original bytes across
  the dedicated database. Rejected inputs also consume retention. Use verified
  scoped reset when appropriate; do not bypass quotas or delete volumes.
