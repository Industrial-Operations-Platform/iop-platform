# IOP-216 — Execution evidence

Completed locally on 2026-10-20. Authorized by the owner's screenshot/design request.
Branch: `feature/IOP-216-shell-branding`, from `develop` at `0df0299`.
Isolated worktree: `/private/tmp/iop-216-shell-branding`; IOP-215 work remained
outside this story. [Permanent scope](../items/IOP-216-shell-branding.md).

## Delivered changes and ownership

- Shared `Layout.tsx` places the aligned mark and stacked name in the header,
  grouping search, notifications and account controls at the right. Canonical
  `identity.ts` layout tokens set the desktop header/rail dimensions.
- `components.css` uses compact left-aligned navigation beneath the header,
  independent desktop scrolling and one horizontal narrow-screen strip.
  `SideNavigation.tsx` fully reveals keyboard-focused destinations; native browser
  focus scrolling left some partially clipped. Start navigation remains labelled.
- The shared React adapter measures header height with `ResizeObserver`, allowing
  demo selectors/search to wrap while the rail and anchored panels remain aligned.
  Header selectors keep 44px targets. `overview.css` contains search results at
  intermediate widths; shared popover heights account for a wrapped header.
- The existing Unified Record SVG now has centered square loops and equal strokes.
  Workspace, introduction and favicon share `unified-record-v2`; the host lockup,
  landing assertions and canonical visual/component/web documentation agree.

Changes remain in shared design and React host/feature presentation adapters under
Accepted ADR-0032/0010. No domain/application rule, permission, API/schema,
persisted data, dependency or new architectural pattern changed. Read dependency
IOP-214 was already English; no translation-only edits were needed.

## Validation and evidence

Node 24.21.0/npm 10.9.2:

| Check | Result |
| --- | --- |
| `npm test --workspace @iop/api` | 48 suites / 509 tests passed |
| `npm test --workspace @iop/web` | 38 suites / 219 tests passed |
| Web browser run selecting shell-branding, operational-shell, desktop-consistency, platform-landing and appearance specs | 36 scenarios passed |
| `npm run build --workspace @iop/web` | Design guard 4/4, TypeScript and production bundle passed |
| `npm run typecheck` | API, web and database tooling passed; final web edits also checked by production build |
| Changed Markdown links and `git diff --check` | No missing targets or whitespace errors |

The new [browser scenarios](../../../apps/web/e2e/shell-branding.spec.ts) cover
1440×900 light, 1366×768 dark, 768×900 light, 390×844 dark/German and 320×844 light,
plus native demo profile/search controls at 621px and 800px. They verify rendered
brand/control alignment, left-aligned labels, all 14 destinations through Tab,
Start navigation, contained account/search panels and rail movement after resizing.
Screenshots are attached to browser results; inspected desktop light/dark,
narrow German, intermediate search and expanded native-demo rendering. Existing
scenarios additionally exercise notifications, account focus, appearance changes,
public introduction/sign-in and operational collections at 375–1920px.

Browser evidence uses explicit fixtures, without real provider/customer data.
Local test sockets and Chromium required sandbox escalation. Dependency symlinks
reuse the existing installation without changing package manifests. The production
build retains its existing warning for chunks above 500kB. No database integration,
real-provider validation, deployment or plant acceptance is claimed.

## Local review

All acceptance criteria are met; the permanent item/backlog are synchronized and
this plan is retained in completed. Changes are ready for the required local
commit and owner review. No merge or push is authorized by implementation closure;
publication requires the owner's separate approval under ADR-0008.
