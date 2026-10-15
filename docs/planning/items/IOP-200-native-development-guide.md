# IOP-200 - Project state and native development travel guide

Status: Completed. Owner-approved refresh integration into develop and publication
of both branches to origin completed on 2026-10-15. Original delivery/publication
remain completed.

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
Artifact: [17-page PDF](../../../output/pdf/iop-project-native-development-guide.pdf).
Completed locally on 2026-10-09; owner-approved integration into develop and
publication of both branches to origin completed that day. See
[publication evidence](../completed/IOP-200-publication-plan.md).

## Boundaries

Documentation and reversible local recipe validation only. The standard Compose
contract stays unchanged; a private development overlay exposes PostgreSQL only on
127.0.0.1. Native mode reuses existing supported local authentication/authorization
and the single-host lease. No new business features, grants, reset, demo fixture
writes, portable database migration or production/shared deployment is authorized
by the original guide request. Subsequent guide publication has its own explicit
owner approval and evidence above.

## Explicit owner refresh - 2026-10-15

Update the same offline PDF and editable source for the current delivered modules,
including Maintenance, Shift Handover views/formal shift records, Workforce,
Improvement Tracking, Asset Locator and operating infrastructure. Explain
Integrations as the adapter boundary between external systems/formats and internal
ports, distinguishing implemented imports/readiness from missing provider transports.
Keep native API/web development on the same existing Docker PostgreSQL database.

- [x] Explain each current module, entry point, typical workflow and role boundary.
- [x] Document exact native preparation/start/edit/stop/return commands, including
  private Locator references and current configuration, without credentials in Git.
- [x] Verify the same database/volume is reused and restore the existing local
  container application after reversible validation; do not reseed or reset data.
- [x] Distinguish published develop from installed, unmerged IOP-211 refinements.
- [x] Regenerate the PDF, inspect every page and check extracted commands, links,
  source consistency and current delivery/remaining-work descriptions.

This is documentation and reversible recipe validation, not external integration
implementation or approval to merge/push IOP-211. Follow-up execution:
[completed plan](../completed/IOP-200-guide-modules-refresh-plan.md).
Approved refresh publication:
[evidence](../completed/IOP-200-guide-refresh-publication-plan.md).
