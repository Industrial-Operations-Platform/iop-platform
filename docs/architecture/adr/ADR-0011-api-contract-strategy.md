# ADR-0011: REST API and explicit boundary contracts

## Status

Proposed on 2026-09-14 under [IOP-003](../../planning/items/IOP-003-api-contract-strategy.md).
Awaiting explicit owner acceptance. Every convention below is proposed; this record
neither changes the accepted baseline nor authorizes endpoint implementation.

## Context

IOP is a modular monolith with NestJS, React and PostgreSQL accepted under
ADR-0001/0003/0006/0010. V1 covers CSV import, normalization and predefined
executive/detail analytics. One maintainer owns the stack. There is no application,
API, external consumer commitment or measured performance baseline.

The item requests API style, versioning, errors and contracts. Its seed names
REST/other approach without a detailed option list. The alternatives below make
that comparison explicit. Identity/session design, physical tenancy, exact metric
semantics, source schemas and asynchronous delivery remain separately scoped.

## Alternatives considered

The fit assessments are project judgments based on the accepted scope, not
benchmarks or claims that a protocol inherently enforces module boundaries.

| Style | Strengths for IOP | Cost or limitation | Assessment |
| --- | --- | --- | --- |
| REST over HTTP with JSON and OpenAPI | Explicit operations, standard HTTP behavior, language-neutral descriptions and Nest integration; purpose-built analytics responses fit fixed reports. | Requires deliberate schemas, compatibility review and bounded queries; poorly designed resources can cause excessive requests. | Recommend for the browser-facing business API. |
| GraphQL | Typed schema and client-selected fields can serve consumers with different graph-shaped data needs. | Adds resolver ownership, query-cost controls and field-level scope review; fixed v1 views do not establish a need for client-defined graph queries. | Reconsider with demonstrated heterogeneous query needs. |
| tRPC | Type inference suits a TypeScript frontend/backend and reduces manual type wiring. | Makes the primary consumer contract dependent on TypeScript router types; language-neutral API descriptions need a separate approach. | Viable for a tightly coupled UI, weaker fit for the API-first platform boundary. |
| gRPC / gRPC-Web | Explicit protobuf service contracts and generated clients; useful for service-oriented communication. | Browser integration adds a distinct protocol/tooling surface; no distributed service or streaming requirement exists in v1. | Do not introduce it for this scope. |

