# IOP-215 — Operational usability and loading improvements

## Status and goal

Completed locally. The owner's 2026-10-20 request authorizes the following Workforce,
Start, operational interface, analytical loading and Locator refinements.

## Scope and acceptance

- [x] My day subtly identifies leader availability using the selected shift and
  actual time. Editable primary leader groups retain shared operational authority.
  Mike's group contains Stefan Bänsch, Todor Ilkov, Marcello Pranjic, Mario Sanchez
  Gallardo, Mithujan Ragunathan, Stefan Mladenovic and Mitko bibiloski; provisional
  remaining membership may be distributed among other leaders, including Burak.
- [x] Workforce records distinguish ILO Technical Operator and ILO Maintenance
  Technician independently of access profiles.
- [x] Start's weekly assignment view presents a minimal seven-day grid with date,
  shift and zone, with usable narrow-screen containment.
- [x] Authorized technicians can read selected-date Handover journal context in
  Area overview. Blue entry titles align to the left of their content.
- [x] Analytical repeated loading uses bounded caching with correct scope,
  selection and invalidation; current authorization and accurate totals remain.
- [x] Table filtering affordances are subtle and accessible. Improvement Tracking
  filters follow the shared inline Department / Halle control pattern.
- [x] Maintenance board cards can be dragged between valid states; existing
  completion validation, authorization and accessible controls remain effective.
- [x] Locator avoids excessive rendering/resource use, handles renderer failure,
  and separates Administrator configuration/import from operational zone viewing
  for Team Leader and Task Force profiles, enforced by the API as well as the UI.

Use Accepted [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md), current
module contracts and the [visual identity](../../design/visual-identity.md).
Customer names and group seed data belong to scoped configuration/demo adapters.
No publication, deployment or unrelated backlog work is authorized.

## Evidence and remaining work

[Execution evidence](../completed/IOP-215-operational-refinements-plan.md).
Four editable primary groups and 20 memberships were applied through the existing
local Workforce application. The owner explicitly excluded absent Stefan Mladenovic
and Mitko bibiloski on 2026-10-20 and will add them later. Five existing Mike members
were linked, retaining existing directory names through explicit scoped aliases.
The remaining roster can be refined later; individual qualifications remain
unspecified until an administrator selects confirmed levels.

The technician journal denial was not reproduced: all 17 current technicians read
the selected-date entries, while formal shift context retains its separate access
rule. Regression coverage records both populated and empty dates. No grant was
broadened. Implementation is committed locally; merge, push and deployment await
separate authorization.

## Approved local integration — 2026-10-20

The owner explicitly requested merging all pending IOP-215 and IOP-216 commits
into local `develop`. [Integration plan](../active/IOP-215-develop-integration-plan.md) records execution.
Remote publication remains a separate approval.
