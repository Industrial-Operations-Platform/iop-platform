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
- [x] Center the localized platform name beneath the logo in the workspace and
  introduction, as requested in the owner's follow-up; preserve compact visibility.

Presentation stays in the shared design and host adapters under Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
This owner-selected artwork supersedes the mark from
[IOP-216](IOP-216-shell-branding.md); application behavior and permissions are unchanged.

## Evidence and remaining work

[Execution plan](../completed/IOP-229-platform-logo-plan.md), including the selected
built-in image-generation prompt and validation evidence.
[Caption follow-up](../completed/IOP-229-logo-caption-plan.md). The owner approved
publication of the logo and left navigation work to origin/develop.

The owner approved local develop integration together with IOP-230 on 2026-11-08.
Both logo commits are included through the dependent navigation branch;
[integration evidence](../completed/IOP-230-navigation-close-plan.md) records the
verified fast-forward. [IOP-232](IOP-232-publication-scope.md) removes the unrelated
documentation added during the overly broad publication, preserving this logo.
