# IOP-233 — Multi-person schedule preview and workload comparison

## Status and goal

Completed implementation. Owner request of 2026-11-12: extend shift entry with a preview in
which several people can be configured and their Saturday, Sunday, early and late
shift loads inspected before saving.

## Scope and acceptance

- [x] Preserve unsaved weekly edits while switching people; show the proposed
  multi-person schedule without changing persisted schedules or assignments.
- [x] Compare saved and proposed scheduled days, hours, Saturdays, Sundays and
  each configured shift per person for an explicit bounded analysis period.
  Show missing schedules separately from explicit absence; plans are not attendance.
- [x] Require an explicit save after preview. Validate and commit the complete
  proposal atomically with current planner authority and expected revisions;
  preserve edits on failure and invalidate preview after edits.
- [x] Retain configured customer labels, existing assignment protections, scoped
  authorization, revision history and English/German presentation.
- [x] Validate application, transport and UI behavior; synchronize guides and
  commit the completed increment on its story branch.

Reuse [IOP-184](IOP-184-m6-workforce.md), [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and existing Workforce transactions. No migration, persistent draft, automatic
optimization, payroll, deployment or publication is included.

## Evidence

[Execution evidence](../completed/IOP-233-schedule-preview-plan.md).
Focused API/UI checks, typecheck, build and two responsive browser scenarios pass.
The full web suite retains one failure reproduced on clean develop; PostgreSQL
integration execution remains unavailable without a container runtime. No live
activation, merge, push or deployment has been performed.
