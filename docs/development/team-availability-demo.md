# Local team availability demonstration

[IOP-218](../planning/items/IOP-218-team-availability.md) extends the existing
weekly exercise so each configured primary Team Leader can inspect workers,
availability and actual shift/zone distribution together in Workforce.

Run against the updated password-authenticated local Docker installation:

```sh
npm run local:team-availability-demo -- --preview
npm run local:team-availability-demo -- --apply
npm run local:team-availability-demo -- --inspect
```

Preview reads the existing four primary groups from the private
`.local-platform/config/workforce-groups.json` and requires the retained
`.local-platform/operational-demos-2026-10-19.json`. It freezes a private plan in
`.local-platform/team-availability-demo-2026-10-19.json`, without application
writes. Keep both manifests to inspect and resume the exercise; deleting a
manifest does not bypass an existing correction or revision conflict.

The bounded exercise changes **12 user-days** within **19–25 October 2026**.
Each group receives one vacation example and one sickness example on 21 October.
One additional day per group on 22 October demonstrates training, compensation,
accident or maintenance. Other days retain working and off examples. These are
fictional training states, including when an existing person's name appears;
they establish no actual medical or absence information.

Only two workers per group with exact, untouched IOP-217 synthetic days qualify.
Preparation verifies the original availability, assignment fingerprints and
Administrator-attributed first revisions. The Administrator removes eleven
incompatible synthetic assignments through Workforce's normal application,
retaining tombstones and history, then saves the corresponding availability.
Training keeps its scheduled hours; maintenance keeps its exact compatible duty.
Team memberships, levels, configuration, other duties and the four formal
transfers dated 20 October remain authoritative. No account or grant is created.

Each application call has its own transaction. An interruption can leave a
retained assignment deletion before the availability change; rerunning the same
manifest resumes that state. An edited day, membership, duty, retained history or
new Formal Handover binding is reported as `preserved` and receives no further
demo writes. Other eligible frozen rows can complete. Optimistic revisions and a
fresh check between deletion and availability save protect concurrent edits.
Completed unchanged rows are a no-op on repeat.

Inspection reports the twelve intended states, completed/pending/preserved rows,
team membership counts and digest comparisons for unrelated Workforce records,
their revisions, and all Formal Handover records/history. Concurrent unrelated
activity can change those comparisons and is reported for inspection. The
original operational-demo repeat also preserves the retained days and assignment
tombstones rather than recreating duties.

Validate runner preservation, interruption and revision handling with
`npm run test:secrets -- --testPathPatterns=team-availability-demo`.
