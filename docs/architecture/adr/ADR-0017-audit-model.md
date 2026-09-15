# ADR-0017: Scoped application audit records with bounded retention

## Status

Proposed — prepared on 2026-09-15 for [IOP-009](../../planning/items/IOP-009-audit-model.md).
Owner acceptance is pending. No implementation or accepted baseline is changed.

## Context

IOP is a modular monolith with PostgreSQL and TypeScript/NestJS. The pilot imports
CSV data and presents analytics. Audit must explain material platform changes
without copying industrial events, RAW data or every report query into another
history store. ADR-0014 already requires actor/action/target and before/after grant
information for access changes. Audit owns records, not the underlying workflows.

The seed task defines auditable events and retention as its outcome but lists no
options. The comparisons below make those decisions explicit. They are project
judgments for a solo-maintained pilot, not benchmarks. No contractual retention,
audit-volume estimate or independent tamper-proof evidence requirement is known.
Authentication remains separate under IOP-007; this design uses ADR-0004's platform
principal boundary without depending on the unmerged ADR-0015 proposal.

Constraints: Accepted ADR-0001/0003/0004/0005/0006, explicit scope in
[ADR-0012](ADR-0012-organization-site-scope.md), isolation in
[ADR-0013](ADR-0013-tenancy-data-isolation.md), permissions in
[ADR-0014](ADR-0014-scoped-rbac.md) and time semantics in
[ADR-0016](ADR-0016-time-and-timezone-model.md).

## Alternatives evaluated

| Capture model | Benefits | Costs and limitations | Assessment |
| --- | --- | --- | --- |
| Operational logs only | Small initial integration; useful for diagnosis. | Rotation and diagnostic verbosity do not establish durable business history or atomicity with changes. | Insufficient as the authoritative audit trail. |
| Database triggers as primary audit | Can capture row mutations from database writers. | Business intent, verified actor and denied operations need separate context; generic row snapshots risk copying sensitive data. | Do not select as primary capture; future defense for direct database access needs separate design. |
| Explicit module records in PostgreSQL | Owning module knows intent, authorized scope and safe change fields; records can share the business transaction. | Every material operation needs deliberate coverage and failure tests. | Recommend. |
| Event sourcing | Domain events can reconstruct state with replay semantics. | Changes persistence and module design far beyond audit; event replay and audit retention have different needs. | Reject for this task. |
| External audit service / immutable archive | Could provide an independent storage or integrity boundary. | Adds delivery, credentials, outages and operations; no established requirement yet. | Reconsider for independent evidence or measured volume needs. |

| Delivery model | Assessment |
| --- | --- |
| Append directly through Audit's contract in the business transaction | Recommend for material PostgreSQL changes: one commit or rollback, no asynchronous delivery gap. Couples write availability to audit persistence. |
| Transactional outbox then durable consumer | Viable when Audit moves to another store or process; requires retry, deduplication, lag and retention management. Defer while the final record can be written in the same database transaction. |
| In-memory event / write after commit | A crash can lose the record after the change succeeds. Reject for mandatory change history. |

| Retention model | Assessment |
| --- | --- |
| Indefinite retention | Easy initial policy but unbounded exposure and storage; reject as default. |
| One short period for everything | Simple but erases low-volume change evidence as quickly as high-volume security attempts. |
| Bounded periods by event class | Recommend 365 days for material changes and audit maintenance; 90 days for security attempts/session events. Explicit, reviewable pilot defaults. |
| Immediate archive then delete online records | Adds storage/retrieval and deletion coordination before a demonstrated need; defer. |

## Proposed decision

### Ownership and record contract

Owning modules explicitly call Audit's append contract with a versioned event and
trusted execution context. Audit validates the envelope, approved event schema and
scope, and owns persistence. Hosts provide the authenticated principal; clients
cannot choose actors, outcomes, retention classes or audit timestamps. Other
modules never write Audit's tables directly. Audit does not call back to coordinate
business workflows. Activity views, if introduced later, are derived and obey the
same access and retention rules; they are not the source of truth.

Each event schema declares these conceptual fields, without selecting DDL or IDs:

