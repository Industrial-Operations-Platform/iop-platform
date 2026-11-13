# IOP-237 — Keep filters across comparison-month edits

Status: Completed locally. Branch `fix/IOP-237-preserve-month-filters`, from develop
`61ba187`. [Scope](../items/IOP-237-preserve-month-filters.md).

1. Analysis React `ReportFilters`: remove the month-change reset of draft filters.
   Keep existing domain month selection and explicit Apply. Distinguish loaded
   empty option lists from pending lists so retained unmatched fields remain
   clearable. Update the shared localized explanation and operator guide.
2. React regressions: applied/unsaved and numeric criteria survive adding/removing
   months, missing matches, failures/retry and stale responses. Retain empty-month,
   explicit Clear filters and parent-dimension cascade tests.
3. Chromium desktop/mobile: exercise preserved controls, explicit Apply, empty
   matches and month reversal; inspect screenshots. Run relevant web tests,
   typecheck/build/design/contract checks, whitespace and documentation links.
4. Record evidence, close item/backlog, archive plan and commit on the story branch.
   Publication awaits owner approval under AGENTS.md; do not merge the separate
   pending ancestor-completion branch or publish by inference.

Analysis owns draft presentation and invokes the existing framework-free month
selection use case. No port, API, schema, metric or architectural pattern changes.

## Evidence

- Relevant web tests: 4 suites, 30 tests passed. Applied/unsaved dimension and
  numeric criteria, search, grouping/measure/period survive month edits. Empty
  choices remain clearable; retries and out-of-order responses retain the latest
  months. Existing explicit reset, empty-month and dimension-cascade guards pass.
- Production web build/typecheck, design checks and browser contract check passed.
- Chromium: all 6 existing/extended analysis drill-down and month-comparison
  scenarios passed at 1440px and 375px, including light/dark month comparison.
  The new flow removes July, keeps Halle/Bereich/equipment for May's empty result,
  and restores July/results with the same filters. Inspected both retained-filter
  screenshots; shared controls remain within the document width.
- Whitespace and affected documentation links/status consistency checked. No API
  implementation changed; no live data or deployed services were modified.

The independent local implementation is complete. The earlier ancestor-completion
review branch is preserved separately. Publication/merging/deployment await approval.
