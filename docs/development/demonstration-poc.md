# Local CSV-to-presentation demonstration

Prepared for [IOP-129](../planning/items/IOP-129-end-to-end-scenario.md).
Executed under [IOP-147](../planning/completed/IOP-147-working-analytical-poc-plan.md)
with actual PostgreSQL/API/browser evidence and guarded reset/reload. The canonical
operator commands and step-by-step walkthrough are in [running the POC](running-poc.md).
This document retains the acceptance procedure within the
[POC scope](../product/scope-poc.md); fictional previews alone are not evidence.

## Preflight

Use a dedicated local environment and the unchanged
[synthetic fixture corpus](../../fixtures/analytical-poc/README.md), its explicit
scope/mapping configuration and independent `expected.json`. Follow the optional native fixture installation in the
[operator guide](running-poc.md) and fixture seed instructions.
Seeding scope alone does not activate runtime access.

Before importing, link passing evidence for Accepted
[ADR-0018](../architecture/adr/ADR-0018-local-poc-execution-context.md): explicit
development mode, loopback listeners, seeded principal with current exact-site
grants, mutation-origin protection and refusal of shared/deployed mode. Verify
missing/foreign scope, foreign references, missing grants and client-selected
actor rejection, with positive controls and forced RLS under non-owner runtime
credentials. Do not substitute login, database-owner access or a fixture bypass.

Confirm production OIP receiving storage, the real upload/review path, executable
queries and connected overview/detail are available. Stop if any gate is absent.
Use IOP-128's delivered guarded reset only for a registered native fixture dataset.
This procedure does not reset the primary historical Docker installation.

## Demonstration sequence and expected evidence

| Step | Action | Required observation |
| --- | --- | --- |
| 1. Import | Upload the two `valid/` CSVs using their original basenames and configured organization/site/source. | Persisted receipt/RAW provenance and terminal outcomes; six July 1 records and three July 3 records. Review warnings and all three unclassified records without excluding them. |
| 2. Inspect failures | Submit each `invalid/` fixture; inspect available diagnostics and known/unknown counts. | No partial analytical admission, new coverage or changed baseline totals. A decoding/structure failure does not imply all rows were counted. |
| 3. Inspect duplicates | Re-upload July 1, then `duplicate-changed/Hitliste-20260701.csv`. | Both visibly conflict on the scoped reporting date; no automatic replacement or new measures. A malformed renamed basename rejects. |
| 4. Open overview | Select `[2026-07-01, 2026-07-04)` explicitly with no dimension restriction or exclusion. | Nine contributing records, 19 reported occurrences and 97,775 accumulated alarm seconds. July 2 is missing coverage; all source windows remain unknown. |
| 5. Investigate | Navigate sector → area → source equipment → message/contributors, then return. Repeat with a message exclusion. | Visible dates/scope/filters persist, restrictions do not silently broaden, and return restores the prior selection. Compare each selection against its own expected total. |
| 6. Verify both views | Execute the existing [reconciliation matrix](reconciliation-poc.md), including all contributor pages. | Same selection and data revision yield the same exact totals and contributing RAW/physical-line identities in queries, overview and detail. Distinguish missing imports, no matches and matching zero-valued records. |
| 7. Present from IOP | Use Executive Overview and detail to explain the results to the observer. | Explain frequency versus record count, accumulated duration versus downtime, exclusions, unclassified rows, unknown windows and traceability. Keep those limitations visible; no export or additional chart catalog is required. |
| 8. Recreate | Run the delivered IOP-128 reset and reload only the two baseline files, then repeat steps 4–6. | Same analytical results after recreation; preserved seeds/grants/configuration and unrelated targets. Link refusal evidence outside the verified target and failure/rollback checks required by ADR-0029. |

Use the fixture README's isolated scenarios for valid new-date relabeling and
corrected invalid-date retry. Byte-identical contents with a new valid reporting
label are not automatically duplicates; do not mix that scenario into the baseline
or claim verified source coverage. Do not resave the CSVs or alter the oracle to
fit application output.

Recreation follows [ADR-0029](../architecture/adr/ADR-0029-scoped-demo-reset.md).
Reset and reload are separate phases: failed reload is an incomplete demonstration,
not a rolled-back reset. No volume removal or broad database cleanup is part of it.

## Execution record and closure

Use the linked IOP-147 runtime execution record. For a new observation session, record application
commit, date/environment, fixture hashes and byte sizes, scope/source and mapping
revision, actual import/RAW IDs, applied selections, data revisions, complete
contributor identities, observed counts/totals and links to browser/API evidence.
Record observed import/read/reset timings without inventing a performance target.
Exclude credentials and private data from committed evidence.

Run `npm run test:poc` using the [testing guide](testing-poc.md), with delivered
journey assertions added under the execution plan. Existing passing tests alone
do not establish this scenario. Mark each step passed, failed or blocked with its
actual evidence; on discrepancy, preserve the failing selection/revision and use
the reconciliation procedure to identify the first failing stage. Do not bypass
validation, change filters silently or repair data to manufacture a pass.

Close IOP-129 only after the real demonstration, denial evidence and reproducible
reset/reload pass. Link results for IOP-132's separate final numerical acceptance;
its prepared matrix is usable now and its final story closure is not a prerequisite
for starting this demonstration. IOP-129/132 are Completed and Data Analysis v1
usefulness feedback is recorded; IOP-130 retains measurement consolidation. Local
login, Workforce, Handover and Maintenance are delivered through later increments,
with separate module guides. Shared-use release, surveys/maps and live integrations
remain outside this analytical demonstration procedure.
