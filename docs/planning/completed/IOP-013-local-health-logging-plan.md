# IOP-013 — Local health and diagnostic logging plan

Status: Completed. Authorized by the owner's request to work on IOP-013 within
the POC scope, 2026-09-26.
Branch: `docs/IOP-013-local-health-logging`, created from clean `develop`.
Item: [IOP-013](../items/IOP-013-observability-baseline.md).

## Changes and steps

1. Review the POC scope/delivery map, IOP-002/003 and accepted architecture/API
   decisions. Both direct dependencies are completed on develop and already in
   English; no dependency translation is needed. ADR-0018 is Accepted, with runtime
   implementation pending; it does not block this design.
2. Add `docs/architecture/health-logging-poc.md`: define process health/startup
   visibility, bounded safe diagnostics, error/import correlation and implementation
   handoffs, grounded in the existing host and IOP-022 error contract. No new
   architectural mechanism, logger dependency, endpoint or readiness platform.
3. Translate the entire IOP-013 item to English, preserve its POC-only scope and
   synchronize its current state, acceptance/evidence and ADR-0018 status.
4. Update only the IOP-013 backlog row, add a design-status link to
   `docs/planning/poc-delivery.md`, and update the API README's IOP-013 handoff.
5. Validate, record evidence, move this plan to completed and commit the bounded
   documentation increment. Publication requires separate owner authorization.

## Validation and evidence

Review scenarios: successful/failed startup; liveness with unavailable database;
5xx correlation and ordinary 4xx; admitted/rejected/duplicate/interrupted imports;
secret-bearing or oversized diagnostic input; absent logs and unavailable proxy.
Check changed Markdown links, item/backlog status, scope and `git diff --check`.
No application changes or runtime tests are planned; design review is not executable
evidence. Inspect existing source without claiming previously recorded tests ran.

Validation on 2026-09-26: inspected the existing health controller, startup/configuration,
Problem Details filter/DTOs and API guide against ADR-0011, ADR-0018 and the CSV
preservation contract. All eight scenario rows have explicit outcomes and delivery
owners; import correlation remains a documented handoff, not implemented evidence.
Both direct dependency items were reviewed in English. The full IOP-013 story was
translated; functional documentation updates are also identified in steps 3–4.
Changed-file Markdown target checks and `git diff --check` passed. No runtime tests
were run because only documentation changed.

## Closure

The POC design criteria are satisfied by the linked baseline and scenario review.
IOP-013 and its backlog row are Completed as design only. No new architectural
pattern or acceptance-dependent decision was introduced. Broader observability,
runtime implementation and adjacent stories remain outside this increment.
