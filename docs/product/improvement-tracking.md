# Improvement Tracking

Administrator, Team Leader and Task Force manage site improvement actions. All
three receive explicit read/contribute/coordinate grants; every operation also
checks the current profile. Technician access is denied even if an erroneous
Tracking grant exists. Owner selection contains active eligible people with an
active Tracking grant. No provider group or UI role preview confers authority.

## Actions and evidence

An action records a title, hypothesis/context, configured location, optional exact
registered asset/Handover issue links, owner, due date and objective. A quantitative
target optionally names reported frequency or accumulated alarm seconds and an
expected percentage reduction per observed reporting date. Source modules validate
references under their own current permissions; linking does not alter their records.

Actions start Planned, proceed through In progress and Implemented to Evaluated,
and may be Blocked or Cancelled with a reason. Implemented/Evaluated require an
implementation date; Evaluated requires an observed result. The server rejects
skipped transitions, requires reasons for edits and retains immutable attributed
revisions. Cancellation can reopen to Planned; evaluation can reopen to investigation.

Notes/results are append-only. A correction explicitly supersedes earlier evidence
without deleting its text or authorship; one correction can supersede each entry.
External evidence references are text, not retrieved or trusted remote content.
Binary attachments remain outside this delivery. Concurrent changes require the
current action revision. Client-generated request IDs support recovery from an
uncertain acknowledgement without silently duplicating evidence.

## Observed before/after comparisons

OIP computes both non-overlapping periods in one authorized database statement.
Periods have inclusive starts, exclusive ends and a maximum of 366 days each.
Selection uses either exact source-specific aliases of the linked asset or at
least one explicit source filter. Asset identity is never inferred from an
equipment code. The same selection and reporting profile apply to both periods.

Results include exact frequency/alarm-second totals, matching-record counts,
eligible/admitted/missing/excluded dates and averages per admitted reporting date.
Missing imports remain missing; absent periods and unmapped assets have unavailable
averages. A zero baseline has no percentage reduction. Unequal eligible date counts,
weekday distributions, missing coverage, unmapped aliases or absent matches prevent
assessment of the numeric target. Measures and warnings remain visible separately.

A saved comparison is recomputed on the server and retained with its exact aliases/
filters, profile/publication revision, objective, actor, timestamp and action revision.
Later imports, profile changes or asset alias corrections cannot rewrite that evidence.
The preview may differ from the subsequently saved snapshot if source data changes.

Reporting windows and production exposure are unknown. Accumulated alarm seconds
are not plant downtime. An observed reduction does not establish that the action
caused it. Actual intervention dates, production context and supporting evidence
must be entered/verified by the operating team.

Ownership and delivery are recorded in [ADR-0037](../architecture/adr/ADR-0037-operational-completion.md)
and [IOP-205](../planning/items/IOP-205-improvement-tracking.md).
