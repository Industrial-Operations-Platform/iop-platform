# POC delivery map

Owner-approved product scope: [local analytical POC](../product/scope-poc.md),
recorded under [IOP-142](items/IOP-142-poc-delivery-scope.md). These are delivery
increments selecting existing story slices, not five new mandatory architecture
phases. Start a small plan/branch for the selected story; do not activate all IDs.
A completed slice leaves a parent open when future requirements remain.

## Delivery preference — 2026-09-25

The owner prioritizes seeing the intended platform experience before substantial
backend functionality. Start with a reviewable visual flow for upload, reporting
dates, Executive Overview and analytical detail; identify fixture-backed states.
Connect persistence and import/read operations progressively alongside the UI so
that the final POC works end to end. A visual prototype alone is not completion.

Views use predefined calculations and filters within the accepted metric scope;
additional formulas require explicit definitions and reconciliation evidence.
Reporting dates and duplicate rejection retain the existing source-date semantics.
This sequencing preference does not add general organization/site CRUD, a formula
editor or administration screens to the [POC scope](../product/scope-poc.md).
Select implementation stories separately; IOP-026 remains the bounded site seed.

## Five observable increments

| Increment | Existing story slices | Exit evidence |
| --- | --- | --- |
| 1. Runnable local application | IOP-013–020, 022, 025–026, 123: local health/config, hosts, migrations, scoped seed and relevant tests | Documented local startup and API/UI connection; migrations reproducible. No worker or administration UI. |
| 2. CSV to verified stored data | IOP-011–012, 041–043, 045–049, 103, 125 | Original CSV retained; known normalized counts/durations and sector mappings; invalid input visible; duplicate source/site/date rejected. |
| 3. Executive Overview | IOP-089–091, 095, 097, 116, 120–122 | Frequency and accumulated duration with consistent filters, units, quality states and independently checked totals. |
| 4. Analytical detail | IOP-094, 096 and the same UI slices | Sector → area → source equipment → message/contributing records; overview/detail totals agree. No physical asset prerequisite. |
| 5. Reproducible demonstration | IOP-128–130, 132; local instructions from IOP-136 | Import → analyze → present from a known fixture, including failure/duplicate examples and safe demo reset. |

Tests, basic logs, secret exclusion and input validation accompany every increment
(IOP-020, 109–110). Implement the relevant checks, not an upfront complete test
platform. Add basic CI (IOP-021) when runnable checks exist; it does not gate the
first local demonstration. Measure representative performance during validation;
workers/caches/optimization need evidence, not anticipatory infrastructure.

IOP-020 provides the [POC testing entry point](../development/testing-poc.md),
`npm run test:poc`, for the current unit, integration and browser layers. Fixture
UI checks do not prove the pending import/analytics journey; new behavior brings
its own relevant tests in the delivering slice.

IOP-013 completed the [local health and diagnostic logging design](../architecture/health-logging-poc.md).
Process liveness and IOP-022 error correlation already exist; import correlation
and delivered-path verification remain implementation work. No readiness or metrics
platform is added.

IOP-014 has completed the [local security baseline](../architecture/security-baseline-poc.md)
as design. Configuration, input limits and scope controls still require executable
evidence in their delivery slices; ADR-0018 is Accepted; implementation remains pending.

IOP-011 completed the accepted [CSV preservation design](../architecture/csv-preservation-poc.md)
and [Accepted ADR-0022](../architecture/adr/ADR-0022-poc-csv-preservation.md).
The bounded storage choice is accepted as design; IOP-042 supplies its internal
RAW/batch storage below. ADR-0018 remains a separate runtime access gate.

IOP-041 completed the [logical RAW model](../architecture/raw-ingestion-poc.md):
immutable receipt provenance, scoped contributing-line references and separate
RAW availability/analytical outcomes. IOP-041 is design only; IOP-042 supplies
batch-owned storage and tested coordination below, without delivering a production
OIP receiver or the full CSV journey.

IOP-042 documents the [bounded import batch model](../architecture/import-batches-poc.md).
[Accepted ADR-0027](../architecture/adr/ADR-0027-poc-import-publication.md) recommends
atomic quota admission, cross-module publication and synchronous reconciliation.
The owner accepted the design on 2026-09-26. IOP-042 now supplies internal batch
storage/lifecycle and transaction coordination, with actual-role database tests.
The OIP receiver is exercised through a disposable test fixture; parser, mapping,
receiver and host activation still gate the working CSV-to-analysis journey. See
the [storage record](completed/IOP-042-import-batch-storage-plan.md).

IOP-043 completed the [canonical aggregate design](../architecture/event-aggregates-poc.md):
one fact per scoped source line, exact frequency/accumulated seconds, source
grouping, frozen classification, RAW provenance and unknown reporting windows.
It defines logical dimension equality without introducing physical assets or
fabricated occurrences. OIP receiver/storage and analytical reference encoding
remain future implementation; this design does not complete the CSV journey.

