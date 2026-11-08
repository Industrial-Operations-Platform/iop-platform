# Railway and Docker: deployment and updates

The local installation keeps its separate containers. Railway uses **two
services**: `iop` serves React and the API from the same origin; `database` runs
PostgreSQL 17.6 on the private network. Each installation has independent data
and credentials. A code update never imports the data again.

The current Railway installation is **development**, deployed from `develop` to
project `IOP-development`, environment `development`. It contains evaluation data
and is not the final application or an exact representation of real-world data.
There is no production installation. When needed, production will be created in
a **separate Railway workspace**, with its own project, data, secrets and deployment
workflow; the current environment will remain development.

## Common commands

Run these commands from the repository root. In PowerShell with scripts disabled,
use `npm.cmd` instead of `npm`.

| Command | Result |
| --- | --- |
| `npm run local:up` | Builds and starts local Docker; preserves its data |
| `npm run local:update` | Rebuilds the current code and applies migrations without deleting volumes |
| `npm run local:sync` | Requires a clean Git tree, runs `git pull --ff-only`, and updates Docker |
| `npm run local:stop` | Stops Docker without deleting data |
| `npm run local:status` | Checks the containers |
| `npm run railway:deploy` | Validates and publishes the current commit to Railway; verifies the revision served over HTTPS |
| `npm run railway:check` | Checks HTTPS, the web app, authentication, and rejection of anonymous access |

`local:update` builds the images before stopping the previous version. If the
build fails, the existing application keeps running. A later migration error
requires investigating the failure and running the update again; the command
preserves data and does not automatically roll back migrations. Local services
restart when Docker restarts, unless explicitly stopped.

## Review interface changes before deployment

For changes limited to React/CSS, update only the local web service:

```sh
docker compose -f compose.platform.yaml build web
docker compose -f compose.platform.yaml up -d --no-deps --wait web
```

This preserves the API, PostgreSQL, and their volumes. Review the result at
`http://127.0.0.1:8080` before publishing the commit with `npm run railway:deploy`.
The navigation toggle sits beside the logo; every new session starts with the
navigation open. Charts resize automatically when the navigation is hidden.
Monthly averages follow their series colors and axis sides. Each KPI has its own
details icon, which opens a small floating panel without resizing the dashboard.

For API behavior changes without a database migration, build and update both
application services while leaving PostgreSQL and its volume running:

```sh
docker compose -f compose.platform.yaml build api web
docker compose -f compose.platform.yaml up -d --no-deps --wait api web
```

Monthly KPI references and persistent exclusions require the updated API as well
as the web app. Exclusions use the existing versioned reporting profile; no schema
migration is required. See [analysis settings](../product/analysis-settings.md) for
the historical reference formula and the administration path.

Railway may contain imported months that do not exist locally. Before the next
deployment, export the **current remote database** with `pg_dump` over SSH and
verify that the backup contains those months. The initial local snapshot does
not include them. An interface update does not require importing data, changing
variables, or recreating services or volumes. Do not run `railway:import-initial`
or restore a local backup over Railway development to update the interface.

## Initial Railway setup

Requirements: a Railway account on Hobby, Node 24.21.0, npm 10.9.2, Git, and a
working Docker Desktop installation to export the local installation and run
full validation. `npm ci` installs the official CLI **5.71.0**, pinned in the
lockfile. A global installation is unnecessary. Sign in interactively:

```sh
npm run railway -- login
```

Create the `IOP-development` project and a `development` environment with the following resources.
If Railway creates a default `production` environment, rename that environment
to `development` before configuring the services; do not keep a second environment.
Use the dashboard or Railway integration; **do not connect GitHub yet**.

| Resource | Initial configuration |
| --- | --- |
| `database` service | Image `postgres:17.6-bookworm`, without a public domain or TCP proxy |
| `database` volume | Mounted at `/var/lib/postgresql/data`; preserve it between deployments |
| Empty `iop` service | Repository root; configuration `.railway/railway.ts` |
| `iop` volume | Named **`iop-data`**, mounted at **`/data`** |
| `iop` domain | Use an HTTPS `iop-development-*.up.railway.app` domain; no domain purchase is required |
| Replicas | One, in the same European region as the database |

Do not start PostgreSQL with default credentials before configuring its variables.
If it was already initialized with a different user/database, create a new
installation: changing variables on a populated volume will not reinitialize it.
This application requires the owner `iop_bootstrap`, database `iop_local`, and
separate roles `iop_migrator` and `iop_runtime`.

Copy the project, environment, and service identifiers. Generate the variables
from the current local configuration:

