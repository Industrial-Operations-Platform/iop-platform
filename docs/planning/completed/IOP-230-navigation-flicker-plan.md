# IOP-230 — Closing flicker regression

Completed. The owner's 2026-11-08 report authorizes correcting a visible flicker
when closing the left navigation. Branch: `fix/IOP-230-navigation-flicker`, created
from clean develop at `b5a3bc4`.
[Permanent scope](../items/IOP-230-collapsed-navigation.md).

## Changes and steps

1. Reproduce the closing-animation completion boundary in the existing
   `navigation-session.spec.ts`: delay delivery of its completion event so the
   final CSS frame can be inspected before React applies hidden. The suspected
   issue is the animation reverting to its untransformed state during that gap.
2. Make the smallest shared `components.css` correction that keeps the panel
   offscreen until hidden, without changing timing, icon, spacing, accessibility,
   reduced motion or reopening behavior.
3. Run the regression against the current build to prove the failure, then run
   production build/design guards and the existing navigation/session, shell,
   analytical layout, landing and appearance browser scenarios after the fix.
   Inspect the completion-boundary screenshot and desktop/mobile rendering.
4. Synchronize the visual identity/component docs and item/backlog, check links
   and whitespace, complete this plan and commit locally. Integration/publication
   is separate; touch no other review branches or historical integration content.

Shared presentation only under Accepted ADR-0032/0010. No architecture, application,
API, schema, dependency or unrelated cleanup. Read IOP-230 context is already English.

## Reproduction evidence

The completion-boundary scenario fails against the original CSS: after the closing
animation finishes but before its React completion handler runs, the panel's right
edge returns to 220px for consecutive animation frames instead of staying at or
left of zero. The screenshot shows the panel visibly returned over the workspace.
The closing animation now retains its final frame with `forwards` until hidden
is applied. The build also exposed generic Element event-listener typing in the
existing animation helper; use Event with an AnimationEvent guard so TypeScript
checks the regression and helper correctly.

## Final validation and closure

| Check | Result |
| --- | --- |
| Baseline completion-boundary regression | Failed as expected: right edge returned to 220px |
| Final web production build | Design guards 4/4, TypeScript and Vite passed |
| Navigation-session, shell-branding, analysis-layout, platform-landing and appearance browser specs | 35 passed in 53.7s; exit 0 |
| Actual rendering | Completion-boundary screenshot inspected: no panel returns over the expanded workspace; desktop/mobile scenarios pass |
| Changed Markdown links and whitespace | All local targets resolve; `git diff --check` passes |

The production change is limited to retaining the closing animation's last frame.
The regression holds completion delivery and samples two subsequent animation
frames before releasing React's handler, then exercises reopening, interrupted
closing and reduced motion. The temporary fixture-only preview config was removed
and server stopped. Screenshots remain under ignored `apps/web/test-results/`;
baseline screenshot retained under ignored `tmp/IOP-230-flicker/`.
The build retains its existing large-bundle warning. No API/domain behavior changed.

Acceptance and item/backlog are synchronized. Retain this plan under completed
and commit locally on the bug-fix branch. No merge, push, deployment or other
review-branch modification occurred; publication requires separate authorization.
