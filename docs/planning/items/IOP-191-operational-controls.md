# IOP-191 — Operational controls and contextual navigation

Status: Completed

## Authorized request and acceptance

Owner request of 2026-10-02:

- Refine the Meeting preparation date and label through a reusable date control.
- Align Journal department and date selection in one responsive filter surface.
- Present Available profiles with a clearer visual hierarchy; open user creation
  from an accessible icon beside user search, with a guided modal form.
- Make My day personal assignments clear and visually structured, prioritizing
  assigned duty/shift and showing supporting facts without duplicate hours.
- Separate Weekly plan assignment form actions from its fields.
- Preserve clickable section/category breadcrumbs after Journal View entries,
  including navigation back from an entry through its category to Journal.

Reuse the accepted visual identity and existing React adapters; preserve business
rules, scoped authorization, native date semantics and English/German localization.
No API, database, deployment or architecture change is required.

References: [IOP-190](IOP-190-daily-handover.md),
[IOP-188](IOP-188-user-directory-refinements.md),
[IOP-185](IOP-185-administration-workforce-ui.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[visual identity](../../design/visual-identity.md).

[Execution plan](../completed/IOP-191-operational-controls-plan.md).


## Outcome

All six refinements are implemented and validated in the local story branch.
The shared date field and filter surface, profile cards and creation modal, compact
personal assignment summary, separated form footer and category-aware breadcrumbs
preserve existing application/API contracts. English/German resources are updated.
Validation and screenshot evidence are recorded in the execution plan. Publication
and operator-container activation remain separate from this completed implementation.
