# IOP-110 — POC input validation

Status: Completed (health-only slice). Authorized by the owner's request to work on IOP-110 within
[POC scope](../../product/scope-poc.md) and the [delivery map](../poc-delivery.md).
Branch: `feature/IOP-110-poc-input-validation`, created from clean `develop`.
Story: [IOP-110](../items/IOP-110-input-validation.md).

## Changes and steps

1. Translate the full IOP-110 context to English and refine its delivered-path
   slice. Dependencies IOP-003, IOP-014 and IOP-022 are English, completed design
   or common error implementation, and present on develop. ADR-0011 already
   requires transport validation; no new architectural pattern is needed.
2. Harden the existing health-only API: reject nonempty query strings and any
   framed nonempty/chunked request body before the health service runs, including
   unsupported media. Configure existing JSON/form parsers explicitly at 102400
   bytes (100 KiB), disable decompression, bound form parameters to 10 and depth
   to 1. These fixed parser ceilings are not upload admission limits. Map known
   parser rejection types to sanitized Problem Details; never trust arbitrary
   error status properties.
3. Expected files: API application/health/filter code, focused HTTP tests, API
   README, generated OpenAPI/browser types, this plan, item, backlog and POC map.
   Verify raw chunked transport, byte boundary and one above, malformed JSON,
   unsupported encoding, hostile query/body strings and unchanged valid health.
4. Keep IOP-110 open for future CSV and analytical endpoint validation. No new
   endpoint, DTO engine, importer, authorization, database or UI feature. Existing
   configuration checks run as regression evidence; do not change their scope.

## Validation and evidence

Run `npm run typecheck`, `npm test`, regenerate/review API and browser contracts,
check documentation links/statuses and `git diff --check`. Use real HTTP negative
cases and verify service non-invocation and no input echo. Document actual results.
Node transport timeouts remain existing host behavior; this slice introduces no
upload processing/time budget or performance claim. Future endpoint plans must
specify those budgets before enabling business paths.

## Results — 2026-09-26

- Translated the entire IOP-110 story into English while refining the authorized
  slice; dependency stories were already English and needed no translation.
- Health validation rejects raw query strings and body framing before service
  execution. Explicit JSON/form byte ceilings preserve the former 100 KiB JSON
  budget; decompression is disabled and form parameter/depth limits are explicit.
- Generated OpenAPI advertises 400/413/415 as Problem Details and browser bindings
  match. Valid health and the existing consumers retain their success behavior.
- Used installed temporary runtime `/private/tmp/iop-020-bin`: Node 24.21.0 and
  npm 10.9.2. Initial generation with the shell's Node 20.18.3 failed on Nest ESM;
  regeneration with the project version passed without dependency changes.
- `npm run openapi`, browser `contract`/`contract:check`, and `npm run typecheck`
  passed. Initial sandbox HTTP tests could not listen (EPERM); rerun with local
  listener permission passed. Final `npm test`: 191 passed (9 secret-check, 105 API, 15 web, 62 database
  configuration tests); all 12 suites passed. API execution took 11.785 seconds.
- Tests verify 102400/102401 actual JSON/form bytes, UTF-8 byte counts, chunked
  requests without Content-Length, 10/11 form fields, depth 1/2, malformed JSON,
  unsupported encoding/charset/media, hostile/repeated/nested queries, HEAD and
  service non-invocation. Errors do not reflect supplied content.
- No new architecture decision, database change or endpoint was needed. Browser
  end-to-end and database integration suites are not required for this health-only
  transport change; their existing unit/configuration checks remain covered.

## Closure

Evidence recorded; this plan moved to completed/ and the In progress parent/backlog
were synchronized. Local documentation links, status consistency and
`git diff --check` passed. Publication requires the owner's explicit approval under
the shared workflow. CSV/analytical validation remains open in the parent.
