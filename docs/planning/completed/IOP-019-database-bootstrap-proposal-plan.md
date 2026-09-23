# IOP-019 — Migration proposal preparation record

Source: [permanent item](../items/IOP-019-database-bootstrap.md).
Execution was planned before edits in the
[active implementation plan](../active/IOP-019-database-bootstrap-plan.md).

## Status and authorization

Completed documentation increment on 2026-09-23 under the owner's IOP-019 POC
request. Branch: `docs/IOP-019-database-bootstrap`, created from clean develop.
The parent remains Blocked on acceptance of Proposed ADR-0019. Its implementation
plan remains active; this record does not archive unfinished work.

## Scope, files and steps

Reviewed the POC scope/delivery map, architecture, referenced ADRs, dependencies,
current Compose and configuration. Prepared Proposed ADR-0019, refined the permanent
item in English and mirrored Blocked status in backlog. No scope-document changes
were necessary. No executable file, dependency, database or adjacent item changed.

The proposal defines node-pg-migrate without an ORM, separate bootstrap/migrator/
runtime roles, migration lifecycle and concrete fresh/rerun/failure/concurrency/
privilege scenarios. ADR-0018 remains Proposed and does not gate infrastructure.

## Validation and evidence

- Dependency inspection confirmed IOP-002/005 design and completed IOP-018 local
  configuration are present on develop; migrations remain unimplemented.
- Official node-pg-migrate/PostgreSQL documentation was consulted and linked in the
  proposal. The live migration docs show an alpha version; stable version selection
  and behavioral verification are explicitly left to accepted implementation.
- Local Markdown link checks for all five changed/new documents passed.
- IDs and statuses checked: IOP-019 item/backlog are Blocked; ADR-0019 and ADR-0018
  remain Proposed. Active implementation plan retains unchecked runtime criteria.
- `git diff --check` passed; changed-file review confirms documentation-only scope.
- Runtime tests, including `npm test`, were not run: no executable changes were made.
  Database reproducibility and runtime privileges remain unverified.

## Completion checklist

- [x] Concrete proposal, dependencies and validation scenarios documented.
- [x] Documentation links, IDs, status parity and whitespace checked.
- [x] Completed increment recorded separately; parent and implementation plan stay open.

## Deviations and next step

Initial branch creation encountered a sandbox restriction; approved escalation
created the branch before file edits. No scope expansion, merge, rebase or push.
Owner acceptance of ADR-0019 is the next required decision under AGENTS.md rule 5.
After acceptance, refine exact implementation files/commands in the active plan
before code changes. No additional decision about login is requested for this slice.
