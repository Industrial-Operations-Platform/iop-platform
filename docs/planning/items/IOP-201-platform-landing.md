# IOP-201 — Minimal presentation home and existing sign-in

## Status and goal

Completed. The owner's 2026-10-09 refinement requests a minimal, modern presentation
home from `develop`, with subtle interactive 3D movement focused on Data Analysis,
Maintenance and Workforce, preserving the platform identity and existing login.
Sign-in must open only after an explicit button action; detailed product content
belongs in About. The supplied reference informs composition, without pricing,
trials or a copied marketing design.
The subsequent foreground-only request replaces the cube and three tilted,
labelled cards with a professional graphical capability composition and a new
platform mark. Selecting a main module illuminates its relevant capability symbols.
Retain the approved background, palette, movement, home composition and access flow.
The owner selected Unified Record (round-two option 10) as the application icon:
two nested rounded-square loops with white strokes and a blue lower/right segment.

## Scope and acceptance

- [x] The initial entry is minimal and uses six unnamed graphical capabilities
  around a refreshed platform mark, with no cube or tilted module cards. Module
  selection illuminates the corresponding capability subset.
- [x] Sign in opens existing access controls on demand; About contains the detailed
  delivered module/workflow information, independently of the initial home.
- [x] The existing individual-account sign-in, mandatory password change, session
  restoration and logout still work; the landing also composes the existing
  selector in explicitly configured native demo mode.
- [x] Desktop and narrow layouts use the refreshed shared mark and preserve font and palette,
  controls and accessible keyboard navigation, with English/German presentation.
- [x] Reduced-motion preferences and an explicit animation pause control provide
  a static presentation; pointer interaction is optional.
- [x] Relevant web tests, identity/architecture guards and production build pass;
  actual desktop/narrow browser rendering is inspected.
- [x] The shared application mark matches the owner's selected Unified Record
  image, is legible at small sizes, and is reused in the homepage, shell and favicon.
- [x] Docker rebuild includes the selected mark and required design checks; actual
  Docker delivery and all branding consumers resolve the new icon without stale URLs.

Presentation belongs to the browser host; the scoped public-home visual refinement
is recorded in the visual identity. Credential rules, HTTP adapters, API
contracts, permissions and data storage remain with their existing owners. Follow
[visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
Do not add registration, new providers, invented operational data or future-module
claims. After Docker icon verification, the owner-approved story-to-develop
integration and publication of both branches to origin completed on 2026-10-09.

## Evidence and remaining work

[Initial delivery](../completed/IOP-201-platform-landing-plan.md) is committed at
`947e61e`. The [completed presentation refinement](../completed/IOP-201-minimal-presentation-plan.md)
records the initial presentation criteria and validation on the retained story branch.
The [completed capability scene plan](../completed/IOP-201-capability-scene-plan.md) covers the
foreground-only refinement.
The [completed selected icon plan](../completed/IOP-201-selected-icon-plan.md) records the final
owner-selected mark replacement.
The [completed Docker delivery/publication plan](../completed/IOP-201-docker-icon-publication-plan.md)
records runtime verification, cache refresh and the approved publication sequence.
