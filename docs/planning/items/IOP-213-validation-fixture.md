# IOP-213 — Restore platform validation secret hygiene

Status: Completed locally on 2026-10-15; remote publication pending.

Owner request of 2026-10-15: investigate and fix the failed Platform validation
notification for `docs/IOP-200-guide-modules-refresh` at `2ef014d`.

## Scope and acceptance

- [x] The synthetic embedded credential fixture passes repository secret hygiene
  while retaining the same invalid URL and rejection coverage.
- [x] Scanner regression tests and the complete API test suite pass.
- [x] Evidence distinguishes local reproduction from remote workflow verification.

Keep scanner rules intact; no allowlist, production behavior, runtime, database or
guide artifact changes. Execution: [plan](../completed/IOP-213-validation-fixture-plan.md).
