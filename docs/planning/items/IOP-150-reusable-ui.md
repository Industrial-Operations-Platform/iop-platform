# IOP-150 — Reusable frontend identity components

Status: Completed

The owner requests reusable frontend components so subsequent features preserve
the established product identity. Extract and use a shared React presentation
library backed by the existing identity tokens, within ADR-0032's outer adapters.

## Acceptance

- [x] Reusable controls, panels, metrics, disclosures, tables and navigation own
  their appearance independently of the analysis feature.
- [x] The active import and analytical workspace use the shared components.
- [x] Existing colors, typography, responsive behavior, labels and workflows remain.
- [x] Usage guidance explains the public component API and extension rules.
- [x] Validate accessible component behavior and the real import/report journey.

References: [visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[plan](../completed/IOP-150-reusable-ui-plan.md).
