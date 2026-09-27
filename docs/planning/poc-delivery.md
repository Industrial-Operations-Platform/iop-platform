# POC delivery map

## Current owner-requested correction — IOP-148

The latest database clarification selects the normalized backup model and a physical
sector FK in the main analytical fact; see the [relational plan](completed/IOP-148-relational-hitliste-plan.md).

The preceding owner refinement restricts the POC to Administrator, places prioritization
KPIs only in Executive Overview, defers Pareto and fixes the visual identity.
See the [refinement plan](completed/IOP-148-executive-overview-plan.md).

The owner rejected the IOP-147 report experience after its technical delivery.
[IOP-148](items/IOP-148-analytical-workspace.md) implements the supplied chart
templates, persistent historical preparation, five-sector mapping and hexagonal
backend/frontend boundaries. Its [plan](completed/IOP-148-analytical-workspace-plan.md)
records completed technical validation. Use `analysis:setup`, `analysis:load-reference` and
`analysis:start` for the separate authorized reference installation.

The supplied [database backup review](../architecture/wincc-backup-reference.md)
identified missing analytical rows and per-row duration rounding in the reference
model; neither discrepancy is copied. User acceptance of the revised workspace
is still pending. The following evidence describes the earlier IOP-147 baseline.

## Earlier technical baseline — IOP-147

The owner requested a working local CSV demonstration on 2026-09-27, including
frontend/backend integration and temporary configured user switching.
[IOP-147](items/IOP-147-working-analytical-poc.md) owns that complete delivery and
supersedes the missing implementation handoffs in the
[2026-09-26 readiness snapshot](poc-readiness.md).

**Run the application:** [operator guide](../development/running-poc.md).
**Acceptance evidence:** [IOP-147 execution record](completed/IOP-147-working-analytical-poc-plan.md).
**Product boundary:** [local analytical POC](../product/scope-poc.md).

## Delivered workflow

1. Prepare the dedicated local PostgreSQL installation and start API/web with
   `npm run demo:setup` and `npm run demo:start`.
2. Enter as a configured demo user; switch users from the header. Current scoped
   permissions remain enforced. This is local impersonation, not production login.
3. Upload the supported CSV. Review admitted, invalid, duplicate or interrupted
   attempts and retrieve the preserved original with the review permission.
4. Analyze that file or persisted historical dates. Overview and detail use one
   backend selection, exact measures, coverage, dimension filters and exclusions.
5. Drill through sector, area, source equipment and message to original source
   lines. Return restores the prior selection. Data survives application restarts.
6. Stop the application, reset only the registered dataset and reload through the
   actual importer with explicit dataset confirmation.

## Acceptance and ownership

| Delivered capability | Relevant selected stories | Evidence |
| --- | --- | --- |
| Native local host, configured user selection, current grants and origin protection | IOP-147; existing IOP-018/025–030 foundations | ADR-0018/0030, startup/session/HTTP denial and real-role tests. Administration parents stay Deferred. |
| Durable RAW, validation, duplicate admission, frozen classification and OIP facts | IOP-042/045–049/103 | Actual importer, exact RAW/line oracle, invalid and duplicate review, transactional publication. |
| Full exact frequency/duration, area/equipment/message groups and scoped queries | IOP-089/090/091/094/095 | Independent totals, group partitions, page reconciliation, revisions, overflow, historical mapping and tuple cases. |
| Shared overview/detail selection, drill-down, runtime states, layout and keyboard access | IOP-096/097/120/121/122 | Real browser uploads, file/history, filters, return, reload, retry, user switch, laptop/tablet checks and semantic tables. |
| Guarded reset, end-to-end demonstration and numerical reconciliation | IOP-128/129/132 | Offline maintenance exclusion, rollback, quota/foreign-target preservation, uncertain acknowledgement and actual reimport. |
| Input validation and usable instructions | IOP-110/136 | Bounded HTTP/domain inputs, safe errors, verified setup/start/fixtures/recreate commands and operator guide. |
| Owner assessment of usefulness | IOP-130 | **Negative owner feedback recorded; IOP-148 addresses it.** Technical evidence is available; automated checks cannot provide this assessment. |

The two baseline files produce **9 records, frequency 19 and 97,775 accumulated
alarm seconds**. July 2 is missing. Unclassified records contribute frequency 5
and 91 seconds. Frequency is source-reported occurrences; accumulated alarm duration
is not plant downtime. Filename dates do not establish complete reporting windows.

## Boundaries and deferred capabilities

- Third-party identity provider integration and solid shared-use login are future
  work behind the principal adapter. No provider is selected by this delivery.
- Keep one trusted loopback-only operator installation, explicit organization/site/
  source configuration, current grants and forced RLS. No public deployment claim.
- Organization/site/user administration, physical assets, surveys/maps, shifts,
  workers, maintenance, improvement tracking and live external integrations remain
  outside this demonstration. A source equipment label is not a physical asset.
- Full audit, production retention/backup/restore, formal performance acceptance,
  CI/deployment and shared-use release gates remain separately scoped future work.
- Optional fixture previews remain at `?preview=1`; they are supporting UI examples.
  Acceptance of the real workflow uses actual PostgreSQL/API/browser results.
- Analysis is bounded to 366 reporting labels, 100 records per API page and 100
  displayed groups per dimension, with paged options to reach other groups. RAW
  retention is bounded to 1,000 attempts and 256 MiB; individual uploads to 5 MiB.

Permanent contexts keep each selected story's acceptance and prior evidence.
Finished continuation plans are archived; IOP-147 is the single implementation
record for this integrated delivery. Historical review branches are preserved and
have not been merged implicitly. Broader Deferred parents remain open for their
future scope. The revised report workspace must satisfy IOP-148 and receive owner review; earlier
technical completion did not establish usability acceptance.
