# IOP-002 — Local delivery and tooling review

Status: requirements and tooling accepted in
[ADR-0009](../../architecture/adr/ADR-0009-local-delivery-tooling.md).
Source: [IOP-002](IOP-002-technology-stack.md). No runtime tooling is installed.

## Confirmed reporting requirements

IOP replaces Power BI presentation with its own application. The sole maintainer
has strong backend experience and limited frontend experience; the owner requests
an evidence-based frontend recommendation rather than choosing unfamiliar tools.

V1 has an executive overview and a detailed analysis view with filters for the
external concepts `Halle`, `Bereich`, `Betriebsmittel` and `Meldetext`. These are
customer-scoped labels/mappings, not fixed generic hierarchy levels. Users consult
and filter predefined reports; only the administrator changes report definitions.
Versioned configuration files select implemented metrics, groupings and chart types.
New formulas require code changes. Changes are infrequent; an administration UI is
future scope. Exact metric definitions and pilot acceptance remain with IOP-001.

## Confirmed delivery requirements

Initially run locally in Docker, with separate frontend, backend and PostgreSQL
containers. Keep component build outputs in their own directories and package only
required runtime artifacts in each image. Provide versioned build/start commands
and explicit configuration inputs. Preserve portability to future servers without
hard-coded developer paths or a hosting-provider dependency.

Commits must identify their scope, including backend, frontend and architecture.
Automatic hooks must reject formatting and syntax errors before commits. These
requirements do not establish that static checks can detect all application bugs.

## Tooling comparison and recommendation

| Concern | Alternatives | Recommendation and reason |
| --- | --- | --- |
| Monorepo scripts | npm workspaces; separate installs/scripts per component | npm workspaces and one lockfile simplify consistent dependency installation while preserving component scripts. Additional build orchestration is not justified yet. |
| Git hooks | maintained hook manager; custom shell hook installer | Husky with lint-staged keeps hook setup versioned and selects staged files without maintaining a custom installer. Requires developer dependency installation. |
| Commit messages | free text; validated convention | Conventional Commits with commitlint provides explicit, machine-checkable scopes. Message validation alone does not prove the diff matches the scope. |
| Code checks | manual checks; automated formatter/linter/type checks | Prettier, ESLint and project TypeScript checks separate formatting, lint/syntax and typing responsibilities. |
| Local orchestration | manual container commands; Compose | Docker Compose captures services, configuration, volumes and startup behavior in versioned files. |
| Images | compilation tools in runtime; multi-stage builds | Multi-stage builds keep compilation and final runtime artifacts separate. |

Sources: [npm workspaces](https://docs.npmjs.com/misc/workspaces/),
[Husky setup](https://typicode.github.io/husky/get-started.html),
[lint-staged](https://github.com/lint-staged/lint-staged),
[commitlint conventions](https://commitlint.js.org/concepts/commit-conventions.html),
[commitlint rules](https://commitlint.js.org/reference/rules.html),
[Prettier checks](https://prettier.io/docs/cli),
[ESLint CLI](https://eslint.org/docs/latest/use/command-line-interface),
[Docker Compose](https://docs.docker.com/compose/),
[multi-stage builds](https://docs.docker.com/build/building/multi-stage/).
These are capability references; recommendations are project-specific judgments,
not benchmark results. Compatible versions must be verified and pinned at bootstrap.

## Command contract and implementation ownership

The following are required behaviors, not runnable repository commands today:

- Install locked dependencies and set up local hooks: backend/tooling bootstrap
  (IOP-016), coordinated with frontend bootstrap (IOP-017).
- Format/check staged supported files and validate commit messages: bootstrap;
  reject malformed syntax, formatting violations and missing/invalid scopes.
- Run project-level type checks without passing staged filenames to the compiler;
  cover shared-package consumers. Verify partially staged changes remain intact.
- Build and run all three containers, show logs and stop without deleting data:
  IOP-015, using real hosts from IOP-016/017 and PostgreSQL from IOP-019.
- Validate environment/report/source-input configuration: IOP-018. Include example
  variable names, required/optional values, paths, ports and input mounts. Exclude
  secrets and customer datasets from images and committed examples.
- Execute meaningful tests: IOP-020. Repeat lint/type/test checks in CI under
  IOP-021 because local hooks can be bypassed. CI must not depend on installed hooks.

These ownership links are planning assignments, not activation of those stories.
No scaffolds, fake commands or Docker deployment are part of this completed review.
The subsequent [frontend/testing evaluation](IOP-002-frontend-testing-review.md)
records the accepted remaining stack under ADR-0010, with owner-selected Jest.
