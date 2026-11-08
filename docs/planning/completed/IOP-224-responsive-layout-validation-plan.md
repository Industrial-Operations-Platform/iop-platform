# IOP-224 - Responsive layout validation follow-up

Completed. Authorized by the owner's 2026-11-08 report of two browser failures
blocking Railway deployment. Branch: `fix/IOP-224-responsive-layout-validation`,
from develop at `394f87d`.
[Scope and acceptance](../items/IOP-224-handover-card-alignment.md).

## Changes and steps

1. Reproduce the personal operational workflow failures at 1440px and 375px.
2. In `apps/web/e2e/personal-operational-workflows.spec.ts`, replace the obsolete
   160px empty-card ceiling with checks for aligned row peers, centered empty
   messages and natural single-column sizing. Cover a medium viewport as well.
   Inspect desktop/mobile screenshots and preserve existing workflow assertions.
3. Synchronize the item, backlog and the visual identity's empty-card statement
   with the already approved IOP-224 behavior; record validation and commit.

The owning adapter is Shift Handover React presentation. This increment changes
browser verification and documentation only; existing CSS and module boundaries
remain intact under Accepted ADR-0032. No story translation is required.

## Validation and evidence

Run the failing browser file before/after the change, the web design/architecture
guards and the full browser suite against a fresh web build. Check documentation
links and `git diff --check`. Railway publication requires integration into develop
under the owner's publication convention; do not deploy the story branch.

- The reported 170.578125px desktop and 161.1875px mobile heights exceed the old
  160px ceiling but match the approved row alignment and padded empty state.
- The initial sandboxed baseline run stopped earlier at existing `/tmp` screenshot
  paths with `EPERM`; the browser runner was interrupted and rerun outside the
  sandbox. No execution-policy or application changes were needed.
- Focused browser file: three passing workflows at 1440px, 1050px and 375px.
- Fresh web production build: passed, including TypeScript and four design guards.
- API-owned hexagonal architecture suite: 26 checks passed across API/web boundaries.
- Desktop/medium/mobile screenshots inspected: matching row heights, centered empty text,
  natural mobile heights and no horizontal page overflow.
- Documentation check: 248 relative file links resolve across affected documents;
  whitespace checks pass.
- `npm.cmd run test:e2e --workspace @iop/web`: all 110 browser tests passed in
  3.2 minutes, including the three responsive personal workflows.

The obsolete height check is replaced without changing application CSS or behavior.
The item/backlog are complete and this execution record is archived. The owner
subsequently approved publication: `d2f21d1` was integrated into develop and pushed
with `fix/IOP-224-responsive-layout-validation` to origin. Full Linux validation
passed, and Railway's verified `fe0eecf` release includes the correction.
