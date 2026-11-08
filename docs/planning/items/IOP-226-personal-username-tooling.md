# IOP-226 - Integrate personal username operator tooling

## Status and scope

Completed. The owner's 2026-11-08 request to integrate all pending changes
includes the existing personal username script, command, tests and operator guide.
This increment commits that work without repeating the account changes recorded
in the existing private operator evidence.

- Preserve deterministic, case-insensitive personal logins and system accounts.
- Retain collision detection, transactional preview/rollback and credential
  preservation checks before any explicit operator apply.
- Include the npm command, authentication regression coverage and operator guide.
- Validate, commit and integrate the scoped increment into develop, then publish.

[Execution plan](../completed/IOP-226-personal-username-tooling-plan.md).
This is operator tooling around existing authentication and audit contracts;
the application login normalization and database schema are unchanged.
