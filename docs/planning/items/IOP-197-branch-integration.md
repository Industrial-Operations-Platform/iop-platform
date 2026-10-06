# IOP-197 — Integrate all retained branches into develop and origin

Status: In progress

Owner request on 2026-10-06: unify all branches into develop and origin. This
explicitly authorizes integration and remote publication under
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md).

## Scope and acceptance

- [ ] Every retained local and origin branch tip is contained in final develop.
- [ ] Integrate outstanding documentation and IOP-196 without losing current
  implementation, English translations, completion evidence or later scope decisions.
- [ ] Validate the combined tree and synchronize affected documentation.
- [ ] Publish develop and retained story branches to origin; verify remote parity
  and a clean final develop checkout.

Preserve review branches and history. This request does not promote stage/master,
change the remote default branch, deploy, or implement pending product scope.
Existing decision statuses remain explicit; merging a Proposed ADR does not accept it.

Execution: [plan](../active/IOP-197-branch-integration-plan.md).
