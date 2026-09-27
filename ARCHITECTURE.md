# Architecture

IOP is the generic platform; Data Analysis is the product-facing name of its
analytical module, retaining OIP as the internal/historical identifier.
The delivered [local POC](docs/product/scope-poc.md) uses React/TypeScript/Vite,
a NestJS modular monolith and PostgreSQL. The [operator guide](docs/development/running-poc.md)
owns execution instructions; the [delivery status](docs/planning/poc-delivery.md)
links validation evidence.

## Hexagonal boundaries

[ADR-0032](docs/architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
defines inward dependencies for the active import and analytical workflows.
Domain/application code owns rules, use cases and ports without importing frameworks,
SQL drivers, transport schemas or presentation adapters.

| Boundary | Implementation responsibility |
| --- | --- |
| `apps/api/src/host/` | Composition root, inbound NestJS controllers and temporary local identity adapter |
| `apps/api/src/modules/integrations/` | Import lifecycle, CSV adapter, RAW retention, source-date admission and mapping snapshots |
| `apps/api/src/modules/oip/` | Exact facts, analytical domain/use cases and outbound PostgreSQL reporting adapters |
| `apps/web/src/features/analysis/` | Framework-free selection/use cases with HTTP, React and ECharts adapters |
| `apps/web/src/host/AnalyticalApp.tsx` | Browser composition root |
| `apps/web/src/design/` | Shared identity tokens and reusable presentation components |

Platform Core owns organization/site identity and time zone. Users/RBAC owns
principals, memberships and site grants. Publication and query infrastructure lives in explicit module adapters and is
reused behind ports. Users/RBAC separates its pure decision rules and lookup use
case from PostgreSQL. Platform Core currently exposes only a site-ownership adapter;
there is no artificial empty domain/application layer. The retained atomic import
and compatibility query adapters still coordinate SQL transactions under ADR-0026/0027;
this cleanup does not claim every persistence algorithm is a separate use case.
Customer labels and source schemas remain in integration adapters/configuration.

React feature adapters compose the [shared component library](apps/web/src/design/components/README.md).
It has no feature, transport, chart or business-policy dependencies. CSS and ECharts
share [identity tokens](docs/design/visual-identity.md). The browser controls selection
and presentation; the server owns full-history totals and authorization.

## Data flow and persistence

1. The host resolves the configured local principal and checks current permissions.
2. Integrations retains bounded original bytes and inspection outcomes, validates
   CSV fields and freezes import-time classification.
3. OIP receives immutable source aggregate facts bound to RAW/physical lines;
   publication and the unique organization/site/source/reporting-date claim commit
   atomically. Duplicates never silently replace history.
4. Reporting joins normalized catalogs and `analytics` facts, including `sektor`
   and the main fact's `sektor_id`. Publication and versioned profile saves refresh
   this projection atomically, preserving original facts and source bytes.
5. Reports return full matching totals and bounded groups/pages from persisted data;
   displayed chart/row limits do not truncate the measures.

The relational reporting model follows the backup's normalized analytics structure,
not the initial public prototype. See [ADR-0033](docs/architecture/adr/ADR-0033-relational-hitliste-analytics.md)
and the [backup review](docs/architecture/wincc-backup-reference.md).
[ADR-0031](docs/architecture/adr/ADR-0031-historical-reporting-profiles.md) defines
explicit historical preparation; changing a profile changes analytical interpretation,
not retained source evidence.

One fact is a source aggregate line, not an individual incident. Frequency and alarm
seconds are additive; display minutes derive from exact seconds. Accumulated alarm
duration is not plant downtime. Filename dates label reports with unknown windows;
missing imports are not zero measures. Equipment codes are source identifiers, not
inferred PLC/sensor entities. Detailed contracts live in the
[aggregate model](docs/architecture/event-aggregates-poc.md) and
[query contract](docs/architecture/analytics-query-poc.md).

## Local execution and access

[ADR-0034](docs/architecture/adr/ADR-0034-local-container-platform.md) defines
separate web/API/database containers plus a temporary setup service. Only web is
published on loopback. Setup provisions roles, migrations and optional analytics-only
backup seed; API startup never implicitly migrates. Persistent volumes survive stops.
The seed extracts known COPY data without executing archive SQL, then imports derived
daily CSVs through the real pipeline. Private manifests preserve source provenance.

The POC exposes one Administrator through a temporary configured selector under
[ADR-0018](docs/architecture/adr/ADR-0018-local-poc-execution-context.md) and
[ADR-0030](docs/architecture/adr/ADR-0030-local-demo-user-selection.md).
Origin/Host checks and opaque local cookies protect this bounded local flow;
a third-party identity adapter is required before shared use. Compatibility paths
containing `demo` do not represent a separate application/module.

Every operation checks current grants and exact ownership, pins a scoped connection
and uses explicit predicates plus forced RLS. Runtime is a non-owner role with narrow
privileges and no RLS bypass, delete or DDL authority. Missing scope never means
unrestricted access. Browser references are not permission snapshots. These controls
do not protect against a compromised backend or privileged local operator.

Imports and reads have finite budgets. Failed publications roll back; uncertain
outcomes require durable inspection rather than automatic replay. The earlier native
fixture tooling additionally provides offline scoped reset with installation/target
checks and exclusive maintenance. There is no reset HTTP endpoint or main-stack
volume-deletion shortcut. See [database operations](infra/database/README.md).

## Contracts, tests and future scope

Business routes use `/api/v1`, reviewed OpenAPI, generated browser bindings and
sanitized Problem Details. Internal ports are independent of transport/provider.
Public `/health` proves process response only. Use the [API guide](apps/api/README.md)
and [testing guide](docs/development/testing-poc.md) for executable checks.

Shared authentication, administration, external connections, workers, physical assets,
other operational modules and production operating controls remain separately scoped.
Industrial integrations are read-only; no plant control commands are included.
See the [module map](docs/architecture/modules.md),
[conceptual model](docs/architecture/data-model.md), [ADRs](docs/architecture/adr/)
and [roadmap](ROADMAP.md). Proposed decisions are not accepted implementations.
