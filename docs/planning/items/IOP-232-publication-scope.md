# IOP-232 — Correct publication scope

## Status and goal

Completed corrective change; publication authorized. On 2026-11-08 the owner clarified that publication should include
only the logo and left navigation work, then explicitly approved a forward-only
corrective commit removing the extra transfer note and integration documentation.
The broader push had already completed at `591737e` before that clarification.

## Scope and acceptance

- [x] Remove the extra historical transfer note and superseded IOP-231 item/plan
  and backlog entry; restore unrelated backlog wording to the approved baseline.
- [x] Keep IOP-229/230 application behavior identical to validated `7ad6b01` and
  record their actual publication with the corrected scope.
- [x] Preserve existing history and branches; constrain the authorized publication
  to this corrective branch and develop, without force, deletion or other tip changes.

The earlier merge commits remain in history; a forward correction cannot remove
their ancestry. The owner approved preserving that history. No application,
database, account, deployment or stage/master operation is required.

[Execution plan](../completed/IOP-232-publication-scope-plan.md).
