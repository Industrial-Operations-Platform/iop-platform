# IOP-201 — Minimal presentation home and existing sign-in

## Status and goal

Completed. The owner's 2026-10-09 refinement requests a minimal, modern presentation
home from `develop`, with subtle interactive 3D movement focused on Data Analysis,
Maintenance and Workforce, preserving the platform identity and existing login.
Sign-in must open only after an explicit button action; detailed product content
belongs in About. The supplied reference informs composition, without pricing,
trials or a copied marketing design.

## Scope and acceptance

- [x] The initial entry is minimal and presents the three main modules through a
  responsive, interactive 3D scene with subtle animated background elements.
- [x] Sign in opens existing access controls on demand; About contains the detailed
  delivered module/workflow information, independently of the initial home.
- [x] The existing individual-account sign-in, mandatory password change, session
  restoration and logout still work; the landing also composes the existing
  selector in explicitly configured native demo mode.
- [x] Desktop and narrow layouts preserve the shared mark, font and palette,
  controls and accessible keyboard navigation, with English/German presentation.
- [x] Reduced-motion preferences and an explicit animation pause control provide
  a static presentation; pointer interaction is optional.
- [x] Relevant web tests, identity/architecture guards and production build pass;
  actual desktop/narrow browser rendering is inspected.

Presentation belongs to the browser host; the scoped public-home visual refinement
is recorded in the visual identity. Credential rules, HTTP adapters, API
contracts, permissions and data storage remain with their existing owners. Follow
[visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
Do not add registration, new providers, invented operational data or future-module
claims. Remote publication requires the owner's explicit approval.

## Evidence and remaining work

[Initial delivery](../completed/IOP-201-platform-landing-plan.md) is committed at
`947e61e`. The [completed presentation refinement](../completed/IOP-201-minimal-presentation-plan.md)
records the updated criteria and validation on the retained story branch. Remote
publication remains unauthorized.
