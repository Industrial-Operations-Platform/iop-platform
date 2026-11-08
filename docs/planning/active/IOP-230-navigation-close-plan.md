# IOP-230 — Closing motion and approved develop integration

In progress. The owner's 2026-11-08 request authorizes matching the closing effect
to opening and integrating the completed logo/navigation work into develop.
Push is not inferred from that integration request; ask separately before origin
publication under AGENTS.md/ADR-0008.

Story branch: `fix/IOP-230-navigation-motion`, already based on
`feature/IOP-229-platform-logo`. [Permanent scope](../items/IOP-230-collapsed-navigation.md).

## Changes and steps

1. In shared `Layout.tsx`, retain the rendered panel only during its closing
   animation, immediately marking it inert and aria-hidden. Hide it after its
   own closing animation ends; reopening cancels the closing state. Honor reduced
   motion initially and if that preference changes during closing.
2. In `components.css`, keep the physical panel width while closing even though
   workspace space is released. Match the 220ms opening motion in reverse.
3. Extend navigation-session scenarios for actual mid-close geometry, hidden and
   noninteractive destinations, reduced motion and interrupted closing. Preserve
   the paired chevrons, button position and logo/caption.
4. Synchronize shared docs, item/backlog and run web build/design guards, relevant
   web unit tests and shell-branding, navigation-session, analysis-layout,
   platform-landing and appearance browser specs. Inspect actual motion/screenshots;
   check Markdown links and whitespace.
5. Commit the validated increment, fetch origin and verify develop divergence.
   Merge the reviewed story into local develop without rewriting history or
   deleting branches; the story already includes both logo commits. Verify the
   integrated tree and ancestry. Record integration evidence on the story branch
   before the final integration. Request publication of the concrete validated
   story/develop refs to origin only after local work is complete.

Ownership remains shared presentation under Accepted ADR-0032/0010. No domain,
API, persistence, permission, dependency or new architectural pattern. Read story
contexts are English. No stage/master promotion or explicit deployment is authorized.

## Validation evidence

| Check | Result |
| --- | --- |
| Web production build | Design guards 4/4, TypeScript and Vite passed |
| `npm test --workspace @iop/web` | 49 suites / 319 tests passed |
| Shell-branding, navigation-session, analysis-layout, platform-landing and appearance Playwright specs | 35 passed in 52.6s; exit 0 |
| Actual motion | Inspected panel halfway through closing, retaining its width while inert/aria-hidden; opening, closing and interruption verified in-browser |
| Origin/develop inspection | Fetched origin; local and remote develop both `f2e5454`, no divergence before integration |

The lifecycle scenario verifies that closing destinations cannot receive focus,
reopening interrupts closing, reduced motion is immediate and changing that
preference mid-close completes hiding. Desktop/mobile analytical and shell checks
retain navigation reachability, chart resizing, button alignment and logo/caption.
The first browser run passed 34 cases but its motion observer caught the wrong
animation after a media change; filtering the observer by animation name corrected
the test, and the final 35-case run passed. The temporary fixture-only preview
configuration was removed and its server stopped after validation. Existing
large-bundle warnings remain; no API or database change is involved.

Implementation is ready for its local story commit and the owner-approved
fast-forward into develop. After that integration, record the actual source/hash
and ancestry on the story branch, complete this record and fast-forward the
documentation increment into develop. Do not push without separate authorization.
