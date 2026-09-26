# IOP-136 — POC user guide preparation

Status: Completed (documentation preparation only). Authorized by the owner's request to work on IOP-136 within
the POC on 2026-09-26. Branch: `docs/IOP-136-poc-user-guide`, created from `develop`.
Context: [IOP-136](../items/IOP-136-user-guide.md),
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).

## Changes and steps

1. Review IOP-129 and IOP-122 dependencies, current web behavior and accepted ADRs.
   IOP-129 has no delivered end-to-end evidence; IOP-122 validates only the preview.
   ADR-0018 is Accepted but runtime host activation is pending. These block final
   user-guide validation, not documentation of the available fictional preview.
2. Translate all of `items/IOP-136-user-guide.md` to English, preserving its original
   intent and references; refine only its selected POC requirements and status.
   Both dependency stories read are already English; no translation edits required.
3. Add `docs/product/user-guide-poc.md`: local startup links, current navigation,
   reproducible fictional filters/drill-down, keyboard use, metric interpretation,
   troubleshooting and explicit pending import/reset instructions. No code, new
   architecture, adjacent story implementation or shared-use manual.
4. Link the guide in root `README.md`, `apps/web/README.md` and `poc-delivery.md`;
   synchronize the story and backlog. Preserve unfinished acceptance as Blocked.
5. Record evidence, move this finished preparation plan to `completed/`, and commit
   the documentation increment. Final runtime validation stays with the open item.

## Validation and evidence

- Check guide labels, routes, examples and recovery behavior against web source
  and existing browser tests; run the existing browser suite if local prerequisites
  are available. Do not claim a real CSV journey from fictional preview evidence.
- Check all changed Markdown local links, IDs/status consistency and `git diff --check`.
- Verify no available reset command or runtime import is invented; retain canonical
  startup instructions rather than duplicate configuration or destructive commands.
- Final acceptance requires IOP-129 delivered-path evidence and IOP-122 real-control
  validation, followed by an operator walkthrough of import, failure/duplicate,
  analysis, presentation and scoped reset. This increment cannot establish it.

## Results and closure

- Added the operator guide and linked it from root/web entry points and the delivery
  map. Translated/refined the entire IOP-136 context in English; the two dependency
  contexts needed no translation. No runtime files or adjacent stories changed.
- Reviewed startup references and actual `App`, `AnalyticalStates`, `FixtureFilters`,
  `HealthStatus` and fixture behavior. A Node assertion check verified all seven
  walkthrough arithmetic checkpoints, including the zero-valued fourth record
  after message exclusion and its removal when narrowing to North.
- Used Node 24.21.0/npm 10.9.2 from the existing temporary runtime through
  `/private/tmp/iop-136-bin` PATH wrappers. `npm run test:e2e` built API, web and
  database tooling successfully; its first browser launch was blocked by sandbox
  listener restrictions. Retried the browser suite with loopback permission.
- `npm run test:e2e --workspace @iop/web`: **18 passed (45.7s)** after allowing
  loopback listeners, covering keyboard/accessibility, drill-down, filters, health,
  navigation, responsive layouts and simulated UI states. No test changes needed.
- Local Markdown validation: **243 links/anchors across all seven changed/new
  files passed**; item/backlog Blocked status and completed-plan location agree.
  `git diff --check` passed. API implementation is unchanged; no additional API
  or database test run was required for this documentation increment.
- Preparation acceptance is satisfied. IOP-136/backlog remain Blocked for the
  real CSV journey and actual-control validation; the permanent item owns the
  continuation handoff. No POC completion, import/reset execution, runtime security
  validation or human usability certification is claimed. No new ADR required.
