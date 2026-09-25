# IOP-116 — POC navigation execution plan

Status: Completed. Authorized by the owner's request for IOP-0116 (resolved to
[IOP-116](../items/IOP-116-navigation.md)) on 2026-09-25.
Branch: `feature/IOP-116-navigation`, created from `develop` from a clean tracked tree. The initial sandbox denied the Git lock; the branch
was then created with approved Git access before implementation. The plan was the
only new file during that retry.

## Changes and steps

1. Reuse completed IOP-017 and Accepted ADR-0010 tooling. Follow
   [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
   ADR-0018 remains Proposed; independent navigation requires no business access.
2. Update `apps/web/src/App.tsx` and `style.css`; extract the existing health
   component to `src/HealthStatus.tsx`. Provide three hash-linked destinations,
   active navigation, browser history/reload, unknown-location recovery, keyboard
   focus and responsive layout. Native fragment links need no router dependency.
3. Show truthful empty destinations and shared scope/filter summaries. No invented
   metrics, uploaded files, fixture results, business requests, authentication,
   server contracts or filter engine. Import and analytics delivery remain separate.
4. Retain `apps/web/test/App.spec.tsx` health checks, add navigation RTL/Playwright coverage,
   adapt `e2e/health.spec.ts`, and update `apps/web/README.md`.
5. Synchronize item/backlog and record completed evidence. Translate the IOP-116 context from Spanish on develop as required by
   the language rule; IOP-017 is English. Preserve the separate IOP-144 branch.

## Validation and evidence

Run `npm test`, `npm run typecheck` and built-app Playwright. Verify all destinations,
direct links, reload, back/forward, invalid routes, keyboard focus, narrow layouts,
health failure/retry and absence of business requests. Inspect browser screenshots.
Check changed Markdown links, story IDs/status consistency and `git diff --check`.
Navigation cannot prove import, metric reconciliation or server access denial;
those remain outside this story. Commit validated changes locally; publication
requires owner approval under AGENTS.md and ADR-0008.

## Completed evidence — 2026-09-25

- `npm test`: build and contract drift check passed; 59 API, 13 web and 62
  database configuration tests passed.
- `npm run typecheck`: passed across API, web and database tooling.
- `npm run test:e2e --workspace @iop/web`: all four Chromium journeys passed
  against the built app and real local API, including back/forward, direct links,
  reload, invalid destinations, keyboard/skip-link focus and health recovery.
- Inspected desktop overview and 375px detail screenshots; no clipping or overlap.
  Browser checks cover every destination at 375px and 768px with no overflow.
  Screenshots remain ignored under `apps/web/test-results/`.
- Tests used Node 24.21.0/npm 10.9.2 from
  `/private/tmp/iop-017-runtime/node_modules/.bin`, with loopback permission.
  Initial Node 20/sandbox attempts failed on ESM/runtime and socket restrictions;
  reruns with the required runtime passed without dependency changes.
- Existing health tests were retained; no API, schema, package or ADR changes.
  IOP-116 was translated from Spanish on develop; IOP-017 needed no translation.
- All navigation acceptance criteria are met for the POC slice. Empty destinations
  deliberately do not claim CSV submission, data/filters, analytical calculations
  or permission enforcement. ADR-0018 remains Proposed.
- Item/backlog synchronized; finished plan moved to completed. Changed Markdown
  links and whitespace checked before commit. No IOP-144 changes were integrated.
