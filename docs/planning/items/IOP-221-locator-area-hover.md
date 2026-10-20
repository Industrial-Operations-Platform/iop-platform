# IOP-221 — Show Locator area names on hover

## Status and goal

Completed locally. The owner's 2026-10-20 request is to show the Bereich name when the
pointer passes over its tile in Asset Locator / Plant overview.
The owner has approved merging the story into develop and pushing both to origin.

## Scope and acceptance

- [x] Hovering any part of an overview tile shows that scene's configured name
  without clicking; moving between tiles updates the name.
- [x] The label clears on empty space, pointer exit/cancel, camera interaction and
  overview replacement. It remains inside the viewer at desktop/narrow widths.
- [x] Selection, orbit/zoom, labelled scene cards and private-reference behavior
  remain usable in both appearances; verify actual WebGL hover and relevant guards.

Reuse the existing React/Three.js presentation adapters under Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md), the
[visual identity](../../design/visual-identity.md) and the integrated
[IOP-211](IOP-211-locator-models-and-access.md)/
[IOP-219](IOP-219-locator-reference-curves.md) viewer. No API, model, authorization,
private revision activation or architectural changes are required.

## Evidence

[Completed execution and verification](../completed/IOP-221-locator-area-hover-plan.md).
[Approved publication](../active/IOP-221-publication-plan.md).
Service activation remains outside this increment.
