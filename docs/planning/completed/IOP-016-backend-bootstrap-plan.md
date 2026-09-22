# IOP-016 — Backend bootstrap execution plan

Source: [permanent item](../items/IOP-016-backend-bootstrap.md).

## Status and authorization

Completed on 2026-09-22; implementation validated on 2026-09-16.
Owner requested IOP-016 within the [POC scope](../../product/scope-poc.md)
and [delivery map](../poc-delivery.md), then explicitly requested continuation.
Branch: `feature/IOP-016-backend-bootstrap`, created from `develop` at `477b112`
after the explicitly requested IOP-142 merge and push to origin. No other review
branch was merged. This story will be committed locally for review.

## Proposed implementation

Bootstrap only the NestJS API host, npm workspace, TypeScript build and Jest/Supertest
checks. Provide version-neutral `GET /health` returning `200 {"status":"ok"}`:
process liveness only, public, no organization/site/permission or database claims.
Generate a reviewed OpenAPI artifact from explicit DTO metadata. Bind local startup
to `127.0.0.1`, validate optional `PORT`, and fail startup safely on invalid inputs
or listener errors. Use minimal safe Problem Details for bootstrap errors only.
No business routes, database, frontend, workers, authentication or local principal.

## Files expected to change

- This plan, permanent IOP-016 item and its backlog row.
- Root `package.json`, `package-lock.json`, `.gitignore`, `.nvmrc` for reproducible
  workspace installation and commands.
- `apps/api/`: package/build/test configuration, source, tests, generated OpenAPI
  artifact and local usage documentation; remove its obsolete placeholder.
- `README.md`, `ARCHITECTURE.md` and the baseline/test-runner statements in `AGENTS.md` only where
  the new executable host makes documentation-only claims obsolete.

## Dependencies and decisions

IOP-002 and IOP-003 are Completed. Follow Accepted ADR-0001/0003–0011,
module ownership, glossary and data model. ADR-0011 explicitly assigns operational
health endpoints to backend bootstrap. IOP-013 remains Proposed: this task supplies
only process liveness and fixed startup/failure messages; readiness, diagnostic
correlation and import logging contracts remain there. IOP-022 retains the complete
error catalog/correlation implementation. Neither adjacent item is activated or closed.
ADR-0018 remains Proposed and blocks business access, not this independent host.
IOP-015 depends on the host, so Compose is not a prerequisite. IOP-018/019 own broader
configuration/persistence. Workspace build/type/test scripts are the minimum needed
here; full hooks/lint/format tooling and CI remain separately scoped delivery work.
Pin mutually compatible dependencies after checking official documentation/package
metadata. This implements accepted technology choices without a new domain pattern.

## Database changes

None. No credentials, connection, migrations, RLS changes or readiness claim.

## API and UI changes

One public process-health operation, with no inputs or business data. A generated
OpenAPI document records scope/permission as not applicable. Unknown routes/versions
remain unavailable. No Swagger UI, frontend bindings or business endpoints.

## Tests and validation

- Clean `npm ci`, `npm run build`, `npm run typecheck`, `npm test`.
- Real Nest injection and HTTP health response; unsupported routes/methods return
  safe Problem Details without reflecting request data; unexpected errors sanitized.
- Generated artifact matches metadata and actual health response shape; pin its dialect.
- Execute compiled entrypoint on loopback, probe health, terminate gracefully;
  invalid ports and occupied port exit nonzero without leaking configuration.
- Inspect direct dependency licenses/notices and installation audit results.
- Check changed Markdown links, item/backlog status, `git diff --check` and staged scope.
- No database, browser, shared-user authorization or Docker validation claimed.

## Implementation steps

1. Record plan before implementation; refine item to this bounded bootstrap.
2. Create workspace/API and compatible locked dependencies.
3. Implement minimal host/contract and meaningful integration/startup tests.
4. Run checks, synchronize documentation and record limitations.
5. Move finished plan to completed, commit validated changes and report status.

## Completion checklist

- [x] Bootstrap acceptance criteria verified with actual results.
- [x] Tests and documentation checks completed; limitations recorded.
- [x] Item/backlog synchronized; completed plan linked.
- [x] Scoped changes included in this local commit; publication remains subject to authorization.

