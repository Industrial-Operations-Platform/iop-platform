# IOP-130 — POC pilot measurement preparation

Status: Completed — measurement preparation only. Authorized by the owner's request to work on IOP-130 within
the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-130-pilot-metrics`, created from clean `develop` on 2026-09-26.
Permanent [item](../items/IOP-130-pilot-metrics.md).

## Changes and steps

1. Review IOP-001's accepted measures and IOP-129's demonstration prerequisites.
   IOP-001 is completed design; IOP-129 is Blocked. The API AppModule registers
   health only and the web upload explicitly remains disconnected. Do not implement
   dependencies or use fixture previews as pilot evidence.
2. Translate the complete IOP-130 story to English and refine its selected POC
   measurement slice. Dependency stories IOP-001/129 are already English.
3. Add `docs/development/pilot-metrics-poc.md`: map the five accepted measures to
   observable POC evidence, record observed timings without targets and define
   owner feedback capture. Reuse demonstration/reconciliation procedures.
4. Synchronize the item, backlog and delivery map. Complete this preparation plan
   while leaving actual measurement Blocked until the delivered journey and owner
   observation exist. No application, schema, API, UI or architectural change.

## Validation and evidence

Check changed-document relative links, story IDs/status consistency, English prose
and `git diff --check`. Review all five IOP-001 measures against the POC boundary;
keep expected results distinct from observations and mark absent evidence explicitly.
No runtime tests are required for this documentation-only increment and no runtime
acceptance or owner feedback may be invented.

## Closure

Record actual checks, move this finished preparation plan to `completed/`, commit
the scoped documentation and report the remaining measurement prerequisites.

## Preparation outcome

The procedure maps all five accepted measures to delivered evidence and explicit
owner feedback, with timing boundaries and no numeric targets. IOP-130 was fully
translated/refined; IOP-001/129 required no translation. The item/backlog remain
Blocked on the actual demonstration and owner observation. No dependency was
implemented and no runtime measurement or user feedback was claimed.

Validation on 2026-09-26: a Python relative-link/heading-anchor check passed for
216 links across the five changed documents; assertions confirmed item/backlog
Blocked and preparation Completed. `git diff --check` passed. Manual review mapped
all five IOP-001 measures, kept all project prose English and confirmed explicit
unmeasured/uncollected states. No application files changed; runtime tests were
not run for this documentation increment.