IOP-048 verifies retained synthetic RAW, normalized lines and scoped classification
against IOP-125's independent oracle through the disposable database receiver:
nine records, frequency 19 and 97,775 accumulated seconds, including unclassified
and repeated records. Rejection counts preserve unknown remainders; failed or
duplicate attempts add no measures. See the
[reconciliation record](completed/IOP-048-data-reconciliation-plan.md).
Production OIP receiving storage and importer/host composition remain pending;
IOP-048 stays In progress. This evidence does not complete analytical views or the
end-to-end POC, and batch outcome recovery is not a metric-integrity check.

IOP-103 has a [delivered-path validation plan](active/IOP-103-csv-validation-plan.md)
and remains Blocked on production OIP receiving storage, real importer/review
composition and ADR-0018 host activation. Existing internal evidence is reusable;
no second importer or integration registry is required.

## Critical dependency corrections

- IOP-014's local safety slice does not wait for IOP-007 sessions. Runtime context
  follows Accepted ADR-0018; implementation and verification remain pending.
- IOP-041 uses CSV-only IOP-011/012 contracts, not a map store or provider framework.
- IOP-042 records a direct bounded import; no dependency on IOP-010/024 workers.
- IOP-049 maps source area/sector vocabulary; no dependency on IOP-037 asset aliases.
- IOP-094/096 use source equipment references; no IOP-044/asset-survey prerequisite.
- IOP-103 validates the manual CSV path; no IOP-102 integration registry prerequisite.
- IOP-116 needs the frontend, not IOP-031 administration.
- IOP-125/128/129 use only the analytical fixture and journey; no workforce,
  maintenance, asset inventory, maps or login gates.

Story dependency sections are updated for these POC slices. Older broad acceptance
criteria in unchanged sections describe later parent scope, not extra POC gates.

## Complete inventory disposition

Selection is distinct from story status. Proposed does not mean required now;
Completed design does not mean implemented. Existing IDs are retained.

| IDs | POC disposition |
| --- | --- |
| IOP-001–006, 008 | Reuse completed design; do not repeat decisions or demand full platform implementation. |
| IOP-007 | Login/session delivery deferred. Accepted local context in ADR-0018; implementation pending. |
| IOP-009–010 | Full audit and job design/implementation not POC gates; retain future records. |
| IOP-011–014 | Narrow decisions for CSV provenance/contract, useful logs/health and local input/configuration safety. |
| IOP-015–020, 022 | Minimum local hosts, persistence, configuration, API errors and tests as used. |
| IOP-021 | Basic CI once commands exist; not a local-demo prerequisite. |
| IOP-023–024 | Audit and workers deferred. |
| IOP-025–026 | Scoped organization/site seed and ownership validation; CRUD/admin later. |
| IOP-027–031 | Full identity lifecycle, login and access administration later. Minimal principal/grant checking follows Accepted ADR-0018; not blanket authorization bypass. |
| IOP-032–040, 044 | Physical asset domain/mapping deferred. |
| IOP-041–043, 045–049 | Minimum CSV provenance, aggregates, validation, duplicate rejection and reconciliation. |
| IOP-050–088 | Workforce, handover, maintenance, maps and asset histories deferred. |
| IOP-089–091 | Query boundary and the two verified measures. IOP-091 supplies alarm duration, not unsupported downtime. |
| IOP-092–093 | Additional trends/Pareto after the first useful two-view demonstration. |
| IOP-094–097 | Source-equipment/area detail and shared filters; no physical registry requirement. |
| IOP-098–102 | Improvements and general integration registry deferred. |
| IOP-103 | Manual CSV delivery validation, reusing the importer; not a second import framework. |
| IOP-104–107 | External/vendor/identity integrations and their health platform deferred. |
| IOP-108 | Full shared-user authorization suite later; relevant scope/grant/RLS checks still accompany POC runtime access. |
| IOP-109–110 | Basic secrets/configuration hygiene and validation in delivered paths. |
| IOP-111–113 | Full audit verification and operational backup/restore later; reproducible demo reset remains required. |
| IOP-114–115 | Formal performance targets and worker/integration recovery later; measure the demo and avoid partial/duplicate imports now. |
| IOP-116 | Import, overview and detail navigation. |
| IOP-117–119 | Role homes, cross-module overview and global search deferred. |
| IOP-120–122 | Relevant loading/error/empty states, readable layout and accessible controls in the two views. |
| IOP-123 | Fictional organization/site seed. |
| IOP-124 | Physical asset demo deferred. |
| IOP-125 | Representative CSV aggregates and independent expected outputs. |
| IOP-126–127 | Workforce/maintenance fixtures deferred. |
| IOP-128–130, 132 | POC reset, end-to-end demonstration, owner feedback and reconciled results. |
| IOP-131 | Full shared-user permission acceptance later. |
| IOP-133–135 | Formal performance acceptance, deployment and admin guides later. |
| IOP-136 | Short local demo instructions only; broader user guide later. |
| IOP-137 | Check implemented slices against ADRs during delivery; full release architecture review later. |
| IOP-138 | Shared-use v1 release gate later; not the definition of POC completion. |
| IOP-139–141 | Existing repository governance; no additional platform prerequisites. |
| IOP-142 | This documentation alignment; no application implementation. |

