# Local POC secrets hygiene

[IOP-109](../planning/items/IOP-109-secret-management.md) applies the
[security baseline](../architecture/security-baseline-poc.md) to the delivered
local configuration and database tooling. This is a single-operator POC control,
not certification of the repository's history or a production secrets service.

## Local handling

- Keep generated, unique local database passwords in ignored `.env` or the explicit
  operator environment. Follow [container startup](../../infra/docker/README.md)
  and [database tooling](../../infra/database/README.md). Native npm commands do
  not load `.env`. Restrict private files to the operator (`chmod 600`).
- Keep bootstrap, migrator and runtime passwords separate. Only the database and
  explicit tooling services receive the credentials they need; the current API
  and frontend receive none. Do not reuse production credentials for this demo.
- Commit empty credential fields in `.env.example`; local scope belongs in
  `config/*.local.json`, with fictional identifiers in the tracked example.
  Never put credentials in browser variables, assets, source, Docker build arguments
  or image layers. Docker's allowlist also excludes private files under source paths.
- Treat resolved Compose configuration, process environments, shell history and
  diagnostic captures as private. Validate Compose with `config --quiet` and do not
  paste credentials into commands, logs, screenshots or review comments. Existing
  API/database errors deliberately omit raw configuration and driver diagnostics.

## Review before every commit

```sh
npm run test:secrets
# Stage only the intended files, then inspect the exact proposed content locally.
git diff --cached --check
npm run check:secrets
```

Review the staged diff privately as well. `check:secrets` reads every indexed Git
blob, not the current worktree or ignored local files. It rejects private environment,
local configuration and key filenames, PEM private-key headers, credential-bearing
URLs, populated secret fields in environment examples and secret-named Vite variables.
It catches forced additions of ignored files and returns nonzero on findings or
inspection errors. Output contains only escaped filenames and rule names, never
matched content. Do not put sensitive values in filenames either.

This is a bounded, dependency-free guard for the current POC. It does not recognize
all token formats, arbitrary hard-coded passwords, encoded values, production data,
untracked files, generated bundles or past commits. There are no content exceptions
or bypass flags; construct synthetic test markers at runtime. It is an explicit
local command, not an installed hook or CI gate. `npm test` runs its regression tests;
run the index check again after staging changes. A passing check supplements review,
not a claim that no possible secret exists.

## Accidental exposure

If a real credential is staged, remove it from the index before committing and
keep the private file ignored. If committed or shared, treat it as exposed: revoke
or rotate it at its source, then coordinate removal from affected artifacts and
history with the owner. Adding an ignore rule or deleting the latest copy does not
remove earlier copies. History rewriting and publication require explicit approval.
For PostgreSQL, editing `.env` does not change an existing role password; reconcile
credentials with the existing database rather than deleting its volume.

External integrations, hosted secret managers, automated rotation, history rewriting,
production recovery and shared-user deployment remain outside this POC slice.
