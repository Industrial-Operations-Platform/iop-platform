# IOP-168 — Operational Shift Handover

## Status and authorization

Completed — first operational increment under [ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md).
Owner requested M7 on 2026-09-29. Keep the temporary login as delivered.

## Scope

Deliver a durable technician-authored operational journal, department/equipment
reference history, open issues, meeting preparation and selected Start highlights.
Use the [product contract](../../product/shift-handover.md) for fields and journeys.
The owner wants workers returning from leave or joining a department to recover
context without relying on meeting memory or material records in Ultimo.

This bounded vertical increment spans parts of IOP-060–065/067; it does not complete
all M7 parent stories. Formal shift closure (IOP-066), canonical asset history
(IOP-063/087), workforce scheduling (M6) and maintenance lifecycle (M8) remain
separate. References and planned integration must preserve those boundaries.

## Acceptance

- [x] All four profiles can reach Shift Handover from the left navigation and
  read authorized site history. Technicians can create durable entries.
- [x] Support configured Safety, Information, Successes, People, Performance
  and Problems categories and the requested meeting/matrix fields.
- [x] Capture department, optional area/equipment reference, short summary,
  detail, author and occurrence/creation context; general site announcements
  do not require a fictional equipment reference.
- [x] Search/filter persistent department and equipment-reference history;
  preserve corrections and follow-up with actor/time evidence.
- [x] Track reported damage, inspection needs, repairs, blocked equipment and
  open issues without deriving equipment condition from alarm statistics.
- [x] Show a meeting summary and department matrix with responsibility,
  deadlines and optional external work-order reference; pending issues survive
  date changes and later shift closure.
- [x] Start shows deliberately selected highlights and scoped sector context
  linking to the full entry. The module retains all entries.
- [x] Future M6 assignments may prefill location with an explicit override for
  assistance elsewhere; initial release supports manual location selection.
- [x] Apply shared visual components, English default UI, hexagonal boundaries,
  scoped permissions and database isolation; verify API, storage and browser paths.

## Dependencies and decisions

Reuse delivered IOP-165 authentication, stable user IDs and shared presentation
components. ADR-0032 governs clean code and inward dependencies. ADR-0012/0013/0014
govern ownership, RLS and explicit permissions; ADR-0016 governs time.
Unimplemented canonical asset lifecycle (IOP-034), shifts (IOP-053) and general audit
infrastructure (IOP-023) require the bounded interim contracts in ADR-0036, not
silent substitution with analytical catalogs or acceptance of other proposals.

No Ultimo API/material integration, corporate login changes, scheduling, automatic
plant control, notifications, attachments or new deployment is authorized here.

## Evidence

[Completed discovery plan](../completed/IOP-168-shift-handover-discovery-plan.md).
ADR-0036 was explicitly accepted on 2026-09-29. See the
[implementation evidence](../completed/IOP-168-shift-handover-implementation-plan.md)
and [operator guide](../../development/shift-handover.md). The owner approved the
existing Halle/Bereich configuration as the initial operational catalog: 5
departments and 89 areas are saved privately with stable IDs. Code and disposable
test environments are validated. The owner subsequently authorized implementation
merge/push and the local Docker update; the rebuilt stack is healthy and loads the
approved catalog. Existing accounts were preserved and all 78 historical seed dates
reconciled unchanged. See the [activation record](../completed/IOP-168-shift-handover-publication-plan.md).
