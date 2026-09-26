# Local API host

IOP-016 implements process liveness only. This is the API composition host for the
modular monolith; it contains no business modules or database connection.

## Run from the repository root

Use Node 24.21.0 (`nvm install && nvm use`, when nvm is installed) and npm 10.9.2. Dependencies
are pinned in the workspace manifests and root lockfile. If your Node installation
bundles a different npm major, select the verified version with
`npm install --global npm@10.9.2` before installing this workspace.

```sh
npm ci
npm run build
cp config/poc.example.json config/poc.local.json
chmod 600 config/poc.local.json
IOP_CONFIG_FILE="$PWD/config/poc.local.json" npm start
```

In a second terminal:

```sh
curl --fail http://127.0.0.1:3000/health
```

Expected: HTTP 200, `application/json`, `{"status":"ok"}`. The listener defaults
to IPv4 loopback. HOST accepts only `127.0.0.1` or `0.0.0.0`; the latter is for
the private Compose network with explicit `IOP_TRANSPORT=container`, never native
shared/LAN operation. Add `PORT=3001` to the configured startup command to use another port. PORT must be an
integer from 1 to 65535; absence defaults to 3000, an empty value is invalid.
No `.env` file is loaded and no database or secret configuration is needed.
IOP-018 requires explicit, validated local scope configuration; see the
[configuration contract](../../docs/development/local-configuration.md). Stop with
Ctrl-C or SIGTERM. Startup failures exit nonzero with a sanitized field or listener diagnostic;
configuration values and exception details are not logged.

## Checks and contract

```sh
npm run typecheck
npm test
npm run openapi
```

`npm test` builds first and enables the VM module support required by Jest when
loading Nest 12 ESM packages from the CommonJS TypeScript build. Node emits its
experimental VM-module warning during tests. It runs Jest/Supertest checks plus compiled
process tests. Tests open ephemeral local ports and need permission to listen.
`npm run openapi` regenerates [the reviewed artifact](contracts/openapi.json)
from Nest DTO/operation metadata; the integration test detects artifact drift.
The verified dialect is OpenAPI 3.0.0. No documentation route or Swagger UI is served.

`GET /health` is public and requires no identity, organization/site or permission.
It proves only that the process responds, not readiness of storage/import/analytics.
It rejects nonempty query strings and request bodies and returns no application configuration or data.
Unknown routes/versions and unsupported operations return 404 Problem Details.
IOP-022 implements the common error contract below; domain-specific errors accompany
future endpoints.

## POC error contract (IOP-022)

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
standard reason phrase (or `HTTP Error` for unassigned statuses). The Express body-parser `entity.too.large` error maps to 413 (the current host
JSON parser budget is 100 KiB; future CSV uploads need their own budgets). Known parser syntax/depth failures map to 400 and unsupported encoding/charset
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
400s have no validation entries. No DTO validation engine or CSV parser is added.

Example (the identifier varies):

```json
{"type":"urn:iop:problem:bad-request","title":"Bad Request","status":400,"traceId":"ea6162a0-c8cc-4c7d-98a3-d5dd7aff2004","errors":[{"pointer":"/query/reportingDate","code":"invalid"}]}
```

For every 5xx, stderr receives only a JSON record with `event: api.request.failed`,
`status` and the response's `traceId`. Client-provided IDs are ignored. This is
error-occurrence correlation, not request-wide/distributed tracing or an audit log;
4xx responses are not logged. Health success stays unchanged. Network/proxy errors
may not follow this format, and HEAD responses have no body.

Compatibility review: the bootstrap `about:blank` types become explicit catalog
URIs and `traceId` is required. The existing browser uses only health success and
its generic error state; regenerated bindings and tests verify this bounded update.
Shared `ProblemDetails`/`ValidationIssue` DTOs appear in OpenAPI; only the shipped
health route is published. Synthetic routes used to test failures never ship.
Import row failures remain future import-result data, not automatically HTTP errors.

