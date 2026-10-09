# IOP-200 - Project state and native development travel guide

Status: Completed

Owner request of 2026-10-09: an offline PDF explaining the current project, key
files, modular-monolith layout and step-by-step development with automatic browser
updates. The owner selected native frontend/backend with the existing PostgreSQL
Docker database, preserving current data and accounts.

## Acceptance

- [x] An English PDF records the current develop snapshot, delivered modules,
  important limitations and remaining work without treating proposed scope as delivered.
- [x] Repository and module maps explain responsibilities, frontend layouts, owned
  persistence and a representative browser-to-database code path.
- [x] A tested recipe starts Vite and a compiled, watched API against the existing
  database using loopback access, current scope and password authentication.
- [x] Commands explain installation, preparation, startup, reload, verification,
  shutdown, tests, contracts, migrations, offline preparation and Git review flow.
- [x] No credentials or private business records are embedded in the artifact;
  configuration remains private and data is not reseeded, reset or copied to a new database.
- [x] Every final page is rendered and inspected; links, paths, command accuracy
  and planning status are checked. The PDF and reproducible authoring source are
  committed on an isolated documentation branch.

Dependencies: [IOP-199](IOP-199-handover-category-workflows.md), Accepted
[ADR-0030](../../architecture/adr/ADR-0030-local-demo-user-selection.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0034](../../architecture/adr/ADR-0034-local-container-platform.md).
Execution and evidence: [completed plan](../completed/IOP-200-native-development-guide-plan.md).
Artifact: [12-page PDF](../../../output/pdf/iop-project-native-development-guide.pdf).
Completed locally on 2026-10-09; guide publication remains owner-controlled.

## Boundaries

Documentation and reversible local recipe validation only. The standard Compose
contract stays unchanged; a private development overlay exposes PostgreSQL only on
127.0.0.1. Native mode reuses existing supported local authentication/authorization
and the single-host lease. No new business features, grants, reset, demo fixture
writes, portable database migration, production/shared deployment or remote guide
publication is authorized by this request.
