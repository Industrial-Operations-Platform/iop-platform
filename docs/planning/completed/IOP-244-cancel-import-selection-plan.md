# IOP-244 — Cancel CSV selection plan

Status: Completed locally on 2026-11-23. Authorized by the owner's request to cancel a
mistakenly selected or renamed CSV before importing it.
Branch: `fix/IOP-244-cancel-import-selection`, from clean develop `0177fc4`.
[Scope](../items/IOP-244-cancel-import-selection.md).

## Changes and validation

1. Record the request/item/backlog, then add a secondary Cancel action beside
   Import CSV using shared Actions/Button. Clear the selected file and native file
   input, date confirmation, replacement prompt and form error. Preserve retained
   import review/history. Disable cancellation while processing; it is not a server
   rollback or interruption action. No API, persistence or boundary changes.
2. Add the English accessible label/German translation and verify the empty form,
   duplicate/invalid selections, reselection and pending-state behavior using the
   existing import component suite. Extend the existing replacement browser cases
   with pre-upload cancellation and native-input reset; inspect desktop/mobile and
   German/dark screenshots.
3. Run the affected web tests, localization/architecture/design guards, web build
   and relevant Playwright scenarios. Check documentation links/IDs/statuses and
   whitespace. Archive the finished plan, update item/backlog and commit locally.

Expected files: ImportWorkspace.tsx, German dictionary, existing import component
and replacement Playwright tests, this plan/item and backlog. Reuses ADR-0032 and
IOP-166/243 behavior; no new architecture decision or story translation is needed.
No unrelated work, publication, deployment or live-data mutation is included.

## Evidence and closure

Implemented Cancel / Abbrechen beside Import CSV with the shared action layout.
One reset function clears the selection, native input, confirmation and form error;
successful imports reuse it while preserving retained review/history. The button
is absent without a file and disabled during processing. Its accessible label is
localized as Cancel file selection / Dateiauswahl abbrechen.

- Import administration and localization suites passed all 12 cases, including
  cancellation of duplicate/invalid selections, preserved review, native-input
  reset, same-file reselection and clearing an interrupted-upload form error.
- Web build passed TypeScript, the four design guard cases and Vite compilation.
  The existing bundle-size advisory remains; no bundle changes were attempted.
- The shared API/web architecture suite passed all 26 cases. API/persistence code
  did not change, so database and full API tests were not repeated.
- Three extended Playwright scenarios passed in 10.7 seconds: 1440 px English,
  375 px English and 375 px German/dark. They verify no upload on Cancel, empty
  native input, fresh confirmation on reselection, disabled cancellation during
  upload and the unchanged exact-prior-ID replacement path. Inspected the generated
  IOP-244 selection screenshots; actions fit desktop/mobile without overflow.
  Browser data was synthetic and intercepted; no live business request was made.
- `git diff --check` passed. Final closure checks validate local documentation
  links, item/backlog completion and archived plan before the local commit.

Item/backlog completed locally and plan archived. No merge, push or deployment
performed; publication of this story and develop to origin needs separate approval.
