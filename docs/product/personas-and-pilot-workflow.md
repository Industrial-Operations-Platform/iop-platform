# V1 personas and analytical workflow

Status: Accepted design baseline under [IOP-001](../planning/items/IOP-001-v1-personas-and-pilot-workflow.md).
Current confirmed scope: **CSV → preparation/normalization → analysis → presentation**.
The owner explicitly deferred precise asset location because surveying the plant
and identifying every sensor requires substantial work. This supersedes the earlier
CSV → analysis → locator pilot. No implementation is claimed.

## Current delivery precedence

The owner-approved [POC scope](scope-poc.md), recorded in IOP-142 on 2026-09-15,
prioritizes a local single-operator demonstration without login. The individual
accounts, role administration and shared-user access scenarios below remain the
accepted baseline for later shared use, not POC gates. Analytical responsibilities,
source integrity and the two-view reporting baseline remain applicable now.
This preserves the IOP-001 acceptance history without repeating its design work.

## Current process reported by the owner

The owner is the only project developer and currently uploads a consistent-format
CSV exported from WinCC. An existing Python script formats it and loads a local
database, then Power BI reads the data and presents reports locally. Loader/repository excerpts, CSV structure and report screenshots were reviewed
under IOP-002; see the [reporting evidence](csv-and-reporting-reference.md).
The complete pipeline has not been executed and KPI parity is not verified.

IOP v1 should reproduce the useful analytical behavior inside the product with
individual logins and appropriate views. Python, Power BI embedding, source-code
reuse and the future IOP database schema are not selected by this requirement.

## Responsibilities

### Data operator — initially the owner

Confirmed: currently uploads and prepares the CSV. The platform must support that
function without depending on one named person. The owner confirmed their Administrator profile also reviews failed imports and
maintains mappings/configuration. This is an operational responsibility, not a
hard-coded personal identity or a detailed permission matrix.

### Team Leader

Confirmed: interprets analysis and presents results to a superior. Needs report
views/templates, charts, KPIs and source-provided sector/equipment context where
available. Shares analytical investigation capability with Taskforce within the
permitted scope. Team Leader and Taskforce consult/filter; they do not edit report definitions
or administer imports and configuration.

### Taskforce investigator

Confirmed: handles the most serious operational problems and needs automated
analysis to investigate faults and recurrence. In v1, available source identifiers
and context support investigation; exact physical sensor location is not promised.
The longer-term need is sector-to-sensor location, potentially in 3D after suitable
survey/mapping data exists. Taskforce is the current group label, not a hard-coded
customer-specific core type.

### Management recipient

Confirmed: receives information presented by Team Leaders only. No direct IOP login
or management dashboard role is required for v1. Present directly from IOP; PDF/image export is deferred.

### Administration — owner-confirmed responsibility

The owner's Administrator profile manages users, configuration and import-quality review.
One person may perform several responsibilities. Map/asset survey administration
is deferred with Asset Locator and does not block this v1 responsibility discussion.
Personas are not an accepted RBAC matrix or an authentication-provider choice.

## Acceptance preconditions for future implementation

- Individual accounts and permitted customer/site context for application users,
  plus an unauthorized scope for negative checks.
- A representative CSV in the actual expected format with independently known
  counts/measures and examples of invalid, repeated and corrected input.
- Agreed reporting/KPI definitions and reference outputs from the existing process.

Choose representative synthetic or authorized reference data during validation planning;
no production dataset is authorized by this design acceptance.
No full plant inventory, survey, map or sensor coordinates are required.

## End-to-end scenario

1. **Configure — Administrator:** define the permitted site
   and CSV mapping using the agreed format. Keep source vocabulary outside core.
2. **Upload — Administrator:** submit CSV and receive a traceable import result;
   preserve original input, validate and normalize it.
3. **Review — Administrator:** inspect rejected/unresolved rows
   and reconciliation. Explain corrections and ensure repeat input does not double
   count facts under the agreed idempotency contract.
4. **Analyze — Team Leader or Taskforce:** use the agreed templates, charts, filters
   and KPIs. Investigate recurrence and source-provided sector/equipment references
   without requiring a physical asset match or exact coordinates.
5. **Inspect evidence — authorized analyst:** trace a result to contributing records,
   its period, units and data-quality limits. Separate individual occurrences from
   period aggregates; do not infer downtime or root cause from insufficient data.