## Review branches and future integration

`docs/IOP-007-authentication-model` contains an earlier basic-login proposal; this
owner-approved POC deferral supersedes its product timing, not its Proposed status.
`docs/IOP-009-audit-model` records an accepted future audit design and its explicit
pilot deferral. Neither branch is merged here. During owner review/integration,
preserve their evidence and reconcile older login requirements with this POC scope.
Do not infer acceptance of ADR-0015 or copy ADR-0017 into develop as an implicit merge.

IOP-109 provides [local secrets hygiene](../development/secrets-poc.md), including
a staged-index check and private-file exclusions. This bounded POC check supplements
manual review; it does not certify history or provide production secret management.

IOP-110 hardens the current health-only input contract with explicit parser ceilings,
unsupported query/body rejection and HTTP boundary tests. See the
[API input contract](../../apps/api/README.md#poc-input-validation-iop-110).
The parent remains In progress for CSV and analytical endpoint validation; this
slice does not implement those paths or their admission/processing limits.

IOP-027 implements minimal active principal storage and an explicit local insert-only
seed under [Accepted ADR-0024](../architecture/adr/ADR-0024-local-principal-bootstrap.md).
IOP-030 implements organization membership and both fixed site-role seeds under
[Accepted ADR-0025](../architecture/adr/ADR-0025-local-membership-bootstrap.md), with
atomic creation, strict unchanged reruns and forced seed RLS. User/membership
administration remains deferred; see the
[IOP-030 completed plan](completed/IOP-030-local-membership-plan.md).

IOP-029 implements current scoped permission lookup and a pinned operation transaction
under [Accepted ADR-0026](../architecture/adr/ADR-0026-poc-authorization-lookup.md).
The runtime has narrow lookup column reads with forced RLS, replacing its former
CONNECT-only baseline. Checks validate active principal/membership, exact ownership
and fixed grants before installing business context. Real-role tests cover denials,
revocation, rollback, cancellation, pool reuse and privilege drift. The bounded slice
is complete; the broader shared-user parent is Deferred. See the
[completed plan](completed/IOP-029-poc-authorization-plan.md).

ADR-0018 host activation, configured principal binding, loopback/origin protection
and future import/read endpoint tests remain pending. This lookup slice opens no
business endpoint and does not complete that independent runtime access gate.

IOP-045 implements the bounded pure CSV adapter with a fictional UTF-16 fixture,
physical-line provenance, exact normalized measures/totals and repeated-tuple
warnings. Syntax/value/budget failures return no partial dataset. See the
[execution record](completed/IOP-045-csv-adapter-plan.md). Preparation does not admit
an import: persisted reporting composition, IOP-049 classification, production OIP
receiving storage, IOP-042 composition and ADR-0018 host activation remain pending.
Legacy Python duration conversion parity is unverified.


IOP-046 adds internal bounded validation reports with invalid-row diagnostics,
complete versus interrupted inspection counts and no partial preparation results.
Its [execution record](completed/IOP-046-import-validation-plan.md) covers executable
value/structure/budget scenarios. The story remains In progress for persisted
import/review visibility; host activation, scoped classification and production
OIP receiving validation/publication remain independent dependencies.

IOP-047 verifies the existing date-claim mechanism together with the real CSV
adapter and retained synthetic input: repeated/changed imports, concurrency,
independent namespaces, invalid-input retry and uncertain-success reconciliation.
Repeated source rows retain their measures. The disposable receiver proves internal
coordination only; production OIP storage and delivered conflict visibility remain
pending, so the parent stays In progress. See the
[execution record](completed/IOP-047-import-idempotency-plan.md).

IOP-049 supplies the pure scoped classification stage with immutable configuration
snapshots, exact area matching and unclassified records retained in totals. Synthetic
checks cover configuration conflicts, scope/revision mismatch and unchanged measures.
Owner-supplied membership reconciliation is complete and the private local JSON
is editable; durable receipt/OIP composition remains pending. The story stays
In progress. See the [configuration record](completed/IOP-049-editable-mappings-plan.md).

IOP-089 has a [bounded query design](../architecture/analytics-query-poc.md) with
[Accepted ADR-0028](../architecture/adr/ADR-0028-poc-analytics-query-consistency.md)
for dimension references, revision consistency and contributing-record pagination.
The owner accepted the design on 2026-09-26. The story remains Blocked pending
production OIP storage/local host activation. No analytical service or endpoint is delivered; internal IOP-048
reconciliation evidence does not prove runtime overview/detail parity. See the
[active plan](active/IOP-089-analytics-query-layer-plan.md).
