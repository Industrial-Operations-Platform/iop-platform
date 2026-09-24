# IOP-025 — Organization proposal preparation record

Source: [permanent item](../items/IOP-025-organization-model.md).
Execution was planned before content edits in the
[implementation plan, now completed](IOP-025-organization-model-plan.md).

## Status and authorization

Completed documentation increment on 2026-09-24 under the owner's IOP-025 POC
request. Branch: `docs/IOP-025-organization-model`, created from clean develop.
Parent and implementation plan remain Blocked on acceptance of Proposed ADR-0020.

## Scope, files and steps

Reviewed AGENTS.md, architecture, POC scope/delivery, dependencies, relevant ADRs,
module/data/glossary contracts and existing configuration/database tooling. Created
the story branch and active plan before content changes. Prepared ADR-0020,
rewrote the in-scope permanent item in English and mirrored its status in backlog.
These five documentation files are the complete increment; no executable files,
dependencies, operator data or other story changed.

The proposal defines the organization table, stable existing text-ID contract,
explicit privileged local initial seed, insert-only repeat/conflict behavior,
forced RLS and denied runtime access. It proposes a bounded bootstrap exception
instead of assuming that ordinary permission requirements disappear before users
exist. IOP-026/123 remain separate, and ADR-0018 remains Proposed.

## Validation and evidence

- IOP-004/005 completed design and IOP-019 implementation are present on develop.
  No prerequisite merge was performed or required for this increment.
- Official PostgreSQL 17 RLS and SET documentation reviewed and linked in ADR-0020.
- Local Markdown targets in all five changed/new documents checked; IDs, item/backlog
  Blocked status and ADR-0018/0020 Proposed status checked for consistency.
- `git diff --check` passed; changed-file review confirmed documentation-only scope.
- Runtime tests, including `npm test`, were not run because no executable change
  was made. All migration/seed/security scenarios remain unexecuted requirements.

## Completion checklist

- [x] POC proposal, prerequisite review, expected files and validation mapped.
- [x] Documentation links, status parity, IDs and whitespace checked.
- [x] Completed documentation increment recorded separately from blocked implementation.

## Deviations and next step

Branch creation required sandbox escalation and then succeeded before edits.
No scope expansion, merge, rebase, deployment or push. AGENTS.md rule 5 requires
acceptance of the new seed authority before dependent code/DDL. Owner review of
ADR-0020 is the next input; no approval of login or adjacent stories is requested.


## Subsequent acceptance and implementation

On 2026-09-24 the owner accepted ADR-0020 and authorized this branch's push to
origin. The [completed implementation plan](IOP-025-organization-model-plan.md)
records the delivered POC slice and tests. Blocked/Proposed descriptions above
preserve the earlier increment; the current parent is Deferred for future scope.
