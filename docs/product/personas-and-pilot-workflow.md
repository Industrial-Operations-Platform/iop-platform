# V1 personas and pilot workflow proposal

Status: Draft under [IOP-001](../planning/items/IOP-001-v1-personas-and-pilot-workflow.md).
**Owner-confirmed v1 boundary: CSV events → analysis → locate the asset.**
The owner has described the current workflow and primary user responsibilities.
Detailed permissions, report requirements, pilot data and success targets remain open.
This document describes future behavior, not an implemented or tested application.

## Pilot objective

Demonstrate that an authorized team can import event history from CSV, identify a
recurring event or affected asset through explainable analysis, and locate the
correct validated asset on a versioned map. Every analytical result must remain
traceable to its source records.

## Current workflow reported by the owner

The owner is the only developer on this project and currently uploads the CSV.
The export is reported to have a consistent WinCC format. An existing Python
script formats the file and loads a local database; Power BI reads that database
and presents results locally. Neither the script nor the database, CSV or reports
has been inspected in this task, and feature parity has not been verified.

IOP should reproduce those useful import, reporting-template, chart and KPI
capabilities within its own product experience, with a path from analysis to asset
location. Exact reports/KPIs and whether any Power BI coexistence is needed remain
to be specified; Power BI embedding or code reuse is not selected by this goal.

Direct acquisition from the source behind WinCC Viewer or its database is a future
objective. Source identity, supported interfaces, access rights and compatibility
need discovery later; the Viewer itself is not assumed to be a database/API.
The existing CSV process remains the v1 input boundary.

## Personas and confirmed responsibilities

### Data operator — initially the project owner

Confirmed: the owner currently uploads and prepares the CSV using the existing
pipeline. In v1 this operational function supplies the event data for analysis.
It is a reusable responsibility, not a hard-coded dependency on one named person.

Import-error resolution, configuration privileges and responsibility for maintaining
asset aliases/maps still need explicit confirmation. Do not automatically grant
all administrator permissions merely because this person develops the project.

### Team Leader

Confirmed: analyzes the results and presents them to a superior. Needs report
views/templates, charts and KPIs, plus the ability to understand where faults
occurred, with the same automated analysis and sector-to-sensor location drill-down
available to Taskforce so the Team Leader can also help investigate. This is an
analytical responsibility, not responsibility for uploading
CSV or maintaining maps unless subsequently confirmed.

### Taskforce investigator

Confirmed: handles the most serious operational problems. Needs access to the
full automated analysis within the authorized scope and to fault locations from
a configured sector down to an individual sensor, where validated data supports
that resolution. This is analysis plus investigation and asset lookup, not just a map.
Whether investigators may correct asset identity, aliases or placements is open.
Taskforce is the current group label; generic domain and permission names must
remain reusable across customers.

### Management recipient

Confirmed: the superior only receives information presented by Team Leaders.
No direct IOP login or management dashboard role is required for this recipient
in v1. The presentation medium remains a later reporting question.

### Administration responsibility — still to assign

Customer/site configuration, accounts, memberships, source mappings and map/asset
maintenance need owners. These duties are not automatically assigned to the data
operator, Team Leader or Taskforce. One person may hold several responsibilities.

Each application user needs an individual login and access to the views they need.
These needs are confirmed; exact role/permission/scope rules and login technology
belong to the later RBAC/authentication designs and remain undecided.

## Proposed preconditions and fictional data

- One fictional organization/site and a second organization for access-denial tests.
- Individual accounts for application users; management receives presentations only.
- A small synthetic CSV with documented columns, known frequency/duration totals,
  periods, units and source grain; include repeated, invalid and unresolved inputs.
- Canonical assets with scoped external aliases, survey validation status and one
  ambiguous alias. One validated asset has a marker; another has no placement.
- An approved fictional map with an explicit version and coordinate convention.

Synthetic data is a proposal pending owner confirmation. A later authorized export
may be used without changing the generic contract. No fixture or import code is
created by IOP-001. Provider, login mechanism and physical tenancy remain undecided.

## End-to-end scenario

1. **Prepare — Configuration owner (to confirm):** select the authorized site, map external CSV fields
   to the documented source contract, and establish asset aliases and map context.
2. **Import — Data operator (initially the owner):** import the CSV as a traceable batch. Preserve RAW
   records, validate/normalize inputs and report accepted, rejected and unresolved
   records. A repeat import must not duplicate facts under agreed source-key rules.
3. **Reconcile — Import reviewer (to confirm):** compare normalized counts and supported measures
   with the source, accounting for corrections/rejections. Do not mark an import
   analytically ready while discrepancies remain unexplained.
