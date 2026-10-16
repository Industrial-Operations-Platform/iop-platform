# IOP-214 — Execution evidence

Completed locally on 2026-10-15. Authorized by the owner's instruction to implement
the review findings autonomously. Branch: `fix/IOP-214-desktop-consistency`, from
`develop` `905f398`. [Permanent scope](../items/IOP-214-desktop-consistency.md).

## Delivered changes and ownership

- Formal Handover waits for context before displaying record times; Area overview
  retries failed bootstrap without resetting later selections. Three regressions
  reproduced failures against the original implementation before the fixes.
- Improvements retains applied queries, guards collection/detail/lookup pagination
  and comparison responses by request/action identity, blocks duplicate requests,
  and retains drafts after uncertain saves. Integrations guards readiness/history,
  provides explicit retry/empty states and formats dates in the selected site zone.
- Shared `PageStack`, `DetailFacts`, semantic table alignment and stable prose apply
  existing identity tokens to operational collections/forms/details. The desktop
  navigation scrolls within its fixed rail; native controls inherit appearance.
- Asset Management uses localized states, explicit filter reset/result states and
  ordering only after the full matching collection is loaded. Workforce defaults
  to seven day columns with labelled shifts; the expanded shift matrix remains
  available. Locator cards inherit the platform font.
- The host defers analytical rendering, announces loading and catches chunk failure
  inside the content area, retaining operational navigation and a reload action.

Changes stay in `apps/web` presentation/host adapters and scoped localization;
domain/application contracts, API/database schemas, grants and persisted data are
unchanged. Accepted ADR-0032/0010 cover these refinements. The owner-approved
alignment revision is recorded in the visual/component contracts. Read dependencies
IOP-202, IOP-212 and IOP-187 were already English; no translation-only edits arose.

## Verification

Node 24.21.0/npm 10.9.2:

| Check | Result |
| --- | --- |
| `npm test --workspace @iop/api` | 48 suites / 509 tests passed |
| `npm test --workspace @iop/web` | 38 suites / 219 tests passed |
| `npm run test:e2e --workspace @iop/web -- --reporter=line` | 67 browser tests passed |
| `npm run build --workspace @iop/web` | Design guard 4/4, TypeScript and production bundle passed |
| `npm run typecheck` | API, web and database tooling passed |
| `npm run contract:check --workspace @iop/web` | Generated browser contract matches API artifact |
| `npm run test:secrets` | 5 suites / 25 checks passed |
| `npm run check:secrets` | Indexed-file hygiene passed |
| Changed Markdown links and `git diff --check` | No missing targets or whitespace errors |

The new [browser scenarios](../../../apps/web/e2e/desktop-consistency.spec.ts)
use explicit read-only fixtures: 1366×768 keyboard access to all 14 destinations,
dark native date control, deferred/failed analytical chunk loading, populated
collections/details/forms at 1440 light/1920 dark/390 dark, and German states.
Inspected generated screenshots for those states and compact Workforce at desktop
and narrow widths. Narrow grid containment and a readable minimum collection width
were corrected during inspection; overflow remains inside the table viewport.
Existing Handover checks now assert stable prose and retry style readiness.

The initial JavaScript file falls from 1,388.69 kB to 724.28 kB minified
(421.94 to 201.77 kB gzip); analytical and Three.js rendering remain deferred chunks.
Vite still warns about chunks above 500 kB. This is artifact-size evidence, not
measured loading-time or representative performance acceptance. No plant acceptance,
real-provider verification, database integration rerun or deployment is claimed.

## Local review

Logical increments: `f3a1048` (loading recovery), `765e3c4` (shared desktop/table
presentation) and `c619872` (pagination/integration forms), followed by the completion
increment containing deferred loading and browser evidence. The item/backlog are
complete and this plan is retained under `completed/`. No merge, push or deployment
was performed; remote publication follows the explicit repository convention.
