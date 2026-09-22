# IOP-017 — Frontend bootstrap execution plan

Source: [permanent item](../items/IOP-017-frontend-bootstrap.md).

## Status and authorization

Completed on 2026-09-22. Owner requested IOP-017 on 2026-09-22 within the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-017-frontend-bootstrap`, created from clean `develop` before edits.

## Proposed implementation

Deliver only React/TypeScript/Vite startup and public API process health. Show
loading, reachable and unavailable states with manual retry and bounded requests.
Use a relative `/health` request and local Vite proxy, including built-app preview.
Generate browser types from the reviewed API OpenAPI artifact. No business screens,
charts, login, principal, CSV, persistence, Docker, hooks or adjacent stories.

## Files expected to change

- `apps/web/`: source, styles, generated types, build/test configurations, tests,
  package manifest and README; remove obsolete placeholder.
- Root package manifest/lockfile and `.gitignore` for workspace and test outputs.
- This plan, IOP-017 item, backlog, README and minimal current-host statements in
  ARCHITECTURE.md and AGENTS.md.

## Dependencies and decisions

IOP-002/003/016 are Completed and present on develop. Accepted ADR-0001–0011
supply host boundaries, React/Vite, npm, Jest/RTL/Playwright and OpenAPI strategy.
ADR-0018 remains Proposed; public health needs no business execution context.
IOP-015/018/020 retain broader infrastructure/configuration/testing. Local proxy
configuration is explicitly delegated to IOP-017 by ADR-0010; no new ADR needed.
Pin compatible packages and inspect license metadata. Use the existing required
Node 24.21.0 / npm 10.9.2 in a temporary location for verification if necessary.

## Database changes

None.

## API and UI changes

Consume existing public `GET /health`; no API changes, scope inputs or secrets.
Loopback-only dev/preview listeners. A host status page describes liveness without
claiming database or analytical readiness. No customer labels or source schemas.

## Tests and validation

Clean npm install; root build/typecheck/test (including existing API tests).
Jest/RTL: loading, success, safe network/HTTP/malformed-response failure, retry,
request timeout and cleanup. Generated browser contract drift check.
Playwright: built UI with actual API through proxy and simulated failure/recovery;
check narrow viewport and keyboard retry. Review direct licenses and npm audit.
Check changed documentation links/statuses, whitespace and staged scope.

## Implementation steps

1. Record this plan and refine permanent item to the authorized slice.
2. Add workspace, health UI, generated types and local proxy.
3. Add relevant unit/UI and built-browser checks; execute validation.
4. Synchronize docs/evidence, move completed plan and commit locally.

## Completion checklist

- [x] Acceptance criteria verified with executable evidence.
- [x] Documentation and dependency checks completed; limitations recorded.
- [x] Item/backlog synchronized and plan moved to completed.
- [x] Scoped local commit created; ask owner before pushing to origin.

## Evidence and deviations

Initial checkout clean. Git branch creation required an approved sandbox escalation.
Default environment has Node 20.18.3, below the existing repository requirement.


## Final validation evidence

- Temporary runtime: Node 24.21.0 / npm 10.9.2 under `/private/tmp/iop-017-runtime`;
  the default user runtime was not changed.
- Clean `npm ci`: 533 packages installed, 536 audited, zero vulnerabilities.
  Transitive glob and whatwg-encoding deprecation warnings remain; no audit finding.
- `npm run typecheck` and `npm test`: passed. Both hosts built; API 3 suites / 24
  tests and frontend 2 suites / 11 tests passed. Browser OpenAPI drift check passed.
- `npm run test:e2e`: 2 Chromium tests passed (12.5 seconds), using the compiled
  API and built frontend via Vite preview. Verified actual same-origin health,
  safe non-JSON HTTP failure, keyboard retry/recovery and 375px layout without
  horizontal overflow. Mobile screenshot inspected: readable and unclipped.
- Health consumer checks include additive fields, invalid payloads, failed HTTP,
  non-JSON/network failures; UI checks cover loading, success, safe failure/retry,
  five-second timeout and unmount cancellation.
- All direct frontend dependency license metadata/files reviewed: MIT or Apache-2.0.
  Playwright includes NOTICE; TypeScript includes ThirdPartyNoticeText.txt.
- Changed Markdown local links, Completed item/backlog status and whitespace checked.
- No new architecture decision, API modification or scope expansion. ADR-0018
  remains Proposed. No CSV, charts, storage, authorization, Docker or CI delivered;
  POC increment 1 remains incomplete. Browser evidence covers Chromium only.

Implementation references: [Vite server proxy](https://vite.dev/config/server-options),
[Vite preview](https://vite.dev/config/preview-options),
[Jest DOM environment](https://jestjs.io/docs/test-environment) and
[OpenAPI type generation](https://openapi-ts.dev/cli). Versions and licenses checked
against npm metadata and installed distributions. Git publication still requires
explicit owner authorization under AGENTS.md and ADR-0008.
