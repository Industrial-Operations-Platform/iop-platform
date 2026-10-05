# IOP-086 — Maintenance history

## Status and authorization

Completed — local implementation under [IOP-194](IOP-194-maintenance-asset-history.md).
M10 — Asset History / Digital Asset Record. The owner's explicit 2026-10-05 request authorizes full implementation
and delegates design choices on an isolated review branch. This replaces the
initial proposed slice; M9 remains excluded.

## Goal and behavior

Expected outcome: Repairs and maintenance are visible.

The digital record includes Maintenance-owned technical work revisions/outcomes with navigation to original work records.

## Acceptance

- [x] Repairs and maintenance are visible.
- [x] Planned scenarios, actual validation evidence and synchronized documentation
  are recorded in the [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md).

## Boundaries and dependencies

[IOP-084](IOP-084-asset-timeline.md), [IOP-075](IOP-075-maintenance-history.md)

Dependency refinements and exclusions are recorded in the
[delivery scope](IOP-194-maintenance-asset-history.md). The
[product contract](../../product/maintenance-assets.md) owns behavior and permissions;
the [development guide](../../development/maintenance-assets.md) owns operation.
