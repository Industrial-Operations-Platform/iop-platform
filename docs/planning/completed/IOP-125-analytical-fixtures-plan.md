# IOP-125 — Analytical fixtures

Status: Completed. Authorized by the owner's 2026-09-25 request for IOP-0125,
resolved to [IOP-125](../items/IOP-125-demo-events.md).
Branch: `feature/IOP-125-analytical-fixtures`, created from clean `develop`.

## Changes and steps

1. Deliver static synthetic CSVs under `fixtures/analytical-poc/`, with a README,
   explicit fictional scope/mapping and independently authored expected JSON.
   Follow the [CSV contract](../../architecture/csv-source-contract-poc.md) and
   [POC boundary](../../product/scope-poc.md). Cover two reporting dates with a gap,
   mapped/unclassified records, repeats, quoted text, exact seconds, invalid input
   and duplicate admission scenarios. No importer, runtime configuration or seeds.
2. IOP-012 is completed design on develop. IOP-123 remains Proposed: fixture scope
   is descriptive data only; seed integration is a later handoff. No unmerged
   branch is needed for standalone fixtures. IOP-103 validation awaits the importer;
   ADR-0018 remains Proposed and no runtime business access is exercised.
3. Translate all Spanish prose in the read IOP-125 and dependency IOP-123 stories;
   preserve IOP-123's meaning/status. Update only IOP-125 delivery status and backlog.
   Expected documentation files: those two items, backlog and this plan.

## Validation and evidence

Independently decode the committed CSV bytes with Python's standard library:
verify BOM/encoding, line provenance, cells, frequency/duration conversions, mapping,
per-row outputs and literal overall/date/sector/filter totals against expected JSON.
Check each intentionally invalid fixture against its stated violated rule, and byte
identity for duplicate content. These are fixture checks, not importer tests.
Review duplicate/retry and missing-date scenarios against the source contract.
Check changed Markdown links, status consistency and `git diff --check`.
No API code changes or runtime security claims; API tests are not applicable.

## Closure

Record actual results and any remaining integration limitations. Move this plan to
completed after static fixture delivery; keep IOP-123 and runtime handoff stories
open. Commit only the authorized changes and request publication approval.

## Recorded evidence — 2026-09-25

- Executed an independent inline `python3` check using `csv`, strict UTF-16 LE
  decoding, `datetime`, `re` and JSON comparisons. All nine normalized rows,
  physical line numbers, both date totals, three sector totals, two combined-filter
  checks, repeated-tuple membership and blank/unclassified counts matched the
  literal oracle. Total: frequency 19 and accumulated alarm duration 97,775 seconds.
- All ten invalid files were checked for their intended violated rule, including
  the bad record between valid rows. Duplicate-date changed bytes and byte-identical
  content under a new reporting label were confirmed. Admission behavior is a
  documented expectation, not executed importer evidence.
- Corpus: 14 CSV files, 5,670 bytes; the two valid baseline files total 1,232 bytes.
  No performance claim is made from this small corpus.
- `git diff --check` and local Markdown target checks passed. IOP-125/backlog agree;
  IOP-123 remains Proposed, with translation-only changes. No new ADR or dependency
  implementation was needed. API tests were not run because no API/code changed.
- Static fixture criteria are complete. Seed integration remains with IOP-123 and
  executable admission/reconciliation with IOP-103 after importer delivery. The
  fixture README records those boundaries and deterministic review scenarios.
