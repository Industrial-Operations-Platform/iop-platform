# IOP-163 — Local refresh and publication

Status: Completed. The owner approved merging the story into develop, pushing
both branches to origin and updating the local application.
Branch: `feature/IOP-163-component-pareto`, originally from `develop`.
Scope: [item](../items/IOP-163-component-pareto.md).

## Steps and validation

- Inspect local/remote refs and the existing Compose services.
- Rebuild and restart only API/web, preserving database, volumes, configuration
  and imported history. Verify health and the served Pareto UI/report contract.
- Record evidence here and link this increment from the item. Move the plan to
  completed and commit documentation on the story branch.
- Merge the approved story into develop and push both branches to origin. Verify
  remote refs and a clean working tree. Do not promote stage/master.

## Evidence

- `git fetch origin` confirmed develop and origin/develop were identical before
  publication (`250163a`); the story includes implementation commit `5ccbeb6`.
- `docker compose -f compose.platform.yaml build api web` and
  `up -d --no-deps --wait api web` succeeded. API/web are healthy; the database
  container, volumes, configuration and imported history were retained.
- The live 8080 application serves bundle `index-DP5zGhSH.js`. Chromium verified
  both Pareto charts against real retained history, independent frequency/duration
  rankings, frequency-led period series while duration is selected, and May/July
  totals equal to the sum of the separate monthly reports. No browser errors.
- The initial browser probe caught an in-flight initial report; waiting for initial
  rendering and matching the selected-month response fixed the verification race.
- Live harness and screenshots are local evidence under `/private/tmp/iop-163-live*`.
  Reviewed the actual frequency Pareto screenshot. No application source change or
  package-version bump was needed; the owner requested the current build locally.
- Documentation links and `git diff --check` verified before the publication commit.
  The authorized merge/push and remote refs are verified after this documentation
  commit; their hashes are reported in the session rather than self-referencing here.
