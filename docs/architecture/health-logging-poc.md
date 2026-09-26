# Local POC health and diagnostic logging

IOP-013 design baseline for the [local POC](../product/scope-poc.md).
This specializes existing host behavior and [ADR-0011](adr/ADR-0011-api-contract-strategy.md)
without adding a logging service, readiness endpoint or architectural mechanism.
Implementation evidence remains with each delivered path.

## Health and startup visibility

`GET /health` remains public, version-neutral and input-free: HTTP 200 with
`{"status":"ok"}` means the API process responds. It returns no version,
configuration, scope, principal or database details. Database unavailability does
not change that meaning. A reachable web page likewise does not prove API health.
Neither signal proves migrations, grants, RAW storage or analytics are ready.

The existing host reports its validated listening address after binding, and exits
nonzero on startup failure with a fixed listener diagnostic or safe configuration
field name. Do not echo submitted values or exception objects. Keep local startup
and health commands in the [API guide](../../apps/api/README.md) and
[Compose guide](../../infra/docker/README.md), rather than inventing parallel commands.
The listener failure text is a starting point for inspection, not a diagnosis of
every possible bootstrap fault.

Before demonstrating imports, follow the delivered migration/seed instructions and
exercise a known scoped import/read. That evidence, rather than a green health
badge, establishes usability. ADR-0018 is Accepted; its adapter/grant/RLS verification
remains pending. Health never opens or bypasses business access.

## Error diagnostics and correlation

Retain the [IOP-022 contract](../../apps/api/README.md#poc-error-contract-iop-022):
each application error has a fresh server-generated UUID `traceId`. A 5xx emits
one stderr JSON record containing only `event: api.request.failed`, numeric
`status` and that same `traceId`. Client-supplied IDs are ignored. It identifies
one error occurrence, not an entire request journey or distributed trace.
Ordinary 4xx responses are not logged; their identifiers need not have a matching
console entry. Do not add per-request success or health-poll logs for this POC.

Public validation errors remain limited to 50 fixed-schema pointer/code entries,
with pointers at most 256 characters. Import row diagnostics are separate scoped
result data, not extra unrestricted Problem Details fields. The current API has
no database or importer; its implemented 5xx record does not identify an import.

Future import delivery must make a failure diagnosable through the existing
application-generated opaque `importId` and safe stored outcome. When an admitted
attempt fails with an HTTP problem, retain its error `traceId` with that attempt's
bounded diagnostics so an authorized review can connect it to the console record.
This is an implementation handoff, not a claim that such persistence exists today.
An identifier provides correlation only; retrieval still requires explicit scope
and `imports.review`. Never copy browser-supplied scope or identifiers into logs.

Before durable receipt, report only the safe API error; do not invent a persisted
import ID, RAW reference, checksum or count. A disconnect/crash may produce no
response or log. An unfinished attempt remains incomplete until reconciled by
the importer; absence of an error log never establishes success. After an uncertain
commit, resolve the existing import identity before retrying, as required by the
[CSV preservation contract](csv-preservation-poc.md).

## Bounds and exclusions

Use the existing fixed-field error record rather than logging arbitrary messages
and attempting to redact them afterwards. UUID/status/event fields bound each
record. Startup diagnostics use reviewed static text and validated listener fields.
No new free-text diagnostic field or logger package is required.

For retained import diagnostics, reuse the preservation contract's maximum of
100 entries per attempt and 256 characters per fixed reason, with explicit
truncation. Use safe reason codes, physical line numbers and neutral field names;
no raw cell excerpts. Counts not established before failure remain unknown.
These bounds do not permit one console record per rejected row.

Exclude credentials, tokens, connection strings, headers, request URLs/query
values, bodies, CSV bytes/cells, filenames, customer labels, SQL, stacks and raw
exception objects from application diagnostics. Source evidence belongs only in
the scoped preservation/review path. Browser failures show a safe category and
available error reference; never dump a response body or source data to the console.

Console output is local troubleshooting evidence, not durable audit or retained
import truth. Fixed record size does not bound total process/container output over
an unlimited run. Keep demonstrations finite; retained terminal/Compose captures
remain under the trusted operator's control and outside Git. Do not introduce an
application log store, rotation service or retention SLA in this slice. Shared
hosting, metrics collection, distributed tracing, operational dashboards, full
audit and production retention remain deferred.

## Scenario review and delivery handoff

The following are design walkthroughs, not executed runtime tests.

| Scenario | Required outcome and verification owner |
| --- | --- |
| Valid startup; invalid configuration; occupied port | Listening message only after bind; safe failure/nonzero exit. Host/configuration delivery verifies actual stdout/stderr and supplied-secret exclusion. |
| API responds while database is unavailable | Health still describes process liveness only; business operation fails safely. API/persistence delivery verifies no readiness claim or access bypass. |
| Unexpected 5xx with secret-bearing exception | Generic Problem Details and one fixed-field stderr record with identical server UUID, no exception text. API delivery verifies response/log agreement. |
| Invalid input, foreign reference or forged correlation ID | Safe 4xx, no reflected data/foreign existence, fresh error UUID and no ordinary 4xx console entry. API delivery verifies this separately from authorization. |
| Valid or rejected admitted CSV; duplicate date | Authorized import review shows stable import identity, outcome and bounded diagnostics; duplicate adds no facts. IOP-041/042/045–048 verify persistence and correlation. |
| Oversize, timeout before receipt or interrupted publication | No fabricated durable receipt; incomplete/uncertain outcomes require reconciliation. Import delivery verifies cleanup, limits and absence of false success. |
| More than 100 import issues, oversized reason or hostile cell | Bounded safe diagnostics with visible truncation; no cell/filename/secret in console or public errors. Import delivery tests limit and limit-plus-one inputs. |
| Proxy/network failure or missing console output | UI gives a safe unavailable state; no invented trace/import reference or successful outcome. Frontend delivery verifies non-JSON and disconnected responses. |

Future implementation must run its relevant API tests (`npm test`) and importer/UI
checks, including captured output assertions. This document introduces no runtime
behavior and does not claim that pending import or business-access checks pass.
