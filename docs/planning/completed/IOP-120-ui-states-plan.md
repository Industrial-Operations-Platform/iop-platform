# IOP-120 — POC UI states

Status: Completed — independent POC presentation slice, 2026-09-26. Owner requested IOP-0120 (canonical IOP-120), limited to
[POC scope](../../product/scope-poc.md) and [delivery](../poc-delivery.md).
Branch: `feature/IOP-120-ui-states`, created from clean `develop`.
Item: [IOP-120](../items/IOP-120-ui-states.md).

## Changes and steps

1. IOP-017 and IOP-022 are completed and integrated; existing IOP-116 navigation
   supplies both analytical destinations. Business endpoints are unavailable.
   Deliver an explicitly simulated UI slice without requests or invented metrics.
2. Translate the entire IOP-120 context to English and refine POC acceptance;
   dependency stories read (017, 022, 116) already use English.
3. Add `apps/web/src/AnalyticalStates.tsx`, integrate in `App.tsx`, and extend
   `style.css`: default disconnected state plus opt-in loading, unavailable,
   no-import and no-match previews shared by overview/detail. Provide accessible
   announcements and honest simulated retry/reset actions. Preserve metric limits.
4. Add RTL and Playwright state/recovery checks; update web README, item/backlog.
   No API/schema, permissions, new libraries, architectural patterns or adjacent
   import/filter/metric implementation. IOP-022 remains the future error contract;
   no generic business error consumer is needed before an endpoint exists.

## Validation and evidence

Run `npm run typecheck`, `npm test`, `npm run test:e2e`. Verify both destinations,
keyboard controls, no business requests, responsive layout, recovery and explicit
coverage distinctions. Check changed Markdown links, status consistency and diff.
Record actual outcomes here; move this slice plan to completed after validation.
Keep the parent In progress until runtime states can be connected and validated.


## Results and remaining work

- Shared overview/detail presentation, explicitly simulated recovery, persistent
  metric limitations and default disconnected state implemented. No business API
  requests, metrics, scope selection or real filter mutations were introduced.
- `npm run typecheck` passed. `npm test` passed: 79 API, 15 web and 62 database
  configuration tests; builds and generated browser contract check passed.
- `npm run test:e2e` passed all 5 journeys, including state recovery by keyboard,
  both destinations at 375/768/1280 px and absence of business requests.
- Initial validation used shell-default Node 20 and sandbox-blocked ports. Repeated
  successfully with Node 24.21.0 from `/private/tmp/iop-017-runtime/node_modules/node/bin`
  and permission for loopback test servers. No dependency changes were required.
- Changed Markdown relative links and `git diff --check` passed. IOP-120 was fully
  translated to English and refined for this requested POC slice; no dependency
  translations were necessary. README now reflects Accepted ADR-0018 accurately.
- Parent remains In progress: analytical endpoint integration, actual failures,
  request lifecycle and real filter recovery still require delivered contracts and
  runtime access. No authorization, analytical correctness or full POC completion
  is claimed. Future cross-module UX remains outside this slice.
