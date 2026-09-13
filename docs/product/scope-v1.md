# IOP v1 scope

## Current owner-confirmed release boundary

**CSV events → preparation and normalization → analysis → presentation.**

The owner narrowed v1 to reproduce the current local Power BI workflow. A full
plant survey and precise sensor location would delay that delivery and are deferred.
This decision supersedes the earlier v1 workflow ending in Asset Locator.
Individual login and appropriate customer/site-scoped views remain required.
No application functionality is implemented yet.

## V1 capabilities to specify

- Import the consistent WinCC CSV format through a source adapter; preserve RAW
  provenance, validation, normalized data, idempotency and reconciliation.
- Reproduce the useful report templates, charts and KPIs of the current Python →
  local database → Power BI process. Exact feature parity and presentation/export
  format remain to be agreed; no Power BI embedding or existing-code reuse is selected.
- Provide Team Leaders with analysis they can interpret and present to management.
  Management receives these presentations and does not need a v1 login.
- Provide Taskforce and Team Leaders with automated analytical views for investigating
  recurring/serious faults within their authorized scope.
- Preserve source-provided sector, equipment and event identifiers where available
  for filtering and context. These do not prove a sensor's physical position.
- Provide the minimal configuration, access control and traceability needed by
  that workflow. Authentication provider and detailed RBAC remain separate decisions.

Neither a complete surveyed asset inventory nor validated sensor-to-map placement
is a prerequisite for v1 analytics. Distinguish source equipment references from
future surveyed physical assets. Local names and CSV fields belong in configuration
and adapters, not the generic core.

## Outside v1

Plant-wide surveys, precise sensor positioning, map upload/placement, Asset Locator,
3D visualization, workforce/shift planning, meeting/handover workflows, maintenance
management, improvement tracking, predictive analytics and real-time ingestion.
Direct WinCC/vendor connectivity and industrial control/write-back are excluded.
No ERP/CMMS replacement or microservice decomposition.

Future work may connect directly to an authorized source behind WinCC Viewer, add
meeting/shift functions and provide precise asset location, potentially in 3D.
Source interfaces, location capture, representation and delivery sequence remain
undecided. These goals do not impose dependencies on the CSV-based v1.

## Release conditions still to finalize

Demonstrate import → reconciled analysis → useful presentation with the agreed CSV,
reports and test cases. Verify individual access, scope isolation, source traceability
and truthful data-quality states. Agree responsibilities, report/KPI definitions,
performance/value targets and operating criteria before claiming release readiness.
Maps, 3D, complete asset surveys and operational workflows are not v1 release gates.

## Planning inventory

The [backlog](../planning/backlog.md) and M1–M17 milestones include the longer-term
platform. They are not a mandatory v1 checklist. Select and refine only slices needed
for this boundary before implementation; do not require all asset/locator stories
or later workflows as prerequisites.

[Personas and pilot workflow](personas-and-pilot-workflow.md) records the current
scope and remaining questions. IOP-001 is still In progress; narrowing the release
does not complete persona or acceptance validation.
