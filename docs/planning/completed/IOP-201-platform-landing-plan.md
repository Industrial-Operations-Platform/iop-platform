# IOP-201 — Platform landing execution plan

Completed on 2026-10-09. Authorized by the owner's landing/login request.
Story branch: `feature/IOP-201-platform-landing`, created from local `develop`
at `d469824`. [Permanent scope](../items/IOP-201-platform-landing.md).

## Changes and steps

1. Compose a host-owned `LandingPage.tsx` and `landing.css` using `IdentityRoot`,
   the platform mark, shared surfaces/controls and existing identity tokens.
   Explain delivered modules and their practical workflow without fictional data.
2. Integrate the existing `LoginPanel` as a content slot in `WorkspaceApp.tsx`.
   Preserve password-change, restored-session, logout and connection-retry behavior.
   Compose the existing selector for signed-out native demo sessions as well, so
   both existing access modes use the platform entry. Adjust
   `e2e/workspace-startup.spec.ts` for its new signed-out presentation and retain
   real health/context proxy verification. No new policy or transport work.
3. Add German resources in `src/localization/de.ts`; adjust the existing login
   presentation only as needed for a coherent heading/layout. Synchronize
   `apps/web/README.md` with the entry behavior.
4. Verify browser login transitions and responsive rendering in a focused
   `apps/web/e2e/platform-landing.spec.ts` and the native demo startup scenarios.
   Run existing web/access/session tests,
   identity/architecture guards and the production build. Review desktop/mobile
   screenshots and document the distinction between intercepted browser responses
   and real authentication tests.
5. Record evidence, complete item/backlog, move this plan to `completed/`, review
   the scoped diff and create a local English commit. Request publication approval
   only after the reviewable result is ready.

Changed files: host landing/composition, access `LoginPanel.tsx`, localization,
focused browser/startup tests, web README and this story's planning
records/backlog. No dependency stories containing Spanish prose were read.

## Validation and evidence

Used the installed Node 24.21.0 runtime. Results:

| Validation | Result |
| --- | --- |
| `npm test --workspace @iop/web` | 29 suites, 149 tests passed after final composition changes. |
| `npm test --workspace @iop/api` | 30 suites, 418 tests passed with completed API build and localhost permission. |
| `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries` | 16 checks passed after final composition changes. |
| `npm run build` and final `npm run build --workspace @iop/web` | API/web/database compilation passed; final web build includes all 3 design guards. Existing large-bundle advisory remains. |
| `npm run test:e2e --workspace @iop/web -- platform-landing.spec.ts workspace-startup.spec.ts administrator-workspace.spec.ts` | 12 Chromium scenarios passed: desktop/tablet/mobile, EN/DE, persisted locale, keyboard anchors/focus, rejected login, successful login/logout, initial-password replacement, restored session, native demo selection, connection recovery and administrator views. |
| Landing dictionary inspection | All 48 presentation keys have German resources; no duplicate dictionary keys. |

Inspected screenshots at 1440, 1024 and 375 pixels, including German desktop/narrow
rendering. Flat shared surfaces, original mark and tokens are preserved; no
horizontal overflow or browser page errors were observed. Browser artifacts are
temporary `/tmp/iop-201-landing[-de]-WIDTH.png` files. Browser access responses are
intercepted fixtures; credential persistence remains covered by the existing
authentication tests rather than a new PostgreSQL login journey.

The temporary local preview returned HTTP 200. A visible browser handoff was
unavailable because Computer Use reported no browser surfaces; Chromium tests and
inspected screenshots supplied actual browser QA. The owned preview server was
stopped. No dependencies, API contracts, database schemas or authentication policy
changed. Documentation links/statuses and whitespace are checked before commit.

## Closure

All item criteria are met; item/backlog are synchronized and this plan is retained
in `completed/`. Validated changes are retained on the story branch for owner
review. Merge, push and deployment require the owner's separate authorization.