## Boundaries and follow-up

IOP-013 completed the [local health/logging design](../../docs/architecture/health-logging-poc.md);
import diagnostics and their verification remain with future import delivery. See [IOP-015 container instructions](../../infra/docker/README.md) for Compose
integration; IOP-018 supplies local scope validation; IOP-019 owns database bootstrap. No frontend,
worker, database readiness, authentication or business routes are wired into this
health host. IOP-029 supplies the internal authorization boundary below; Accepted
ADR-0018 still requires its local host adapter and executable activation/origin
checks. Loopback binding is a local host choice,
not proof of shared-user security. Hooks/lint/format tooling and CI remain future
scoped work; this bootstrap provides build, type and runtime checks only.

Direct packages use MIT or Apache-2.0 licenses. Installed package distributions
retain their license files (including the reflect-metadata CopyrightNotice).
The lockfile records dependency licenses; any future redistribution/container
packaging must preserve applicable notices. No production readiness is claimed.

## POC input validation (IOP-110)

Health allows zero query fields and zero body bytes. Nonempty raw query strings
(including repeated/nested keys) and nonzero Content-Length or any Transfer-Encoding
are rejected with 400 and fixed `/query` or `/body` pointers before the health
service executes. HEAD uses the same validation and returns no response body.
An empty query marker and explicit zero Content-Length remain valid.

Before route validation, JSON and URL-encoded parsers enforce 102400 actual bytes
(100 KiB), including chunked requests, with decompression disabled. Form parsing
allows at most 10 parameters and nesting depth 1. These are fixed ceilings, not
configurable defaults or CSV upload budgets. At the parser ceiling, health still
rejects a body; above it, parsing returns 413. Malformed JSON/deep forms return 400;
unsupported compressed bodies or charsets return 415. Other media are not parsed
and health rejects their body framing with 400. No input is echoed or executed.
The existing browser and container probes send no query/body and remain compatible.

`test/input-validation.spec.ts` exercises real HTTP boundaries, including actual
chunked bytes without Content-Length. Existing configuration tests remain regression
coverage. This does not enable CSV uploads or analytical queries: their owning
stories must supply semantic constraints, collection/processing budgets, scoped
access and safe rejection/cleanup before exposing those paths. No upload timeout,
performance commitment or shared-user security certification is implied.

## Site-operation authorization (IOP-029)

Accepted [ADR-0026](../../docs/architecture/adr/ADR-0026-poc-authorization-lookup.md)
is implemented under `src/modules/users-rbac`, `src/modules/platform-core` and
`src/persistence/site-operation.ts`. It is not wired into the health host and opens
no business route. The receiving module calls `runSiteOperation(runtimePool,
request, callback)` with a trusted principal, explicit organization/site and a
nonempty permission list defined by the server's operation code. No browser/provider
role claim is trusted. The pool must use non-owner `iop_runtime` credentials and
clean session defaults; the caller owns its lifetime and shutdown.

The boundary validates exact ownership and queries current active user, membership
and assignments on every operation. It denies missing/foreign scope, missing grants,
inactive state, empty/unknown permissions and organization-admin requests. The fixed
reader and operator bundles retain ADR-0014's permissions without inheritance or
cross-site composition. No result cache or login/session assumption is introduced.

One pinned READ COMMITTED transaction installs candidate lookup selectors, checks
access, then installs authorized `iop.user_id`, `iop.organization_id`, `iop.site_id`.
Only then does the callback receive an immutable context and query handle. Receiving
modules must enforce scoped records/references, await all queries and use this handle
exclusively. They must not issue transaction-control/context changes except savepoints
after entry. Handles reject queries after callback completion; a retry must re-enter
the boundary and authorize again. Business policies/grants remain owning-module work.