Capability references: [GraphQL overview](https://graphql.org/learn/),
[tRPC documentation](https://trpc.io/docs/),
[gRPC-Web tutorial](https://grpc.io/docs/platforms/web/basics/) and
[Nest OpenAPI integration](https://docs.nestjs.com/openapi/introduction).
No subscriptions, WebSockets, broker or second public API style is selected.

## Proposed decision

### HTTP style and versioning

Use REST-oriented HTTP resources and purpose-built analytical read representations.
JSON is the normal request/response format; a future CSV upload operation documents
its own media type. Do not expose database tables or a generic SQL/query endpoint.
Use GET for safe reads with documented filters, and POST for submissions. Follow
HTTP method/status semantics; do not return business failures as HTTP 200.
A future asynchronous operation may return 202 only after accepting work and must
expose a documented status reference. This does not select a queue or retry policy.
See [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html).

Use an explicit major version in business API paths, starting with `/api/v1`.
This is compatible with the same-origin relative routing accepted in ADR-0010.
Do not silently route unknown versions to the latest. Operational health endpoints
may remain version-neutral; their implementation belongs to backend bootstrap.

| Versioning option | Tradeoff | Proposal |
| --- | --- | --- |
| URI major version | Visible in requests, logs and contract paths; new major versions change URLs. | Select for straightforward inspection and routing. |
| Header or media-type version | Stable URLs but version negotiation is less visible and needs consistent client/proxy handling. | No established benefit for v1. |
| Unversioned API | Smallest initial setup, but breaking changes lack an explicit consumer boundary. | Reject as the business API default. |

Nest supports these versioning mechanisms; see [Nest versioning](https://docs.nestjs.com/techniques/versioning).
The route major is distinct from the OpenAPI specification dialect and the
contract artifact's release version.

Preserve existing request/response semantics within a major. Clients tolerate
unknown response fields. Optional additions are compatible only when existing
clients retain their behavior. Removing/renaming fields, changing types, units,
nullability, required inputs or metric meaning requires a breaking-change review
and normally a new major. New response enum values are potentially breaking for
exhaustive clients; review rather than automatically classifying them as additive.
Before retiring a used major, document affected consumers, migration and an
owner-approved retirement date. No unsupported lifetime/SLA is promised here.

### Contract source and ownership

Use OpenAPI as the language-neutral HTTP contract artifact. Propose a Nest
code-first authoring workflow: dedicated transport DTOs, explicit operation and
response metadata, and runtime validation generate a reviewable OpenAPI artifact.
Review the contract shape before implementing each operation; generation must not
make incidental controller or persistence details into public commitments.
Nest supports generating and saving this document through its Swagger integration.
See [Nest OpenAPI integration](https://docs.nestjs.com/openapi/introduction).

| Authoring approach | Tradeoff | Proposal |
| --- | --- | --- |
| Nest DTOs/metadata with generated OpenAPI | Fits the accepted framework and avoids separately hand-maintaining the entire HTTP schema; generation can omit constraints or responses. | Select with artifact review and runtime conformance checks. |
| Hand-authored OpenAPI with generated server/client code | Makes independent consumer design explicit; adds generator integration and synchronization work. | Reconsider if independently released consumers drive the contract. |
| Shared TypeScript interfaces alone | Convenient compile-time reuse but cannot describe all HTTP behavior or validate untrusted input at runtime. | Insufficient as the API contract. |

Pin the exact OpenAPI dialect and compatible generation/validation/client tools
in bootstrap after a round-trip check; do not claim a specific dialect works with
unpinned dependencies. The [OpenAPI specification](https://spec.openapis.org/oas/v3.1.1.html)
defines operations, schemas, responses and security descriptions. This proposal
selects OpenAPI, not a claim that version 3.1.1 is installed or the latest version.

Each operation must document its owning module, stable operation ID, scope and
permission requirement, input schema/limits, success and error responses, and
examples without real customer data. Specify optional versus nullable values,
units, period/time-zone semantics and enumeration evolution. Browser types/client
bindings derive from the reviewed artifact; do not import Nest classes, ORM
entities or server internals into React. Exact generator/package layout is deferred.

Keep runtime input validation at the transport boundary and domain invariants in
the owning module. Reject unknown request fields and invalid filters instead of
silently broadening a query. TypeScript typing or generated OpenAPI alone does
not provide runtime validation; see [Nest validation](https://docs.nestjs.com/techniques/validation).
Future checks must compare declared schemas with actual serialization/validation.

Internal module contracts remain explicit, owner-published TypeScript interfaces
and data structures, independent of HTTP and provider tokens. HTTP DTOs map into
those contracts; sharing a process does not require internal HTTP calls.
`packages/contracts` is only for deliberate boundary contracts, not internal
entities. Source adapters translate vendor formats into receiver-owned ingestion
contracts. This preserves the [module rules](../modules.md) without selecting
module placement, cross-module transactions or reliable event delivery.

### Response and analytical conventions

Return a resource object for a single resource. Collections use `items` and `page`
metadata. For potentially large detail lists, propose opaque cursor pagination
with a bounded `limit` and nullable `nextCursor`; every operation sets its own
finite default/maximum and deterministic ordering with a tie-breaker.
Cursors must be checked against the authorized scope and original filters/order;
never treat possession of a cursor as permission. Cursor encoding and snapshot
consistency belong to the endpoint design. Do not promise page-number navigation
or exact totals by default; offset pagination needs an explicit use-case review.

Analytical responses may use a purpose-built object containing series, summaries
and metadata. Pagination applies to detail rows, not partial aggregation of a
whole report. Bound filters, date ranges and grouping cardinality per operation.
Expose applied filters, source period/grain, units and available coverage/quality
information so clients distinguish empty results from incomplete data. Exact
metric IDs, schemas, limits and unknown-period behavior belong to the analytical
contracts; this ADR does not invent reporting boundaries or downtime semantics.
Canonical IDs are opaque to clients; source equipment labels remain scoped data.

### Errors

Use RFC 9457 Problem Details with `application/problem+json`. For application-owned
errors, require `type`, `title` and `status`; use safe optional `detail` and
`instance`. The body status matches the HTTP status. Stable documented problem
`type` URIs identify error categories; clients must not parse human prose.
Propose `traceId` as a correlation extension and `errors` for validation entries
with a documented field pointer and machine-readable code. Exact URI namespace,
error catalog and correlation plumbing belong to IOP-022/IOP-013.
These extensions are IOP conventions, not RFC-defined fields.
See [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html).

| Situation | Proposed HTTP mapping |
| --- | --- |
| Malformed syntax, invalid fields/filters or missing required scope selector | 400 with validation details where safe. |
| Missing/invalid authentication | 401; authentication challenge follows the future selected scheme. |
| Authenticated but disallowed operation | 403. |
| Missing resource, or resource inaccessible within the authorized scope | 404 without revealing whether another customer's resource exists. |
| Conflict with current resource state | 409. |
| Request body too large / unsupported media type | 413 / 415. |
| Rate limit / temporary service unavailability | 429 / 503; document retry guidance where applicable. |
| Unexpected server failure | 500 with generic public detail and internal correlation. |

Prefer 400 consistently for input validation over introducing a 400/422 split
without a use-case benefit. Never expose SQL, stack traces, credentials, source
rows or other customers' identifiers in errors. Failed CSV rows in an accepted
import are import-result data with reconciliation, not automatically a failed
HTTP request. Infrastructure errors outside the API may not use Problem Details;
clients still handle network failures and non-JSON responses safely.

### Authentication, authorization and customer scope

Apply Accepted ADR-0004/0005: verified identity maps to a platform principal;
Users/RBAC resolves permission and allowed customer/site scope. Request selectors
are untrusted inputs, not grants. Every operation documents whether customer or
site scope is required and validates referenced resources against it. Missing or
invalid scope must never fall back to an unrestricted query. Provider claims,
cookies/tokens and identity SDKs do not enter module business contracts.

Scope checks also apply to list queries, analytical aggregation, import/status
references and any future caches. UI filters are not authorization controls.
This proposal does not select scope transport, an identity provider, a session
mechanism, database enforcement or a caching implementation.

## Consequences

One HTTP convention gives the frontend a reviewable contract and leaves modules
independent of transport. The cost is maintaining accurate DTO metadata, runtime
validation, error translation and compatibility evidence. A generated client
cannot establish authorization, analytical correctness or contract conformance.
Purpose-built report responses avoid transferring domain interpretation to charts,
but their size and query performance still need measurement.

Acceptance should update ARCHITECTURE.md and module contract guidance, then close
the IOP-003 design item. IOP-016 owns API bootstrap; IOP-022 owns error-model
implementation; frontend/CI stories own consumer integration and checks. Those
stories are not activated here. No endpoint, dependency manifest or executable
OpenAPI file is produced by this evaluation.

## Review scenarios and future verification

These are design walkthroughs, not executed runtime tests.

| Scenario | Expected behavior under the proposal | Design review |
| --- | --- | --- |
| Authorized report query | Bounded query; documented aggregate semantics and coverage; only permitted customer/site data. | Fits v1 reports without graph queries. |
| Empty or incomplete source data | Successful response distinguishes no results from known coverage/quality limitations. | Exact analytical fields remain with metric contracts. |
| Invalid or unknown filter | 400 Problem Details; no silent unfiltered query. | Validation and errors agree. |
| Foreign resource ID or reused cursor | Scope rechecked; no foreign data or existence disclosure; invalid cursor rejected. | Consistent with ADR-0005. |
| New optional response metadata | Existing client ignores unknown fields; semantics unchanged. | Compatible only after consumer review. |
| Renamed field or changed duration unit | Breaking-change review and major-version migration. | Prevents silently misleading reports. |
| Accepted import with rejected rows | Documented run/result reports accepted and rejected inputs; HTTP acceptance is not import success. | Does not choose background delivery mechanics. |
| Unexpected database failure | Generic 500 Problem Details with correlation; no SQL or source data. | Consistent error boundary. |

During implementation, validate the generated artifact, compare contract changes,
exercise actual success/error responses with Supertest, check the generated
consumer and verify cross-customer cases. Use the accepted testing stack from
ADR-0010; exact commands and pinned-tool compatibility require bootstrap.
Sources above were consulted on 2026-09-14. No runtime or performance checks ran.
