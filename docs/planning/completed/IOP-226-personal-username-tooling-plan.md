# IOP-226 - Integrate personal username operator tooling

Completed. Branch: `feature/IOP-226-personal-username-tooling`, from develop at
`5eb6343`. [Permanent scope](../items/IOP-226-personal-username-tooling.md).

## Execution

1. Review the pending script, npm command and tests; preserve the existing
   authentication boundary. The script is an explicit operator adapter, not an
   application request handler or automatic migration.
2. Restore the pending personal-username section of the deployment guide, separated
   from IOP-225 so each commit has a coherent scope.
3. Verify the scoped diff and links; retain private inventories/backups outside Git.
   Record tests, complete the plan and commit only this increment.
4. Integrate into develop and publish under the owner's instruction to integrate
   all pending work. No account/database operation is executed during integration.

Expected files: `scripts/access/rename-usernames.cjs`,
`scripts/personal-usernames.spec.cjs`, `apps/api/test/transitional-access.spec.ts`,
`package.json`, the guide, backlog and this item's execution documents.

## Validation

The complete scripts suite passed 95 tests (four platform-specific skips),
including personal-name normalization, system-account preservation, idempotency,
organization scoping and collisions. All 54 API suites passed 560 tests,
including login normalization and preservation of the canonical account/session.
The reviewed operator SQL locks and verifies the preview before updating only
usernames; it preserves credential fields and appends an access-audit event.

Historical operator records remain private. No new local or Railway account
rename, database restore, password issuance or session revocation is claimed.
