# IOP-073 — Maintenance Board

## Status and authorization

Completed — local implementation under [IOP-194](IOP-194-maintenance-asset-history.md).
M8 — Maintenance Management. The owner's explicit 2026-10-05 request authorizes full implementation
and delegates design choices on an isolated review branch. This replaces the
initial proposed slice; M9 remains excluded.

## Goal and behavior

Expected outcome: Board by site/hall/area.

A status board and list use the configured location tree rather than hard-coded physical levels; full filtered counts accompany bounded pages.

## Acceptance

- [x] Board by site/hall/area.
- [x] Planned scenarios, actual validation evidence and synchronized documentation
  are recorded in the [execution plan](../completed/IOP-194-maintenance-asset-history-plan.md).

## Boundaries and dependencies

[IOP-069](IOP-069-maintenance-status.md), [IOP-070](IOP-070-maintenance-priority.md), [IOP-071](IOP-071-maintenance-ownership.md), [IOP-072](IOP-072-maintenance-asset-link.md)

Dependency refinements and exclusions are recorded in the
[delivery scope](IOP-194-maintenance-asset-history.md). The
[product contract](../../product/maintenance-assets.md) owns behavior and permissions;
the [development guide](../../development/maintenance-assets.md) owns operation.
