# V1 personas and pilot workflow proposal

Status: Draft under [IOP-001](../planning/items/IOP-001-v1-personas-and-pilot-workflow.md).
**Owner-confirmed priority: CSV events → analysis → locate the asset.**
The owner selected this priority during this task. Persona responsibilities,
pilot data, detailed scope and numeric success targets still need validation.
This document describes future behavior, not an implemented or tested application.

## Pilot objective

Demonstrate that an authorized team can import event history from CSV, identify a
recurring event or affected asset through explainable analysis, and locate the
correct validated asset on a versioned map. Every analytical result must remain
traceable to its source records.

## Personas

### Administrator

Needs to configure the authorized customer/site, memberships, CSV source mapping,
canonical assets and approved map versions. Proposed actions: run/review an import,
resolve invalid records and mapping issues, and inspect permitted audit evidence.
Success means usable, scoped and traceable input is available for analysis.

The Administrator persona does not automatically receive unrestricted business
data access. Exact grants and whether import operators are separate users belong
to the later RBAC design.

### Team Leader

Needs to identify recurring issues and decide where the team should investigate.
Proposed actions: filter the approved history by period/location/asset, inspect
frequency and duration where supported, and drill down into the source evidence.
Success means identifying a defensible focus for investigation without manually
reconciling disconnected identifiers or treating correlation as root cause.

### Technician

Needs to identify the physical asset associated with the selected analytical
result. Proposed actions: confirm the canonical asset or resolve an ambiguous
alias, open the correct map version and inspect the marker and asset context.
Success means finding the correct validated component, or seeing honestly why
identity or placement is unresolved.

These personas describe needs, not an accepted role/permission matrix.

## Proposed preconditions and fictional data

- One fictional organization/site and a second organization for access-denial tests.
- Authorized users representing the three personas.
- A small synthetic CSV with documented columns, known frequency/duration totals,
  periods, units and source grain; include repeated, invalid and unresolved inputs.
- Canonical assets with scoped external aliases, survey validation status and one
  ambiguous alias. One validated asset has a marker; another has no placement.
- An approved fictional map with an explicit version and coordinate convention.

Synthetic data is a proposal pending owner confirmation. A later authorized export
may be used without changing the generic contract. No fixture or import code is
created by IOP-001. Provider, login mechanism and physical tenancy remain undecided.

## End-to-end scenario

1. **Prepare — Administrator:** select the authorized site, map external CSV fields
   to the documented source contract, and establish asset aliases and map context.
2. **Import — Administrator:** import the CSV as a traceable batch. Preserve RAW
   records, validate/normalize inputs and report accepted, rejected and unresolved
   records. A repeat import must not duplicate facts under agreed source-key rules.
3. **Reconcile — Administrator:** compare normalized counts and supported measures
   with the source, accounting for corrections/rejections. Do not mark an import
   analytically ready while discrepancies remain unexplained.
4. **Analyze — Team Leader:** select a period and permitted location/asset filters;
   inspect event frequency and source-reported duration, with grain and coverage
   visible. Identify a recurring event or affected asset for investigation.
5. **Inspect evidence — Team Leader:** drill from the selected result to contributing
   normalized and RAW records. Distinguish event occurrences from period aggregates;
   the result must not imply exact timing, downtime or root cause without evidence.
6. **Identify — Technician:** follow the canonical asset reference from the result.
   If mapping is ambiguous or unvalidated, review candidates before continuing;
   imported alarm text alone does not prove the identity of a physical component.
7. **Locate — Technician:** open the selected asset's placement on the correct map
   version, highlight its marker and show physical and functional context. If it
   has no placement, show that state without inventing a location.
8. **Review — Authorized users:** confirm that the result, source evidence, canonical
   identity and map refer to the same permitted scope. Review import/configuration
   audit records under the agreed permissions.

All industrial data access is read-only. The pilot does not send control commands,
create maintenance work automatically or require a live vendor connection.

## Failure and access scenarios

- **Malformed/invalid CSV:** report row-level reasons and import status; do not
  silently discard rows or claim reconciled results from unexplained omissions.
- **Repeated import:** identify duplicate input under the accepted idempotency
  contract; separately define how corrected source data is treated.
- **Unknown or ambiguous alias:** expose unresolved candidates in scope; never
  select the first match silently or auto-create a validated physical asset.
- **Missing placement:** show asset identity and available context with an explicit
  unplaced state. A replacement map version must not reinterpret old coordinates.
- **Wrong customer/site:** deny access through direct record/map references,
  searches, exports and analytical filters, not just through navigation controls.
- **Aggregate-only history:** preserve reported period/count/duration; do not invent
  individual timestamps, shift membership or plant downtime. Overlapping alarm
  durations cannot be assumed to represent elapsed equipment downtime.

## Proposed first-pilot scope

Required capabilities for this confirmed workflow priority: scoped access, CSV
mapping/RAW capture, batch validation, idempotency/reconciliation, canonical asset
identity and aliases, manual validation, period-based frequency/duration analysis,
source drill-down and versioned asset lookup on a map. Basic audit covers imports
and material configuration changes according to the later audit model.

Maintenance, handover and workforce scheduling are follow-on workflows. They remain
in the broader proposed v1 inventory but are not prerequisites for this first pilot.
Improvement tracking, real-time ingestion, predictive analytics and production
vendor connectors are also outside this first-pilot proposal.

Relevant task groups to refine after scope validation: IOP-025–040 (scoped core and
assets), IOP-041–049 (CSV data foundation), IOP-076–083 (locator) and IOP-089–097
(OIP analysis). This is not authorization to implement all tasks in those ranges;
select the minimum slices that satisfy the validated pilot scenario.

## Acceptance and pilot measures

| Measure | Proposed evidence |
| --- | --- |
| Complete workflow | Administrator imports/reconciles a sample; Team Leader identifies a result and source evidence; Technician locates its validated asset. |
| Import integrity | Known input counts and supported measures reconcile with explicit exclusions/corrections; replay does not duplicate facts. |
| Analytical correctness | Frequency/duration results match an independently prepared expected sample calculation at the same grain and period. |
| Asset lookup correctness | The result resolves to the expected canonical asset and map version, or clearly reports ambiguity/missing placement. |
| Investigation effort | Measure elapsed time from CSV availability to an explained result and correct asset lookup against an agreed manual baseline. |
| Isolation and traceability | Deny unauthorized scope and demonstrate actor/time/subject evidence for agreed material import/configuration actions. |

Numeric timing targets, sample size, data volume, observation period and who
validates the pilot remain open. No improvement, performance or adoption result
is claimed. IOP-130 will measure accepted targets once a pilot exists.

## Decision register

- **Confirmed by owner:** first pilot priority is CSV events → analysis → locate
  the asset. Source: explicit response to the IOP-001 priority question.
- **Proposed:** Administrator handles import/mapping, Team Leader performs analysis,
  Technician verifies/locates the asset. Confirm actual responsibilities.
- **Open:** synthetic CSV versus an authorized export; available grain, fields,
  identifiers, units, volume and map data.
- **Open:** which analyses are essential initially (for example frequency ranking,
  source-reported duration and period filters), and whether Pareto is required.
- **Open:** manual baseline, numeric targets, reviewers and observation period.

Priority confirmation alone does not accept every scope detail or finish IOP-001.

## Review evidence

Derived from repository vision, scope, module ownership and accepted ADRs. The
owner confirmed workflow priority. Detailed persona validation and pilot acceptance
measures are pending; documentation checks do not substitute for that validation.
