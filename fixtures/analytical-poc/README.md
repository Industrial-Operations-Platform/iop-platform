# Synthetic analytical POC fixtures

Static, entirely fictional data for [IOP-125](../../docs/planning/items/IOP-125-demo-events.md),
following the [source contract](../../docs/architecture/csv-source-contract-poc.md).
These are reviewable inputs and a literal expected-results oracle, not an importer.
IOP-123 adds explicit organization/site seed inputs and matching reference
configuration below. No production data is included.

## Use and scope

Use `scope.json` as the explicit fictional organization/site/source and mapping
context for importer tests. The IOP-123 instructions below persist its organization
and site through the existing IOP-025/026 commands. Configure the supported source
separately during importer delivery: a source reference is not a persisted source.
No implicit site selection, principal, grants or runtime access is supplied here.
ADR-0018 is Accepted; host implementation remains pending. IOP-103 must validate
these CSVs through the real importer when available; fixtures do not prove that path.

## Load the fictional organization and site (IOP-123)

[`seed.env.example`](seed.env.example) contains only configurable fictional labels,
stable IDs and an explicit zone, matching [`scope.json`](scope.json):
`fixture-org-001` / Example Operations, `fixture-site-001` / Example Works,
`Europe/Zurich`. Select IDs once; display names never determine identity or access.
[`poc.example.json`](poc.example.json) uses the supported reference-only format.
Copy it to `config/poc.local.json` only for this demo, preserving any existing local
configuration first. Keep all organization/site/source references aligned. Names
belong in seed inputs, not new fields in the strict reference configuration.

Prepare the dedicated local database using the [database guide](../../infra/database/README.md)
(provision, then migrate). Keep credentials in the private `.env`, never in fixtures.
From the repository root, use the existing opt-in Compose services:

```sh
docker compose --env-file .env --env-file fixtures/analytical-poc/seed.env.example -f compose.yaml -f compose.database.yaml build database-seed-organization database-seed-site
docker compose --env-file .env --env-file fixtures/analytical-poc/seed.env.example -f compose.yaml -f compose.database.yaml run --rm database-seed-organization
docker compose --env-file .env --env-file fixtures/analytical-poc/seed.env.example -f compose.yaml -f compose.database.yaml run --rm database-seed-site
```

Alternatively, for a native local database, put the explicit native connection
fields and migrator password documented in that guide in private `.env`, then:

```sh
npm run db:build
node --env-file=.env --env-file=fixtures/analytical-poc/seed.env.example infra/database/dist/cli.js seed-organization
node --env-file=.env --env-file=fixtures/analytical-poc/seed.env.example infra/database/dist/cli.js seed-site
```

Both tools give exported shell variables precedence over environment files: remove
stale `IOP_SEED_*` overrides before loading this exact fixture. For customized labels,
use a private environment file instead of editing committed fixtures; keep the
reference JSON and scope/mapping inputs consistent if IDs or zone change.

On an empty migrated database, each command reports `created`; exact repeats report
`unchanged`. Stop if either command fails. A conflicting name, owner or zone fails
without overwriting stored data. These are two independent transactions: if the
site step fails, the organization can remain. Correct the inputs and rerun both;
the matching organization is unchanged. Do not delete records to resolve conflicts.
These commands neither reset data nor run automatically at application startup.
IOP-128 owns the later safe demo reset.

Only the fictional organization and site are seeded. No source rows, imported CSVs,
physical assets, principal, membership or grants are created. RLS and the separate
migrator credential follow Accepted ADR-0020/0021; configuration is not authorization.
Existing principal/grant tooling remains separately explicit; ADR-0018's unfinished
host adapter still gates runtime business access. This is a local installation
fixture, not shared-use access control or an end-to-end analytical demonstration.

`npm run test:database` loads these exact files through the CLI on disposable
PostgreSQL, checks stored scope/config agreement, repeat/conflict behavior and
runtime denial. It never seeds or resets the operator's database.

Upload each CSV using its basename, not its containing scenario directory.
The supported files use UTF-16 LE with BOM, semicolons and CRLF. The deliberately
wrong-encoding file is UTF-8 without BOM. Do not resave CSVs in a spreadsheet:
that may change encoding, quoting and equipment references beginning with `=`.
All seven source header names remain verbatim external fields.

