# Run and demonstrate the analytical POC

The application supports **CSV → persistent history → Executive Overview →
analytical detail**, with configured local demo users. This is a single trusted
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

Open **http://127.0.0.1:5173**. Select **Demo operator** or **Demo colleague**.
Keep the launcher running; Ctrl+C stops both application processes. PostgreSQL
stores history in the dedicated `iop-poc-data` volume and survives application
restarts. After restarting Docker, run `docker start iop-poc-postgres` before
`npm run demo:start`, or rerun setup while the application is stopped.

Setup creates a labelled `iop-poc-postgres` container, provisions separate database
roles, applies migrations, seeds the fictional organization/site and both demo
users, and registers an empty installation for safe reset. Reruns preserve imports,
credentials and configuration. It refuses an unknown conflicting container and
never deletes a volume or database. Runtime uses the non-owner `iop_runtime` role.

Generated `.local-demo/` files are ignored and private: database credentials,
configured scope, allowed users/origins, mappings and the reset dataset identity.
Do not commit or share them. Existing operator configuration elsewhere is untouched.
The default setup uses IOP-125's fictional scope, not an external customer connection.

## Demonstration workflow

1. Select a demo user. The header allows switching later; switching clears the
   previous browser workspace and invalidates its old session. Current grants are
   checked on every operation. This selector is local impersonation, not human login.
2. In **Import & history**, select a supported file and press **Import CSV**.
   Supported input is `Hitliste-YYYYMMDD.csv`, UTF-16 LE with BOM, semicolon-separated,
   with the exact [source contract](../architecture/csv-source-contract-poc.md).
   Maximum file size is 5 MiB; one upload is processed at a time.
3. Review the outcome and any line/field diagnostics. Failed input adds no analytical
   measures. A repeated successful reporting date for the same source is rejected,
   even if its bytes change; existing data is never replaced automatically.
4. Choose **Analyze this file** or **Analyze file** in the history. The reporting
   range selects that admitted date. Original bytes remain downloadable through
   the review/provenance links with `imports.review` permission.
5. Choose **Analyze history** to combine persisted reporting dates. A single analysis
   spans at most 366 labels; for a longer history the initial range is the most recent
   366 days. Open **Reporting dates & shared filters** to choose another range and
   sector, area, source-equipment or message values, including message exclusions.
   Empty dimension selections mean all values. Date end is exclusive.
6. Executive Overview and Analytical detail share the same selection and backend
   calculations. Choose a group to drill down; **Back one level** restores the prior
   selection/view. Detail shows original physical lines, import/RAW identifiers,
   source dimensions and frozen mapping revisions. Full totals include every page.
7. Missing reporting dates remain visible. No matching rows differ from no imports;
   records reporting zero remain real records. Unclassified and repeated source
   rows remain included unless explicitly filtered out. A changed dataset revision
   requires refreshing the selection rather than silently mixing pages.

Frequency means source-reported occurrences. Accumulated duration is summed exact
seconds, **not plant downtime**; overlapping alarms can exceed a day. Filename dates
are reporting labels, not event timestamps or proof of a complete reporting window.
The UI makes no claim about distinct physical incidents, rates or operational causes.

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

## Mapping your own source labels

Edit `.local-demo/mappings.json` while the host is stopped, then restart it. Keep
its organization/site/source IDs aligned with `.local-demo/scope.json`. Configure
sectors and exact source-area membership; change `mappingRevision` when editing.
Preserve sector-key meaning across revisions. Unknown source areas are retained as
unclassified. Changes affect future imports only: previous facts retain their frozen
classification and interpretation. A changed mapping is not permission to replace
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

- An inactive backend shows **Connect your analytical workspace**; use the demo
  launcher, not the independent health-only/container bootstrap.
- Access failure requires checking the selected seeded principal and current grants.
  Shared hosting, production mode, foreign origins and arbitrary scope are refused.
- An interrupted attempt can be reviewed and explicitly recovered from Import &
  history once processing has stopped. Recovery checks durable outcome and never
  silently resubmits the bytes.
- Storage is bounded to 1,000 retained attempts and 256 MiB original bytes across
  the dedicated database. Rejected inputs also consume retention. Use verified
  scoped reset when appropriate; do not bypass quotas or delete volumes.