6. **Present — Team Leader:** communicate the agreed analytical results to management
   directly from IOP; export is deferred.

IOP does not control the installation, resolve physical faults automatically or
require a live WinCC database connection in v1.

## Failure and access scenarios

- Invalid input: visible reasons/status and preserved provenance, without unexplained
  omissions presented as complete analytics.
- Duplicate/corrected input: explicit replay/correction semantics and reconciled totals.
- Missing/ambiguous equipment reference: retain the analytical record and expose its
  uncertainty; do not invent a physical asset or location to make the import succeed.
- Unauthorized scope: deny direct record/query/export access as well as UI navigation.
- Aggregate-only data: retain periods and counts; do not fabricate exact occurrences,
  shift attribution, sensor position or downtime. Source duration may overlap.

## Accepted acceptance measures

| Measure | Required future evidence |
| --- | --- |
| Workflow coverage | Owner can supply CSV; authorized users analyze it; Team Leader presents the agreed results. |
| Import integrity | Known counts and measures reconcile with documented rejection/correction handling; replay does not duplicate facts. |
| Analytical parity | Agreed reports/KPIs match independently checked outputs of the existing workflow at the same grain and period. |
| Usability/value | Users can inspect frequency/duration by the agreed filters and present results from IOP. Numerical effort targets are deferred before release acceptance. |
| Isolation/traceability | Unauthorized scopes are denied and results/material changes retain their agreed provenance and audit evidence. |

The baseline below is accepted by the owner. Detailed calculation contracts,
reference fixtures and numerical performance targets remain scoped follow-up work.
No measured improvement or runtime acceptance is claimed.

## Current decision register

- Confirmed: v1 delivers current Power BI-style analytics after CSV preparation;
  precise location and 3D are future scope, not first-release prerequisites.
- Confirmed: owner uploads; Team Leader analyzes/presents; Taskforce investigates;
  management only receives presentations. Application users have individual logins.
- Confirmed: Administrator owns imports/error review and user/configuration
  administration; analysts consult/filter without editing. Prior evidence is recorded
  in commit `830b943`; this review synchronizes those confirmations without a merge.
- Accepted: frequency and accumulated alarm duration in executive/detail views,
  reconciled filter-consistent totals, scoped read access and direct presentation.
- Deferred: export and numerical performance targets before release acceptance;
  detailed calculation contracts and representative fixtures belong to delivery work.
- Future direction: meetings, shifts and other platform functions; precise asset
  location/3D and direct read-only source integration. Sequence and technologies open.

## Validation evidence

Recorded from the owner's chat clarifications and checked against current product
scope and accepted foundational ADRs. Source excerpts were reviewed under IOP-002; no operational results were verified.
The owner explicitly accepted the final baseline and deferrals on 2026-09-14.
IOP-001 is Completed as design; release validation remains future work.

## Confirmed report configuration and views

The owner confirmed an Executive Overview and a detailed analysis view with filters
for external `Halle`, `Bereich`, `Betriebsmittel` and `Meldetext` concepts. Source
labels/grouping rules remain customer-scoped mappings. Only the administrator
changes versioned files selecting implemented metrics, groupings and chart types.
New formulas require code changes; an administration UI is deferred. These decisions
were confirmed during IOP-002 and do not need repeated approval.

## Accepted final acceptance baseline

The owner explicitly accepted the following baseline and deferrals on 2026-09-14.

- Initial measures: reported occurrence frequency and accumulated alarm duration,
  with explicit units. Accumulated duration is not elapsed plant downtime.
- The two confirmed views expose these measures and retain visible scope/period
  filters. For identical inputs and filters, overview/detail totals agree with
  independently validated reference totals; every discrepancy must be explained.
- Administrator imports and reviews errors; invalid/duplicate data must not silently
  distort totals. Precise correction semantics are defined before importer delivery.
- Authorized analysts consult/filter without editing; requests outside their
  permitted scope are denied. Team Leader presents directly from the application.
- PDF/image export, additional formulas/targets and numerical performance/value
  thresholds are explicitly deferred to their scoped requirements before release
  acceptance. This does not claim that any performance target has been achieved.

IOP-090/091 own exact metric contracts; IOP-097 owns filter/period behavior;
IOP-048/132 own reconciliation; IOP-130 owns pilot measurement and IOP-114/133
performance validation. These references do not activate adjacent work. These follow-ups do not block this accepted design baseline; no adjacent story
is activated and no release readiness is claimed.
