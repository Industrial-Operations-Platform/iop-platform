# IOP-230 — Navigation reveal icon

## Status and goal

In progress; icon selection pending. On 2026-11-08 the owner requested a different
icon when the left navigation is collapsed. The owner subsequently rejected edge
placement: both collapse and expand buttons must retain the same original position,
with only the opening icon changed. Present alternatives for the owner to select.
Keep local commits separate from logo work for later owner integration.

## Scope and acceptance

- [x] Restore identical original position/dimensions for both states without
  collapsed-only tab styling or shifts in neighboring header controls.
- [ ] Apply the owner's selected opening icon after showing alternatives in chat.
- [x] Preserve the expanded control, translated accessible names, expanded/control
  relationships, visible keyboard focus and 44px interaction target.
- [x] Verify collapse/reopen behavior, navigation reachability, analytical resizing
  and desktop/mobile light/dark rendering; pass relevant guards/build/browser checks.

Shared design presentation owns this change under Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No navigation permissions, session state, domain/API behavior or architecture changes.
IOP-229 is an independent pending story and is not merged into this branch.

## Evidence

[Execution plan](../completed/IOP-230-collapsed-navigation-plan.md).
[Position correction](../completed/IOP-230-toggle-position-plan.md). The original
position is restored and validated; the owner is choosing the final opening icon.
