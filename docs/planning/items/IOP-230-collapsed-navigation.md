# IOP-230 — Edge-mounted navigation reveal control

## Status and goal

Completed. On 2026-11-08 the owner requested a different icon when the left
navigation is collapsed, positioned closer to the left edge and suggesting that
clicking it pulls the hidden panel out from that side. Keep this in a separate
local commit; the owner will integrate it with the pending logo work later.

## Scope and acceptance

- [x] Replace the collapsed hamburger with a left-panel outline and right-pointing
  reveal arrow, anchored at the viewport's left edge without shifting the brand
  or right-hand header actions.
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
