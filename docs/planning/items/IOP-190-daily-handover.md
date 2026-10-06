# IOP-190 — Daily Handover views and focused table filters

Status: Completed

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

The user-search refinement depends on IOP-188. On 2026-10-01 the owner explicitly
approved continuing IOP-190 on that branch. On 2026-10-02 the owner approved its
develop integration and origin publication; operator activation remains separate.

## Outcome

The Handover navigation, daily views, department-status disclosure and matrix filters
are implemented and validated locally. API, real PostgreSQL and desktop/mobile
browser evidence is recorded in the execution plan. User search is a compact icon
beside Users that reveals/focuses its input; closing or Escape clears the query,
restores focus and preserves sorting. The authorized IOP-188 dependency and combined
behavior are validated. Both stories are integrated into develop and published to
origin through IOP-190; operator activation remains pending.

References: [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md),
[visual identity](../../design/visual-identity.md).
[Execution plan](../completed/IOP-190-daily-handover-plan.md).
[Publication evidence](../completed/IOP-190-publication-plan.md).

## Current delivery — 2026-10-06

Earlier activation/publication notes above describe the original increment. This
implementation is present in the current develop baseline; the later
[IOP-194 validation](../completed/IOP-194-equipment-catalog-refinement-plan.md) and
[publication](../completed/IOP-194-publication-integration-plan.md) record the
integrated local application and preserved data. No new activation or publication
is performed by the IOP-195 documentation audit.
