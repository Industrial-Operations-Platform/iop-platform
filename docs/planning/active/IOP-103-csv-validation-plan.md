# IOP-103 — Manual CSV delivery validation plan

Status: Blocked — real importer/receiver and local host activation are unavailable.
Authorized by the owner's 2026-09-26 request for [IOP-103](../items/IOP-103-csv-integration.md),
limited to the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-103-csv-validation`, created from clean `develop` before edits.

## Scope, dependencies and steps

1. Review IOP-045/046/047/048 and IOP-125's fixture handoff. The parser is complete;
   validation, duplicate admission and reconciliation have internal evidence only.
   Existing tests use a disposable receiver, not production OIP storage.
2. Translate the entire IOP-103 context into English, preserving its requirements,
   constraints and unfinished acceptance. Read dependency stories are already English.
   Correct the stale ADR-0018 reference: the mechanism is Accepted, implementation
   and delivered-path verification are pending.
3. Synchronize IOP-103 status in its item, backlog and delivery map. Current changes
   are restricted to those three files and this plan; no runtime or fixture edits.
4. Resume executable validation when production OIP receiving storage, importer
   submit/review composition, browser delivery and ADR-0018 host activation are
   integrated. Confirm explicit fixture scope/source/mapping and seeded principal/
   grants. Do not activate adjacent stories or substitute a second test importer.
   Refine this plan with actual endpoint contracts and test files before test edits.

## Planned delivered-path evidence

Reuse [IOP-125's corpus and literal oracle](../../../fixtures/analytical-poc/README.md)
and existing importer; do not derive expected results from its parser.

| Scenario | Required evidence |
| --- | --- |
| Two valid files | Retained original bytes and scoped physical-line provenance; nine OIP records, frequency 19 and 97,775 accumulated seconds; per-date/sector totals match `expected.json`. |
| Classification and grain | Three unclassified records remain in totals; repeated lines, zero measures and opaque source dimensions survive. Reporting windows stay unknown. |
| Duplicate/date semantics | Identical and changed bytes on an admitted scoped date visibly conflict without changing facts; concurrent submissions admit at most one full dataset. A new valid filename date is not rejected solely by checksum. |
| Invalid files and retry | Corpus failures visibly reject all analytical admission with safe diagnostics and known/unknown counts; no new coverage or partial facts; a corrected unused date can succeed. |
| RAW and publication failure | Review retained bytes/provenance only with permission; rollback leaves no partial OIP facts; uncertain publication follows existing reconciliation without replay. |
| Local authorization | Real non-owner runtime credentials and forced RLS; missing/foreign scope or grants and client-selected actor cannot gain access. Mutation origins and nonlocal startup follow ADR-0018. |
| Observable review | Upload, terminal outcome and contributing-record review use real persisted data; capture dataset size and observed timings without setting a performance target. |

The fixture README defines isolated relabeling/retry cases; keep them separate from
the baseline. Full analytical-view delivery and general demo reset remain their
own stories. No login, integration registry, live vendor connection, workers,
automatic replacement or general administration is required here.

## Validation and evidence

For this documentation increment: check local Markdown links, IDs/status agreement,
English translation completeness and `git diff --check`. Inspect host composition
and existing evidence; do not report prior test runs as new execution.
For eventual implementation: run `npm test`, `npm run typecheck`,
`npm run test:database` and relevant `npm run test:e2e` scenarios under the accepted
Node/npm runtime, with actual import/read endpoints and production OIP storage.

## Closure

Documentation evidence on 2026-09-26: all 197 local Markdown links in the four
changed files resolve; item/backlog both say Blocked; English translation and
scope/status consistency were reviewed; `git diff --check` passed. Inspection of
`apps/api/src/app.module.ts` confirms only HealthController/HealthService registration;
`apps/web/src/App.tsx` explicitly states that CSV submission is not connected.
No code changed and no application tests were run for this documentation increment.
IOP-048's linked completed record remains prior internal evidence only.

Commit the validated documentation increment locally. Keep this plan active and
IOP-103 Blocked until the missing delivered path exists; move the plan to completed
only after its executable acceptance is verified. Publication requires separate
approval under [ADR-0008](../../architecture/adr/ADR-0008-story-branches.md).
