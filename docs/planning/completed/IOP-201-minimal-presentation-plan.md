# IOP-201 — Minimal presentation home refinement

Completed on 2026-10-09. Authorized by the owner's clarification and visual reference.
[Scope](../items/IOP-201-platform-landing.md). Retain
`feature/IOP-201-platform-landing`, originally created from `develop` at `d469824`;
initial implementation is local commit `947e61e`. No integration is authorized.

## Changes and steps

1. Replace the dense host landing with a minimal full-height presentation home.
   Use the original mark/font/palette, a scoped display-heading token and CSS/SVG
   depth, moving background forms and an optional pointer tilt. Illustrations
   represent Data Analysis, Maintenance and Workforce without fabricated metrics.
2. Compose the existing access slot in shared `Dialog` only after Sign in. Keep
   mandatory password replacement outside dismissible presentation, preserve
   restored-session routing and make logout return to the minimal home.
   Report `LoginPanel` submission state to the host so the shared dialog remains
   busy during login; closing/reopening must not bypass the form's pending guard.
3. Move the existing six-module/workflow content to a host `PlatformAbout.tsx`
   view opened by About, with accessible return/focus behavior. Reuse shared controls
   and surfaces. Keep decorative scene content hidden from assistive technology;
   labelled module buttons provide keyboard-accessible selection.
4. Respect reduced motion and provide an explicit pause action. Record the
   owner-authorized presentation-only visual refinement in the design contract;
   workspace typography and controls keep their existing identity. This is a host
   presentation change under Accepted ADR-0032/0035, with no new architectural
   boundary, provider, route API, storage or dependency.
5. Update EN/DE resources, web README and affected unit/browser expectations.
   Validate login/About focus and Escape, all existing access transitions, module
   interaction, paused/reduced motion and desktop/mobile rendering. Close planning
   records, review the scoped diff and create a local commit.

Changed files: host `LandingPage.tsx`, `IntroScene.tsx`, `PlatformAbout.tsx` and
`landing.css`; `WorkspaceApp.tsx`/`LoginPanel.tsx` pending-state composition;
shared display tokens, design contract, localization, README, affected browser and
readiness tests, and planning records. Delegates moved About content, updated the
bounded tests and reviewed accessibility. Host composition supplies Access use
cases; visual adapters own interaction state. No Spanish dependency story was read.

## Validation and evidence

Validation used installed Node 24.21.0:

| Check | Result |
| --- | --- |
| `npm test --workspace @iop/web` | 29 suites, 149 tests passed. |
| `npm test --workspace @iop/web -- '--testPathPatterns=workspace-readiness\|localization\|design-boundaries'` | 3 suites, 16 tests passed after lifecycle refinements. |
| `npm run build --workspace @iop/web` | Final TypeScript/Vite build passed, including all 3 design guards. Existing bundle-size advisory remains. |
| `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries` | 16 boundary checks passed. |
| `npm run test:e2e --workspace @iop/web -- platform-landing.spec.ts workspace-startup.spec.ts administrator-workspace.spec.ts` | 16 final Chromium scenarios passed. |

Browser coverage verifies minimal initial content, six modules only in About,
on-demand password/demo access, rejected and successful login, logout, restored
sessions, mandatory password replacement, connection recovery, pending-submit
dismissal/duplicate protection, native modal background inertness and focus return,
module keyboard selection, pointer tilt, pause and reduced motion. Native Tab may
move to browser chrome; the test rejects focus on every application control behind
the modal rather than treating browser chrome as an application escape.

Inspected actual EN/DE screenshots at 1440, 1024 and 375 pixels, plus narrow About.
The shared mark and three module labels remain readable; layout is responsive and
initial access controls/details are unmounted. Temporary artifacts are
`/tmp/iop-201-intro[-de]-WIDTH.png` and `intro-about-WIDTH.png`. Geometry is
illustrative and never presents live metrics, pricing or trials. Native visible
browser handoff remains unavailable; automated Chromium supplied browser QA.
Playwright stops its temporary servers after the run.

Browser access responses are intercepted fixtures; real credential persistence
remains outside this presentation refinement. No dependency, API, database or
authentication-policy changes were introduced. Documentation links, IDs, completed
statuses and whitespace are checked before the local commit.

## Closure

All revised criteria are met. The item/backlog are synchronized, this slice is in
`completed/`, and prior evidence is retained. Validated changes remain on the story
branch for review. Merge, push and deployment require the owner's explicit approval.
