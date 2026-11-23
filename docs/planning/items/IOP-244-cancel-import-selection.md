# IOP-244 — Cancel a selected CSV before importing

Status: Completed locally; publication pending.

The owner requests a visible cancel option when a wrong file or a file with an
incorrect reporting-date name has been selected. The existing IOP-243 cancellation
only closes its replacement dialog; the main upload form still retains the file.

## Scope and acceptance

- [x] Show a secondary Cancel action next to Import CSV whenever a file is selected,
  including invalid filenames and duplicate reporting dates.
- [x] Cancel clears the native file input, selected-file/date confirmation and
  form-specific warnings/errors without submitting, replacing or deleting data.
  Existing retained import review/history remains available.
- [x] Selecting the same or a different file afterwards requires fresh confirmation.
  Disable cancellation while an upload/review operation is processing.
- [x] Reuse shared controls/identity, provide English/German presentation and verify
  component behavior plus desktop/mobile rendering and existing replacement flow.

This is a React presentation change under Accepted ADR-0032, following
[IOP-166](IOP-166-import-form-reset.md) and [IOP-243](IOP-243-import-day-removal.md).
It does not cancel a server-side operation or undo a completed import.
[Execution evidence](../completed/IOP-244-cancel-import-selection-plan.md).
