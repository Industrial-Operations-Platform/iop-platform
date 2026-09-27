# Architecture baseline

IOP is the generic industrial operations platform; OIP is its Operational Intelligence
module. The delivered [local analytical POC](docs/product/scope-poc.md) composes a
React/TypeScript/Vite browser, NestJS modular monolith and PostgreSQL. It supports
configured demo user selection, manual CSV upload, retained originals, immutable
aggregate facts, historical analysis and scoped offline reset.
See the [delivery map](docs/planning/poc-delivery.md),
[operator guide](docs/development/running-poc.md) and
[implementation evidence](docs/planning/completed/IOP-147-working-analytical-poc-plan.md).

## Delivered boundaries and flow

- Platform Core owns organization/site identity and the explicit site time zone.
- Users/RBAC owns active principals, organization memberships and fixed site roles.
  The host checks current permissions before each pinned scoped operation.
- Integrations owns RAW bytes, receipt/inspection history, source-date admission,
  CSV decoding/normalization and scoped mapping snapshots. Source schema names and
  customer labels remain in adapters/configuration, outside generic core concepts.
- OIP owns publications, exact immutable aggregate facts, dimension references,
  coverage and analytical queries. Receiving validation binds facts to retained
  RAW and original physical lines. Publication and date admission commit together.
- The host composes these contracts; the browser consumes generated REST/JSON types.
  Overview and detail share one backend selection/result, including full totals,
  bounded groups, cursor pages and original-file provenance.

One fact is a source-reported aggregate line, not an individual incident. Reported
frequency and accumulated alarm seconds are exact additive measures. Duration is
not plant downtime. Filename dates are reporting labels with unknown windows;
missing imports are distinct from no matching records and actual zero measures.
Import-time sector mappings remain frozen. The explicit, versioned reporting
profile in ADR-0031 interprets historical source values without changing original
facts; saving the profile deliberately changes analytical classification. See the [aggregate model](docs/architecture/event-aggregates-poc.md)
and [query contract](docs/architecture/analytics-query-poc.md).

## Identity and isolation

The explicit native `local-demo` mode binds only to loopback and refuses production
or shared/container activation. ADR-0030 extends ADR-0018 with an allowlisted local
user selector and opaque short-lived cookies. Origin/Host checks precede business
handling; selection does not create identities or grant access. The adapter is
replaceable by third-party authentication before shared use; no provider is selected.

Organization is the customer configuration/data boundary; site scope includes both
organization and site, with independent ownership and permission checks. Membership
alone grants no site access. Every operation/page checks current grants, installs
transaction-local scope on a pinned connection and uses explicit predicates plus
forced RLS. Revocation applies to subsequent operations; already-authorized work
may finish. Browser references and tokens are never permission snapshots.

Runtime uses a non-owner role with narrow column privileges and no RLS bypass,
delete or schema authority. Derived analytical references may be updated; original
facts, measures and CSV bytes remain immutable. Separate bootstrap and migrator roles provision the
local installation; migrations never run implicitly on API startup. RLS does not
protect against a compromised trusted backend or privileged installation operator.

## Persistence, consistency and reset

Integrations retains bounded original bytes and failed attempts with provenance.
Successful source/date admission is unique; changed duplicates do not replace data.
A failed publication rolls back facts and its claim. Explicit outcome recovery
inspects durable agreement without automatically replaying bytes.

Each analytical operation uses one SQL snapshot. Revisions fingerprint immutable
source publications; scoped canonical dimension digests and selection-bound cursors
prevent silently mixing selections/pages. Exact sums fail before unsafe JSON number
conversion. Reads have statement and response bounds; full totals never come from
one displayed page. Stable source tuples, unclassified data and repeated lines
remain independently represented.

Reset is an offline migrator operation with a private installation identity and
exact organization/site/source target. A single-host lease and shared operation
locks exclude exclusive maintenance; active runtime connections cause refusal.
Supported schema, seeded ownership and quota accounting are checked before atomic
scoped cleanup. Foreign targets, configuration and principals/grants survive.
Lost commit acknowledgement requires inspection, never automatic replay. Fixture
reload is a separate phase through the real importer. No reset API or database/
volume-drop convenience is provided.

## Contracts and tooling

Use REST/JSON business routes under `/api/v1`, reviewed OpenAPI, generated browser
bindings and sanitized Problem Details with safe correlation. Internal module
contracts remain independent of HTTP and the identity provider. Health bootstrap
can run separately without business activation.

Accepted tools are npm workspaces, Node/TypeScript, NestJS, React/Vite, PostgreSQL,
node-pg-migrate without an ORM, Jest/RTL/Supertest, Playwright and Testcontainers.
The local [testing entry point](docs/development/testing-poc.md) covers unit,
contract, startup, actual-role database and real browser checks. Existing container
health hosts remain separately documented; the analytical demo uses native hosts
and a dedicated local database container. Hooks/lint automation remain future work.

## Future scope and undecided choices

Shared-use authentication/provider/session policy, administration, ORM, broader
module placement, hosting/topology, workers/jobs, operational modules, map storage,
full audit, production retention, backup/restore and formal service targets remain
separately scoped. Historical PDFs inform the product; their SQL/deployment examples
and customer-specific structures are not adopted implicitly. Industrial integrations
remain read-only, with no commands to control plant equipment.