Denial throws `SiteAccessDeniedError`; unavailable lookup/driver state throws sanitized
`AuthorizationUnavailableError`. Domain callback errors retain their identity for the
future transport error mapper. Both failure paths roll back; uncertain cleanup or a
contaminated/failed connection destroys it. No 403/503 endpoint mapping is claimed by
this internal slice. Already-authorized work may finish after revocation, but a new
check sees the current state.

API unit tests cover permission bundles, invalid inputs and cleanup failures;
`npm run test:database` exercises the compiled boundary under real runtime credentials,
including a disposable scoped table, revocation, pool reuse, timeout/cancellation and
terminated connections. Runtime column grants are documented in the
[database guide](../../infra/database/README.md#current-site-authorization-lookup-iop-029).
ADR-0018's trusted local adapter, activation, loopback/origin checks and future
import/read integration remain required before any business route is opened.

## Pure POC CSV preparation (IOP-045)

The Integrations index exports `prepareCsv(filename, bytes, startedAt?)`,
`parseCsvReportingDate`, `CsvAdapterError`, `CSV_LIMITS` and adapter revision
`hitliste-poc-v1`. Input is one complete Buffer and the original upload basename.
The adapter has no file/network/database access and does not select organization,
site or source. Source vocabulary is confined to the adapter.

It implements the [source profile](../../docs/architecture/csv-source-contract-poc.md)
with the [fixed preservation budgets](../../docs/architecture/csv-preservation-poc.md):
5 MiB, 20,000 data records, 25,000 physical lines, 4,096 decoded UTF-16 code units
per field, 32,768 per physical record and a 30-second processing deadline. It
checks byte length before decoding, line length before slicing and field length
before appending. No disk spooling or configurable cap increase is provided.
A terminal newline does not invent another blank physical line.

Successful preparation returns neutral source records, their original physical
line numbers, original duration text, exact frequency/seconds and totals, blank
counts and repeated-tuple flags/counts (including the first member). It preserves
all repeated records and all nonempty areas, without choosing classifications.
The filename supplies a reporting-date label with an explicitly unknown window.
No occurrence time, physical asset or downtime is inferred.

Failure throws one fixed `CsvAdapterError` with code and optional physical line/
neutral field, without raw values or partial records. Fail-fast inspection leaves
the remainder unknown; it does not report a complete invalid/data count. This is
not an OIP publication payload. For multiple diagnostics and IOP-042-compatible
counts, use the IOP-046 report below; composition still supplies classification
and validates the receiver contract. A prepared dataset is not an admitted import.

Future composition must authorize and persist immutable scoped RAW before
preparation, validate receipt/date/revision consistency, share its monotonic
`performance.now()` start across validation/mapping, and publish only after all
checks and the successful date claim. Deadline checks occur after decoding, at
every physical line and before return; the bounded synchronous adapter does not
preempt a native decode or provide HTTP upload cancellation. Host admission,
origin protection and request deadlines still require their own delivery tests.
Original buffers are never changed; callers remain responsible for RAW retention.

Run `npm test --workspace @iop/api -- --testPathPatterns csv-adapter` for the
fictional byte fixture, exact arithmetic, malformed input and budget boundaries.
The missing legacy Python duration helper prevents claiming conversion parity.
See the [execution record](../../docs/planning/completed/IOP-045-csv-adapter-plan.md).


## POC CSV validation report (IOP-046)

`validateCsv(filename, bytes, startedAt?)` uses the same parser and fixed limits as
`prepareCsv`, which retains its fail-fast throwing behavior. On `status: valid`,
`prepared` contains the unchanged full result. On `status: invalid`, only safe
`reason` and `inspection` metadata are returned, never records or partial totals.
Unexpected programming errors propagate rather than becoming input rejections.

Value errors (including individual exact-integer overflow) retain one diagnostic
per invalid row and continue scanning. Structural/encoding/header errors, resource
limits, cumulative overflow and deadline expiration stop inspection: total records
remain `null`, even when a prefix was inspected. Empty/header-only input is invalid
with a complete zero-record count. Two valid plus one invalid row reports 2/1/3;
no row is admitted by this function. Blank/header lines are excluded from counts
and retained in physical line numbering. Repeated valid tuples remain warnings.

Diagnostics retain at most 100 entries; `diagnosticsTruncated` indicates omitted
entries, independently of complete inspected counts. Codes and neutral fields use
IOP-042's existing vocabulary: numeric overflow/timeouts become `limit-exceeded`,
invalid filename becomes `invalid-value`, and empty input becomes `invalid-record`.
`reason` preserves the precise first value error, or the terminal interruption code.
A line beyond the 25,000-line budget is omitted from stored diagnostic metadata.
No source values, paths, error stack or raw rows are included in reports.

`CsvInspection` intentionally omits `unclassifiedCount`: scoped mapping has not
run. Composition must supply that count to create an IOP-042 `Inspection`; it must
not assume missing classification is zero. Receipt, rejected/admitted counts,
publication, permission checks and `imports.review` retrieval remain batch/host
responsibilities. Reports neither authorize access nor prove a durable outcome.
The receiving OIP module must independently validate its invariants.

Run `npm test --workspace @iop/api -- --testPathPatterns csv` for preparation and
report scenarios. See the [execution record](../../docs/planning/completed/IOP-046-import-validation-plan.md).

## Scoped source classification (IOP-049)

`SourceMappings` is an internal Integrations stage after `prepareCsv` or a valid
`validateCsv` result. Construct it from configuration, then call
`mappings.classify(receiptSource, prepared)`. It opens no endpoint or database
connection and does not authorize access. The host must bind trusted configuration
to the seeded site/source and freeze it before receipt; the receiver must validate
the resulting envelope against that receipt before publication.

Configuration has `organizationId`, `siteId`, `sourceId`, `mappingRevision`,
`sectors: [{ sectorKey, label }]` and `areas: [{ sourceArea, sectorKey }]`.
Use local customer configuration outside Git for real labels; tests use fictional
ones. IDs/revisions/sector keys use the existing 1–64 ASCII alphanumeric/underscore/
hyphen identifier profile, beginning with an alphanumeric character. Lists are
bounded at 20,000 entries each (the POC record ceiling); area/label strings at 4,096
UTF-16 code units (the field ceiling). Empty lists explicitly classify all records
as unclassified. Blank text, NUL/newlines, unknown sector references, duplicate
sector keys and duplicate normalized area keys fail before classification, including
identical duplicate assignments. Errors contain fixed codes without source values.

Area matching trims only outer ASCII spaces/tabs and compares exactly, preserving
case, internal spaces, accents, punctuation and nonbreaking spaces. Display labels
are separate from identity and preserved verbatim. A sector key must retain the same
reporting concept across revisions; a changed concept needs a new key. Renaming a
label may retain its key. The configuration owner is responsible for this semantic
continuity; the pure helper cannot compare independently loaded historical files.
Every content change requires a new revision; never reuse one for changed rules.

The returned immutable `ClassifiedCsv` carries the full frozen `mapping` snapshot,
records with `classificationStatus`/`sectorKey`, and `unclassifiedCount`. Organization,
site, source and mapping revision must exactly match the supplied receipt source.
Source fields, physical line references, measures, duplicate flags and totals survive
unchanged. Unmatched nonempty areas have a null key; they are retained in totals.
Use `Unclassified` as the default presentation label, independently of sector keys.
Copy `unclassifiedCount` into the future batch inspection handoff; it may overlap
with repeated-record counts and must not be added to the total record count.

This API takes adapter-validated records, not untrusted JSON or client-provided
scope. Mapping persistence, publication composition, actual owner-list reconciliation
and host activation remain pending. Frozen in-memory output is not durable storage;
DAX comparison parity and runtime authorization are not claimed.
