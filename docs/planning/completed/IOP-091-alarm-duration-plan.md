# IOP-091 — POC accumulated alarm duration

Status: Completed — specification slice only; parent IOP-091 remains Blocked.
Authorized by the owner's 2026-09-26 request, limited to
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-091](../items/IOP-091-downtime.md).
Branch: `docs/IOP-091-alarm-duration`, based on clean `develop`.
The initial branch command was sandbox-denied; the plan draft was written before
the successful escalated branch creation. All subsequent edits were on the story
branch; no commit was made on develop.

## Changes and steps

1. Reuse IOP-089's accepted query contract, canonical aggregates and CSV duration
   grammar. Executable queries, production OIP receiving storage and ADR-0018 host
   activation remain missing; do not implement adjacent prerequisites.
2. Translate the entire IOP-091 item to English, preserving intent and links;
   refine current status and POC acceptance. The read dependency IOP-089 is already
   English and requires no translation.
3. Add `docs/product/alarm-duration-poc.md` with exact units, conversion, metric
   limitations and literal reconciliation cases. No new formula or architecture.
4. Synchronize `docs/planning/backlog.md` and `docs/planning/poc-delivery.md`.
5. Independently check retained synthetic CSV durations against the literal oracle,
   inspect existing parser boundary coverage, validate relative links/statuses,
   run `git diff --check` and `npm run check:secrets`.
6. Record actual evidence, move the finished specification plan to `completed/`
   and commit. Keep the parent Blocked until runtime reconciliation is possible.

## Validation and evidence

Executed on 2026-09-26:

- Independent Python CSV/integer arithmetic decoded both retained UTF-16 inputs
  and compared all nine normalized rows with `expected.json`. Date totals
  94,055 + 3,720 = 97,775, sector totals 300 + 97,384 + 91, the 97,475-second
  message exclusion, matching zero, incompatible filters and missing date agree.
  Verified the 1,629-minute/35-second and 27-hour/9-minute/35-second displays.
- Inspected existing `apps/api/test/csv-adapter.spec.ts` coverage for invalid
  clock components, individual exact maximum, maximum plus one and sum overflow.
  This is code inspection, not a newly executed parser test.
- IOP-091 is fully English; the read dependency IOP-089 required no translation.
  No ADR status or dependency implementation changed.
- Documentation checks cannot prove production query, authorization, pagination
  or overview/detail integration. No application code changed; runtime suites
  were not run.
- Final validation: 206 relative links resolve across the five changed files;
  item/backlog Blocked statuses agree. `git diff --check` and
  `git diff --cached --check` passed. `npm run check:secrets` passed for
  424 indexed files.

## Closure

The specification slice is complete; runtime gates remain explicit in the item.
Publication requires separate authorization under the shared workflow.