```sh
npm run build
npm run railway:configure -- --project PROJECT_ID --environment ENVIRONMENT_ID --service APP_SERVICE_ID --database-service DATABASE_SERVICE_ID --origin https://YOUR-APP.up.railway.app
npm run railway:variables
npm run railway -- link --project PROJECT_ID --environment ENVIRONMENT_ID --service APP_SERVICE_ID
npm run railway -- config plan
npm run railway -- config apply --yes
```

Private values are stored in `.railway/`, excluded from Git and code uploads.
Only its IaC configuration and README are versioned. This format replaces
`railway.json`, scheduled for retirement by Railway on 2026-12-01. Variables
remain outside IaC management to preserve their secrets. The generator copies
scope, users, mappings, and Handover; it replaces only the local origins with the
HTTPS domain. It generates three new passwords for Railway and preserves those
same passwords when configuration is repeated. The
`${{database.RAILWAY_PRIVATE_DOMAIN}}` reference assumes the service is named
**database**. Variables are sent through stdin and do not appear in command
arguments or output. The additional local `workforce-groups.json` file, if present,
is preserved in the private configuration copy; it is not an API runtime input.

Start the `database` service after configuring the variables and wait for
PostgreSQL to become ready. Keep `iop` undeployed until the copy is complete.

## Copy the current data once

With local Docker running, take a current snapshot; do not use an old copy from
the repository or `transfer-staging`:

```sh
npm run railway:snapshot
```

A consistent `pg_dump` of the current database, private Locator references, and
configuration are saved in `.railway/initial-snapshot/`. This directory contains
sensitive data and destination provisioning passwords; keep it private.
On Windows, protect the directory with the user's account permissions; POSIX
`0600` modes do not replace NTFS permissions.

Register the SSH key through an initial interactive connection to the `database`
service, using the project and environment identifiers, if Railway requests it:

```sh
npm run railway -- ssh --project PROJECT_ID --environment ENVIRONMENT_ID --service DATABASE_SERVICE_ID -- true
npm run railway:import-initial
npm run railway:verify-data
```

The import requires a **new, empty database**, without existing application roles,
and refuses to run again. It creates roles with independent passwords and restores
the schema, data, ownership, and permissions in a single transaction. It does not
delete tables or modify the local volume. It preserves users and their passwords;
copied sessions are revoked to require a new login. If it fails, investigate the
error before retrying; do not remove the empty-destination check.

Verification compares table row counts with the initial copy without printing
business records. Run it immediately after importing.

After the first deployment, with `iop` active, run `npm run railway:references`.
It checks that `/data/locator` is empty, copies files using encrypted SCP, and
applies private Node permissions. It requires OpenSSH and a registered key:
store its path in `sshIdentity` in `.railway/target.json`, or supply
`IOP_RAILWAY_SSH_IDENTITY`. It refuses to overwrite existing references. Normal
updates preserve the volume and do not repeat this transfer.

## First and subsequent deployments

Commit reviewed changes on `develop` before deployment. The command rejects other
branches and checks that the selected remote environment is named `development`.
The command uploads an explicit list of sources and resources; it never uploads `.local-platform`, `.railway`,
credential files, backups, or the entire working directory.

```sh
npm run railway:deploy
```

The first run uses the target saved by `railway:configure`. Before uploading, the
command requires a clean Git tree, rejects high or critical runtime dependency
advisories through `npm audit`, and runs `npm run test:poc` (including PostgreSQL
and browser checks with Docker). Explicit identifiers can be supplied through
`RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_SERVICE_ID`,
`RAILWAY_DATABASE_SERVICE_ID`, and `IOP_PUBLIC_ORIGIN`.

Railway builds the combined image using the lockfile. The pre-deployment step
applies forward migrations and checks provisioning without starting another
application runtime. A failure prevents that release from becoming active. The
application uses non-owner credentials, `Secure`/`HttpOnly`/`SameSite=Strict`
cookies, an exact domain, origin checks, and a CSRF header. Local mode remains
limited to loopback; the demo selector cannot be enabled on Railway.

The service retains migration secrets for the pre-deployment step; the launcher
removes them from the API process environment. This separates connection roles,
but does not isolate those secrets from an operator who controls the Railway
container. The application and database communicate over Railway's private
network; a public database URL is not accepted, and TLS validation for an external
service is not disabled.

The application volume is mandatory: Railway stops the previous instance before
mounting it on the next one. This respects IOP's single-process lock, with a brief
interruption during updates. Do not enable replicas. The launcher adjusts volume
ownership and runs Node as a non-root user.

The command checks `/health`, the web app, the anonymous context, and rejection
of unauthenticated `/users` access. It also waits for `build-revision.json` to
match the uploaded commit, avoiding confusion between a healthy previous version
and the new deployment. `/health` remains a process health check: it does not
replace an authenticated functional test or a backup recovery test.

