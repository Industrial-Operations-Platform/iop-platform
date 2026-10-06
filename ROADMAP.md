# IOP roadmap

Reviewed on **2026-10-06** against develop at `c0fc3ff` under
[IOP-195](docs/planning/items/IOP-195-development-status.md).
IOP-197 subsequently reconciles the retained Audit design and IOP-196 operational
refinements while integrating all retained branches.
The local analytical POC has expanded into an operational platform. This inventory
records delivery and remaining work; it does not select the next implementation
or commit to delivery dates. The [backlog](docs/planning/backlog.md) mirrors each
permanent story's status; the [delivery map](docs/planning/poc-delivery.md) links evidence.

## Delivered locally

- Docker web/API/PostgreSQL, migrations, persistent history and scoped authorization.
- Individual local login, four profiles, user administration, logical deletion,
  English/German presentation and shared identity/components.
- Data Analysis: CSV preservation/import/preparation, historical reporting,
  daily/weekly/monthly trends, monthly comparisons, KPIs and source-component Pareto.
- Shift Handover: configured categories, technician journal, follow-up, durable
  open issues, department matrices, daily overview, meeting preparation and Start.
- M6 Workforce: teams/settings, schedule imports/manual weekly planning,
  assignments, floating duties, phone responsibility and retained revisions.
- M8 Maintenance: categorized work, reviewed repair scope, ownership/priorities,
  board/search, immutable outcomes and atomic resolution of included Handover issues.
- M10 Digital Asset Record: stable registry, exact scoped aliases, validation/
  retirement, search, manual within-area metadata and source-authorized timeline.
- Explicit synthetic analytical, Handover, Workforce and Maintenance exercises.
- IOP-196 personal Start summaries, focused Maintenance status/completion and
  historical daily categories with current pending topics, images and person notices.

IOP-194 was integrated into develop and published to origin on 2026-10-06.
IOP-197 also integrated and published all retained story tips, including IOP-196,
on that date; its completed plan records conflict resolution and validation.
Owner functional testing, physical inventory verification and missing-component
survey remain pending; Git integration is not final product acceptance.

## Remaining development and validation

| Area | Remaining outcome | Stories |
| --- | --- | --- |
| Shared-use identity/core | Corporate/provider authentication and complete organization/site/user/membership lifecycle beyond the local installation | IOP-007, 025–027, 029–030, 106 |
| Assets | Configurable composition hierarchy/types, parent-cycle rules, controller links, extensible metadata, survey workflow and ingestion-time event mapping | IOP-032–033, 035–036, 038–039, 044; synthetic structure IOP-124 |
| Formal Handover | Shift-bound record, canonical asset references, closure/acknowledgement and previous-shift view; Workforce-prefilled location remains separate integration | IOP-060, 063, 066–067 |
| Asset Locator | Versioned maps, upload, normalized coordinates, placements and ambiguous/unmapped lookup; explicitly Deferred by the owner | IOP-076–083 |
| Analytical extension | Full canonical Asset/Area/Event Pareto coverage beyond the delivered source-group charts | IOP-093 |
| Improvement Tracking | Decide ownership/inclusion; action, owner/target, evidence and action-linked before/after impact | IOP-098–101 |
| External integrations | Registry, read-only WinCC/Ultimo contracts, Entra connection and source health; corporate roster connection remains outside manual Workforce import | IOP-102, 104–107 |
| Delivery infrastructure | Automatic CI; background job design and worker/retry infrastructure | IOP-021; Deferred IOP-010 and Proposed IOP-024 |
| Audit/security | General Audit storage/collection/retention under Accepted ADR-0017 and consolidated authorization/critical-action verification | IOP-023, 108, 111, 131 |
| Operations | Full-platform backup/verified restore, performance baseline/targets and broader job/import recovery | IOP-112–115, 133 |
| UX | Unified area overview and one global asset/area/issue search | IOP-118–119 |
| Release | Consolidated pilot measurements, authorized deployment/admin procedures, final architecture review and version/tag/release notes | IOP-130, 134–135, 137–138 |

The original local outcomes of login/admin, asset lifecycle/aliases/search,
Handover categories/entries/issues/summary, role-aware Start and Workforce/Maintenance
fixtures are reflected as Completed in their original stories. Partial parent
coverage is documented without closing unfulfilled criteria.

## Acceptance and publication

The owner accepted the charts as **Data Analysis v1** on 2026-09-27.
[IOP-130](docs/planning/items/IOP-130-pilot-metrics.md) remains In progress for
consolidating all five accepted measures and actual human timing/dataset evidence;
usefulness feedback is recorded. Shared-use validation and whole-platform release
remain separate. Maps, surveys and every future inventory item are not automatically
analytical release gates.

Use the [workflow](docs/planning/workflow.md) to select and plan the next authorized
slice. Existing story publication does not authorize stage/master promotion,
hosted deployment or a new release.
