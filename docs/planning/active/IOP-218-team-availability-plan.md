# IOP-218 — Team availability execution plan

In progress. [Owner request and acceptance](../items/IOP-218-team-availability.md).
Branch: `feature/IOP-218-team-availability`, created from
`feature/IOP-217-admin-configuration-demos` at `f6e0400` after the owner explicitly
approved a dependent branch on 2026-10-20. Prior validated configuration and demo
commits remain intact. No merge or publication is authorized.

## Changes and steps

1. Workforce's existing board already owns scoped team memberships, availability
   and assignments. Add a framework-free browser projection of the actor's primary
   teams in `apps/web/src/features/workforce/domain/team-distribution.ts` and a
   shared-component React view in the Workforce adapter. Integrate it into
   `WorkforceWorkspace.tsx` without new endpoints, schemas, grants or access boundaries.
2. Show each member's dated status, all shift/zone/duty allocations and explicit
   missing/unassigned states. Keep membership independent of the leader's own
   duty and preserve site-wide authorized planning. Reuse existing labels,
   localization, compact controls and visual identity. Add focused projection/UI
   tests and desktop/narrow browser coverage.
3. Add bounded local absence-demo tooling and script tests under `scripts/local/`
   and `scripts/`, with a package command and operation guide. Use the four existing
   primary groups, future dates within 2026-10-19–2026-10-25, current Administrator
   application operations, optimistic revisions and a private retained manifest.
   Preflight and alter only identified synthetic schedule/duty records; retain
   assignment deletions/history before changing incompatible availability. Preserve
   the four formal transfers dated 2026-10-20 and all unrelated records.
4. Preview/apply/inspect twice, verify all four leaders and absent/working members,
   activate the local browser update, synchronize `docs/product/workforce.md` and
   relevant operation notes, complete the item/backlog and commit locally.

Accepted ADR-0032 and existing Workforce contracts apply; primary teams organize
visibility without narrowing another authorized leader's planning authority.
Read dependency stories 184/215/217 are English; no translations are needed.
The owner-approved dependency preserves IOP-217's configuration restrictions and
installed demonstration while keeping this request independently reviewable.

## Validation and evidence

Planned: own/other/multiple teams, absent leader, missing/absent/unassigned days,
multiple and overnight duties, deleted records, membership/name changes and role
navigation tests; shared design/architecture checks, web build/typecheck and
desktop/narrow rendering. Run script preservation, optimistic conflict and rerun
checks; use existing API tests for any server behavior touched. Inspect persisted
team/status counts, original record digest and unchanged formal transfers.

Passed: full web suite 42/42 suites and 245/245 tests; focused projection/UI/design
26 tests; API Workforce 14/14; web typecheck/build/design checks; desktop/narrow
Playwright 2/2 with inspected 1440px/390px screenshots; full script suite 61/61.
The rebuilt local web is healthy. Actual actor-owned projections were verified
for all four primary leaders and their five members each; the existing additional
Demo operations group remains visible to its configured leader.

Application added 12 availability revisions and 11 retained assignment tombstones
on 2026-10-21/22, preserving all four formal records and unrelated Workforce data.
Both the absence command and original weekly command repeat without changes;
all 25 users retain 175 daily records and all 128 working user-days are assigned.
The UI increment is ready for a local commit; tooling/closure follow separately.

## Closure

Record actual checks and limitations, move this plan to `completed/`, update the
item/backlog, commit validated changes and report hashes/tree status. Publication
still requires the owner's approval naming the story branch, develop and origin.
