# IOP-088 — Asset detail page

## Status and authorization

Completed — local implementation under [IOP-194](IOP-194-maintenance-asset-history.md).
M10 — Asset History / Digital Asset Record. The owner's explicit 2026-10-05 request authorizes full implementation
and delegates design choices on an isolated review branch. This replaces the
initial proposed slice; M9 remains excluded.

## Goal and behavior

Expected outcome: Single asset view.

A searchable registry and asset detail combine identity, location, validation/evidence, aliases and filtered historical sources; missing/unmapped/unauthorized coverage remains explicit.

## Acceptance

- [x] Single asset view.
- [x] Planned scenarios, actual validation evidence and synchronized documentation
  are recorded in the [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md).

## Boundaries and dependencies

[IOP-085](IOP-085-asset-event-history.md), [IOP-086](IOP-086-asset-maintenance-history.md), [IOP-087](IOP-087-asset-handover-history.md), [IOP-040](IOP-040-asset-search.md)

Dependency refinements and exclusions are recorded in the
[delivery scope](IOP-194-maintenance-asset-history.md). The
[product contract](../../product/maintenance-assets.md) owns behavior and permissions;
the [development guide](../../development/maintenance-assets.md) owns operation.
