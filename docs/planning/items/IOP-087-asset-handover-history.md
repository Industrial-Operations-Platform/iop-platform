# IOP-087 — Handover history

## Status and authorization

Completed — local implementation under [IOP-194](IOP-194-maintenance-asset-history.md).
M10 — Asset History / Digital Asset Record. The owner's explicit 2026-10-05 request authorizes full implementation
and delegates design choices on an isolated review branch. This replaces the
initial proposed slice; M9 remains excluded.

## Goal and behavior

Expected outcome: Relevant notes are visible.

Exact scoped source aliases retrieve Handover-owned equipment-reference evidence with original authorship and navigation to the journal entry.

## Acceptance

- [x] Relevant notes are visible.
- [x] Planned scenarios, actual validation evidence and synchronized documentation
  are recorded in the [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md).

## Boundaries and dependencies

[IOP-084](IOP-084-asset-timeline.md), [IOP-063](IOP-063-handover-asset-link.md)

Dependency refinements and exclusions are recorded in the
[delivery scope](IOP-194-maintenance-asset-history.md). The
[product contract](../../product/maintenance-assets.md) owns behavior and permissions;
the [development guide](../../development/maintenance-assets.md) owns operation.
