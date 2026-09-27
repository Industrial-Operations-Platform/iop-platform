# IOP-165 — Login layout correction

Status: Completed. Owner follow-up: hide the workspace sidebar during login and
report the existing local accounts. Continue `feature/IOP-165-operational-home`,
the unmerged story branch already based on develop.

Scope: [IOP-165](../items/IOP-165-operational-home.md), Accepted ADR-0032/0035.
Keep authentication presentation separate from the workspace shell in host
composition; reuse IdentityRoot and LoginPanel. No domain, permission or database
changes and no credential resets. Account inspection is read-only; never read hashes.

1. Update WorkspaceApp.tsx and access.css to render login/initial-password change
   without sidebar or workspace header, including initial context loading.
2. Build/typecheck and run existing web tests; verify the actual Docker login at
   desktop/mobile sizes, and existing authenticated navigation through the real
   authentication browser suite. No new test suite for this presentation fix.
3. Rebuild/recreate only Docker web, preserving API/database/accounts. Record account
   status without credentials in repository documentation. Close this plan and
   commit; publication remains subject to the owner's approval.

## Evidence

- Web build/typecheck and all 57 existing web tests passed after correcting an
  unknown-valued JSX error condition. The eight real PostgreSQL/authentication
  browser cases passed, including first-password change and authenticated navigation.
- Rebuilt only web; its container is healthy. Actual Docker browser checks at
  1440 px and 375 px found no sidebar/header, a centered form and no horizontal
  overflow. Mobile screenshot visually inspected; artifacts remain under /tmp.
- Read-only account inspection found one active local administrator login with
  initial-password change still required. No account or password was modified.
- Changed documentation links and git diff whitespace checked. No API/domain,
  permission or data changes; the presentation stays in host composition/adapters.
