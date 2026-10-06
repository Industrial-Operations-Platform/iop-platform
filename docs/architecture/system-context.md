# System context

Operators, technicians and supervisors use IOP for operational context, handovers,
maintenance, asset lookup and analytics. Administrators manage customer/site
configuration and scoped access. The delivered local profiles are Administrator,
Team Leader, Task Force and Technician under ADR-0035; corporate identity remains
future integration.

```mermaid
flowchart LR
  People[Operational users and administrators] --> IOP[IOP modular platform]
  Local[Local credentials and sessions] -->|Authentication| IOP
  IDP[Corporate identity provider - future] -.->|Identity assertions| IOP
  Sources[Controlled CSV exports] -->|Manual read-only ingestion| IOP
  CMMS[External maintenance systems - future] -.->|Optional read-only adapter| IOP
  IOP --> PG[(PostgreSQL)]
  IOP -->|Scoped read contracts - future| BI[External analytics consumers]
```

Arrows describe logical information flow, not network initiation or a selected
protocol. Web, API and PostgreSQL run in separate local Docker containers under
ADR-0034; a finite setup service provisions/migrates. Worker infrastructure and
remote/shared deployment remain pending. External BI consumption is an extension
point, not a mandatory v1 dependency.

## Integration boundary

WinCC/event exports are historical candidate inputs. The source's actual
version, interface, licensing, access method and data grain require discovery.
CSV, documented read-only SQL views, historians and official APIs/protocols are
options, not promises of supported connectors. Manual CSV import and analytics-only
backup extraction exist; direct industrial/vendor connectivity is not delivered.

Adapters capture source provenance and translate local names and schemas.
Preserve an existing customer export/BI flow during any future migration until
reconciliation succeeds; IOP does not assume the historical `public.hitliste`
table or Power BI is present in every deployment.

## Trust and ownership

- Identity comes through Authentication; Users/RBAC decides scoped permissions.
- Customer context must be verified for reads, writes, searches, jobs and exports.
- Industrial systems remain outside the application trust boundary. Future
  connections use approved read-only access and an agreed OT/IT network path.
- Credentials, production exports and customer plans are deployment data, never
  repository fixtures. Delivered synthetic exercises are explicitly labelled.
- PostgreSQL holds platform-owned relational data and bounded original CSV/RAW
  bytes under ADR-0022/0027. Map-file storage, production retention and remote
  network placement remain open.
