# IOP-075 — Maintenance history

## Status and authorization

Completed — local implementation under [IOP-194](IOP-194-maintenance-asset-history.md).
M8 — Maintenance Management. The owner's explicit 2026-10-05 request authorizes full implementation
and delegates design choices on an isolated review branch. This replaces the
initial proposed slice; M9 remains excluded.

## Goal and behavior

Expected outcome: History visible from an asset.

Immutable attributed full revisions and work outcomes remain readable in Maintenance and the digital asset record.

## Acceptance

- [x] History visible from an asset.
- [x] Planned scenarios, actual validation evidence and synchronized documentation
  are recorded in the [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md).

## Boundaries and dependencies

[IOP-069](IOP-069-maintenance-status.md), [IOP-023](IOP-023-audit-infrastructure.md)

Dependency refinements and exclusions are recorded in the
[delivery scope](IOP-194-maintenance-asset-history.md). The
[product contract](../../product/maintenance-assets.md) owns behavior and permissions;
the [development guide](../../development/maintenance-assets.md) owns operation.
