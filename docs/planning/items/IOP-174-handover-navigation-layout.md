# IOP-174 — Handover navigation and layout

Status: Completed locally. Owner requested these fixes on 2026-09-29 after reviewing
the populated handover screens.

- Align Reported condition with the component identifier select regardless of
  lookup pagination or feedback. Explain that Betriebsmittelkennzeichen identifies
  a component such as a sensor or motor; preserve exact imported codes.
- Selecting Shift Handover in the sidebar must return from entry detail to the
  module home. Replace the boxed back action with a highlighted module-name action
  and use a subtle accessible reload icon in the detail header.
- Give matrix columns deliberate space, wrap Details into a narrower column and
  center Date and Status horizontally and vertically. Keep dates on one line and
  narrow-screen overflow inside the existing table viewport.

Reuse shared components and scoped feature CSS under Accepted ADR-0032/0036.
No domain, persistence, authentication or imported-data changes. IOP-173 publication
was approved separately and completed; this new UI increment needs its own review.

Implemented and validated at desktop/mobile sizes. See the
[execution evidence](../completed/IOP-174-handover-navigation-layout-plan.md).
Publication and local Docker rebuild remain pending approval for this increment.
