# IOP-070 — Priority model

## Status and authorization

Completed — local implementation under [IOP-194](IOP-194-maintenance-asset-history.md).
M8 — Maintenance Management. The owner's explicit 2026-10-05 request authorizes full implementation
and delegates design choices on an isolated review branch. This replaces the
initial proposed slice; M9 remains excluded.

## Goal and behavior

Expected outcome: Configurable priority.

Administrators maintain named, ranked site priorities with versioned settings; retained record labels preserve history.

## Acceptance

- [x] Configurable priority.
- [x] Planned scenarios, actual validation evidence and synchronized documentation
  are recorded in the [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md).

## Boundaries and dependencies

[IOP-068](IOP-068-maintenance-record.md)

Dependency refinements and exclusions are recorded in the
[delivery scope](IOP-194-maintenance-asset-history.md). The
[product contract](../../product/maintenance-assets.md) owns behavior and permissions;
the [development guide](../../development/maintenance-assets.md) owns operation.
