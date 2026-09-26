# IOP-090 — POC event frequency definition and reconciliation

Status: Completed — specification slice only; parent IOP-090 remains Blocked. Authorized by the owner's 2026-09-26 request, limited to
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-090](../items/IOP-090-event-frequency.md).
Branch: `docs/IOP-090-event-frequency`, created from clean `develop` before edits.

## Scope and dependencies

Finish the independent metric-definition and reconciliation specification slice.
IOP-089 has an accepted query contract under ADR-0028 but no executable query layer;
production OIP receiving storage and ADR-0018 host activation remain pending.
Do not implement those adjacent prerequisites or substitute fixture UI for runtime
evidence. Reuse the accepted sum, filter, grain and revision semantics; no new
architectural decision or metric formula is needed.

## Changes and steps

1. Review IOP-089, the aggregate/query contracts and the independent synthetic oracle.
2. Translate the entire IOP-090 item into English, preserving its intent and links,
   and refine its POC criteria and concrete dependency gates. IOP-089 is already
   English; no dependency translation is required.
3. Add `docs/product/event-frequency-poc.md` with the metric definition, limits and
   literal reconciliation scenarios, linking canonical contracts rather than
   repeating the query design.
4. Synchronize IOP-090 in `docs/planning/backlog.md` and `docs/planning/poc-delivery.md`.
5. Validate the documented totals against the retained synthetic CSV/oracle,
   check relative links/statuses and `git diff --check`, and run the secret check.
   No runtime implementation is changed; API/database suites cannot establish
   completion of the pending KPI delivery.
6. Record evidence, move this finished specification plan to `completed/`, leave
   the parent Blocked on executable IOP-089, and commit the documentation increment.

## Validation and evidence

Executed on 2026-09-26:

- Independent Python CSV/integer arithmetic read both retained UTF-16 files and
  compared all nine normalized frequency/dimension tuples with `expected.json`.
  Confirmed 12 + 7 = 19 occurrences, sector partitions 9 + 5 + 5 = 19 and
  message exclusion leaving six records / 10 occurrences. Matching zero records
  and incompatible sector/area selections were checked separately.
- These are specification/oracle checks, not runtime query, admission, pagination
  or isolation evidence. No application code changed; runtime suites were not run.
- `npm run check:secrets`: passed for 420 indexed files. Final staged hygiene and
  whitespace checks accompany the commit; relative links/statuses are checked below.
- IOP-090 was translated fully and refined for the POC; IOP-089 needed no translation.
  No dependency implementation or ADR status was changed.

## Closure

The independent specification slice is complete; retain this record in `completed/`.
The parent remains Blocked until executable IOP-089 and its storage/host prerequisites
allow runtime reconciliation, coverage, integer-boundary and access-denial validation.
No new decision acceptance is needed; publication requires separate authorization.

Final documentation validation: 205 relative links resolve across all five changed
files; item/backlog statuses agree; `git diff --check` passed.
