# IOP-022 — POC API error model

Status: Completed — 2026-09-26. Authorized by the owner's request to deliver IOP-022 within
the [POC](../../product/scope-poc.md). Branch: `feature/IOP-022-api-error-model`,
created from clean `develop`. [Permanent item](../items/IOP-022-api-error-model.md).

## Changes and steps

1. Dependencies IOP-003 and IOP-016 are Completed and present on develop. Apply
   Accepted ADR-0011's Problem Details strategy; no new architectural pattern.
2. Replace the bootstrap filter with a bounded host error catalog and shared DTOs,
   structured validation exception, server-generated error trace IDs and sanitized
   server-error logs. Preserve generic handling of untrusted framework exceptions.
3. Update `apps/api/src`, HTTP tests, API README, generated OpenAPI and web bindings;
   document exact types, validation pointers/codes, limits and compatibility.
4. Translate the entire IOP-022 item to English and refine its POC acceptance;
   dependencies read are already English and need no translation. Synchronize
   backlog and the API implementation note in ARCHITECTURE.md.

No business routes, CSV processing, authentication, authorization, database changes,
frontend behavior or full observability infrastructure. Domain-specific error types
and validation rules accompany future endpoints. Synthetic test routes do not ship.

## Validation and evidence

Run `npm run typecheck` and `npm test`; regenerate OpenAPI and browser bindings.
Map the observed Express body-parser size exception explicitly to 413; Nest does
not convert it to HttpException. Exercise unknown routes, supported HTTP error mappings, malformed JSON, oversized
JSON, safe structured validation, unexpected exceptions and correlation/log secrecy.
Check artifact drift, local documentation links, statuses and `git diff --check`.

## Results and closure

- `npm run typecheck`: passed for API, web and database tooling.
- `npm run openapi` and web `contract`: regenerated reviewed DTO schema and bindings;
  `npm test` verified no artifact/binding drift and unchanged health success.
- `npm test`: passed, 79 API + 13 web + 62 database configuration tests (154 total).
  HTTP coverage includes all catalog mappings, unknown routes, safe 500 logs,
  distinct UUIDs ignoring client IDs, malformed JSON, oversized body rejection,
  explicit validation metadata, limits and generic HTTP fallback.
- Node 24.21.0 was selected from `/private/tmp/iop-017-runtime/node_modules/node/bin`
  via PATH. The initial shell used Node 20.18.3 and could not generate Nest OpenAPI;
  rerunning with the repository's required runtime succeeded. Sandbox listeners
  initially failed with EPERM; the approved unrestricted test invocation passed.
- Real HTTP testing exposed Express's non-Nest size exception returning 500; explicit
  recognition now produces sanitized 413, verified by the oversized-body test.
- Local Markdown target checks and `git diff --check` passed. Item/backlog status,
  README and architecture implementation note agree. IOP-022 translated/refined in
  full; dependency stories read were already English and remain unchanged.

All bounded acceptance criteria are met. Only `/health` ships; synthetic error
routes are test-only. No authentication/authorization, CSV, database runtime access,
rate limiter, retries or full tracing has been delivered. Completed plan moved here;
validated changes are committed locally, with publication awaiting owner approval.
