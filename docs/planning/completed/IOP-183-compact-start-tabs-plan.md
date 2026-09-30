# IOP-183 — Compact Start category tabs

Status: Completed. Authorized by the owner's UI request on 2026-09-30.
Branch: `fix/IOP-183-compact-start-tabs`, created from clean `develop`.
Scope: [item](../items/IOP-183-compact-start-tabs.md).

## Changes and steps

1. Extend shared `ViewNavigation` and component CSS with a compact full-width
   tab placement, reusing identity tokens and existing native button semantics.
2. Use it in Shift Handover's `HandoverHighlights` React adapter with existing
   labels/counts and without card descriptions. No application, API or data changes.
3. Update the component README, visual identity and affected existing browser
   assertions. No story translations are needed.
4. Run web tests/build, architecture guards and existing Start/handover browser
   journeys; inspect desktop/mobile screenshots, equal widths, compact height,
   counters, selected state, keyboard operation and overflow.
5. Check documentation links and diff, archive evidence, synchronize item/backlog
   and commit locally. Publication remains subject to owner approval.

## Validation and evidence

- Web build/typecheck passed; the pre-existing bundle-size warning remains.
- All 76 web tests passed, including shared identity/architecture guards
  (`/tmp/iop183-web-tests.log`). All 10 API hexagonal-boundary checks passed
  (`/tmp/iop183-boundaries.log`).
- Five existing browser journeys passed: populated handover at 1440/820/375px
  and Start at 1440/375px (`/tmp/iop183-browser.log`). Assertions cover equal
  widths filling the row, compact height, small counts, active underline,
  keyboard selection, preserved navigation and no document overflow.
- Inspected `/tmp/iop183-start-1440.png` and `/tmp/iop183-start-375.png`:
  desktop labels/counts share one line; narrow labels/counts wrap within three
  adjacent tabs. Empty/zero-count collections also pass the Start journeys.
- Reviewed presentation-only dependencies, existing count sources, native focus
  behavior, English content, document links and diff whitespace.
- Checks used the available Node 24.19.0 runtime, below the declared 24.21.0
  minimum. Browser journeys use intercepted fixtures. Sandbox server startup
  failed; the permitted run outside the sandbox passed. No Docker activation
  or live-data validation is claimed.

## Closure

Acceptance is complete. Item/backlog synchronized and plan archived. Owner-approved publication is complete; see the
[publication evidence](IOP-183-publication-plan.md). Docker activation remains
outside this increment.
