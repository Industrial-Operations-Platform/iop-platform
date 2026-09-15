# Analytical proof of concept

## Owner-confirmed boundary

Accepted product direction on 2026-09-15 under [IOP-142](../planning/items/IOP-142-poc-delivery-scope.md):
**manual CSV → preparation and normalization → verified analysis → presentation**.
The immediate target is a local demonstration operated by one person, without login
or external system connections. It precedes the shared-use v1. This overrides older
references to individual login as a prerequisite for the first demonstration.

Manual CSV ingestion remains essential; postponing integrations means postponing
live WinCC/Ultimo/Entra connections and a general integration registry, not removing
the source-to-domain translation boundary.

## Minimum useful result

- Start the accepted React/Vite, NestJS and PostgreSQL stack locally with documented
  commands, migrations and configuration. Compose/tooling decisions remain accepted;
  implement only the hosts and checks used by the slice, not a worker host.
- Configure one organization, one site with an explicit zone, and one source through
  development configuration/seed data. No organization/site administration screens.
- Load the supported CSV, preserve original input and import provenance, normalize
  reported frequency and accumulated alarm duration, and apply configured sector mappings.
- Show validation failures and unresolved mappings. Unclassified records remain in
  totals; no silent data loss. Reject already imported reporting dates within the
  same organization/site/source, including renamed files, without automatic replacement.
- Present an Executive Overview and a detail view with consistent reporting-date,
  sector, area, equipment and message filters. Drill down to contributing source
  records without requiring surveyed assets or physical sensor identities.
- Show source coverage and metric limits. A filename date is a reporting label,
  not an occurrence timestamp or proof of a full 24-hour window. Missing imports
  are not zero-fault periods; accumulated alarm duration is not plant downtime.
- Reproduce known results using synthetic or explicitly authorized reference data,
  demonstrate duplicate/error handling and reset the dedicated demo dataset safely.

Initial charts should prove these two measures and the analysis path. The broader
screenshot catalog, every chart type and every future metric are not POC gates.

## Deferred beyond the POC

Login, sessions, password workflows, user lifecycle/admin screens, interactive role
and membership management, Entra, direct industrial connections, general integration
registry, full audit/retention infrastructure, background workers/retries, map/file
platforms, asset surveys/registry, workforce, handovers, maintenance and improvements.
Also deferred: exports, shared hosting, production backup/restore operations and a
full release ceremony. Basic input validation, safe configuration, scoped storage,
useful error logs and tests for delivered behavior remain part of each slice.

## Architecture retained and one open mechanism

Keep the modular monolith, accepted stack/API strategy, provider-independent
identity boundary, organization/site ownership, scoped references, RLS and temporal
semantics. Metrics belong to OIP; source column names and customer classification
belong to the adapter/configuration. Avoid a generic provider/plugin engine for one CSV.

The owner approved the product boundary without login, not a technical bypass of
Accepted ADR-0012/0013/0014. [ADR-0018](../architecture/adr/ADR-0018-local-poc-execution-context.md)
proposes a local execution adapter with an explicit seeded principal and grants.
It remains Proposed. Dependent runtime business access waits for its acceptance or
another accepted mechanism; independent bootstrap, pure parsing and UI work can proceed.
Do not silently disable RLS, use a database-owner runtime role, or trust a browser's
scope/actor as authority. A local unauthenticated demonstration is not shared-user
access control and must not be presented as such.

## POC acceptance

The owner can import a representative CSV, inspect rejected/duplicate input, obtain
independently reconciled frequency/duration totals in both views, navigate filters
and contributing records, and present the result directly from IOP. The demo can be
recreated from documented commands and fixtures. Record actual dataset size and
observed timings without inventing a performance commitment.

Exact parsing/grain and metric fixtures are refined with importer/analytics delivery;
unknown reporting windows stay visible and block only claims that require them.
POC completion does not complete deferred parent stories or certify shared-use v1.

## Later shared use

Before enabling other users or network-hosted operation, deliver authentication,
current scoped authorization and lifecycle behavior, negative access tests and the
operating controls relevant to that deployment. Reassess audit and recovery needs
at that stage. The POC neither chooses a future provider nor removes those obligations.

See the [delivery map](../planning/poc-delivery.md) for story slices and sequencing.
