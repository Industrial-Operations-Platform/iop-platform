# IOP-190 — Daily Handover views and focused table filters

Status: In progress

## Owner request

- Order Handover tabs: Meeting preparation, Journal, Department matrix, My entries;
  make meeting preparation the default destination. Preserve Team Leader's Daily
  overview label and site-wide daily scope.
- Journal and meeting content cover the selected calendar day. Show outstanding
  Problems and Performance separately by department until resolved. Other categories
  remain daily content and searchable history, without being silently closed.
- Department matrix filters all columns except What? and Details: occurrence date,
  external work reference, due date, responsibility and status/condition. Apply them
  server-side with full counts and stable pagination.
- Replace the exposed user-search field with a compact search icon that reveals a
  well-aligned search box beside the Users heading, with keyboard focus support.

## Boundaries and acceptance

Reuse existing application/query ports, scoped authorization and shared design.
Carry-forward category behavior belongs in scoped catalog configuration; Problems
and Performance are the current pilot defaults. No entry/state migration or automatic
closure is authorized. Test selected dates, outstanding category limits, pagination,
combined filters, empty results, navigation and keyboard/mobile search behavior.

The user-search refinement depends on the unmerged IOP-188 branch. Its integration
or use as a dependency requires the pending explicit branch decision; independent
Handover work may proceed from develop.

## Progress

The Handover navigation, daily views, department-status disclosure and matrix filters
are implemented and validated locally. API, real PostgreSQL and desktop/mobile
browser evidence is recorded in the execution plan. User-search placement remains
pending the IOP-188 dependency decision; this parent item stays In progress.

References: [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md),
[visual identity](../../design/visual-identity.md).
[Execution plan](../active/IOP-190-daily-handover-plan.md).
