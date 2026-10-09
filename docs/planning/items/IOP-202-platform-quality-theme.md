# IOP-202 — Platform quality review and selectable appearance

## Status and goal

Completed. Owner request of 2026-10-09: review the code and completed work from
`develop`, improve code quality and visual consistency across the platform, retain
hexagonal boundaries and reusable components, and add user-selectable dark mode
beside language/profile/sign-out controls. Keep the result on a separate branch.

## Scope and acceptance

- [x] Audit API, browser, database/tooling and completed-story traceability using
  executable checks and targeted source review; record evidence and remaining limits.
- [x] Centralize light/dark semantic palettes and offer Light, Dark and System in
  the account dropdown, with persistent browser preference and accessible labels.
- [x] Apply appearance consistently to every workspace, controls, dialogs, tables,
  badges and analytical charts; retain the approved public introduction artwork.
- [x] Improve shared spacing, interaction feedback and purposeful text alignment;
  preserve readable prose, centered totals/metadata and responsive layouts.
- [x] Refactor concrete duplication/quality defects found in scope while preserving
  module ownership, authorization, source semantics and current workflows.
- [x] Synchronize affected guides/design/component contracts and completed-work
  evidence; validate types, architecture, design, API/browser/database behavior and
  actual desktop/mobile rendering, then commit locally on the retained branch.

Existing [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and [visual identity](../../design/visual-identity.md) govern implementation. Theme
is browser presentation, not business policy or a new backend preference service.
This request does not accept Proposed ADRs or close pending product/release work.
No merge, push, deployment, destructive cleanup or dependency upgrade is authorized.

## Evidence and remaining work

[Execution plan](../completed/IOP-202-platform-quality-theme-plan.md).
