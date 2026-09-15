# IOP-008 — Define the time and time-zone model

## Status

Completed — the owner explicitly accepted
[ADR-0016](../../architecture/adr/ADR-0016-time-and-timezone-model.md) and the architecture guidance is synchronized. No runtime implementation exists.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define time zones, UTC, overnight shifts and timestamp semantics across modules.

## User / business value

Reports must preserve the meaning of source dates and periods, compare instants
consistently and avoid misleading totals around midnight or clock changes.
The team needs a reviewable decision before implementation.

## Context

The owner requested evaluation, an ADR and documentation updates if accepted.
The seed lists temporal topics but no explicit alternatives. ADR-0016 compares
local-only, UTC-only and combined representations; regional versus implicit/fixed
zones; storage/transport; interval bounds; ambiguity; shifts; and historical context.

Read the [modules](../../architecture/modules.md),
[data model](../../architecture/data-model.md),
[glossary](../../product/glossary.md) and [workflow](../workflow.md).
The requested historical `active/IOP-002-backend-stack.md` was migrated to
[backend evaluation](IOP-002-backend-evaluation.md); the
[current backend review](IOP-002-backend-review.md) and
[stack item](IOP-002-technology-stack.md) record the accepted decisions.

## Current state

PostgreSQL and TypeScript/NestJS are accepted, and each site requires explicit
zone context under ADR-0012. Detailed temporal contracts are accepted under ADR-0016.
V1 is CSV normalization and analytics; shift scheduling is deferred.
The [CSV evidence](../../product/csv-and-reporting-reference.md) confirms a
filename reporting date but not its exact window, time zone or event timestamps.

## Desired state

An accepted generic model distinguishes instants, calendar values, reporting
periods and durations. It defines source interpretation, midnight/DST behavior,
future overnight shift semantics and preservation of historical meaning.
Unknown source facts remain explicit rather than being guessed.

## Requirements

- Deliver only the temporal design, with options, recommendation and ADR.
- Preserve identity, authorization, organization/site scope and module boundaries.
- Keep source time rules and customer zones in scoped configuration/adapters.
- Address transport, storage precision, provenance and analytical coverage.
- Obtain explicit acceptance before updating the accepted architecture baseline.

## Acceptance criteria

- [x] Time zones, UTC, overnight shifts and timestamps defined in Accepted ADR-0016.
- [x] Plan and ADR document options, scenarios and decisions without scope expansion.
- [x] Documentation validation evidence recorded; proposal item/backlog synchronized.
- [x] Owner explicitly accepts the temporal decision.
- [x] Accepted architecture, module, data-model and glossary guidance synchronized.

## Domain considerations

Keep instants distinct from local dates and schedule intent. Aggregates cannot
reconstruct occurrences or shift membership. Shift semantics do not activate the
deferred Workforce module, labor/pay rules or a scheduling UI.

## Architecture constraints

Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md),
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md),
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md),
[ADR-0012](../../architecture/adr/ADR-0012-organization-site-scope.md),
[ADR-0013](../../architecture/adr/ADR-0013-tenancy-data-isolation.md) and
[ADR-0014](../../architecture/adr/ADR-0014-scoped-rbac.md).
Proposed is not Accepted. ADR-0015 belongs to the independent IOP-007 branch.

## Security considerations

Existing permissions and organization/site scope remain mandatory for temporal
configuration, imports and results. Time-zone selectors are not access grants.
No secrets, production records or industrial write-back are required.

## Data considerations

Use UTC instants plus explicit zone/provenance, calendar dates and resolved
half-open periods. Preserve RAW values and unresolved interpretation. No schema
or migration is created; no rounding, fabricated midnight or source window is assumed.

## API considerations

Use the accepted RFC 3339 instant profile, separate local-date contracts and
period/coverage metadata. No endpoint or generated schema is implemented.

## UI considerations

Reports retain site/period context across devices and label ambiguity/unknown
coverage. No zone preference editor or scheduling interface is selected.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md) is accepted and integrated into develop.
IOP-002 and IOP-003 supply accepted stack/API constraints. IOP-007's unmerged
proposal is not a prerequisite. Dependencies do not activate adjacent stories.

## Non-goals

Applications, tests for nonexistent runtime behavior, migrations, endpoints,
infrastructure, date-library selection, customer rules in core or source-schema
invention. No deferred workforce feature, payroll rule or multi-site report.

## Validation

Review official capability sources, relative links, IDs, statuses, English prose,
branch ancestry and whitespace. Walk through UTC conversion, midnight, DST gaps
and repeated times, 7/8/9-hour shifts, 23/25-hour days, period boundaries, source
ambiguity, precision and historical changes. These are design reviews, not executed
runtime tests. See the [evaluation plan](../completed/IOP-008-time-and-timezone-evaluation-plan.md).

## Documentation impact

This item, its [backlog](../backlog.md) row, ADR-0016 and the evaluation plan preserve
the proposal evidence. Accepted architecture, modules, data model, glossary and
ADR-0011/0012 follow-up notes are synchronized under the
[acceptance plan](../completed/IOP-008-time-and-timezone-acceptance-plan.md).
IOP-008 is complete as design; no adjacent implementation is activated.

## Open questions and implementation handoff

- The owner explicitly accepted ADR-0016 and authorized publication of the story
  branch to origin. No decision acceptance remains pending for IOP-008.
- Source contract work must confirm the CSV filename date's exact reporting window
  and zone before exact period/shift/rate semantics can be used. This unknown does
  not prevent accepting a generic model that represents unresolved source periods.
- Bootstrap must verify the chosen runtime/driver's parsing, millisecond round trips
  and time-zone-data provenance. Fine precision needs a reviewed contract change.


## Owner clarification: CSV reporting date

The owner manually dates the filename and requires the pilot to reject dates that
already have imported data for the same configured source and organization/site.
A second check against a date selected at upload is a suggested option; if adopted,
values must agree before admission. No automatic overwrite or replacement is implied.
See the [source evidence](../../product/csv-and-reporting-reference.md#confirmed-pilot-reporting-date-input-and-duplicate-rejection)
and [clarification plan](../completed/IOP-008-csv-date-clarification-plan.md).

This confirms date-entry and duplicate-rejection intent, not exact reporting hours
or time zone. ADR-0016 remains Accepted and IOP-008 remains Completed as design;
import concurrency, retries and UI contracts remain future ingestion work.
