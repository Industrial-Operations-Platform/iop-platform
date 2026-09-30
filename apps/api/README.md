# API application

Run `npm run local:up` from the repository root for the complete application.
The [operator guide](../../docs/development/running-poc.md) owns startup, imports,
reporting and optional native development. See [architecture](../../ARCHITECTURE.md)
for module responsibilities and hexagonal boundaries.

## Composition and access

`src/host/runtime.ts` composes Users/RBAC, Integrations and OIP. NestJS controllers
are inbound adapters; module application code owns ports and use cases; PostgreSQL
adapters implement persistence and reporting. Immutable publication/query infrastructure remains reusable behind these boundaries.
`src/main.ts` and `src/generate-openapi.ts` are the only root entry points;
configuration, Nest composition, HTTP errors and health live under `src/host`.
CSV decoding/mapping lives under Integrations `adapters/csv`; SQL publication,
queries and lookups live under each owning module’s `adapters/postgres`.
Users/RBAC domain rules and application lookup ports have no SQL dependency.
The shared `src/persistence/site-operation.ts` remains the pinned transaction
boundary mandated by ADR-0026. Module barrels are adapter/composition facades;
domain/application code must import only inward-owned contracts.

Business activation requires explicit local execution, configured identity/scope,
origin checks and runtime credentials. Every scoped operation checks current grants
on a pinned transaction and uses forced RLS. The POC exposes one Administrator;
third-party authentication replaces the temporary identity adapter before shared use.
Compatibility `/api/v1/demo/context` and `/api/v1/demo/user` paths are retained;
there is no separate demo application directory.

Without business activation, `/health` and a disabled local-context response remain
available. `/health` reports process response only, accepts no query/body and reveals
no scope or storage readiness. The [configuration contract](../../docs/development/local-configuration.md)
describes the independent health-only path.

## Import and reporting contracts

| Concern | Canonical reference |
| --- | --- |
| CSV decoding, source fields and exact duration | [Source contract](../../docs/architecture/csv-source-contract-poc.md) |
| RAW retention, budgets and provenance | [Preservation contract](../../docs/architecture/csv-preservation-poc.md) |
| Scoped grants and pinned operation | [ADR-0026](../../docs/architecture/adr/ADR-0026-poc-authorization-lookup.md), [database guide](../../infra/database/README.md) |
| Atomic import publication | [ADR-0027](../../docs/architecture/adr/ADR-0027-poc-import-publication.md) |
| Immutable facts and classification | [Aggregate model](../../docs/architecture/event-aggregates-poc.md) |
| Analytical transport and request/response schemas | [OpenAPI](contracts/openapi.json) |

The Integrations adapter exports `prepareCsv`, `validateCsv` and `SourceMappings`.
Pure preparation does not admit an import; the application composes authorization,
RAW retention, inspection, classification and atomic publication. Duplicate dates
are rejected within organization/site/source. No partial facts are published.

`POST /api/v1/analytics/report` returns full-history measures and bounded groups,
periods and contributing rows. `GET/POST /api/v1/analytics/profile` reads/version-saves
historical preparation. Reads require `analytics.read`; saves require `imports.submit`.
Import-time facts remain immutable; explicit profile changes update the relational
analytical projection. See the operator guide for normalization and sector editing.

## Validation and generated contracts

From the root with Node 24.21.0/npm 10.9.2 and installed dependencies:

```sh
npm run typecheck
npm test
```

The [testing guide](../../docs/development/testing-poc.md) documents actual-role
PostgreSQL/browser checks and prerequisites. API tests require loopback listeners.
Boundary checks verify framework-free application dependencies and exercise ports
independently, alongside real adapter integration.

After an authorized contract change, `npm run openapi` regenerates the reviewed
OpenAPI 3.0.0 artifact from Nest metadata. Then regenerate web bindings with
`npm run contract --workspace @iop/web` and review both diffs. Drift checks protect
the contract. No Swagger UI or documentation endpoint is served.

## Error contract

