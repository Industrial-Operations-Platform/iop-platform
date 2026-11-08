# IOP-230 — Restore the shared toggle position

Completed position-restoration slice. Owner correction on 2026-11-08: collapse and expand controls must
occupy the same original position; only the opening icon should differ. Continue
`fix/IOP-230-collapsed-navigation` with a new commit, preserving existing history.
[Permanent scope](../items/IOP-230-collapsed-navigation.md).

## Changes and steps

1. Remove collapsed-only edge offsets, tab chrome and focus overrides from shared
   `components.css`. Keep the current reveal glyph pending the owner's icon choice.
2. Update existing shell-branding scenarios to require identical toggle position
   and dimensions in both states. Preserve keyboard reopening and stable neighbors.
3. Synchronize the visual identity/component README and permanent scope; present
   three in-chat icon alternatives using the visualization skill under ignored
   `tmp/visualizations/`. No chosen alternative is implemented before user selection.

Shared design presentation only; no architecture, API or session behavior change.

## Validation and remaining work

| Check | Result |
| --- | --- |
| Web production build | Design guards 4/4, TypeScript and Vite passed |
| Shell-branding, navigation-session and analysis-layout Playwright specs | 15 passed in 28.8s; exit 0 |
| Visual review | Restored plain toggle inspected at 1440px and 320px |
| Changed Markdown links and whitespace | All local targets resolve; `git diff --check` passed |

Existing scenarios now require identical toggle x/y/width/height before and after
collapse, stable adjacent controls, visible keyboard focus and keyboard reopening.
Fixture-only preview was stopped and temporary test config removed. The build's
existing large-chunk warning remains. Three Lucide-based alternatives are prepared
in the ignored in-chat preview `tmp/visualizations/navigation-icons.html`:
Panel + arrow, Double chevron and Arrow. No final icon choice is inferred.

This correction is ready for its local commit. The parent item remains In progress
pending the owner's icon selection; neither story is merged or pushed.
