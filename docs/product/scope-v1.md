# IOP v1 scope

## Owner-confirmed release boundary

**CSV events → analysis → locate the asset.**

The owner explicitly limits v1 to this workflow. Other modules remain part of the
long-term IOP vision, not v1 delivery commitments. Detailed feature depth, persona
permissions and measurable acceptance targets are still being defined in
[IOP-001](../planning/items/IOP-001-v1-personas-and-pilot-workflow.md).
No application functionality is implemented yet.

## V1 capabilities to specify

- Individual login and customer/site-scoped access to the views each user needs;
  provider, session model and detailed RBAC remain separate decisions.
- Import the stable-format WinCC CSV used in the current process through a generic
  ingestion boundary, preserving RAW provenance, validation and reconciliation.
- Reproduce the useful reporting-template, chart and KPI behavior of the current
  Python/local-database/Power BI workflow. Exact report parity remains to be defined;
  this does not select Python, Power BI embedding or reuse of the existing code.
- Support Team Leader analysis and presentation to management, with source evidence
  and context showing where faults occurred. Management receives presentations only;
  a management login is not required in v1.
- Give Taskforce and Team Leaders access to automated analysis and location
  investigation within their authorized scope, from configured sectors to individual
  sensors where validated data supports it. Taskforce handles serious operational
  problems; these viewing needs do not imply asset/map editing permissions.
- Provide the minimal asset identity, alias validation, map placement, configuration
  and import/configuration audit capabilities needed for that workflow.

The existing fixed export format is a source-adapter concern, not a customer-specific
schema or vocabulary imposed on the generic platform core.

## Outside v1

Workforce/shift planning, shift handover, maintenance workflows, improvement tracking,
advanced workforce optimization/payroll, predictive analytics, automated root-cause
claims, real-time tracking and direct WinCC/vendor connectivity. Industrial control
and source-system write-back are excluded. No ERP/CMMS replacement or microservices.

Future read-only ingestion directly from the system/database behind WinCC Viewer
requires source/interface discovery and authorized access. It is not needed to
complete the CSV-based v1 and no particular interface is promised.

## Release conditions still to finalize

Demonstrate import → explainable analysis → correct asset lookup using the agreed
reports and test data, with individual access, scope isolation and traceable data.
Reconcile source measures and preserve ambiguity/missing-data states. Agree role
responsibilities, reporting requirements, targets and operational criteria before
claiming release readiness. Handover or maintenance is not a v1 release gate.

## Planning inventory

The [backlog](../planning/backlog.md) includes future platform capabilities as well
as possible v1 work. Its M1–M17 structure is a product inventory, not a mandatory
v1 checklist. Refine each selected slice against this boundary before activation;
future items are not authorized by their presence in the index.

[Personas and workflow](personas-and-pilot-workflow.md) records owner confirmations,
remaining responsibility questions and the existing workflow reported in chat.
