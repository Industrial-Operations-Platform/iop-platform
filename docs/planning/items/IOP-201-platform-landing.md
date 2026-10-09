# IOP-201 — Platform landing and existing sign-in

## Status and goal

Completed. The owner requested a landing page from `develop` that explains the
application, preserves its style and colors, and uses the existing login.

## Scope and acceptance

- [x] The signed-out entry introduces IOP and its delivered Data Analysis,
  Shift Handover, Workforce, Maintenance and Digital Asset Record capabilities.
- [x] The existing individual-account sign-in, mandatory password change, session
  restoration and logout still work; the landing also composes the existing
  selector in explicitly configured native demo mode.
- [x] Desktop and narrow layouts preserve the shared mark, typography, palette,
  controls and accessible keyboard navigation, with English/German presentation.
- [x] Relevant web tests, identity/architecture guards and production build pass;
  actual desktop/narrow browser rendering is inspected.

Presentation belongs to the browser host; credential rules, HTTP adapters, API
contracts, permissions and data storage remain with their existing owners. Follow
[visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
Do not add registration, new providers, invented operational data or future-module
claims. Remote publication requires the owner's explicit approval.

## Evidence and remaining work

[Completed execution and validation](../completed/IOP-201-platform-landing-plan.md).
The host composes the existing Access login or native demo selector. All criteria
are verified locally; the owner has not yet authorized merge or remote publication.