4. **Analyze — Team Leader or Taskforce investigator:** select a period and permitted location/asset filters;
   inspect event frequency and source-reported duration, with grain and coverage
   visible. Identify a recurring event or affected asset for investigation.
5. **Inspect evidence — Team Leader or Taskforce investigator:** drill from the selected result to contributing
   normalized and RAW records. Distinguish event occurrences from period aggregates;
   the result must not imply exact timing, downtime or root cause without evidence.
6. **Identify — Taskforce investigator or Team Leader:** follow the canonical asset reference from the result.
   If mapping is ambiguous or unvalidated, review candidates before continuing;
   imported alarm text alone does not prove the identity of a physical component.
7. **Locate — Taskforce investigator or Team Leader:** open the selected asset's placement on the correct map
   version, highlight its marker and show physical and functional context. If it
   has no placement, show that state without inventing a location. Support navigation
   from configured sectors/areas to individual components such as sensors when
   validated hierarchy and placement data exist; do not impose fixed levels.
8. **Present — Team Leader:** use the agreed report views/templates, charts and
   KPIs to explain results to the management recipient. The presentation/export
   mechanism is still open.
9. **Review — Authorized users:** confirm that the result, source evidence, canonical
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

## Confirmed v1 boundary and proposed supporting capabilities

Required capabilities for this confirmed workflow priority: scoped access, CSV
mapping/RAW capture, batch validation, idempotency/reconciliation, canonical asset
identity and aliases, manual validation, period-based frequency/duration analysis,
source drill-down and versioned asset lookup on a map. Team Leaders and Taskforce
share the automated analysis and location-investigation capability within their
authorized scopes; editing privileges remain unassigned. Basic audit covers imports
and material configuration changes according to the later audit model.

Maintenance, handover, workforce scheduling and other broader platform workflows
are outside v1, as explicitly clarified by the owner. They remain future product
backlog candidates. Improvement tracking, real-time ingestion, predictive analytics
and direct production vendor connections are also outside v1.

Relevant task groups to refine after scope validation: IOP-025–040 (scoped core and
assets), IOP-041–049 (CSV data foundation), IOP-076–083 (locator) and IOP-089–097
(OIP analysis). This is not authorization to implement all tasks in those ranges;
select the minimum slices that satisfy the validated pilot scenario.

## Acceptance and pilot measures

| Measure | Proposed evidence |
| --- | --- |
| Complete workflow | Data operator supplies a sample; its designated reviewer reconciles it; Team Leader analyzes/presents the result; Team Leader or Taskforce locates the validated asset. |
| Import integrity | Known input counts and supported measures reconcile with explicit exclusions/corrections; replay does not duplicate facts. |
| Analytical correctness | Frequency/duration results match an independently prepared expected sample calculation at the same grain and period. |
| Asset lookup correctness | The result resolves to the expected canonical asset and map version, or clearly reports ambiguity/missing placement. |
| Investigation effort | Measure elapsed time from CSV availability to an explained result and correct asset lookup against an agreed manual baseline. |
| Isolation and traceability | Deny unauthorized scope and demonstrate actor/time/subject evidence for agreed material import/configuration actions. |

Numeric timing targets, sample size, data volume, observation period and who
validates the pilot remain open. No improvement, performance or adoption result
is claimed. IOP-130 will measure accepted targets once a pilot exists.

## Decision register

- **Confirmed:** v1 is CSV events → analysis → locate the asset; other platform
  workflows are future scope. Individual logins and appropriate views are required.
- **Confirmed:** owner currently uploads; the existing Python → local database →
  local Power BI workflow is the behavioral reference, not a chosen IOP stack.
- **Confirmed:** Team Leader analyzes, presents to a superior and needs location
  context. Taskforce views faults/data and needs exact location for investigation.
- **Confirmed:** management receives Team Leader presentations only, without a v1
  login. Taskforce tackles serious problems; both Taskforce and Team Leader need
  automated analysis and sector-to-sensor location investigation.
- **Open — responsibilities first:** import-error review; configuration, account and map/asset maintenance ownership;
  viewing versus editing capabilities for Team Leader and Taskforce.
- **Open — later discussion:** representative CSV/script/report evidence, source
  grain and fields, authorized pilot dataset and map data, exact templates/charts/
  KPIs, presentation format, baseline, numeric targets and observation period.

## Review evidence

The owner provided the current workflow and responsibility clarification in chat.
Those statements are recorded as confirmed requirements; unassigned duties remain
explicitly open. No source artifacts or operational results have been verified.
IOP-001 stays active while responsibilities and acceptance details are resolved,
one topic at a time. Documentation checks do not substitute for user validation.