## Evidence and deviations

Initial checkout was clean. IOP-142 was already published; merge `477b112` was
pushed to `origin/develop` under the owner's explicit request. Initial Git sandbox
restriction was resolved through an approved escalation. Node initially available
on PATH was 20.18.3 and npm was 10.8.2; the final validated runtime is recorded below.

Compatibility validation found Nest 12's ESM packages incompatible with the initial
CommonJS Jest setup on installed Node 22.14. An intermediate trial used Nest 11.2.5 / Swagger 11.4.7,
TypeScript 5.9.3 and ts-jest 29.4.12 (TypeScript <7 peer constraint), retaining
Jest 30.5.1. This is a version refinement within the accepted stack. Initial HTTP
tests also hit sandbox EPERM on loopback; rerun with approved local-listener access.

Nest 11 passed all 24 tests, but audit identified five high-severity findings
through its multer dependency. Final compatibility target is therefore Node 24.21.0
with Nest 12.0.3 / Swagger 12.0.1; Jest supports require(ESM) on Node >=24.9.
Validate this runtime in a temporary tool directory without changing the user's
global installation. Update .nvmrc and usage requirements to the final tested runtime.

Jest also requires `--experimental-vm-modules` to expose Node's VM module API;
the workspace test command includes it. Application startup does not need this flag.
Reference: [Jest ESM/require documentation](https://jestjs.io/docs/ecmascript-modules).


## Final validation evidence

- Final runtime: Node 24.21.0, npm 10.9.2; exact .nvmrc and package engines recorded.
  Node was installed only under `/private/tmp/iop-016-runtime` for validation;
  the user's default Node installation was not changed.
- `npm ci`: passed from the final root lockfile, 421 packages installed, 423
  packages audited, zero reported vulnerabilities. npm emits a transitive glob
  deprecation warning; no vulnerability is reported for the final dependency tree.
- `npm run typecheck`: passed, including test sources and decorator metadata types.
- `npm test`: passed after clean install, 3 suites / 24 tests (7.474 seconds).
  This command also compiled the API successfully. Tests verify real injected
  health handling, 404 for business/unknown-version routes and mutations, sanitized
  500/logging, artifact drift and response shape, 13 port configuration cases,
  compiled-process TCP health, SIGTERM/port release and both startup failure paths.
- `npm run openapi`: passed; generated OpenAPI 3.0.0 artifact is reviewed and the
  integration test verifies equality with generated metadata after clean install.
- Direct dependency license metadata and distributed license files inspected:
  MIT or Apache-2.0; reflect-metadata includes CopyrightNotice.txt and TypeScript
  includes ThirdPartyNoticeText.txt. Future packaging must retain applicable notices.
- Changed Markdown local links, mirrored Completed status, preserved Proposed
  ADR-0018 and `git diff --check` validated before commit.
- No persistence/RLS, browser, Docker, business authorization, full IOP-013 logging,
  complete IOP-022 error catalog, hooks or CI implementation claimed. These remain
  separate stories; completing IOP-016 does not complete POC increment 1.
- No new architecture boundary was introduced and no Proposed ADR was accepted.
  Source and transport files remain in the host; no domain module layout is chosen.

Primary implementation references checked: [Nest bootstrap](https://docs.nestjs.com/first-steps),
[Nest testing](https://docs.nestjs.com/fundamentals/testing),
[Nest OpenAPI](https://docs.nestjs.com/openapi/introduction) and
[Jest module compatibility](https://jestjs.io/docs/ecmascript-modules).
Version/peer/license metadata was checked against the official npm registry.

## Resumed commit closure — 2026-09-22

The previous staging request was rejected by automatic approval review because the
account usage limit was exhausted; no commit was created in that session. The owner
explicitly requested completion. Read-only review confirmed the same story branch
and expected pending files. The successful runtime validation above remains the
evidence for this unchanged implementation; tests were not rerun merely for commit
closure. The temporary Node runtime has since been removed, and the default local
Node version remains unchanged. All 223 local Markdown links, whitespace and the 27-file staged scope were checked
successfully. This execution record accompanies the authorized local commit. Publication of this new story branch
awaits separate owner authorization.