To return to the code from an earlier revision, revert the relevant changes on
`develop`, commit the reviewed result, and run the same deployment command after
checking compatibility with the current schema. Do not restore the initial snapshot
or automatically reverse migrations: either action could lose evaluator changes. Railway retains deployment
versions for diagnostics, but reverting application code does not reverse
PostgreSQL migrations either.

After deployment, sign in with the copied accounts and test a query and an allowed
write operation for each profile. Create individual accounts for both evaluators
through administration. If an empty installation was chosen, issue initial access
only through an interactive SSH terminal:

```sh
npm run railway -- ssh --project PROJECT_ID --environment ENVIRONMENT_ID --service APP_SERVICE_ID -- node scripts/railway/admin.cjs
```

Do not issue passwords during deployment or through GitHub Actions.

## Personal usernames in local and Railway development

Personal accounts use the first given name and first surname without a separator,
for example `Alex Rivera Torres` becomes `alexrivera`. Login is case-insensitive:
`AlexRivera` and `alexrivera` resolve to the same account. Storage remains lowercase.
German umlauts use `ae`, `oe`, `ue`, and `ss`; other supported accents are removed.
The generic `admin` account keeps its existing login because it has no personal name.

On 2026-11-08, 16 existing accounts were renamed in each installation. Passwords,
credential versions, user IDs, profiles, permissions and existing sessions were
preserved. Old usernames are no longer login aliases. Changing a display name
later does not automatically change the login. Use this naming convention when
creating new personal accounts; resolve duplicate names explicitly.

The operator command previews all changes and refuses username collisions. It
requires Docker locally and the configured private SSH target for Railway
development. Apply saves the previous mapping privately, executes a rollback
trial, then commits the transaction and verifies credential preservation. Each
change appends an operator event to the existing access audit.

```sh
npm run users:rename -- local --preview
npm run users:rename -- railway --preview
npm run users:rename -- local --apply
npm run users:rename -- railway --apply
```

Private plans and verification records are stored under
`.local-platform/username-changes/` and `.railway/username-changes/`. Repeating
the command with the same account names produces no changes. The old workforce
fixture command creates synthetic `m6.*` accounts; do not rerun it on an
installation whose accounts have been personalized.

## Automatic updates from GitHub

The **Platform validation** workflow first classifies the complete changed-file
range using Git, including every commit in a push and both sides of renames.
Documentation-only updates run this lightweight check without installing
dependencies, running the full suite, building images or deploying. The workflow
still reports a result for required checks. Commit subjects such as `feat`, `fix`,
`refactor` or `docs` do not control publication; changed application inputs do.

| Change | Full validation | Automatic Railway deployment |
| --- | --- | --- |
| Documentation, Markdown or documentation images only | No | No |
| Tests, GitHub workflows or operator tooling only | Yes | No |
| Shipped application sources/assets, dependencies, migrations or Railway build/deployment configuration | Yes | On `develop`, after validation, when enabled |
| Mixed code and documentation | Yes | Same rule as application changes |

Full validation checks the code, PostgreSQL, browser, and
builds of all four Docker images. It also starts the Railway image against a
synthetic database and checks login, HTTPS, cookies, and non-root execution.
It can then publish that same SHA; the deployment job never receives code from a
pull request. Development deployments are serialized to prevent overlapping
migrations.

Create the GitHub environment `railway-development` with the target variables below.
Store the development-scoped Railway project token as the Actions secret
`RAILWAY_TOKEN` in the repository or this environment. The current installation uses
the repository secret created manually by the owner; the deployment job reads it
through `secrets.RAILWAY_TOKEN` and checks that it is present before installing
deployment tooling. Its value is never printed. An environment secret with the
same name takes precedence, so avoid an outdated duplicate.
Project-token deployment inspects the explicit project and environment directly;
it skips `railway link`, which enumerates user workspaces. Local interactive CLI
sessions keep the linking step. Both paths retain the development-target check.

| Type | Name | Value |
| --- | --- | --- |
| Variable | `RAILWAY_PROJECT_ID` | Project identifier |
| Variable | `RAILWAY_ENVIRONMENT_ID` | `development` identifier |
| Variable | `RAILWAY_SERVICE_ID` | `iop` service identifier |
| Variable | `RAILWAY_DATABASE_SERVICE_ID` | `database` service identifier |
| Variable | `IOP_PUBLIC_ORIGIN` | Exact HTTPS origin |

Create this as a **repository variable**, so the job condition can read it
before entering the environment:

