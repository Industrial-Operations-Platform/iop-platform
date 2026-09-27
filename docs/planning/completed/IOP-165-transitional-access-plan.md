# IOP-165 — Transitional access implementation

Status: Completed — 2026-09-27. ADR-0035 accepted by the owner on 2026-09-27 together with
implementation, Docker refresh and mandatory hexagonal/clean-code documentation.
Scope: [IOP-165](../items/IOP-165-operational-home.md).
Branch: `feature/IOP-165-operational-home`, continuing the same story from its
validated local commits; no merge, rebase or remote publication is needed to work.

## Implementation sequence and files

1. Record ADR-0035 acceptance. Strengthen ADR-0032, ARCHITECTURE and the shared
   workflow so all new features follow inward dependencies, injected ports, small
   named use cases, explicit errors and focused verification.
2. Add Authentication domain/application ports and services, a Node Argon2id
   adapter and PostgreSQL account/session adapters. Keep HTTP/cookies in the host.
   Use the pinned Node 24 native implementation (64 MiB, three passes, one lane),
   benchmark before activation; no additional hashing dependency is required.
3. Add Users/RBAC user-administration use cases and PostgreSQL adapter. Four
   presentation profiles map to reviewed bundles; only Administrator imports.
   Persist scoped profiles, organization access assignments, auth credentials,
   sessions, throttling and minimal access audit in a new migration. Existing
   site grants gain active status; revocation updates rows, without DELETE rights.
4. PostgreSQL adapters use one pinned transaction and organization advisory lock
   for authentication/access mutations. Check current actor authority and owned
   site before setting access selectors. Constrain credential lookup to the
   configured organization, local identity and session digest. RLS remains forced;
   runtime receives only enumerated column grants, verified by provision.ts.
   Preserve at least one active administrator atomically. Account creation cannot
   attach or reset an existing shared identity; local identities have one owner.
5. Add bounded host DTOs and auth/user endpoints, await authenticated principal
   resolution before analytical operations, deny the selector in password mode.
   Use opaque digest-only sessions, login throttling, initial password change,
   logout/revocation and existing strict local Origin/Host checks.
6. Extract frontend platform composition from the analytical React adapter into
   host/. Add independent access domain/application/HTTP/React adapters for login,
   mandatory password change, profile and user administration. Reuse shared UI and
   server-backed context; never treat a displayed profile as authority.
7. Add explicit `local:admin` bootstrap issuance: existing platform user ID and
   history are retained; no default password and no plaintext credential file.
   Emit the initial secret once to the invoking operator only, never service logs.
   Password mode fails closed until bootstrap; local:up migrates/rebuilds safely.
8. Update OpenAPI/generated bindings, operator guide, plans and scope evidence;
   build and verify Docker. Keep existing database/seed volumes and source data.

## Validation

Run type checks, npm test, actual PostgreSQL migration/RLS/auth tests and browser
flows. Cover all four profiles, initial password change, login/logout/expiry,
revocation, direct denied imports, foreign scope, concurrent last-admin protection,
provision reruns, stable identity/history and dependency direction. Check Docker
health and actual UI login/creation/profile changes at desktop/mobile widths.
No corporate integration or public hosting is introduced. Commit validated changes;
publication approval remains separate from the local Docker update.

## Implementation constraints and checks

- Automatic review rejected an attempted expansion of site-role policy scope.
  That edit was not applied. The implementation retains exact organization/site
  RLS and supports exclusively local identities; bootstrap verifies exclusive
  organization and site ownership. No policy expansion or approval remains needed.
- Compatibility updates include the migration allowlist in demo-maintenance.ts and
  migration/policy expectations in existing database tests. Business-data resets
  preserve credentials, profiles and access audit. No volume or history is deleted.
- Generated HTTP schema now lives in web/src/contracts; platform composition lives
  in web/src/host. Access domain/application imports are covered automatically by
  the existing inward-dependency test. New use-case tests inject in-memory ports.
- Operator documentation covers issuance/recovery, exact profile permissions and
  local deployment limits. Bootstrap does not persist the issued plaintext secret.

## Validation evidence and closure

- Node 24.21.0/npm 10.9.2: typecheck passed. `npm test` passed: 18 secret-tooling,
  300 API, 57 web and 77 database-configuration tests, including architecture
  boundaries and generated-contract drift. Native Argon2id measured about 260 ms.
- Real PostgreSQL access suite: eight passing cases include four profiles, initial
  password change, current-secret verification, expiry/logout/revocation, login
  throttling, atomic provisioning, foreign scope, forced RLS, provision reruns,
  newly created administrator import grants, nonadministrator direct HTTP denials
  and concurrent last-administrator preservation. Browser flow uses real Nest,
  PostgreSQL and built web; desktop/mobile screenshots were visually inspected.
- Seven existing Playwright journeys passed at 1440 px and 375 px. The new browser
  flow initially submitted into the outgoing form before logout completed; the
  test now waits for the login heading before filling credentials.
- Full database validation initially exposed expected migration-count/policy
  changes; assertions and the maintenance allowlist were updated to the reviewed
  migration. The corrected membership suite passed all ten tests. The final full
  database run passed all 13 suites and 186 tests (124.5 s).
- `npm run local:up` rebuilt setup/API/web, applied migrations and left all three
  services healthy. `local:admin` issued the original administrator's first local
  credential without persisting its plaintext. A real Docker browser check found
  the login screen, password mode and no selector; `/demo/user` returns 403. The
  initial password remains unchanged for the owner to choose their own password.
- Local SQL/seed verification: 78 dates and 42,220 analytical rows retained,
  frequency 212,411 and 56,391,042 exact alarm seconds; zero dates reimported.
  Stable user `local-administrator` now has the administrator profile. A private
  pre-migration database backup is retained under `.local-platform/backups/`.
- Packaging includes the bootstrap command through infra/local/Dockerfile and the
  explicit .dockerignore allowlist. Operator/testing guides, architecture/data
  model/module contracts and shared schema references were synchronized.

Changed Markdown links, story/plan status, migration IDs and `git diff --check`
were verified. Screenshots and test logs remain private local evidence under /tmp;
no synthetic or real credentials were added to the repository.

IOP-165 is complete for the requested local increment. Corporate identity binding,
remote deployment, general user password recovery, multi-site/shared identities and
real shifts/maintenance/publications remain future work. Existing Vite bundle-size
advisory remains outside scope. No merge, push, platform tag or hosted release was
performed; publication requires the owner's separate approval under ADR-0008.
