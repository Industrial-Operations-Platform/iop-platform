# IOP-218 — Team Leader distribution and absence demonstrations

## Status and goal

Completed. On 2026-10-20 the owner requested each Team Leader's own workers and
their shift/zone distribution, with vacation, sickness and other availability
examples in the current weekly demonstration. The owner explicitly approved a
dependent branch from [IOP-217](IOP-217-admin-configuration-demos.md), preserving
its configuration restrictions and installed demonstration without merging or
publishing either branch.

## Scope and acceptance

- [x] Each Team Leader can inspect their primary groups and every active member's
  dated availability, shift and zone, even without their own selected-day duty.
- [x] Working, unassigned, absent and unknown days stay distinct; broader authorized
  planning access remains available. Configuration remains Administrator-only.
- [x] Add documented synthetic vacation, sick leave and other statuses through
  existing Workforce operations, preserving unrelated records, user changes and
  existing formal transfers. Verify safe repeated application and leader coverage.
- [x] Validate desktop/narrow views, planning regressions and actual local data;
  record evidence and commit validated changes.

Reuse Accepted ADR-0032 and the existing [Workforce contract](../../product/workforce.md).
Primary teams organize visibility without changing site authorization. Customer
roster and synthetic absence examples stay in scoped local tooling/configuration.
No new API/schema, account creation, medical fact, merge or publication is implied.

## Evidence

[Execution evidence](../completed/IOP-218-team-availability-plan.md).
The local My team view is active. Four primary groups with five workers each have
vacation/sickness examples and additional training/compensation/accident/maintenance
states. Repeated commands preserve the examples, prior formal records and unrelated
data. Local commits are ready for review; publication requires owner approval.
