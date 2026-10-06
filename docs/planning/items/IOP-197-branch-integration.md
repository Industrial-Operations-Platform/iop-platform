# IOP-197 — Integrate all retained branches into develop and origin

Status: Completed

Owner request on 2026-10-06: unify all branches into develop and origin. This
explicitly authorizes integration and remote publication under
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md).

## Scope and acceptance

- [x] Every retained local and origin branch tip is contained in final develop.
- [x] Integrate outstanding documentation and IOP-196 without losing current
  implementation, English translations, completion evidence or later scope decisions.
- [x] Validate the combined tree and synchronize affected documentation.
- [x] Publish develop and retained story branches to origin; verify remote parity
  and a clean final develop checkout.

Preserve review branches and history. This request does not promote stage/master,
change the remote default branch, deploy, or implement pending product scope.
Existing decision statuses remain explicit; merging a Proposed ADR does not accept it.

Execution: [completed plan](../completed/IOP-197-branch-integration-plan.md).

Seven outstanding branch tips integrated with current-scope conflict resolution.
Validated runtime equals IOP-196; typecheck, npm test, documentation and hygiene
checks passed. Atomic origin publication and direct remote inspection verified
133 retained branches, identical local/remote hashes and complete develop ancestry.