| Field | Rule |
| --- | --- |
| Identity and version | Stable `eventId`, `eventType`, `schemaVersion` and emitting module. Event types describe business actions, not HTTP routes or SQL verbs. |
| Scope | Explicit organization or site scope with validated canonical IDs; separately classified platform security events only where no customer scope is established. |
| Actor | Kind (`user`, `service`, `system`, `unknown`) and stable platform reference when known. Jobs retain initiating user and execution identity separately; this adds no service permissions. |
| Subject | Subject type and stable opaque reference in the declared scope; multiple references require the same ownership validation. |
| Outcome and reason | Controlled outcome/reason codes; committed changes, denied attempts and failed attempts remain distinguishable. No raw exception text. |
| Change | Event-specific allowlisted before/after fields or configuration version references; explicit absent values for creation/removal. No generic object serialization. |
| Time | Server-observed `occurredAt` and Audit-assigned `recordedAt`, millisecond UTC instants under ADR-0016. These describe platform actions, not source alarm times. |
| Correlation | Trusted operation ID, optional causation event ID, run ID and attempt/chunk reference. A client correlation string is bounded, untrusted metadata, never an identity or deduplication authority. |
| Retention | Event class and applied policy version; expiry derives from `recordedAt`, not a client or imported timestamp. |

Timestamps do not prove global commit order. Keep subject revision/operation
relationships where causality matters; event IDs provide stable pagination tie
breaks, not a claim of chronology. Preserve recorded UTC values when clocks move
backward; clock health belongs to operational monitoring. Display time conversion
must not rewrite history or use a CSV filename date as audit time.

### Initial event catalog

Names below are semantic categories; implementation registers bounded, versioned
schemas for each operation before enabling it.

| Category and owner | Required evidence | Scope / retention |
| --- | --- | --- |
| Membership and role changes — Users/RBAC | Add/remove membership; grant/revoke fixed role; actor, affected user, role, target and safe before/after grant values, including removals caused by membership deletion. | Organization / 365 days. Site IDs on assignments are grant targets, not site operational payloads. |
| Scoped configuration — owning module | Successful application of source mappings, report configuration and any supported scope/time configuration; changed safe fields or previous/new version and digest. | Actual organization or site target / 365 days. |
| Import lifecycle — Integrations | Accepted submission, start, committed completion/partial completion/failure and committed chunk summaries where applicable; run/attempt references, counts and safe reason codes. | Site / 365 days. No audit row per imported alarm or RAW row. |
| Corrections/reprocessing — owning module, when later authorized | Requested and committed correction/replay with affected run/version references and summary impact. | Actual target / 365 days. Does not authorize these features now. |
| Authentication/session — Authentication | Verified login success, failure, logout, revocation and credential/session lifecycle actions where supported; stable principal when established, no credential content. | Platform security by default / 90 days; confirmed scoped events only under explicit owner contracts. |
| Authorization denial and suspicious validation — enforcing boundary | Actor if verified, attempted action, safe reason and trusted scope if established. | Validated target or platform security / 90 days. Never enrich a denied request by querying foreign customer data. |
| Audit access and maintenance — Audit | Authorized inspection, approved deletion/retention-policy changes and purge summaries: actor, purpose code, target, policy, cutoff and count. | Same customer scope or separately controlled platform maintenance / 365 days. |

Ordinary successful report reads, filters, health checks and internal diagnostics
are not mandatory audit events. Operational errors/metrics stay with IOP-013.
Authentication adapters report only locally observed outcomes; no claim of full
identity-provider history is made. Exports, maintenance, workforce and maps remain
deferred; add event schemas if those capabilities are separately authorized.

File-based configuration retains its reviewed version history. Record the version
actually applied by a validated loader/admin command; a Git commit alone does not
prove application to a site. Runtime activation must not become effective before
its configuration version and audit record are durably committed. External file
publication is not claimed to be atomic with PostgreSQL.

### Atomicity, retries and failures

For material database changes, pass the same explicit transaction handle and pinned
connection to the owner and Audit repositories. Install the validated transaction-
local scope required by ADR-0013. The business mutation and final audit record must
commit together. Audit validation/storage failure rolls back the mutation and the
operation cannot report success. Never switch scope or acquire a second connection
inside Audit to make an append succeed. Organization-owned access changes retain
organization scope even when a changed grant targets a site.

