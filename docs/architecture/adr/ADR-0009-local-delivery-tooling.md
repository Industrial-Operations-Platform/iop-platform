# ADR-0009: Local container delivery and scoped development checks

## Status

Proposed. The owner requested the behavior below; named tooling choices await
review. This ADR does not accept a frontend framework or authorize scaffolding.

## Context

[IOP-002 review](../../planning/items/IOP-002-delivery-tooling-review.md) records
administrator-configured analytics, local Docker execution, future server
portability and automatic scoped-commit checks for a solo-maintained monorepo.
ADR-0001/0002/0006 already establish a modular monolith, monorepo and NestJS backend.

## Decision

Propose npm workspaces with a root lockfile and per-component scripts. Use Husky
for versioned Git hooks, lint-staged for staged-file checks, Prettier for formatting,
ESLint for code linting and TypeScript project checks for types. Pin compatible
versions during implementation. Local Git hooks run in the developer checkout;
application execution in Docker does not remove this local tooling prerequisite.

Require Conventional Commits through commitlint, with a nonempty scope from:
`backend`, `frontend`, `database`, `architecture`, `infra`, `tooling`, `docs`, `shared`.
Use English subjects, for example `fix(backend): validate import duration` or
`docs(architecture): record container delivery boundaries`. Keep changes small;
use the primary purpose for a coherent cross-scope change and explain other areas
in the body. Do not force unrelated work into a shared commit. No historical rewrite.

Pre-commit checks reject formatting/lint failures on staged supported files and
run relevant project type checks for code changes, including shared consumers.
Commit-msg validates the message. Prefer checks that do not rewrite staged files;
provide a separate explicit formatting command. Verify partially staged files,
missing tooling, invalid syntax and invalid scopes during bootstrap. CI repeats
full applicable checks independently; neither hooks nor syntax checks replace tests.

Use Docker Compose for local frontend, API and PostgreSQL services. They are
runtime hosts/storage for the modular platform, not business microservices.
Keep Dockerfiles with their application hosts; use repository-root build contexts
when shared workspace dependencies are needed and an explicit .dockerignore.
Build within component directories in builder stages, then copy runtime outputs
and required production dependencies to final images. Use a pinned PostgreSQL
image with persistent data storage; the database does not require app compilation.

Separate development mounts/hot reload from runtime image configuration. Provide
explicit environment/configuration inputs and configurable source-file mounts.
Do not bake local paths, credentials or customer data into images. A frontend build
must not embed server secrets; its public API location must have a documented
configuration strategy. Resolve that mechanism with the frontend selection.

Reuse runtime images on future servers through environment-specific configuration.
TLS, server topology, backups and production operations belong to later deployment
work; local Compose success is not production readiness evidence.

## Consequences

One workspace and repeatable scripts reduce setup divergence but require disciplined
module imports and lockfile updates. Root scripts must fail on missing required
checks rather than silently skip them. Hooks improve local feedback and can be
bypassed; CI remains necessary. Scope validation labels intent, not file ownership.

No scripts or hooks exist yet. Record actual commands and validation in bootstrap
stories; do not close IOP-002 by inventing executable evidence. The frontend,
charting, test runners, ORM and migrations remain separate unresolved choices.

## Alternatives considered

Manual container startup duplicates configuration and is harder to reproduce.
Separate component installations create more lockfile/update coordination for a
small monorepo. Custom hook installers require additional maintenance. Keeping
build tooling in runtime images adds unnecessary runtime contents. Selecting a
server orchestrator now would exceed the known local deployment requirement.

See the linked review for official capability sources and implementation ownership.
