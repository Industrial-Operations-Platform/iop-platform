# Proposed v1 scope

This is an initial planning baseline, not a claim of implemented capabilities.
Validate workflow depth and acceptance criteria with pilot stakeholders before
implementation. The current repository task delivers documentation only.

## Intended first release

- Platform Core: customer and site context, configuration and module composition.
- Authentication and Users/RBAC: an abstract identity boundary, user membership,
  roles and permission checks scoped to the relevant customer and site.
- Workforce and Shift Management: basic teams, shift definitions and assignments.
- Shift Handover: structured notes, open issues and asset references between shifts.
- Maintenance Management: basic maintenance records, status and asset links;
  external maintenance-system references through adapters where needed.
- Asset Management: canonical identity, hierarchy and external identifier mappings.
- Asset Locator: search by canonical or mapped identifiers and show configured
  physical location and functional context; surface ambiguous or missing matches.
- Operational Intelligence (OIP): normalize imported events, browse history and
  compare event frequency and duration where source data supports them.
- Integrations: a read-only industrial ingestion pilot with provenance and
  repeatable imports; select the actual source and access method separately.
- Audit/activity: trace security-relevant actions and material business changes.

## Outside v1

Industrial control or source-system write-back; full ERP/CMMS replacement;
advanced workforce optimization or payroll; predictive maintenance and automated
root-cause claims; real-time indoor tracking; arbitrary customer custom code in
core; microservice decomposition. Additional integrations require explicit scope.

## Release conditions

Demonstrate one representative end-to-end operational workflow, customer-scoped
access and data isolation, reproducible event normalization, usable asset lookup
and an auditable handover/maintenance trail. Agree source data, performance,
retention, availability and recovery targets before committing to release dates.
