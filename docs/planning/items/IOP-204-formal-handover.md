# IOP-204 — Formal shift Handover completion

## Status and goal

In progress under the owner's [IOP-203](IOP-203-platform-completion.md) authorization.
Deliver IOP-060/063/066/067 using existing Workforce, Assets and Handover boundaries.

## Scope and acceptance

- [ ] Bounded Workforce-owned shift context and durable Handover record snapshots.
- [ ] Open/closed record lifecycle, attributed acknowledgement, preserved issues,
  optimistic conflicts and immutable history.
- [ ] Previous-shift context and explicit canonical asset links without changing
  historical unverified equipment evidence.
- [ ] Advanced records for Administrator/Team Leader/Task Force; preserve existing
  Technician journal permissions. Verify real storage and role denial.
- [ ] Working browser views using shared identity and generated HTTP contracts.

## Evidence and remaining work

Execution plan is created on `feature/IOP-204-formal-handover` before implementation.
Physical asset surveying remains external; formal records use actual configured
Workforce shifts, never inferred alarm windows.
