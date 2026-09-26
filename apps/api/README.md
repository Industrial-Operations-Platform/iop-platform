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
worker, migrations, database readiness, authentication, principal, authorization
bypass or business routes are implemented. ADR-0018 remains Proposed; business
access waits for an accepted mechanism. Loopback binding is a local host choice,
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
