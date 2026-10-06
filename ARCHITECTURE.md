# Architecture

IOP is the generic platform; Data Analysis is the product-facing name of its
analytical module, retaining OIP as the internal/historical identifier.
The delivered [local POC](docs/product/scope-poc.md) uses React/TypeScript/Vite,
a NestJS modular monolith and PostgreSQL. The [operator guide](docs/development/running-poc.md)
owns execution instructions; the [delivery status](docs/planning/poc-delivery.md)
links validation evidence.

## Hexagonal boundaries

[ADR-0032](docs/architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
requires inward dependencies for every new feature and code change, including
temporary authentication and administration. The shared workflow and ADR own the
mandatory clean-code review criteria.
Domain/application code owns rules, use cases and ports without importing frameworks,
SQL drivers, transport schemas or presentation adapters.

| Boundary | Implementation responsibility |
| --- | --- |
| `apps/api/src/host/` | Composition root and inbound NestJS authentication/business controllers |
| `apps/api/src/modules/authentication/` | Provider-independent authentication use cases with local Argon2id and PostgreSQL session adapters |
| `apps/api/src/modules/users-rbac/` | User administration, profile rules and scoped authorization with PostgreSQL adapters |
| `apps/api/src/modules/integrations/` | Import lifecycle, CSV adapter, RAW retention, source-date admission and mapping snapshots |
| `apps/api/src/modules/maintenance/` | Technical work, status rules, scoped responsibility, priority configuration and immutable revisions |
| `apps/api/src/modules/assets/` | Stable registered identities, exact scoped aliases and source-authorized digital-record use cases |
| `apps/web/src/features/maintenance/` | Framework-free work use cases with HTTP/React board, forms and history |
| `apps/web/src/features/assets/` | Framework-free registry/digital-record use cases with HTTP/React adapters |
| `apps/api/src/modules/workforce/` | Personal schedules, scoped planning, teams, assignments and retained revisions |
| `apps/web/src/features/workforce/` | Framework-free planning use cases with HTTP/React role views |
| `apps/web/src/localization/` | Shared English/German presentation resources and locale selection |
| `apps/api/src/modules/shift-handover/` | Operational entries, issue follow-up, immutable revisions and PostgreSQL storage under ADR-0036 |
| `apps/api/src/modules/oip/` | Exact facts, analytical domain/use cases and outbound PostgreSQL reporting adapters |
| `apps/web/src/features/analysis/` | Framework-free selection/use cases with HTTP, React and ECharts adapters |
| `apps/web/src/features/access/` | Framework-free access use cases with HTTP and React login/administration adapters |
| `apps/web/src/features/shift-handover/` | Journal/meeting use cases with HTTP and React adapters, composed into the workspace and Start |
| `apps/web/src/host/` | Browser composition root and cross-feature workspace shell |
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

1. The host resolves a verified principal through Authentication and checks current
   Users/RBAC permissions. Docker uses temporary local credentials and revocable
   sessions; the explicit native demo selector remains a separate adapter.
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

Docker uses individual accounts under
[ADR-0035](docs/architecture/adr/ADR-0035-transitional-authentication.md). Authentication
owns local credentials and revocable sessions; Users/RBAC owns profiles, membership
and grants. Only Administrator imports and manages users. Origin/Host checks and
HttpOnly/SameSite cookies protect this bounded local flow. Corporate identity and
remote/shared deployment remain separate work. The configured selector under
ADR-0018/0030 remains only in explicit native demo mode and is rejected in password
mode. Compatibility paths containing `demo` are not a separate module.

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

Shared authentication, administration, external connections, workers, full asset hierarchy/locator capabilities,
remaining operational modules and production operating controls remain separately scoped.
Industrial integrations are read-only; no plant control commands are included.
See the [module map](docs/architecture/modules.md),
[conceptual model](docs/architecture/data-model.md), [ADRs](docs/architecture/adr/)
and [roadmap](ROADMAP.md). Proposed decisions are not accepted implementations.

Shift Handover follows [ADR-0036](docs/architecture/adr/ADR-0036-shift-handover.md):
operator-configured locations, explicit unverified equipment references and durable
revision history, independent of analytics. [Setup and workflow](docs/development/shift-handover.md)
document permissions and current journal behavior. Formal shift binding, Workforce
location defaults and explicit canonical entry-to-asset references remain separate
integration work; IOP-194 supplies alias-based history and repair resolution.

Workforce is delivered under [IOP-184](docs/planning/items/IOP-184-m6-workforce.md).
It reuses accepted scoped authorization and revision patterns. Personal availability
and operational assignments remain separate; Integrations decodes manual sources.
[Module contract](docs/product/workforce.md) and [implementation guide](docs/development/workforce.md)
cover time resolution, role boundaries, import preview, logical deletion and retained names.

Maintenance Management and the Digital Asset Record are implemented under
[IOP-194](docs/planning/items/IOP-194-maintenance-asset-history.md), integrated into
develop and published to origin on 2026-10-06. They reuse existing scoped
authorization, pinned transactions and atomic
revision patterns. Assets orchestrates explicit source read ports; Maintenance,
Handover and OIP retain their records/joins and enforce source permissions. Stable
asset registration is deliberate; aliases never infer physical identity from
analytics. [Product scope](docs/product/maintenance-assets.md) and
[operation](docs/development/maintenance-assets.md) describe the boundaries. M9
Asset Locator, full M4 hierarchy/controller/survey work and general Audit remain
deferred. This delivery does not constitute owner product acceptance.


The owner-requested IOP-194 follow-up links reviewed Maintenance repair scopes to
Handover issues through narrow owner-defined reads and resolution writes. It reuses
ADR-0027's coordinated pinned transaction; each module retains its own history.
Exact equipment codes provisionally represent parts while physical verification
and 3D/radius selection remain deferred. See the [contract](docs/product/maintenance-assets.md)
and [ADR-0036 refinement](docs/architecture/adr/ADR-0036-shift-handover.md).

## Accepted audit design — deferred beyond the pilot

[ADR-0017](docs/architecture/adr/ADR-0017-audit-model.md) defines explicit
module-emitted, Audit-owned PostgreSQL records committed atomically with material
changes, separately handled security observations and restricted operator
inspection. Future retention defaults are 365 days for changes/maintenance and
90 days for security events, with scoped expiry and separately bounded backups.

The owner accepted this as a future design and explicitly excluded implementation
from the pilot. Audit storage, capture, inspection and retention infrastructure
are not pilot release gates; absent Audit infrastructure does not block pilot
operations. IOP-009 is complete as design. IOP-023 remains future work, and existing
source provenance, authorization and scope requirements retain their own owners.
