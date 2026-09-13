# V1 personas and analytical workflow

Status: In review under [IOP-001](../planning/items/IOP-001-v1-personas-and-pilot-workflow.md).
Current confirmed scope: **CSV → preparation/normalization → analysis → presentation**.
The owner explicitly deferred precise asset location because surveying the plant
and identifying every sensor requires substantial work. This supersedes the earlier
CSV → analysis → locator pilot. No implementation is claimed.

## Current process reported by the owner

The owner is the only project developer and currently uploads a consistent-format
CSV exported from WinCC. An existing Python script formats it and loads a local
database, then Power BI reads the data and presents reports locally. These source
artifacts have not been inspected in this task; exact transformations, reports and
KPI parity remain to be documented.

IOP v1 should reproduce the useful analytical behavior inside the product with
individual logins and appropriate views. The owner requests porting the existing
Python CSV transformation behavior to the TypeScript/Node.js backend accepted in
ADR-0006 (TypeScript compiles to JavaScript). The script remains uninspected: use
it as a behavioral reference, review source-specific rules and verify equivalent
outputs on representative identical inputs before replacing the current process.
No conversion is implemented here. Power BI embedding and database schema details
are not selected by this requirement.

## Responsibilities

### Administrator — initially the owner

Confirmed: uploads/prepares CSV, reviews failed imports and manages user accounts,
memberships and source configuration. The owner explicitly assigned these duties
to their Administrator profile; they are not inferred from being the developer.
Keep this a reusable platform responsibility, not a dependency on a named person.

### Team Leader

Confirmed: interprets analysis and presents results to a superior. Needs report
views/templates, charts, KPIs and source-provided sector/equipment context where
available. Shares analytical investigation capability with Taskforce within the
permitted scope. Confirmed v1 baseline: consultation and analysis, without
administrative import, user-management or configuration duties.

### Taskforce investigator

Confirmed: handles the most serious operational problems and needs automated
analysis to investigate faults and recurrence. In v1, available source identifiers
and context support investigation; exact physical sensor location is not promised.
The longer-term need is sector-to-sensor location, potentially in 3D after suitable
survey/mapping data exists. Taskforce is the current group label, not a hard-coded
customer-specific core type. Like Team Leaders, this profile consults/analyzes
within its permitted scope and does not perform administrative duties in v1.

### Management recipient

Confirmed: receives information presented by Team Leaders only. No direct IOP login
or management dashboard role is required for v1. Presentation format remains open.

### Responsibility boundary

The owner confirmed the Administrator versus analytical-profile responsibility
split. Exact permission identifiers and scope enforcement belong to IOP-006; this
baseline does not select an authentication provider. Map/asset survey administration
is deferred with Asset Locator and does not block v1.

## Proposed acceptance preconditions

- Individual accounts and permitted customer/site context for application users,
  plus an unauthorized scope for negative checks.
- A representative CSV in the actual expected format with independently known
  counts/measures and examples of invalid, repeated and corrected input.
- Agreed reporting/KPI definitions and reference outputs from the existing process.

Whether to use synthetic data, an authorized sample or both remains to be decided.
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
   using the presentation mechanism still to be specified.

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

## Proposed acceptance measures

| Measure | Evidence to agree |
| --- | --- |
| Workflow coverage | Owner can supply CSV; authorized users analyze it; Team Leader presents the agreed results. |
| Import integrity | Known counts and measures reconcile with documented rejection/correction handling; replay does not duplicate facts. |
| Transformation parity | The TypeScript/Node.js port matches reviewed Python transformation outputs for identical representative CSV inputs, including agreed edge cases and explained intentional corrections. |
| Analytical parity | Agreed reports/KPIs match independently checked outputs of the existing workflow at the same grain and period. |
| Usability/value | Users can answer selected operational questions and prepare results with measured effort against the current manual baseline. |
| Isolation/traceability | Unauthorized scopes are denied and results/material changes retain their agreed provenance and audit evidence. |

Report list, calculation rules, timing targets, volume, observation period and
reviewers remain open. No measured improvement or acceptance is claimed.

## Current decision register

- Confirmed: v1 delivers current Power BI-style analytics after CSV preparation;
  precise location and 3D are future scope, not first-release prerequisites.
- Confirmed: owner uploads; Team Leader analyzes/presents; Taskforce investigates;
  management only receives presentations. Application users have individual logins.
- Confirmed: the owner's Administrator profile owns import/error review and
  user/configuration administration. Team Leader and Taskforce consult/analyze.
- Confirmed: port the existing Python CSV transformation behavior to the accepted
  TypeScript/Node.js backend; verify output equivalence before replacement.
- Persona responsibility validation is complete at this task's level; detailed
  RBAC remains separate work.
- Later discussion: representative data/script/report evidence, exact templates and
  KPIs, presentation mechanism, operating constraints and measurable acceptance.
- Future direction: meetings, shifts and other platform functions; precise asset
  location/3D and direct read-only source integration. Sequence and technologies open.

## Validation evidence

Recorded from the owner's chat clarifications and checked against current product
scope and accepted foundational ADRs. No source artifacts or operational results
were verified. IOP-001 remains active until its outstanding criteria are validated.
