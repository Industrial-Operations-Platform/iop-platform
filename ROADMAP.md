# IOP roadmap

Updated locally on **2026-10-14** on `feature/IOP-203-platform-completion`, from
develop `24b6269`, under [IOP-203](docs/planning/items/IOP-203-platform-completion.md).
The owner subsequently approved integration into develop and publication of both
refs to origin, completed on 2026-10-14. The story branch remains available; see the
[publication execution](docs/planning/completed/IOP-203-publication-plan.md).
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
- Formal shift Handover and Improvement Tracking for the three advanced profiles.
- Reusable provisional 3D Locator with private schematics, revisioned placements and source problem evidence.
- Configurable Asset types/composition/controllers/metadata, survey workflow and reviewed canonical mapping/Pareto.
- Global search/area source context, integration readiness, scoped jobs/Audit and encrypted isolated restore.
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
| Plant assets and location | Real type/relationship/metadata configuration, physical inspection, identity mapping, measured plant registration/elevations and exact sensor placement; software workflows are delivered | IOP-039, 079, 081; IOP-206/209 inputs |
| External integrations | Real WinCC/Ultimo/Entra transports and approved schemas/access, current connection evidence; registry/adapters/readiness contracts are delivered | IOP-104–107; IOP-207 |
| Delivery infrastructure | Authorized remote CI execution and registered real business/provider job handlers; local checks/leases/retries are delivered | IOP-021/024; IOP-208 |
| Audit/security | General organization RBAC and platform-security capture/authority; site append/inspection/retention infrastructure is delivered | IOP-023, 108–111; IOP-208 |
| Operations | Representative workload/threshold acceptance, real provider recovery and operational monitoring; full encrypted backup/isolated restore and measurement tooling are delivered | IOP-112–115, 133 |
| Release | Consolidated pilot measurements, shared hosting, owner functional/architecture review and version/tag/release decision | IOP-130, 134–135, 137–138 |


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
