# IOP-212 — Execution plan

Completed. Authorized by the owner's 2026-10-15 improvement request.
Story branch: `fix/IOP-212-entry-recovery-filters`, from develop `06dd8bb`.
Scope: [permanent item](../items/IOP-212-entry-recovery-filters.md).

## Changes and steps

1. Remove pause state/action/styles from host `LandingPage.tsx`, `IntroScene.tsx`,
   `landing.css` and unused localization entries. Synchronize the owner-overridden
   motion requirement in `docs/design/visual-identity.md` and IOP-201's item.
2. Sanitize unavailable transport/invalid JSON in Access's HTTP gateway; keep known
   business errors. Host `WorkspaceApp.tsx` shows one clean reconnect status when
   context is unavailable, retaining retry. Add English/German reconnect wording.
3. Reuse `DepartmentScope`'s shared compact presentation with optional caption and
   empty label for `AreaOverview.tsx`. No selection/domain rule changes. IOP-211
   independently contains a similar area treatment but remains unmerged; do not
   introduce its model/access changes into this branch.
4. Update focused HTTP and browser regressions, run web build/tests and required
   architecture/design checks; visually inspect desktop/narrow landing, failed
   connection/recovery and area controls.
5. Audit fetched Git refs, compare Docker source/artifacts, rebuild/activate local
   web/API from this develop-based story, and record health/content evidence.
6. Synchronize item/backlog and completed plan; create scoped local commits.
   Request publication approval only after the changes are concrete and validated.

Expected files: those above; `apps/web/e2e/platform-landing.spec.ts`, relevant
Operational Overview browser tests, focused Access adapter tests and planning docs.
All consulted story contexts are already English; no translation-only edits needed.

## Validation and evidence

- Initial working tree clean. Fetched origin; develop = origin/develop = `06dd8bb`.
- Eight local branches are not ancestors of develop: IOP-204 through IOP-211.
  Several IOP-204–210 patches have equivalent integrated commits; ancestry must be
  distinguished from delivered content. No fetched remote branch is ahead of develop.
- Initial Docker API/web healthy, built 2026-10-14 with no revision labels; running
  JS is `index-Ba0oPnGB.js`. Compare actual artifacts before asserting freshness.
- Planned: web unit suite, design/architecture guards, production build, focused
  Playwright regressions, visual inspection, Docker health/content, Git/doc checks.

## Git integration audit — 2026-10-15

`git fetch origin` succeeded. Both develop refs remain `06dd8bb` (0 ahead/0 behind).
All fetched origin branch tips are ancestors of origin/develop. The following
retained local branches are not ancestors of either develop ref and have no
corresponding origin ref. Counts below are commits absent by ancestry; equivalent
patches are detected by `git cherry`, not proof of complete feature equivalence.

| Local story branch | Tip | Commits absent | Equivalent patches |
| --- | --- | ---: | ---: |
| `feature/IOP-204-formal-handover` | `e6b051e` | 2 | 1 |
| `feature/IOP-205-improvement-tracking` | `eb96c1c` | 3 | 2 |
| `feature/IOP-206-3d-asset-locator` | `a2edceb` | 2 | 1 |
| `feature/IOP-207-integration-readiness` | `da2f3b3` | 1 | 0 |
| `feature/IOP-208-local-delivery-infrastructure` | `c7b11af` | 5 | 4 |
| `feature/IOP-209-asset-domain-completion` | `ed1b4a7` | 8 | 6 |
| `feature/IOP-210-operational-search-overview` | `dba397a` | 2 | 1 |
| `feature/IOP-211-locator-models-and-access` | `b3a4a01` | 8 | 0 |

IOP-203's [assembly evidence](../completed/IOP-203-platform-completion-plan.md)
records integration of IOP-204–210 functionality under different commits; retained
story ancestry is still missing. IOP-211 has a substantive separate 119-file diff
against develop. This audit does not claim all retained branches have been merged.
The current IOP-212 branch is also pending review/publication. No merge, rebase,
branch deletion or push was performed.

## Docker baseline comparison

A separate source-only build of develop under `/private/tmp/iop-212-develop-ffnjillj`
produced `index-Ba0oPnGB.js`, SHA-256
`97d875e2b804ea9f0bff1b12907372d051a754ba234a7cfb2896f344d9da9893`,
identical to the initially running frontend. API rebuild reused the identical
`3cfa078cd7ee9a17a6204e1ba4265f155c801763e512c5c716c33b80d3df41e3` image;
compiled runtime and overview-composition hashes also matched the develop build.
The initially running services therefore already reflected develop; the web rebuild
adds IOP-212's requested fixes. PostgreSQL and private volumes are preserved.

## Validation and local activation

- Validation uses Node `24.21.0`. `npm run build` passed API/web/database compilation;
  the final web rebuild passed TypeScript, required design checks (4/4) and Vite.
- Full web suite: 38 suites/199 tests passed. After the final HTTP review preserved
  collection responses, the focused Access HTTP suite passed 8/8, including JSON
  arrays, HTML proxy pages (200/502), empty/null JSON, 503, network recovery and
  known credential errors. No API/domain contract or database schema changed.
- `npm run test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  26/26 passed. Review confirms presentation/HTTP changes stay in adapters and host.
- Focused Playwright: 15/15 passed against preview. The final build then passed the
  same 15/15 against actual Docker `http://127.0.0.1:8080` using a temporary test
  configuration. Backend responses are controlled fixtures in these scenarios.
  Coverage includes 1440/1024/375px, keyboard/dialog focus, login/password/session
  flows, HTML/network/503 failure plus retry, running decorative motion, system
  reduced motion, and area/date/department selection with inline alignment.
- A separate Chromium check without API mocks confirmed actual Docker session
  context HTTP 200/password mode and visible login controls at 1440/375px, with no
  alerts, page errors or horizontal overflow. No credentials or data were changed.
- Visually inspected desktop/narrow landing, compact area filters, clean reconnect
  dialog and actual Docker sign-in screenshots. Artifacts: `/private/tmp/iop-212-area-1440.png`,
  `/private/tmp/iop-212-area-375.png`, `/private/tmp/iop-212-reconnect-html.png`,
  `/private/tmp/iop-212-docker-access-375.png`. All retain shared identity.
- Final web image `2188f4f453f82d85d46ab4644d827a82c3d6e7ef0735855d73d79ea1a0fcaa86`
  is active; `index-CHn0WyuT.js` SHA-256
  `3ce044adf242e0e986394266ee8fe57a9c2ee1215ffd750b99e74834dfad9e64`
  matches the local final build. API image is unchanged because it already matches
  develop. Web/API/database are healthy; existing volumes remain intact.
- Vite retains its existing large-chunk warning. No unrelated bundle work added.
- Checked changed Markdown local links, item/backlog status and `git diff --check`.

## Closure

All requested local UI changes, Docker verification/activation and branch audit
are complete. The audit explicitly identifies missing story ancestry. No merge or
push is included in this delivery. IOP-212 is ready for owner review/publication;
retained IOP-204–211 integration remains a separately authorized follow-up.