A long import has records for its actual committed units and terminal outcome;
a failed later chunk does not erase evidence of earlier committed chunks. A
post-rollback failure event uses a new authorized transaction and states failure,
never success. Crashes may leave a started run without a terminal event; later
reconciliation must record the observed recovery outcome, not invent completion.
Run orchestration and recovery mechanisms remain IOP-010/012 implementation work.

Use server-controlled operation identity plus event ordinal/type within the
owning scope to prevent duplicate records for the same committed operation.
A retried transaction reuses logical identities; a genuinely new attempt can have
its own attempt event. Unknown commit outcome requires resolving the stored
operation result before repeating its mutation. Audit deduplication alone does
not make a business command idempotent; verify both in implementation.

Security attempts have no successful business transaction to join. Persist them
independently after the denial/observation; audit failure must never convert denial
into authorization. For the pilot, a security-sink outage does not itself block
otherwise valid authentication or read-only analytics. Emit a sanitized operational
failure signal and mark the evidence gap; do not claim lossless collection or use
an unbounded in-memory queue. Mandatory mutation auditing still fails closed.
Session invalidation must remain effective even if its observation cannot be saved.
Define bounded security-event admission/rate limits in implementation, with explicit
suppression counts; never silently sample committed material-change records.

### Isolation, inspection and integrity

Keep organization, site and platform-security storage classes distinguishable.
Customer records use scoped constraints and enabled/forced RLS with the actual
non-owner runtime role under ADR-0013. Missing site never means all sites. Unknown
login identities and unvalidated requested tenant IDs do not create customer audit
records. Platform security storage must not become a bypass for business payloads.

No current pilot role automatically gains general audit browsing. Do not broaden
`access.manage`, `imports.review` or `analytics.read` to expose Audit tables.
For v1, inspection is an explicitly authorized operator procedure using separate
read-only credentials, an explicit target and purpose, and a recorded inspection
event before releasing results. Customer inspection must enforce the same exact
scope with forced RLS and no bypass role; platform-security inspection is separately
restricted. No new product role, endpoint or UI is selected. Future self-service
access requires a reviewed permission/bundle addition. Inspection records do not
recursively inspect or audit their own insertion.

Ordinary runtime access can append but cannot update, delete or truncate history;
retain only narrow read access needed for verified operation deduplication.
Separate retention credentials allow bounded deletion, not arbitrary modification
or application use. Corrections append a linked corrective event. Subject/user
removal does not cascade-delete audit evidence: stable identifiers remain, while
names/emails and provider claims are not snapshotted. Exceptional redaction requires
an approved, separately recorded maintenance procedure.

This is append-only under ordinary application privileges, not immutable evidence
against compromised application code, database owners or operators. RLS does not
protect against privileged bypass. Independent immutable storage, signatures and
hash chains are deferred; local hash chains alone would not establish an external
trust anchor. Before/after data is explicitly limited to safe fields; exclude
passwords, tokens, cookies, secrets, full request bodies, RAW CSV contents, personal
names/emails, arbitrary filenames/paths and stack traces. Raw IP addresses are not
part of the pilot audit contract. Apply length limits, structured encoding and
sanitization before persistence; escape data when presenting it.

### Retention and disposal

Propose fixed, version-controlled pilot defaults: 365 elapsed UTC days for material
changes/maintenance and 90 elapsed UTC days for security events. These balance a
year of change investigations against shorter retention of higher-volume attempts;
they are recommendations, not legal requirements or verified sizing results.
Confirm customer constraints before production use. No per-customer policy editor
or indefinite default is introduced.

Expiry is `recordedAt` plus the class duration, where a day is 86,400 seconds.
Queries exclude expired records. A daily bounded purge removes records whose
expiry is at or before the captured UTC cutoff, separately per authorized scope.
Target physical removal within 24 hours of expiry during normal operation; a missed
run alerts operators and resumes without broadening scope. Record cutoff, policy
version and deleted count in a same-transaction purge summary. Zero-deletion runs
need operational metrics only, avoiding self-perpetuating empty purge records.
Retention-policy changes apply prospectively; shortening existing history or
extending it requires an explicit reviewed maintenance decision.