| Variable | Value |
| --- | --- |
| `RAILWAY_AUTO_DEPLOY` | `true` to deploy changed application inputs automatically after validation |

The deployment branch is fixed to `develop`; `main` does not deploy to Railway.
**Run workflow** validates by default. On `develop`, explicitly select **Deploy
the validated develop revision to Railway** to deploy manually, including a
revision without new application changes. A pull request, tag or story branch
never deploys. Missing or unreadable Git revisions fail the classification job
and prevent deployment.
Keep Railway's direct GitHub auto-deployment disabled: the workflow
deploys after validation. This avoids competing deployment paths or deployment
before tests. On Windows, four POSIX permission/ownership tests are explicitly
skipped; Linux CI runs them all, including symlink checks that require privileges
on Windows. A fifth restore test involving POSIX permissions also runs only on
Linux.

## Cost, backups, and the end of the evaluation

Use Hobby, two services, one region, and one replica. The API limits Node's heap
to 384 MiB as a starting point; measure RSS and actual consumption after loading
data. On Railway, initially allocate 0.5 CPU/0.75 GB to `iop` and 0.5 CPU/0.5 GB
to PostgreSQL, then review memory after an import. These settings limit resources;
they do not guarantee a US$20 bill.

In the **workspace dedicated to this evaluation**, configure a US$15 alert and
US$20 hard usage limit; reaching the hard limit stops the services. The limit
applies to the workspace, not just this project. Do not apply it to a workspace
with other projects without reviewing the impact. With the dedicated workspace's
identifier:

```sh
npm run railway -- usage limit set --workspace WORKSPACE_ID --target workspace --soft 15 --hard 20
```

The limit applies to usage; review taxes and any additional charges on the billing
page. Do not enable Railway Agent for this automation. In this account, the API
for manual and scheduled native volume backups rejects Hobby and requires Pro.
Those backups were not enabled, and the account was not upgraded to Pro.

The private initial snapshot is retained locally, but does not contain later
evaluator changes. To retain those changes at the end, export PostgreSQL with
`pg_dump` over SSH and copy `/data/locator` together with the private configuration;
verify restoration in a separate environment. The IaC configuration manages
resource limits and 5 GB volumes. Each volume's location must match Railway
exactly: do not accept a location change as part of an expansion. Usage limits
require an active paid subscription.

At the end of the evaluation, export the data, retain the private configuration,
and cancel resources that are no longer needed. Do not delete volumes before
verifying the backup. The repository does not schedule automatic deletion of the
environment after one month.

## Sources and verification status

- [Railway infrastructure as code](https://docs.railway.com/infrastructure-as-code)
- [Pre-deployment migrations](https://docs.railway.com/deployments/pre-deploy-command)
- [Volumes and deployment restrictions](https://docs.railway.com/volumes/reference)
- [Usage controls](https://docs.railway.com/pricing/cost-control)
- [GitHub workflow triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Railway GitHub autodeploy controls](https://docs.railway.com/deployments/github-autodeploys)
- [Railway project tokens for CLI deployment](https://docs.railway.com/cli/deploying)
- [GitHub Actions secret precedence](https://docs.github.com/en/actions/reference/security/secrets)

The first real deployment was verified on 2026-11-06 on Railway Hobby.
On 2026-11-08, the existing project and environment were renamed
to `IOP-development` and `development`; the application origin is
`https://iop-development-9fb7.up.railway.app`. Services and data volumes were preserved.
The local database was imported and row counts were
compared across all 62 tables. Seventy-five Locator files were transferred, and
their SHA-256 hashes and private Node permissions were verified. The web app and
API respond over HTTPS, anonymous user access is rejected, and the published
revision matches the uploaded commit. A US$15 usage alert and US$20 hard limit
were configured.

`NODE_ENV=production` remains the optimized Node runtime setting in the container;
it does not name the Railway environment or create a production installation.

The local and deployment commands are operational. The GitHub `railway-development`
environment and its five target variables are configured and restricted to develop.
The owner resumed automatic deployment activation on 2026-11-08 after creating
the repository Actions secret `RAILWAY_TOKEN`. The workflow already passes that
secret to the CLI. The repository variable `RAILWAY_AUTO_DEPLOY=true` is configured;
changed application inputs now qualify for publication after successful validation
on develop. The owner explicitly approved the current remote database backup;
it was exported privately and verified before the first workflow deployment.
The [activation execution record](../planning/active/IOP-225-selective-railway-deployments-plan.md)
tracks deployment verification. Do not paste the token into chat or Git.
Remote recovery and evaluator functional acceptance have not been verified. Windows
validation skips POSIX-specific tests; the prepared Linux job runs them.
