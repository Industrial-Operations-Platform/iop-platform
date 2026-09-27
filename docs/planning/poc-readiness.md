# POC readiness and closure review — 2026-09-26

> Historical snapshot, superseded for current readiness by
> [IOP-147 delivery](poc-delivery.md) on 2026-09-27. The findings below describe
> `52e803b`; they are retained as the reason for the integrated implementation.
> Technical runtime blockers were resolved. The owner subsequently rejected the
> analytical experience; [IOP-148](items/IOP-148-analytical-workspace.md) tracks the
> requested report workspace, database reference and hexagonal implementation.


Review of `develop` at `52e803b`, under
[IOP-146](items/IOP-146-poc-readiness-review.md). The accepted
[scope](../product/scope-poc.md) is coherent, but the POC is not runnable end to end.
All 15 Blocked stories still have unmet runtime or observation criteria. None can
be closed solely from its completed design, preparation or preview increment.

## Coverage against the minimum useful result

| Required outcome | Available evidence | Remaining delivery |
| --- | --- | --- |
| Local React/Vite, NestJS and PostgreSQL startup | IOP-015–020/022; [Docker guide](../../infra/docker/README.md), [database guide](../../infra/database/README.md), health API and web connection | Business host composition and local execution protection. Current OpenAPI contains only `/health`. |
| One organization/site with zone and configured source | IOP-025/026/123 seeds, IOP-018 configuration; IOP-027/030 principal/grants and IOP-029 lookup | Bind these to each host operation under Accepted ADR-0018. Deferred administration parents do not invalidate their delivered seeds. |
| Preserve CSV and normalize frequency/duration with mappings | IOP-042 retained RAW/batches; IOP-045 parser; IOP-046 diagnostics; IOP-049 pure classification and editable configuration | Durable OIP receiver, immutable facts/classification, and real receipt → parse → classify → publish composition. |
| Visible invalid input, unresolved mappings and date duplicates | IOP-046–048 internal tests, date claims and independent oracle | Submit/review transport and UI, including renamed duplicates, safe recovery and no partial facts. Unclassified records remain included. |
| Executive Overview and detail with shared filters and provenance | IOP-089–095 specifications; IOP-096/097 fixture interaction; IOP-116 navigation | Executable reads and connected result views, stable scoped references, revision checks, bounded contributing pages and source-record access. |
| Coverage and metric limits | Accepted source/time/filter/query contracts and preview disclosures | Deliver the same distinctions from stored data: missing imports versus no matches, unknown windows, reporting labels and accumulated duration rather than downtime. |
| Reproduce, demonstrate and safely reset | IOP-123/125 fixtures; IOP-128 accepted reset design; IOP-129/130/132 procedures | Reset implementation, real import-to-both-views reconciliation, owner walkthrough and recorded dataset sizes/timings. |

Relevant secrets, input, logging, isolation and test requirements are covered by
IOP-013/014/020/109/110 and the delivering slices. They need business-path evidence;
health validation and existing unit tests alone do not meet that requirement.
CI, shared-user authentication, assets, workers, external integrations and full
production operations remain outside the first local demonstration gates.

## Missing implementation ownership

The recurring blockers are not unresolved approval of ADR-0018, ADR-0028 or
ADR-0029: all three are Accepted. The delivery map names their missing code, but
does not give the following work an unambiguous executable story scope:

1. **Local execution adapter and host activation.** Create a bounded implementation
   item for ADR-0018, reusing IOP-029's current-grant check and pinned transaction.
   IOP-142 is completed scope/design; deferred login stories must not accidentally
   become the prerequisite. Require explicit activation, configured principal and
   target, nonlocal-startup refusal, loopback/origin protection and denial tests.
   Host infrastructure can start independently; final access proof needs real
   import/read operations.
2. **OIP aggregate persistence and receiving contract.** Create a bounded
   implementation item for the [IOP-043 model](../architecture/event-aggregates-poc.md)
   and ADR-0027 publication contract. IOP-043 explicitly completed design only;
   the `batch_receiver_probe` used in database tests is not its implementation.
   Require a migration, forced scoped RLS, exact measures, immutable classification,
   validated RAW-line references and atomic publication/inspection on the supplied
   transaction. This can be implemented and tested before browser/host activation.
3. **Manual import composition and submit/review UI.** Give one bounded delivery
   item ownership of composing the existing batch, parser, mapping and OIP contracts,
   plus the HTTP/browser workflow. IOP-045 is a completed pure adapter; IOP-103
   explicitly owns validation, while IOP-116 completed navigation only. Reuse them;
   do not implement a second importer. Include admission budgets, cancellation,
   outcome recovery, RAW review, persisted diagnostics and correlated safe errors.

These are recommended implementation items, not new architecture or activated
stories in this review. Give each its own branch/plan when selected. Their
acceptance should cite the existing contracts and related story criteria so the
same runtime evidence can close the dependent stories without duplicate code.
Any newly required architectural mechanism still needs its own decision review.

## Execution and closure order