The global filter returns `application/problem+json` using
[RFC 9457](https://www.rfc-editor.org/info/rfc9457/), as selected by
[ADR-0011](../../docs/architecture/adr/ADR-0011-api-contract-strategy.md).
Required fields are `type`, `title`, matching HTTP/body `status`, and `traceId`
(a fresh server-generated UUID for each error). Clients use type/status, never
parse titles. `detail` and `instance` are omitted to avoid reflecting request data.

Type URIs use the stable, non-resolving `urn:iop:problem:` prefix plus the suffix
below; this table is their documentation, not a new public route.

| Status | Type suffix | Meaning |
| --- | --- | --- |
| 400 | bad-request | Malformed syntax, invalid fields/filters or missing required scope selector. |
| 401 | unauthorized | Missing/invalid authentication; future authentication adapters must supply their scheme's challenge. |
| 403 | forbidden | Operation disallowed for the authenticated principal. |
| 404 | not-found | Missing route/resource or inaccessible resource; never reveal foreign existence. |
| 409 | conflict | Conflict with current resource state. |
| 413 | content-too-large | Request exceeds the operation's size budget. |
| 415 | unsupported-media-type | Unsupported request representation. |
| 429 | too-many-requests | Request rate limit reached. |
| 500 | internal-server-error | Unexpected failure with no exposed internal detail. |
| 503 | service-unavailable | Temporarily unavailable service. |

Other valid HTTP error statuses retain their status and use `about:blank` with the
standard reason phrase (or `HTTP Error` for unassigned statuses). The Express body-parser `entity.too.large` error maps to 413 (the host
JSON parser budget is 100 KiB; CSV uploads have their own bounded path). Known parser syntax/depth failures map to 400 and unsupported encoding/charset
failures to 415; form parameter overflow maps to 413. Other
non-HTTP failures and invalid exception statuses become 500. Framework exception messages/objects,
SQL, stacks, URLs, headers, payloads and scope identifiers are never serialized.
The filter alone does not implement authentication, limits, retries or business
operations. Future endpoints document any challenge or `Retry-After` behavior;
the filter does not infer them from exception messages.

For explicit `RequestValidationException` failures, 400 adds `errors`, at most 50
entries of `{pointer, code}`. Codes: `required` (missing), `invalid` (syntax/type),
`out-of-range` (outside allowed bounds), `unsupported` (unsupported value).
Pointers are JSON Pointer strings into a logical request object containing `body`,
`query` and `path`; for example `/query/reportingDate`, `/body/name`, or empty for
the whole request. Escape `~` and `/` as `~0` and `~1`. Adapters supply fixed,
reviewed schema paths, never submitted values, dynamic customer keys or source
content. Pointers are limited to 256 characters; invalid metadata is a programming
error and becomes a generic 500. Entries beyond 50 are omitted, so the list is not
an exhaustive validation report. Extra properties are discarded. Generic framework
400s have no validation entries. CSV row diagnostics remain import-result data, separate from HTTP validation errors.

Example (the identifier varies):

```json
{"type":"urn:iop:problem:bad-request","title":"Bad Request","status":400,"traceId":"ea6162a0-c8cc-4c7d-98a3-d5dd7aff2004","errors":[{"pointer":"/query/reportingDate","code":"invalid"}]}
```

For every 5xx, stderr receives only a JSON record with `event: api.request.failed`,
`status` and the response's `traceId`. Client-provided IDs are ignored. This is
error-occurrence correlation, not request-wide/distributed tracing or an audit log;
4xx responses are not logged. Health success stays unchanged. Network/proxy errors
may not follow this format, and HEAD responses have no body.

## File exploration and message choices

`POST /api/v1/analytics/messages` accepts an optional exact `after` cursor and returns
up to 200 referenced, prepared Meldetext values plus `nextCursor`. Follow pages until
null; unused historical catalog entries are excluded. Current `analytics.read` applies.

`POST /api/v1/analytics/source-rows` takes an admitted `importId`, one-based `page`,
ordered `sort` criteria, optional `filters` and optional prior `revision`. It requires `imports.review`
and `analytics.read`, applies exact source scope/RLS, verifies the projection and
sorts the whole file before returning 50 rows. Criteria support sector, area,
equipment, message, type and messageGroup with asc/desc; an empty list means source
line order. Unknown/foreign imports do not disclose their data. Profile changes
invalidate prior pages. Report row fields remain for API compatibility; the UI only
browses contributing rows in the administrative file section.

`filters` maps column names to literal exact strings and combines them with AND.
Allowed keys: sector, area, equipment, message, type, messageGroup, line, frequency
and minutes. Empty values are removed. Text preserves punctuation/case/leading zeroes;
line/frequency are nonnegative integer strings, minutes permits up to two decimals
and matches `round(seconds / 60, 2)`. All values are parameterized, bounded and
validated before persistence. Filtering precedes sorting/pagination. `recordCount`
is the matching count, `totalRecordCount` is the full file count, and `options`
contains up to 200 distinct suggestions per column from the complete scoped file,
restricted by preceding criteria in this order: sector, area, equipment, message,
type, messageGroup, line, frequency, minutes. A field ignores its own/later filters
so alternatives remain available. For example, area choices follow sector, and
equipment choices follow sector and area. An incompatible query can still return
zero records while supplying compatible ancestor choices for correction. The browser
uses debounced source-row reads to preview drafts before Apply.
Integrity validation still covers the whole file, even when filters match no rows.
Administrative file filters include Sundays.

### Analytical calendar

The configured Hitliste source excludes ISO weekday 7 (Sunday). Host composition
injects this policy into reporting and compatibility analytics adapters; the generic
calendar defaults to no exclusions. Eligibility uses the source reporting DATE,
independently of server/browser time zones. Reports expose `excludedWeekdays`, and
monthly executive coverage adds `analysisDays` alongside unchanged `calendarDays`.
Totals, ranking options, period series, admitted dates and both KPI daily averages
exclude those dates. Revisions include the calendar policy. Projection integrity
still covers every fact, including excluded dates. Import history, original bytes,
file source-row browsing and the KPI message catalog retain excluded-date data.

## Generated output

`npm run build` cleans `dist/` before compiling current source. It contains runtime
JavaScript and the OpenAPI generator, never test files or retired source paths.
Do not edit compiled files; rebuild after changing source. Database tooling follows
the same clean-build policy in `npm run db:build`.

## Shift Handover

The host composes framework-free handover use cases with PostgreSQL, configured
Platform Core locations and Users/RBAC lookup adapters. Routes under
`/api/v1/handover` provide the site journal, immutable revision history, issue
follow-up and selected Start highlights. See [the operational contract and guide](../../docs/development/shift-handover.md).

## Workforce

The host composes Workforce planning, site-clock and PostgreSQL adapters with the
Users/RBAC directory and Integrations CSV/email decoder. `/api/v1/workforce` exposes
board, save, preview, import and history operations with current scoped grants.
Administrator profile/entry removal is logical and retains original author names.
See [formats, permissions and validation](../../docs/development/workforce.md).
