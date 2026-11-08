# IOP-230 — Navigation reveal control execution plan

Completed. Authorized by the owner's 2026-11-08 request.
Branch: `fix/IOP-230-collapsed-navigation`, created from clean `develop`.
[Permanent scope](../items/IOP-230-collapsed-navigation.md).

## Changes and steps

1. Update the collapsed SVG in shared `Layout.tsx` to show a left panel and reveal
   arrow. In `components.css`, bring that control to the viewport edge with a
   restrained tab outline and inset focus; compensate its margins to preserve the
   brand/actions positions. Retain the expanded icon and responsive 44px target.
2. Extend existing shell-branding browser scenarios to verify edge placement,
   keyboard reopening and stable neighboring controls. Reuse navigation-session
   and analysis-layout checks for session reset and chart resizing.
3. Update the shared visual identity/component README and item/backlog; record
   actual evidence and commit this story separately for later owner integration.

Ownership stays in shared design presentation under ADR-0032/0010. No new pattern,
dependency, transport or application behavior. Read IOP-229 and IOP-214 contexts
are already English; no translations needed. Logo work remains intact on
`feature/IOP-229-platform-logo`; there is no dependency requiring its merge.

## Validation and closure

| Check | Result |
| --- | --- |
| `npm run build --workspace @iop/web` | Design guards 4/4, TypeScript and production bundle passed |
| Shell-branding, navigation-session, analysis-layout and appearance Playwright specs | 20 passed in 37.1s; exit 0 |
| Actual rendering | Inspected 1440px light, 768px dark and 320px light collapsed header screenshots |
| Changed Markdown links and `git diff --check` | All local targets resolved; no whitespace errors |

The shell scenarios verify the reveal target begins at x=0 with at least 44px
width/height, stable brand/account positions, visible inset keyboard focus,
localized names and keyboard reopening. Existing scenarios verify retained report
content, chart resizing, navigation reachability and session reset. Fixture-only
Vite preview used an ignored temporary config; the server was stopped and config
removed after validation. Screenshots remain under ignored `apps/web/test-results/`.
The production build retains its existing large-chunk warning. No API change or
hosted activation occurred.

Acceptance and item/backlog are synchronized; retain this plan under completed
and commit locally. The owner explicitly deferred integration and publication;
neither story was merged or pushed during this task.
