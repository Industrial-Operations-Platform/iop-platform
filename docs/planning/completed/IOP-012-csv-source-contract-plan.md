# IOP-012 — CSV source contract plan

Status: Completed (design only). Authorized by the owner's 2026-09-25 request to work on
[IOP-012](../items/IOP-012-source-integration-contract.md), limited to the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-012-csv-source-contract`, created from clean `develop` before edits.

## Changes and steps

1. Review AGENTS.md, workflow, architecture, relevant Accepted ADRs and direct
   dependencies IOP-003/004/008/014. All four are completed design on develop;
   none requires integration from another branch. Their English story files need
   no translation. Translate the entire IOP-012 story while refining its scope.
2. Inspect the owner-authorized external `Hitliste-20260701.csv` read-only and the
   supplied Python/DAX excerpts. Record format evidence without copying production
   rows, operational totals or customer mapping lists into Git. Distinguish observed
   syntax from supported contract restrictions and unresolved exporter semantics.
3. Add `docs/architecture/csv-source-contract-poc.md`: bounded source profile,
   aggregate grain, neutral fields, exact units, reporting date, scoped provenance,
   validation and sector mapping behavior. Follow existing module boundaries; no
   new architectural mechanism, runtime code, endpoints, schemas or parser library.
   If a new architectural pattern proves necessary, propose an ADR and pause only
   dependent work; do not accept ADR-0018 by inference.
4. Update discovery/evidence in `docs/product/csv-and-reporting-reference.md`,
   IOP-012 and its backlog row. Do not activate importer or analytics stories.

## Validation and evidence

Read-only format inspection, manual synthetic conversion/rejection walkthroughs,
relative Markdown links, story IDs/statuses, English prose and `git diff --check`.
No application tests or importer implementation in this design-only slice.
Confirm RAW reference input stays outside Git and no neighboring story changes.

Results on 2026-09-25:

- `file` identified UTF-16 LE/CRLF. Read-only Python standard-library decoding and
  CSV inspection found BOM `FF FE`, 120,432 bytes, 682 physical lines, seven columns,
  one header and 681 data rows. No blank lines, empty cells, outer whitespace,
  quoted data cells or repeated five-dimension tuples. Every frequency is digits;
  every duration matches `d h:mm:ss`, with days 0, hours 0–7 and minutes/seconds 0–59.
  Initial exploratory assumptions about whole-line quoting and dot-separated days
  were disproved by inspection and corrected; no file or parser was modified.
- The contract records explicit supported restrictions separately from observations.
  It preserves source-row grain, unknown reporting windows, scoped provenance,
  exact seconds, duplicate-date rejection and unclassified totals. Synthetic manual
  checks cover conversion (90 + 93,784 = 93,874 seconds), invalid input, quoted
  delimiters, unmapped areas, repeated tuples and concurrent date conflicts.
- This is not legacy helper/DAX parity or executable parser/concurrency evidence.
  Exact exporter grouping/window semantics and operational limits remain explicitly
  assigned to delivery; no adjacent implementation or pending ADR is accepted.
- All IOP-012 criteria are covered by the linked contract and scenarios. Only the
  five planned documentation files change, including this plan; direct dependencies
  remain unchanged. No reference rows, operational totals or mapping lists enter Git.
- Relative-link inspection passed: 179 local file targets across the five changed
  documents, none missing. Item/backlog/plan statuses and completed-plan location
  agree. `git diff --check` passed; manual review confirms new/revised prose is
  English and external vocabulary is preserved. No runtime tests were run because
  this increment changes documentation only.

## Closure

The item and backlog mark the bounded design Completed; this plan is archived here.
Commit after final link/status/whitespace review. Publication still requires explicit
approval under the workflow; no automatic merge or push.
