# IOP-132 — Final POC reconciliation preparation

Status: Completed (preparation only), 2026-09-26. Authorized by the owner's request to work on
[IOP-132](../items/IOP-132-final-reconciliation.md), within the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-132-final-reconciliation`, created from clean `develop` before edits.

## Scope and dependencies

Prepare the source-to-both-views acceptance procedure using existing independent
fixture expectations and accepted query/filter/metric contracts. IOP-048 supplies
internal verification only; IOP-096 supplies a separate fictional preview; IOP-129
has no delivered demonstration. Production OIP facts, importer/host composition,
executable IOP-089 queries and connected views remain missing. ADR-0018 is Accepted;
its implementation/validation, not another architecture approval, gates access.
Do not implement prerequisites or claim runtime reconciliation from fixture checks.

## Changes and steps

1. Translate the entire IOP-132 item and read dependency IOP-129 into English,
   preserving meaning, IDs and links. Keep IOP-129 translation-only (including its
   historical pending-ADR wording); record the current decision here and in IOP-132.
   IOP-048/096 are already English and need no edits.
2. Add `docs/development/reconciliation-poc.md`: expected comparisons, exact source
   provenance, rejection/unclassified accounting, identical selection/revision,
   pagination, coverage, mismatch handling and required delivered-path evidence.
   Link existing numerical matrices instead of copying all metric specifications.
3. Update IOP-132 status/blockers and link the procedure; mirror its status in
   `docs/planning/backlog.md` and add a short handoff in `docs/planning/poc-delivery.md`.
   No code, schema, API, UI, fixture or architectural changes.

## Validation and closure

Check edited Markdown links, IDs/statuses and `git diff --check`. Independently
read the two UTF-16 CSVs with Python's standard CSV reader and integer duration
arithmetic; compare physical-line measures and date/sector/filter totals with the
unchanged literal oracle. This checks procedure expectations only, not the app.
No API tests are needed for this documentation-only increment. Record actual
results, move this finished preparation plan to `completed/`, and leave IOP-132
Blocked until both delivered views reconcile. Commit the validated increment;
publication requires separate owner approval under ADR-0008.

## Executed evidence and remaining boundary

- Independent Python standard-library CSV inspection passed for both original
  UTF-16 inputs. Physical-line identities, normalized dimensions/measures, per-date,
  sector and literal filter checks agree with the unchanged oracle: nine records,
  19 reported occurrences and 97,775 accumulated seconds. Also verified message
  exclusion (6 / 10 / 97,475), matching zero, incompatible filters, missing July 2
  and the isolated relabeled-file expectation (15 / 31 / 191,830); its original
  bytes match July 1. No application code or reducer supplied expected values.
- Edited local Markdown link targets, item/backlog status agreement and
  `git diff --check` passed. IOP-129 remains Proposed with translation-only changes;
  IOP-048/096 and all fixture files remain unchanged.
- No application tests were run for this documentation-only increment. No runtime
  import, persisted query, browser comparison, rejection or security result is
  claimed. Those checks require the missing delivery described above.

The preparation increment is complete and this record moves to `completed/`.
All final runtime acceptance boxes remain open and IOP-132 is Blocked. No new
architectural decision or adjacent implementation was introduced. The working
branch is retained for owner review; publication is not authorized yet.
