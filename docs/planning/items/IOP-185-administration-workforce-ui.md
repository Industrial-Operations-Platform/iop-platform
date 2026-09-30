# IOP-185 — Administration and Workforce interface consistency

Status: In progress

## Authorized request

Owner request of 2026-09-30: improve account administration, the administrator
landing page, shared tables/buttons and Workforce planning presentation.

## Acceptance

- Clicking a user opens the complete account information and supported editable
  fields. Profile editing happens inside that view; the list offers access toggling
  and an accessible trash icon for logical deletion.
- Sign out is the rightmost header action.
- Administration starts with useful persisted information: account totals, recent
  modifications and latest imported file. Creation/import stay in their sections.
- Shared tables and action buttons use one consistent visual treatment.
- Weekly plan groups configured shifts under each day instead of repeating shift
  labels in each zone. My day groups leader cards under visible shift headings.
- Configuration has aligned section actions, comfortable spacing and a clear save
  footer. Weekly entry has styled selection controls, cancellation and navigation
  back to the Workforce landing view for creation and editing.
- Preserve scoped authorization, existing revision history, localization and the
  accepted visual identity. Validate behavior and desktop/mobile rendering.

References: [IOP-184](IOP-184-m6-workforce.md),
[visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).

[Execution plan](../active/IOP-185-administration-workforce-ui-plan.md)
