# IOP-156 — Source-file filters and aligned headers

Status: Completed

The owner requests horizontally aligned labels in Files & source rows and manual
column filters above the table, reusing Taskforce filter components and identity.

## Acceptance

- [x] Align sortable and plain table headings while retaining accessible sort buttons.
- [x] Provide collapsible per-column value filters above the file table, reusing
  Taskforce controls, suggestions, apply and clear behavior.
- [x] Filter the entire selected file on the server before sorting and pagination.
  Combine exact column criteria with AND; blank values remove criteria. Include
  line, all six descriptive columns, frequency and duration in displayed minutes
  (rounded to two decimals). Preserve text punctuation and leading zeroes.
- [x] Keep filters through sorting/pagination, reset page on apply/clear and reset
  file-specific filters on file changes. Show matching/total counts and empty results.
- [x] Preserve permissions, scoped suggestions, complete projection checks, Sunday
  file browsing and source evidence. Verify API, UI and real database behavior.

Boundaries: Accepted ADR-0031/0032/0033. Dependency: [IOP-155](IOP-155-analysis-calendar.md).
Plan: [execution](../completed/IOP-156-source-file-filters-plan.md).