## Known results

Import only `valid/Hitliste-20260701.csv` and `valid/Hitliste-20260703.csv` for the
baseline below. The first has a whitespace-only physical line 4 and six records;
the second has three records. `expected.json` records literal, independently
authored normalized rows, date/sector totals, filter checks and rejection outcomes.
Each row array is ordered as:

`[sourceRecordNumber, reportedFrequency, accumulatedAlarmSeconds, sourceArea,
sourceEquipmentReference, sourceMessageText, sourceMessageType, sourceMessageGroup,
sectorKey]`.

A null sector means `unclassified`; otherwise classification is `mapped`. Repeated
tuple groups list every member, rather than choosing an ambiguous duplicate count.
Physical line numbers include the header and ignored blank lines.

| Selection | Records | Reported frequency | Accumulated alarm seconds |
| --- | ---: | ---: | ---: |
| 2026-07-01 | 6 | 12 | 94055 |
| 2026-07-03 | 3 | 7 | 3720 |
| Both dates | 9 | 19 | 97775 |
| Preparation (`alpha`) | 4 | 9 | 300 |
| Dispatch (`beta`) | 2 | 5 | 97384 |
| Unclassified | 3 | 5 | 91 |

Independent arithmetic: the first file's durations are
`90 + 93784 + 0 + 30 + 90 + 61 = 94055`; the second is `120 + 3600 + 0 = 3720`.
The day-bearing duration is `86400 + 7200 + 180 + 4 = 93784` seconds.
The baseline has 19 reported occurrences, not nine events. Do not multiply seconds
by frequency. Overview and detail must reconcile to the same contributing lines.
The two literal filter checks combine area/equipment/message and all five filters.

`Area A` maps after ASCII outer trimming; lowercase `area a` and `Area X` remain
unclassified. Nonempty unknown type `X` is valid. Leading zeros in equipment/type/
group remain text; frequency `001` normalizes to 1. Quoted semicolons and escaped
quotes are part of a single message. Identical records at lines 2 and 7 on July 1
both contribute. Zero measures are valid.

Every reporting window remains unknown. July 2 is missing coverage, not a zero
period. Site time zone is not proof of source-window bounds. No occurrence times,
individual events, physical assets, downtime, availability or 24-hour coverage
are inferred, even when accumulated duration exceeds one day.

## Admission scenarios for later IOP-103 validation

1. Import both valid files into the explicit scope: match the baseline oracle.
2. Re-upload July 1: reject the scoped reporting-date conflict; baseline unchanged.
   Upload `duplicate-changed/Hitliste-20260701.csv` after that success: also reject,
   despite changed bytes (its standalone measures would be 99 and 60 seconds).
3. `renamed-content/Hitliste-20260704.csv` is byte-identical to July 1 but has a new
   valid reporting label. The contract does not prohibit it solely by checksum:
   in a separate scenario it adds six records, 12 and 94055, giving 15 records,
   31 and 191830 overall. This exposes the unverified-date limitation; do not include
   it in the baseline. An arbitrary renamed basename outside the exact filename
   profile is rejected. A second admission of any successful scoped date conflicts.
4. Each `invalid/` file rejects the entire analytical admission, yielding zero
   admitted records and no new coverage. The value/shape files deliberately place
   the bad record between two valid records. Diagnostic reason labels in
   `expected.json` describe fixtures, not a new API error-code catalog. Null line
   numbers mean no specific row assertion. Do not assume all rows were inspected
   after a structural or decoding failure.
5. An invalid July 2 attempt must not reserve that date: subsequently upload a
   copy of a valid fixture with basename `Hitliste-20260702.csv` in an isolated
   scenario and expect admission if the date remains unused. This relabeling is
   synthetic test setup, not evidence of real source coverage.

Missing/foreign scope, concurrency, configured budgets, RAW durability and safe
reset still require real importer/storage/security tests in their owning stories.
This bounded corpus is not an exhaustive parser conformance or performance suite.
It supplies no reset operation and does not change any runtime behavior.
