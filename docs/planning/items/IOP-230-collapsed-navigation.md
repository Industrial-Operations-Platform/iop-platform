# IOP-230 — Navigation reveal icon and motion

## Status and goal

Completed locally with the closing flicker correction; previous delivery is published
to origin/develop. The owner's 2026-11-08 refinements require both toggle states to share
a slightly smaller left inset, double right chevrons (option B) for opening and a
panel that visibly slides out from the left. The owner explicitly requested that
this branch start from the pending logo branch. The owner approved publication
only of the logo and left navigation work. The latest follow-up authorizes matching
the closing motion to opening and integrating the completed work into local develop.

## Scope and acceptance

- [x] Preserve identical position/dimensions for both states without
  collapsed-only tab styling or shifts in neighboring header controls.
- [x] Use the selected double right chevrons and reduce the left inset to
  12px desktop/8px compact in both states.
- [x] Slide the panel in from the left on opening, respecting reduced motion and
  keeping closed destinations inaccessible to keyboard navigation.
- [x] Slide the panel out to the left when closing with the same timing; disable
  its interaction immediately and handle reduced motion and interrupted closing.
- [x] Preserve the expanded control, translated accessible names, expanded/control
  relationships, visible keyboard focus and 44px interaction target.
- [x] Verify collapse/reopen behavior, navigation reachability, analytical resizing
  and desktop/mobile light/dark rendering; pass relevant guards/build/browser checks.
- [x] Keep the panel offscreen at the closing animation's completion boundary,
  without a visible flash before it becomes fully hidden.

Shared design presentation owns this change under Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No navigation permissions, session state, domain/API behavior or architecture changes.
The current successor branch `fix/IOP-230-navigation-motion` starts from
`feature/IOP-229-platform-logo`; earlier navigation work remains preserved on
`fix/IOP-230-collapsed-navigation`.

## Evidence

[Execution plan](../completed/IOP-230-collapsed-navigation-plan.md).
[Position correction](../completed/IOP-230-toggle-position-plan.md). The original
position was restored and validated in that slice.
[Logo-based branch and motion](../completed/IOP-230-navigation-motion-plan.md).
[Closing motion and integration](../completed/IOP-230-navigation-close-plan.md).
Origin/develop contains the completed logo and navigation implementation.
[IOP-232](IOP-232-publication-scope.md) removes the unrelated documentation added
during the overly broad publication without changing the approved application.
[Closing flicker regression](../completed/IOP-230-navigation-flicker-plan.md).
The regression fix is committed separately for review; integration/publication of
that increment is pending authorization.
