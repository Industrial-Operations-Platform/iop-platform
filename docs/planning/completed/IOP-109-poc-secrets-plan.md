# IOP-109 — POC secrets hygiene

Status: Completed. Authorized by the owner's 2026-09-26 request to work on
[IOP-109](../items/IOP-109-secret-management.md) within the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-109-poc-secrets`, created from clean `develop` before edits.

## Changes and steps

1. Reuse integrated IOP-014 security requirements and IOP-018 configuration;
   reviewed both English dependency stories. No dependency translation needed.
   Translate the entire IOP-109 context to English and refine its selected POC slice.
2. Add a dependency-free local Git secret-hygiene check in `scripts/`, with Jest
   tests and root package commands. Check the index (including forced additions)
   for private configuration/key filenames, private-key material, credential URLs,
   populated secret fields in environment examples and secret-named Vite variables.
   Report locations/rule names only, never matching values. Fail on Git/read errors.
3. Extend `.gitignore` for local key files; keep Docker's build allowlist and add
   final private-file exclusions inside allowed source directories. No API, schema,
   identity, dependency, production vault, CI or hook architecture changes.
4. Document local credential handling, review commands, exposure response and
   scanner limits in `docs/development/secrets-poc.md`; link from configuration,
   container/testing guides and POC delivery. Synchronize item/backlog.

## Validation and evidence

- Exercise clean and rejected Git indexes in isolated temporary repositories,
  including forced ignored files, staged content differing from the worktree,
  synthetic credential findings and safe diagnostics. Use the existing Jest runner.
- Run the hygiene check on the final staged index, `npm test` (existing API startup,
  sanitized errors and database configuration/CLI coverage), and `npm run typecheck`.
- Review credential transport in Compose, examples, Docker inputs and browser
  sources; check ignore behavior, changed Markdown links, status consistency and
  `git diff --check`. The bounded scanner cannot certify arbitrary secrets or history.
- Record results here, move the finished plan to completed, and commit locally.
  Publication requires owner approval under the shared workflow.

## Results and closure

Validated on 2026-09-26 with Node 24.21.0/npm 10.9.2 from the existing temporary
runtime and installed dependencies; no lockfile or application runtime change.

- `npm test`: passed, 165 tests (9 hygiene, 79 API, 15 web, 62 database configuration),
  including builds and browser contract drift. `npm run typecheck`: passed.
- Initial sandbox run could not open test listeners (EPERM). The first permitted
  run had one unexpected existing health test response (401 rather than 200);
  a full repeat passed without code changes. The transient cause is unestablished.
- Bounded working-tree review found no findings. Final staged-index check and
  `git diff --cached --check` passed before commit. Changed Markdown targets resolve.
- `git check-ignore --no-index` confirms private root/nested environment files,
  local scope and key files are ignored; the environment/scope examples remain
  trackable. Reviewed Compose credential routing, Docker COPY/build allowlist and
  final exclusions, and browser source: no real credential was identified.
- Docker images, database integration and browser journeys were not rerun: no
  runtime/API/UI/database change. Docker exclusions were reviewed statically;
  generated artifacts, arbitrary secret formats and historical commits are not
  certified. The guide makes these limits explicit.

All selected POC criteria are met. The story was fully translated/refined in English;
English dependency stories required no edits. Item/backlog are Completed for this
slice and this plan is archived. No production secret service, history rewrite,
merge or publication is part of this delivery. Local commit follows validation;
owner approval is still required to merge/push.
