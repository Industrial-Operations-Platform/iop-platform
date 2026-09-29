# IOP-170 execution plan

Status: Completed. Branch: `feature/IOP-170-administrator-workspace`, created
from `develop` (`8575856`). Scope: [permanent item](../items/IOP-170-administrator-workspace.md).

## Implementation

1. Add a host-owned administration overview and profile-view control using existing
   shared panels, buttons and select. The shell composes feature entry points;
   server access rules and application use cases remain unchanged.
2. Keep administration separate from the analytical page. Add bounded initial-view
   props to the analytical presentation adapters for direct tool shortcuts.
3. Default to administration from the real session capabilities; keep preview local
   to the current user and clear it on logout/user change. Preserve authenticated
   context and label the preview explicitly.
4. Update workspace tests, relevant browser expectations and access documentation.
   Validate web tests/build, API `npm test` through the root suite, browser flows,
   architecture checks, whitespace and documentation links. Record evidence, close
   the plan and commit locally; publication requires owner approval.

Expected files: `apps/web/src/host/`, analytical React `Workspace.tsx` and
`ImportWorkspace.tsx`, workspace/browser tests, access documentation, item/backlog
and this plan. No API, persistence, account changes or new architectural pattern.

Browser validation exposed horizontal overflow with all five administrator navigation
items at 375 px. Include the shared mobile SideNavigation CSS in scope: allow its
items to wrap within the available width, preserving all tools without page overflow.

## Evidence

- Root `npm test` passed with local TCP access: secret checks 18, API 321 (including
  architecture boundaries), web 69 and database configuration 77 tests. The generated
  browser contract matches the API. Root production build passed.
- After the mobile CSS correction, the web production build passed again. Existing
  bundle-size advisory remains; no bundle optimization is in scope.
- Playwright `administrator-workspace workspace-startup`: 5 passed against local
  API/preview servers. Administrator overview, all four options, unchanged identity,
  operational navigation and return to administration were exercised at 1440/375 px.
  Screenshots `/tmp/iop-170-administration-{1440,375}.png` and
  `/tmp/iop-170-preview-{1440,375}.png` were inspected. No horizontal page overflow.
- Unit coverage includes capability-gated tools, non-admin profiles, lazy data reads,
  direct preparation access and clearing preview across logout/login.
- Initial validation required local TCP permission for Supertest; an incorrect browser
  import-history fixture was corrected to the actual array contract. Final runs pass.
- Whitespace, scoped documentation links/statuses and staged secret scan checked before
  commit. No server permission, identity, database or Docker configuration changes.

IOP-169 remains intact on its separate review branch. No merge, push or deployment
was performed. Profile view is an explicitly labeled layout preview, not a simulation
of another person's permissions, department assignments or authored records.
