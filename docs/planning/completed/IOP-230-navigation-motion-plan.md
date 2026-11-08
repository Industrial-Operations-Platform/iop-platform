# IOP-230 — Navigation motion and logo-based branch

Completed. The owner's 2026-11-08 follow-up explicitly requests a smaller left
inset in both toggle states, a panel that slides out from the left when opened,
and navigation work based on the logo branch. The owner selected option B,
double right chevrons, for opening.

Branch: `fix/IOP-230-navigation-motion`, created from
`feature/IOP-229-platform-logo` at `7f9ac84`. Preserve the previous navigation
branch and its history; replay only its two IOP-230 commits onto this new branch,
resolving overlaps with the logo/caption changes. This base change and dependent
branch are explicitly owner-authorized; develop integration/publication is not.
[Permanent scope](../items/IOP-230-collapsed-navigation.md).

Replayed commits: `6f58159` → `20e72df`, `63ec153` → `0512995`.
Documentation conflicts were resolved by preserving both story rows and the
logo/caption contract alongside the navigation refinements. The logo branch tip
is the exact merge base of this successor branch; previous branches are intact.

## Changes and steps

1. Replay `6f58159` and `63ec153` from `fix/IOP-230-collapsed-navigation`, preserving
   the logo/caption and both story contexts. Resolve tests/docs consistently.
2. Use double right chevrons in shared `Layout.tsx`. In `components.css`, reduce
   the toggle inset equally in both states (12px desktop, 8px compact), keeping
   its 44px target and compensating margins to retain the logo's position.
3. Add a short translate-from-left opening animation to the existing sidebar,
   with no animation under reduced-motion preference. Closed navigation remains
   hidden and excluded from keyboard focus. No new persistent state is needed.
4. Extend existing browser checks for equal positions, selected icon, real opening
   motion/reduced-motion behavior and keyboard reopening; synchronize shared
   visual/component docs and story status.

Shared design and host presentation under Accepted ADR-0032/0010. No domain,
application, API, schema, dependency or architectural change. Read stories are
English; no translations required.

## Validation and closure

| Check | Result |
| --- | --- |
| `npm run build --workspace @iop/web` | Design guards 4/4, TypeScript and production bundle passed |
| Shell-branding, navigation-session, analysis-layout, platform-landing and appearance Playwright specs | 35 passed in 51.7s; exit 0 |
| Actual rendering | Inspected combined logo/reveal header at 1440px light, 768px dark and 320px light; panel paused midway through opening |
| Branch ancestry | Merge base equals logo branch tip `7f9ac84`; both previous branch refs retained |
| Changed Markdown links and `git diff --check` | Local link targets resolve; no whitespace errors |

The motion scenario pauses the live CSS animation halfway through its duration,
verifies the panel is partially outside the viewport, finishes it at x=0, then
checks reduced motion produces no running animation. Existing scenarios verify
equal toggle positions, smaller insets, 44px targets, keyboard reopening, hidden
navigation, session reset, chart resizing and the preserved logo/caption.
Fixture-only Vite preview used an ignored temporary test config; the server was
stopped and config removed after validation. Screenshots remain under ignored
`apps/web/test-results/`. The build's existing large-chunk warning remains.

The first combined browser run passed 34 scenarios and caught an animation rule
overriding the reduced-motion declaration because of selector specificity. The
reduced-motion override now matches the visible-sidebar selector; the final build
and all 35 scenarios passed after that correction.

Item/backlog are complete and this record is retained under completed. Commit
the validated result locally. No develop integration, branch deletion, push or
hosted activation occurred; publication remains deferred by the owner.
