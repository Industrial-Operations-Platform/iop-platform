# IOP-166 — Reset the file selection after successful import

Status: Completed

The owner reported that a successful CSV import leaves the uploaded file selected.
Refreshing history then presents that same import as a duplicate-date error.

## Acceptance

- [x] Clear the native file input, selected-file metadata and date confirmation
  after a confirmed successful upload; keep its review and refreshed history visible.
- [x] Do not show a duplicate warning for the just-completed upload unless the
  user selects that file again. Continue blocking genuinely duplicate selections.
- [x] Preserve the selected file and diagnostics for rejected, failed or uncertain
  outcomes and transport errors.
- [x] Verify the success/history-refresh regression and unsuccessful outcomes.

Follow-up to [IOP-158](IOP-158-import-administration.md), within the existing React
presentation boundary under [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No API or persistence changes.

Plan: [execution](../completed/IOP-166-import-form-reset-plan.md).
