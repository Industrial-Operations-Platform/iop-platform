# IOP-120 — POC runtime state continuation

Status: Blocked — analytical endpoints and validated local business access are absent.
Authorization: owner's 2026-09-26 request to work on IOP-120 within the POC.
Branch: `docs/IOP-120-runtime-state-plan`, created from clean `develop` before edits.
Item: [IOP-120](../items/IOP-120-ui-states.md).

## Scope and dependency review

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
limit this work to Executive Overview and analytical detail. The existing
[presentation slice](../completed/IOP-120-ui-states-plan.md) already supplies
disconnected, loading, error, no-import and no-match states with simulated recovery.
Preserve that implementation and its completed evidence.

IOP-017, IOP-022 and IOP-116 are integrated in develop. Their contexts were reviewed
and already use English; no translations are required. ADR-0018 is Accepted as
recorded in the current POC scope; older dependency prose calling it Proposed is
historical. Acceptance does not supply its missing runtime implementation.
The API host and OpenAPI currently expose health only, without analytical contracts.
Do not implement adjacent import, analytics, filters or authorization stories here.

## Files and steps

1. Create this active plan, then synchronize the IOP-120 item and backlog to Blocked
   with the concrete runtime prerequisites. This increment changes only those three
   Markdown files and adds no architectural pattern or application behavior.
2. Verify existing state tests, inspect the exposed API paths, and check changed
   documentation links and whitespace. Commit the documentation increment locally.
3. Resume after owning stories deliver analytical reads, coverage/filter semantics
   and validated scoped local access. Refine this plan with their exact contracts
   and affected files before code changes. Expected targets are the web analytical
   state component, view integration, API consumer, RTL/browser tests and web README.
4. Connect real request lifecycle and safe recovery using IOP-022 errors, preserving
   coverage distinctions, metric limitations and accessible keyboard/status behavior.
   No login, new metrics, background retries or broader cross-module states.

## Validation and closure

Current review: run the existing `AnalyticalStates.spec.tsx` tests, inspect OpenAPI
paths and validate the three changed Markdown files. Record actual results below.
This is not new runtime or browser acceptance evidence.

On runtime delivery, run `npm run typecheck`, `npm test` and `npm run test:e2e`.
Validate pending/success/failure/retry, missing imports versus no matching records,
filter recovery and navigation with actual delivered contracts in both views;
check keyboard use and laptop/tablet layout, sanitized failures and scoped access.
Only then check the remaining runtime acceptance criterion and move this plan to
completed. Keep the parent open while these prerequisites are missing.

## Review evidence — 2026-09-26

- Existing web state unit suite passed: 2 tests, covering overview and detail
  (`npm test --workspace @iop/web -- --testPathPatterns AnalyticalStates.spec.tsx`,
  using the existing Node runtime in `/private/tmp/iop-017-runtime`).
- `apps/api/contracts/openapi.json` exposes only `/health`; inspected API source
  likewise contains no analytical controller. Runtime integration cannot proceed.
- Relative links in all three changed Markdown files and `git diff --check` passed.
  Item and backlog both record Blocked; the completed presentation record is preserved.
- No application changes or new browser runs. Documentation review is complete;
  this continuation plan stays active because runtime implementation remains blocked.
