# IOP-158 — Import administration workspace

Status: Completed

The owner requests an administrative Import & prepare workspace focused on CSV
upload, reporting-date confirmation, import counts, errors/duplicates, preparation
and KPI settings/goals, without repeating analytical visualizations.

## Acceptance

- [x] Enter administration directly into import tools; keep charts and report
  selectors in Taskforce view and avoid report requests while administering data.
- [x] Reuse shared identity/components and dedicated import, preparation and KPI
  settings sections, including configuration when no reporting history exists.
- [x] Show selected-file metadata/date confirmation, known duplicate-date warnings,
  authoritative import counts/outcomes and useful inspection diagnostics/history.
- [x] Preserve server validation, immutable originals, recovery and access checks.
- [x] Verify navigation, failed/duplicate imports and configuration isolation with
  component tests, build and read-only local Docker/browser checks.

Uses the existing IOP-154 administration boundary and Accepted ADR-0031/0032.
Independent of pending IOP-157 publication; its branch remains intact.
Plan: [execution](../completed/IOP-158-import-administration-plan.md).