| Order | Work and stories it enables | Evidence required before closing |
| --- | --- | --- |
| 1 | Deliver OIP persistence/receiver and local host adapter as separate slices | Real-role scope/constraint/rollback tests; immutable exact facts; configured actor/grants, origin and startup denials. Keep host acceptance open until delivered operations are exercised. |
| 2 | Compose real CSV submit/review; finish relevant IOP-042/046/047/048/049/110 criteria; validate IOP-103 | Valid, invalid, renamed duplicate and unclassified input through the real path; retained RAW and counts; no partial publication; explicit errors/recovery and access denials. |
| 3 | Implement IOP-089, then verify IOP-090/091/094/095 | Independent totals and grouped results on real facts; shared selection, one-statement consistency, revision changes, scoped references and pagination. Internal query work can start once storage exists; endpoint closure also requires the host. |
| 4 | Connect IOP-097/096 and finish IOP-120/121/122 | Real overview/detail filters, drill-down/back and contributing records; error/retry and coverage states; keyboard, accessible data and laptop/tablet checks. |
| 5 | Implement IOP-128; execute IOP-129 and IOP-132; finalize IOP-136 and collect IOP-130 observations | Safe scoped reset/reload and complete source-to-report evidence, verified instructions, actual timings and owner feedback. Reset work can start once storage/importer contracts exist; its final checks use both views. |

For the two baseline IOP-125 CSVs, the independent expected result is **9 facts,
frequency 19, accumulated alarm duration 97,775 seconds**. Repeated source lines
and unclassified facts remain included. The five-row UI preview is a different
fixture; it must not be used as the production reconciliation oracle.

IOP-129 records the demonstration; IOP-132 reuses it for final numerical acceptance.
Run their scenarios together where useful without creating a circular requirement
that each story must be marked Completed before the other can be tested. IOP-130
requires actual owner observations; automated tests cannot supply that feedback.

## Disposition of every currently Blocked story

| Story | What prevents closure |
| --- | --- |
| IOP-089 | OIP storage, executable analytical queries and validated host access. Accepted query design is already available. |
| IOP-090 | Runtime frequency totals, boundaries and contributing-record reconciliation through IOP-089. |
| IOP-091 | Runtime exact accumulated-duration totals and coverage semantics through IOP-089. |
| IOP-094 | Runtime source-equipment/message groups with shared measures and filters; no physical asset prerequisite. |
| IOP-095 | Runtime area/sector partitions, unclassified totals and shared-selection reconciliation. |
| IOP-096 | Connected drill-down, provenance/pagination and reconciliation; fictional navigation is delivered. |
| IOP-097 | Same real selection/revision in both views and contributing records; fixture filters are delivered. |
| IOP-103 | Real submit/review/importer/receiver composition and host access; internal adapter tests are reusable. |
| IOP-120 | Real pending/success/failure/retry and coverage states against analytical endpoints. |
| IOP-121 | Layout checks on the real filtered results and contributing records; preview layout is delivered. |
| IOP-122 | Keyboard, labels, contrast and accessible data checks on real analytical controls/results. |
| IOP-128 | Executable guarded reset, verified quiescence, quota/foreign-target preservation and real reload. |
| IOP-129 | Demonstrated import → analyze → present, error/duplicate/access cases and safe reset/reload. |
| IOP-130 | Delivered demonstration plus measured outcomes and owner feedback. |
| IOP-132 | Real CSV-to-both-views comparisons, rejected/unresolved accounting and IOP-129 evidence. |

All remain Blocked. A completed slice is retained as evidence; remaining future
parent scope is deferred only when explicitly outside the POC, not to hide missing
POC delivery. There is no need to reopen IOP-020: its
[completed plan](completed/IOP-020-poc-testing-foundation-plan.md) already records
the test entry point and foundation evidence.

## Branch and documentation handoffs

- `docs/IOP-136-poc-user-guide` has unmerged commit `9a8239e` with the preview guide
  and a Blocked continuation. `develop` still lists IOP-136 as Proposed. Integrate
  only after owner authorization; that guide increment does not finish its real
  operator walkthrough. Its reference to IOP-129 as Proposed needs updating when
  the branch is integrated (IOP-129 is now Blocked).
- `docs/IOP-144-poc-next-stories` has unmerged commit `c1f8077`. Its older visual-first
  recommendations and Proposed-ADR-0018 wording predate delivered previews and
  acceptance. Preserve its history; do not merge it as a current readiness report.
- IOP-132 still calls IOP-129 Proposed in current prose; the canonical item/backlog
  both say Blocked. Correct this stale dependency description in its next story
  increment. This discrepancy does not remove its runtime blocker.
- The backlog introduction still calls the local mechanism proposed, while
  ADR-0018 and the product scope record acceptance. The review navigation update
  corrects that summary; implementation remains pending.

## Verification boundary

Source inspection confirms a health-only [Nest module](../../apps/api/src/app.module.ts)
and [OpenAPI artifact](../../apps/api/contracts/openapi.json), seven existing
[migrations](../../infra/database/migrations/) without production OIP receiving
storage, and an [import page](../../apps/web/src/App.tsx) that explicitly cannot
submit files. `batch_receiver_probe` exists only in the
[database integration test](../../infra/database/test/import-batches.spec.cjs).
This is direct evidence of missing composition, not an inference from story labels alone.

Current test commands, results and documentation checks are recorded in the
[IOP-146 execution plan](completed/IOP-146-poc-readiness-review-plan.md). Passing the
existing suite verifies delivered pieces; it cannot close the missing end-to-end
criteria above. No data reset, merge, publication or owner feedback was performed.
