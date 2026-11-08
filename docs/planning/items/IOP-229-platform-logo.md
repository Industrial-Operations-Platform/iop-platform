# IOP-229 — Owner-supplied platform logo

## Status and goal

Completed. The owner's 2026-11-08 request authorizes replacing the existing
platform mark with the supplied navy IOP gear and turquoise pulse-line logo. The
owner explicitly clarified that a new image with a transparent background is required.

## Scope and acceptance

- [x] Use the supplied artwork in the workspace header, public introduction,
  decorative introduction hub and browser favicon, preserving its geometry and
  proportions with a genuinely transparent background and readable theme contrast.
- [x] Avoid a duplicate IOP wordmark; retain accessible navigation names and the
  supporting platform name on wide screens.
- [x] Verify desktop/mobile and light/dark rendering, Start navigation, relevant
  regressions, design/architecture guards and the production build.

Presentation stays in the shared design and host adapters under Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
This owner-selected artwork supersedes the mark from
[IOP-216](IOP-216-shell-branding.md); application behavior and permissions are unchanged.

## Evidence and remaining work

[Execution plan](../completed/IOP-229-platform-logo-plan.md), including the selected
built-in image-generation prompt and validation evidence. Publication requires
separate owner authorization under ADR-0008.
