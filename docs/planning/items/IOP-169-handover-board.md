# IOP-169 — Handover board and guided follow-up

Status: Completed. Owner requested this refinement on 2026-09-29.

## Scope and acceptance

Refine the delivered [IOP-168](IOP-168-shift-handover.md) workflows:

- Category board with recent department history and a small add button per section;
  a shared accessible dialog opens a short form with today's site-local date.
- Compact department selection; search opens intentionally and stays closed during
  creation. Harmonize journal, department matrix and meeting preparation; add My entries.
- Enforce today's date for contributor creation at the server. Coordinators retain
  date selection. Existing historical records and revisions remain readable.
- Select equipment from imported codes filtered by department/area. The owner
  explicitly chose existing imports as the source. These remain unverified external
  references, not canonical assets; no analytical IDs become handover identities.
- Entry details prioritize current information and history. Follow-up opens on demand
  and can include a state change and outcome atomically, preserving the original.
  Make closing and reopening an issue discoverable under existing permissions.
- Start prioritizes pending department issues, overdue/blocked reports and selected
  highlights, with compact metrics instead of a raw analytical table.

Reuse shared components and accepted hexagonal boundaries. No M6 assignment engine,
asset lifecycle, login changes or external integration. Publication and Docker
refresh require a separate approval for this increment.

## Decisions and evidence

[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md) owns durable references,
permissions and history; the owner explicitly selected imported equipment suggestions
for this increment. The adapter is composed by the host through a handover-owned
lookup port, with analytical reads remaining in their owning module.
[Execution plan](../completed/IOP-169-handover-board-plan.md).

The refinement is implemented, validated, integrated into develop and published to
origin. The local Docker stack runs the integrated IOP-169/170/171 delivery.
See the [activation and publication record](../completed/IOP-171-integrated-publication-plan.md)
for combined validation and preserved-data checks.

## Meeting canvas refinement

The owner additionally requested six persistent category sections with title/department
cards. Team Leader uses Daily overview: all authors and departments on the selected
day, default today. Preparation retains earlier open work separately.
[Refinement plan](../completed/IOP-169-meeting-canvas-plan.md).
