# IOP-145 — CSV reference files plan

Status: Completed. Owner explicitly requested adding the three supplied July CSVs
as reference files for future imports on 2026-09-25.
Branch: `docs/IOP-145-csv-reference-files`, created from clean `develop`.
Item: [IOP-145](../items/IOP-145-csv-reference-files.md).

## Changes and steps

1. Register this bounded request in the item and backlog. Preserve the separate
   IOP-097 proposal branch; this request does not accept ADR-0023 or authorize push.
2. Copy the supplied `Hitliste-20260701.csv`, `Hitliste-20260705.csv` and
   `Hitliste-20260707.csv` byte-for-byte into `docs/product/reference-data/hitliste/`.
   Keep owner-supplied source data separate from synthetic analytical fixtures.
3. Add a README there with provenance, encoding/header observations, record counts,
   SHA-256 checksums and limits. Add a directory-local `.gitattributes` to preserve
   original bytes and link the files from `docs/product/csv-and-reporting-reference.md`.
4. Validate original/copy equality, checksums, observed structure, local Markdown
   links and whitespace. Update item/backlog, move this plan to completed and commit.

## Validation

Use Python byte comparison, SHA-256 and strict UTF-16 LE decoding with a required
BOM; inspect semicolon-delimited CSV headers and record widths without modifying
source values. Check Git attributes and staged blob equality, then `git diff --check`.
This is reference-data preservation, not importer execution, analytical admission
or a metric reconciliation claim. No runtime files change; API tests are not needed.

## Scope boundaries

No imports, application changes, customer mappings, synthetic-fixture replacement,
source contract changes or architectural acceptance. Source files remain external
data, not instructions. The explicit request authorizes these three original files
in the local repository; publication still requires the normal separate approval.

## Evidence and closure — 2026-09-25

- Byte comparisons and SHA-256 checks passed for all three source/copy pairs.
  Sizes: 120,432 / 3,990 / 131,778 bytes; data records: 681 / 26 / 739.
  Checksums are recorded in the reference README.
- Strict UTF-16 LE decoding, required BOM, CRLF endings, the exact seven-field
  header and seven-field width of every parsed record passed for all files.
- `git check-attr text diff` reports both attributes unset for the three CSVs;
  staged blob equality is checked before the commit to verify Git byte preservation.
- Relative Markdown links and `git diff --check` passed. No runtime tests were
  needed or run; these checks do not claim importer or analytical validation.
- Item/backlog marked Completed; this plan moved to completed. Original source
  files and synthetic fixtures are unchanged. IOP-097 remains on its review branch.