Use the [module map](docs/architecture/modules.md),
[conceptual data model](docs/architecture/data-model.md),
[system context](docs/architecture/system-context.md) and
[glossary](docs/product/glossary.md). Follow the
[planned workflow](docs/planning/workflow.md): authorized scope, story branch,
plan before edits, real validation and preserved evidence. Proposed ADRs remain
proposals; acceptance is never inferred from an old implementation handoff.

## Decision references

- [ADR-0018-local-poc-execution-context](docs/architecture/adr/ADR-0018-local-poc-execution-context.md)
- [ADR-0001-modular-monolith](docs/architecture/adr/ADR-0001-modular-monolith.md)
- [ADR-0002-monorepo](docs/architecture/adr/ADR-0002-monorepo.md)
- [ADR-0003-postgresql](docs/architecture/adr/ADR-0003-postgresql.md)
- [ADR-0004-authentication-abstraction](docs/architecture/adr/ADR-0004-authentication-abstraction.md)
- [ADR-0005-customer-isolation](docs/architecture/adr/ADR-0005-customer-isolation.md)
- [ADR-0006-backend-stack](docs/architecture/adr/ADR-0006-backend-stack.md)
- [ADR-0007-planned-workflow](docs/architecture/adr/ADR-0007-planned-workflow.md)
- [ADR-0009-local-delivery-tooling](docs/architecture/adr/ADR-0009-local-delivery-tooling.md)
- [ADR-0010-frontend-charting-testing](docs/architecture/adr/ADR-0010-frontend-charting-testing.md)
- [ADR-0011-api-contract-strategy](docs/architecture/adr/ADR-0011-api-contract-strategy.md)
- [ADR-0012-organization-site-scope](docs/architecture/adr/ADR-0012-organization-site-scope.md)
- [ADR-0013-tenancy-data-isolation](docs/architecture/adr/ADR-0013-tenancy-data-isolation.md)
- [ADR-0014-scoped-rbac](docs/architecture/adr/ADR-0014-scoped-rbac.md)
- [ADR-0016-time-and-timezone-model](docs/architecture/adr/ADR-0016-time-and-timezone-model.md)
- [ADR-0019-local-database-migrations](docs/architecture/adr/ADR-0019-local-database-migrations.md)
- [ADR-0020-local-organization-bootstrap](docs/architecture/adr/ADR-0020-local-organization-bootstrap.md)
- [ADR-0021-local-site-bootstrap](docs/architecture/adr/ADR-0021-local-site-bootstrap.md)
- [ADR-0022-poc-csv-preservation](docs/architecture/adr/ADR-0022-poc-csv-preservation.md)
- [ADR-0023-poc-analytics-filters](docs/architecture/adr/ADR-0023-poc-analytics-filters.md)
- [ADR-0024-local-principal-bootstrap](docs/architecture/adr/ADR-0024-local-principal-bootstrap.md)
- [ADR-0025-local-membership-bootstrap](docs/architecture/adr/ADR-0025-local-membership-bootstrap.md)
- [ADR-0026-poc-authorization-lookup](docs/architecture/adr/ADR-0026-poc-authorization-lookup.md)
- [ADR-0027-poc-import-publication](docs/architecture/adr/ADR-0027-poc-import-publication.md)
- [ADR-0028-poc-analytics-query-consistency](docs/architecture/adr/ADR-0028-poc-analytics-query-consistency.md)
- [ADR-0029-scoped-demo-reset](docs/architecture/adr/ADR-0029-scoped-demo-reset.md)
- [ADR-0030-local-demo-user-selection](docs/architecture/adr/ADR-0030-local-demo-user-selection.md)

## Analytical workspace boundaries

[ADR-0032](docs/architecture/adr/ADR-0032-hexagonal-application-boundaries.md) defines
hexagonal development for both hosts. The active import workflow and reporting
use cases depend on inward-owned ports. Backend domain/application folders contain
no NestJS, PostgreSQL or transport imports; PostgreSQL adapters own scoped execution
and SQL. The demo host is the composition root. Existing immutable publication and
legacy query infrastructure is reused through adapters, not claimed to have been
fully rewritten.

The browser analysis feature has independent domain values and application selection
use cases. HTTP, React and ECharts are outer adapters, wired in `AnalyticalApp.tsx`.
Generated HTTP types are checked at the gateway boundary. Full-history totals remain
server-owned; charts never calculate totals from the displayed row page.

The [WinCC backup comparison](docs/architecture/wincc-backup-reference.md) records
source tables, actual reconciliation gaps and exact duration evidence. Its SQL was
not restored. [IOP-148](docs/planning/items/IOP-148-analytical-workspace.md) tracks the
new report workspace and its validation separately from IOP-147's technical baseline.

[ADR-0033](docs/architecture/adr/ADR-0033-relational-hitliste-analytics.md) refines the
reporting adapter to persist normalized Hitliste catalogs and facts in `analytics`,
including `sektor` and the main fact's `sektor_id`. Publication and profile saves
refresh this relational projection atomically. Reports join its catalogs, verify
complete source coverage/profile consistency and preserve the same API/UI contract.
The backup's normalized analytical model is the reference; its initial `public`
prototype is not the target reporting schema.
