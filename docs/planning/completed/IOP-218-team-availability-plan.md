# IOP-218 — Team availability execution record

Completed on 2026-10-20 under the [owner request](../items/IOP-218-team-availability.md).
Branch: `feature/IOP-218-team-availability`, created from
`feature/IOP-217-admin-configuration-demos` at `f6e0400` after explicit owner
approval for a dependent branch. No branch merge or publication occurred.
UI increment: `56edaf4`; demonstration tooling and closure form the next local commit.

## Delivered changes

Workforce's existing scoped board supplies primary groups, current people,
availability and assignments. The framework-free `team-distribution.ts` projection
and shared-component `MyTeam.tsx` view organize the current actor's groups into a
seven-day table, independently of their own duty. It shows current names,
qualifications, status, hours and every allocation, including split and overnight
duties. Missing schedules, planned absence, training and unassigned work remain
distinct. Retired labels remain available. Multiple actor-owned groups are retained.

The additional **My team** tab preserves the broader Weekly plan and current
planning/configuration permissions. There is no API, schema or grant change.
English/German labels, bounded horizontal scrolling, sticky names and distinct
allocation labels reuse the shared identity. Product and operation guides agree.

[Local demonstration tooling](../../development/team-availability-demo.md) reads
the four existing primary groups and the original IOP-217 private manifest. It
freezes twelve exact, unchanged synthetic availability rows before writing, checks
history/membership/Formal bindings and uses existing Administrator application
operations. Incompatible owned assignments receive retained logical deletions;
availability saves use current revisions. Interrupted sequences can resume, while
subsequent user corrections remain preserved. Each application call retains its
existing transaction; no combined atomic absence operation is claimed.

Accepted ADR-0032 and existing Workforce contracts apply. Primary groups organize
visibility without narrowing another authorized leader's site planning authority.
Read dependency stories 184/215/217 were English; no translations were necessary.

## Validation

- Full web suite: 42 suites, 245 tests passed. Focused projection/UI/design checks:
  26 tests passed. API Workforce regression: 14 tests passed.
- Web typecheck/build and design/architecture guards passed. The updated Docker
  web image built and became healthy; the existing API/database were preserved.
- Playwright: 2/2 tests passed at 1440px/390px. Screenshots were inspected for full
  rows, contained scrolling, sticky names, unknown/absence states, multiple teams
  and split/overnight allocation details. Local listener execution required sandbox
  escalation; no test assertions or timeouts were relaxed.
- Full script suite: 8 suites, 61 tests passed, including 24 new ownership,
  malformed-manifest, history, conflict, interruption and repeat checks.
- Actual actor-owned projections passed for Mike, Burak, Kilian and Thomas, with
  five members and seven dated cells per member in each primary group. Their
  planning flags remain true and configuration flags false. Burak's additional
  existing Demo operations group remains visible under its configured ownership.
- Git whitespace, indexed secret hygiene and relative-documentation checks passed.

## Persisted demonstration

All four primary groups have one Vacation and one Sick leave example on 2026-10-21.
On 2026-10-22, Mike's group has Training, Burak's Compensation, Kilian's Accident
and Thomas's Maintenance. These are synthetic planning examples, not medical or
attendance facts. Existing work/off days, membership and qualifications remain intact.

Application wrote 12 availability revisions and 11 retained assignment tombstones;
the compatible Maintenance allocation remains. Inspection confirms unchanged
unrelated Workforce records/revisions and all four Formal Handover records/history.
The formal transfers remain bound to 2026-10-20; no users or credentials changed.

Repeated absence apply changed zero schedules and removed zero assignments, with
all 12 scenarios complete. Repeating the original IOP-217 weekly command also made
zero changes and preserved every absence/tombstone, all Improvement scenarios and
formal records. All 25 users retain 175 daily records; all 128 working user-days
have assignments. Training hours remain separate from operational duty coverage.
Private manifests and verification snapshots remain outside Git.
