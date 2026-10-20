# Formal shift Handover

[IOP-204](../planning/items/IOP-204-formal-handover.md) extends the journal under
[ADR-0037](../architecture/adr/ADR-0037-operational-completion.md). Administrator,
Team Leader and Task Force require an active `handover.records.manage` grant and
current advanced profile for every formal read and write. The ordinary Technician
journal retains its existing permissions.

Open **Shift Handover**, then **Shift records** in the shared Handover view
navigation. Journal, Meeting preparation/Daily overview and Department matrix stay
available there; the sidebar has one Shift Handover entry. Exact links from Area
overview open the selected formal record with Shift records active. **Open current
journal report** returns to the original report identity. Journal issues reflect
current state; closed transfers retain immutable evidence and incoming receiving
acknowledgements. Closing a transfer never resolves its carried journal issues.

## Transfer workflow

1. Plan actual zone assignments in Workforce. Formal shift choices group exact
   date, shift type, target and resolved UTC start/end values; a customized partial
   assignment is a separate interval. Floating or unassigned work creates no
   location-specific shift. Empty planning displays the prerequisite explicitly.
2. Select a department, optional area and date period. Create one draft per exact
   source shift/location, add a title/summary and select relevant reports. The
   selection includes that day's reports and earlier pending issues.
3. Save and review report snapshots, then publish. Corrections require a reason
   and the current record revision. A changed selected report requires reviewing
   and saving the transfer again before publication or closure.
4. Close an open record with a recorded outcome. Selected and pending report
   snapshots retain their revisions, authors, content, source equipment identifiers
   and explicit registered-asset links. Closing leaves journal issues unchanged.
5. A different incoming manager acknowledges receipt with a note. The acknowledgement
   appends attributed history; it never overwrites the closed transfer. Each manager
   can acknowledge once. Closed records cannot be edited or reopened.

Opening retained evidence shows the frozen report revision. **Open current journal
report** separately navigates to current issue history. Bitmap attachments stay
in the original journal revisions and are not duplicated in transfer evidence.
Date/time presentation uses the configured site time zone; dates supplied without
an observation time remain dates.

## Previous shift and bounds

Previous-shift lookup considers real zone assignments at the same configured
location over 92 days and orders their UTC start instants. An overnight predecessor
can originate on an earlier date. Overlapping shifts remain explicit. A missing
predecessor and a predecessor without a formal record have different empty states.
Current pending reports through the selected shift date appear separately from
closed historical evidence.

Records page in groups of 20; revision history pages contain 25. A record selects
at most 100 reports. Candidate/current-pending views show at most 100 entries with
exact full counts. Closure rejects more than 100 pending reports before committing;
narrow the record area rather than retaining a partial snapshot as complete.
The persistence adapter bounds complete snapshots to 2 MiB and uses forced RLS,
explicit organization/site predicates, narrow grants and no runtime delete authority.
Projection and attributed revision writes share one authorized pinned transaction.

## Explicit canonical assets

Authorized operational users can optionally select a compact registered identity
through a receiving-owned reference port while creating or correcting a journal
entry. The server checks current reference authority and exact
scope/location; absent, foreign or newly retired references fail. The entry retains
a server-produced identity snapshot and its original unverified equipment tuple
independently. An unchanged historical identity remains retained after retirement.
Administrator's Digital Asset Record history finds explicit links even when the
asset has no aliases. Team Leader and Task Force use these identities in read-only
Locator; the compact port does not grant standalone registry/model access.

## Composition

The host constructs `composeFormalHandover(pool, scope, locations, timeZone)`, registers
`FormalHandoverController`, injects authorized Assets reference ports into `PgHandover`
and composes `FormalHandoverApplication`, `HttpFormalHandoverGateway` and
`FormalHandoverWorkspace`. The shared German catalog includes `formalHandoverGerman`;
English remains the source language. Controller registration precedes OpenAPI and
browser-binding regeneration. The provisioning allowlist must recognize formal
record tables without widening revision/update privileges.
The host supplies optional journal-view callbacks to `FormalHandoverWorkspace` and
an optional Shift records callback to `HandoverWorkspace`. Both compose the shared
`HandoverViewNavigation`; formal persistence and application contracts are unchanged.
