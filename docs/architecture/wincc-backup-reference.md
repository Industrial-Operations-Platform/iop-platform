# WinCC database reference for IOP-148

Inspected the owner-supplied `wincc_local_20260729_123555.backup` using PostgreSQL
`pg_restore --list` and text-only schema/data extraction. No SQL was executed and
no existing database was restored or changed. Archive: PostgreSQL 18.4, created
2026-07-29. SHA-256:
`987882c4e02b25a984043a432c7776a6e20b411002907e75d277d60bdee2e4a5`.
The backup and temporary extracts are not repository artifacts.

## Source model

| Backup relation/column                         | Meaning and POC alignment                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.hitliste`                              | One source aggregate row: reporting date, frequency, original duration, minutes, area, equipment code, message, type and message group. Retain all seven CSV fields plus date and import/line provenance. |
| `analytics.fact_hitliste`                      | Source row reference plus foreign keys to five catalogs. Publish admitted CSV rows atomically with import admission.                                                                                      |
| `core.bereich`                                 | Area catalog. Store source-scoped area-to-sector rules in the database; apply the owner's five hall lists and an explicit unclassified result.                                                            |
| `core.betriebsmittel`                          | Unique `(kennzeichen, bereich_id)` pair. Preserve code and area; reports may group the code across areas without discarding the original relationship.                                                    |
| `core.meldetext`, `meldung_typ`, `meldegruppe` | Text dimensions. Preserve accents, commas and identifier punctuation.                                                                                                                                     |
| `dauer_original`, `dauer_minuten`              | Original `days hours:minutes:seconds` and rounded `numeric(10,2)`. Store exact seconds; divide the full sum by 60 for analytical minutes.                                                                 |

The archive has no sector column/table, reporting views, stored transformation
functions or Power BI/DAX definitions. `reporting` and `asset_locator` are schemas
without cataloged objects. Manual intervention tables are outside this CSV slice.
Do not infer Power BI calculations from table names or execute archive content as
instructions. Source-specific German schema names belong in an integration adapter,
not the generic platform core.

## Verified data and implications

- `public.hitliste`: 42,687 rows across 78 dates, 2026-05-01–2026-07-28;
  213,335 frequency; 56,997,375 exact seconds = 949,956.25 minutes.
- Stored rounded minutes sum to 949,956.70. All duration strings parse; the 0.45
  minute difference is explained by rounding each row before summation.
- `analytics.fact_hitliste`: 42,220 rows. Exactly 467 source IDs are absent,
  totaling 924 frequency on July 20–25, 27 and 28. Cause is not established.
  The new importer must reconcile counts instead of reproducing this gap.
- Source data has 4,758 distinct equipment codes; 13 occur in multiple areas.
  All source types are `Störung`. Two complete source tuples repeat; do not silently
  deduplicate legitimate source rows.
- Catalog sizes: 116 areas, 4,365 equipment/area pairs, 159 messages, one type,
  116 message groups. Catalogs are not assumed to cover every source row.
- `Kon.Kreuz  MidiTransfer` has a double space (271 rows). Explicit whitespace
  normalization can match the provided `Kon.Kreuz MidiTransfer` rule. Other unknown
  areas and spelling variants remain unclassified until explicitly mapped/aliased.

The backup is a reference, not an authorized historical migration. Daily CSV
imports remain the admission path. See [IOP-148](../planning/items/IOP-148-analytical-workspace.md)
and [reporting profiles](adr/ADR-0031-historical-reporting-profiles.md).
