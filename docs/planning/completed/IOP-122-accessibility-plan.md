# IOP-122 — POC accessibility execution plan

Status: Completed — existing POC preview increment, 2026-09-26. Authorized by the owner's IOP-0122 request, resolved to
[IOP-122](../items/IOP-122-accessibility.md). Branch:
`feature/IOP-122-accessibility`, created from clean `develop` before edits.

## Changes and steps

- Bound delivery to the existing import navigation and two analytical state previews
  in [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
  IOP-116 navigation and IOP-120 preview are integrated; real analytical controls,
  charts, tables and endpoint states remain pending in their owning stories.
- Translate/refine the entire IOP-122 item into English; both dependency items
  are already English. Synchronize backlog and web README. No dependency edits.
- In `apps/web/src/AnalyticalStates.tsx`, preserve keyboard focus when recovery
  removes its button, reopening a collapsed preview before focusing its selector. In `apps/web/src/style.css`, expose heading focus and improve
  control boundaries. Preserve existing labels, landmarks and live status regions.
- Add `apps/web/e2e/accessibility.spec.ts` using existing Playwright: keyboard-only
  navigation/recovery, accessible names/descriptions, status semantics, and computed
  contrast checks at laptop/tablet sizes. No added libraries or API changes.

## Validation and evidence

Targets: text contrast at least 4.5:1, control boundaries/focus at least 3:1 against
adjacent surfaces, visible focus, native keyboard operation and no focus loss after
recovery. These are bounded project checks, not a full accessibility certification.
Run `npm run typecheck`, `npm test`, and `npm run test:e2e`; inspect resulting
screenshots and check changed documentation links, IDs and status consistency.
Record actual results here. Screen-reader speech and future data UI remain unverified.

## Closure

Commit the validated preview increment; keep IOP-122 In progress for real analytical
UI verification. Move this plan to completed and link evidence. Publication requires
owner approval under ADR-0008.

## Results

- `npm run typecheck`: passed with Node 24.21.0 / npm 10.9.2.
- `npm test`: passed, API 79, web 15, database configuration 62 tests; build and
  browser contract drift check passed. Web's 15 tests passed again after the
  collapsed-preview recovery refinement; API/database code was unchanged.
- Initial validation used the shell's Node 20 and failed on ESM compatibility and
  sandbox loopback restrictions. Final commands used the existing runtime via
  `PATH=/private/tmp/iop-121-bin:$PATH`, with approved local listener access.
- Browser keyboard selection uses native typeahead; headless macOS popup arrow
  sequences did not change the selection. No application workaround was introduced.
- Reviewed overview at 768px and detail at 1366px screenshots: readable content,
  visible selector focus and no clipping. Artifacts: `apps/web/test-results/` (ignored).
- No new architectural pattern, API, dependency, business request or scope expansion.
  Parent remains In progress for real data UI; screen-reader speech is unverified.
- Final `npm run test:e2e`: all 12 Chromium tests passed, including the two new
  laptop/tablet keyboard, labels, status and contrast journeys and collapsed-panel
  recovery. Existing health, history, responsive and state tests remain green.
- Changed documentation relative links, item/backlog statuses and `git diff --check`
  verified before commit.
