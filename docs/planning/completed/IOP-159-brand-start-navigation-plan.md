# IOP-159 execution plan

Status: Completed
Branch: `fix/IOP-159-brand-start-navigation`, from develop at `c9f1b4b`.
Context: [IOP-159](../items/IOP-159-brand-start-navigation.md).

1. Add an optional accessible brand action to the shared AppShell; retain passive
   branding for other consumers. Wire Workspace to its existing Start selection.
2. Preserve brand appearance and native keyboard/focus behavior with shared CSS.
3. Run existing web/API tests and web build; verify click/keyboard navigation in
   local Docker, check documentation links/whitespace and commit locally.

Files: shared Layout/CSS/component guide, React Workspace, item/plan/backlog.
No new architecture or tests needed for this small navigation change.

## Validation

Completed on 2026-09-27. Web build passed; existing web tests passed (56 tests,
16 suites) and API tests passed (287 tests, 18 suites). Local Docker frontend rebuilt.
Read-only Playwright verification passed: brand click from analysis, Enter from
administration and Space at 390px all open Start without changing the selected user.
No page errors or viewport overflow. Shared focus styling and brand identity remain.
Whitespace, indexed Markdown links and secret hygiene checks passed. No data writes.
Publication remains pending owner approval.