Deleting a subject does not imply audit deletion, and audit expiry does not delete
RAW/business data. Derived activity views and temporary investigation extracts must
not outlive their source audit retention without an explicitly approved purpose and
expiry. No automatic archive is selected. Customer offboarding and exceptional
preservation requests require an explicit scoped disposition decision before purge;
there is no assumed legal-hold product or indefinite pause.

Database backups are outside online purge and may retain expired records. Before
production, IOP-014 and recovery/hosting work must define a finite backup lifetime,
access and destruction rules. Restores remain isolated until expired audit rows
are purged and scope verified. Do not claim complete physical erasure at online
expiry or accept an undefined backup lifetime as production-ready retention.

## Design walkthroughs and future validation

These are reviewed expected outcomes, not executed tests.

| Scenario | Expected outcome |
| --- | --- |
| Authorized site configuration change | One scoped change and its safe before/after/version record commit together. |
| Audit insert fails or later domain validation fails | Neither change nor success audit record commits; sanitized failure response. |
| Connection is reused after rollback | Fresh validated scope; no prior customer audit visibility. |
| Role revoke includes site assignment | Organization-owned record includes grant target and before/after values without site payloads. |
| Same command retries after uncertain commit | Resolve original outcome; no second mutation or duplicate success record. |
| Import commits one chunk then fails | Earlier committed evidence remains; terminal failure describes partial effect, not total rollback. |
| Denied cross-site request | No foreign lookup/payload; denial remains denied even during audit outage. |
| Forged actor, tenant or CSV timestamp | Ignore as authority; validated server context determines record and retention. |
| Read-only login/report during security-sink outage | Preserve normal authorization behavior; signal audit loss explicitly. |
| Customer administrator tries to browse or delete audit | No implicit permission; deny; ordinary runtime cannot alter history. |
| Operator inspects site A1 | Explicit authorization and recorded inspection; no A2/B1 data or wildcard organization scope. |
| Subject deletion, record correction, malicious text | No cascade loss; append correction; bounded safe fields and output encoding. |
| Clock moves backward / concurrent transactions | Preserve observations and causal references; do not infer total order from timestamps. |
| Exact expiry / failed purge / backup restore | Expired records hidden; scoped purge resumes; restored data remains isolated pending purge. |

IOP-023 must verify real PostgreSQL transaction failure, runtime grants, RLS,
rollback, pool reuse and idempotency; also secret exclusion, inspection and purge
boundaries. Authentication failure integration awaits IOP-007. No schema, runner,
performance measurement or executable security evidence exists in this task.

## Consequences and acceptance boundary

The recommendation offers reviewable business evidence with a simple local commit
boundary. It adds deliberate instrumentation, write latency and audit-storage
availability as a prerequisite for mutations. Security-attempt collection has an
explicit outage gap; privileged tampering remains outside the assurance offered.
Retention and backup operations require implementation before production claims.

Acceptance must explicitly cover capture/atomicity, the initial event catalog,
restricted inspection and the 365/90-day defaults. Until then this ADR is Proposed,
IOP-009 remains open, and architecture/modules/data-model/glossary stay unchanged.
Acceptance authorizes synchronizing design documentation, not scaffolding IOP-023
or implementing identity, jobs, retention workers or hosting.

## Sources

Consulted 2026-09-15; PostgreSQL 18 is a documentation reference, not a selected
runtime version. The recommendation and numeric retention defaults are IOP design
judgments, not requirements stated by these sources.

- [PostgreSQL transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html):
  transaction grouping supports the proposed all-or-nothing database change/record
  contract; external files and remote services are not included in that guarantee.
- [PostgreSQL row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html):
  policy enforcement and owner/superuser bypass limitations inform privilege review.
- [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html):
  application context, security-event coverage, sensitive-data exclusion, protected
  access, sanitization and retention/disposal inform this proposal. Mandatory
  business-change rollback on audit failure is our explicit integrity tradeoff;
  optional diagnostics and security observations use different failure behavior.
