# ADR-0021: Local site persistence and initial seed

## Status

Accepted — explicitly approved by the owner on 2026-09-24 under
[IOP-026](../../planning/items/IOP-026-site-model.md). The owner also authorized
commit, integration into develop and publication to origin. ADR-0018 remains Proposed.

## Context and decision boundary

The POC requires one configured site with organization ownership and an explicit
IANA zone. IOP-025's storage and seed are integrated; IOP-008's temporal model is
Accepted. ADR-0020 explicitly limits its privileged creation exception to
organizations. This proposal extends that installation pattern only to an initial
site, without granting ordinary `site-configuration.manage` business access.

## Decision

### Storage and ownership

Add an ordered migration creating `platform_core.sites`, owned by `iop_migrator`.
Classify it as site-owned. Store non-null `site_id`, `organization_id`,
`display_name` and `time_zone`. Use a globally unique `site_id` primary key and a
unique `(organization_id, site_id)` candidate key for future scoped references.
The organization FK references `platform_core.organizations(organization_id)`;
no cascading ownership changes or deletion. The seed requires an existing owner
and does not create or rename organizations.

Use the existing opaque, case-sensitive text ID contract
`[A-Za-z0-9][A-Za-z0-9_-]{0,63}` for both IDs. Never derive IDs from names or source
labels. Apply ADR-0020's display-name rules at command and table boundaries:
1–200 Unicode characters, nonblank, no surrounding whitespace, control characters
or invalid Unicode. Names need not be unique. No timestamps or lifecycle flags.

Validate a zone explicitly: `UTC` or a slash-separated named zone matching the
IOP-018 syntax and 100-character limit, recognized by Node's existing Intl check
and present with exact spelling in PostgreSQL's `pg_timezone_names`. Reject
whitespace, offsets, bare abbreviations other than UTC and unknown names. Preserve
the supplied spelling; do not silently canonicalize aliases. At the table boundary,
enforce shape/length and use an invoker-rights insert validation trigger to check
the PostgreSQL name catalog. Do not label a catalog lookup function immutable.
The Node check belongs to the seed command; direct SQL does not prove Node support.

No zone conversion or source reporting window is inferred. Reject any seed rerun
that changes name, owner or zone, even before temporal use. Zone corrections and
site transfers require separately reviewed work; no historical data is rewritten.

### Explicit installation authority

Add a one-shot `seed-site` database command using the existing pg client, local
connection guards and verified dedicated migrator login. Require explicit
`IOP_SEED_ORGANIZATION_ID`, `IOP_SEED_SITE_ID`, `IOP_SEED_SITE_NAME` and
`IOP_SEED_SITE_TIME_ZONE`. Keep inputs separate from the strict IOP-018 JSON shape;
document exact agreement with `organization.id`, `site.organizationId`, `site.id`
and `site.timeZone` before later runtime use. No default site or source is supplied.

The operator's local migrator credential authorizes this initial installation
operation only. No API/startup invocation, bootstrap-superuser seed, new permanent
role, security-definer helper, disabled RLS or BYPASSRLS is permitted. Credentials
remain outside API/web containers. Native and one-shot Compose commands are required.

### RLS, transaction and conflict behavior

Enable and force RLS. Add only migrator SELECT and INSERT policies on sites,
requiring BOTH transaction-local `iop.seed_organization_id` and `iop.seed_site_id`
to match the row. Organization-only, missing, empty or malformed context denies
site access. Reuse the existing scoped organization SELECT policy to check the
owner; do not widen it. No UPDATE/DELETE or PUBLIC policies, runtime schema usage
or table privileges. These seed settings are not the future runtime context.

Use a fresh connection and one READ COMMITTED transaction, install validated
settings through parameterized `set_config`, verify the owner, validate the zone,
insert with primary-key conflict handling, then read back in a separate statement.
An exact repeat succeeds unchanged; differing name/zone/owner fails and rolls back.
A globally conflicting site ID outside the selected organization remains invisible
and yields a generic conflict without foreign identifiers. Concurrent equal seeds
converge; differing seeds cannot overwrite the winner. Close the connection after
commit or rollback. Do not implement UPDATE-based upsert or scope switching.

Runtime keeps CONNECT only, including after provisioning reruns and when it sets
seed selectors itself. RLS constrains normal seed statements, not a malicious
object owner capable of changing DDL. This is installation evidence, not business
RBAC or runtime pool-isolation evidence.

## Alternatives

- Extend the existing explicit migrator bootstrap: recommended bounded reuse, with
  site-specific ownership and two-part scope checks.
- Wait for runtime authorization and expose configuration CRUD: exceeds this POC
  slice and couples initial installation to Proposed ADR-0018.
- Embed local data in migrations or disable RLS: reject; mixes customer inputs
  with schema history or removes accepted isolation.
- Add a generic seed engine or separate privileged role: no demonstrated need for
  the single configured site.

## Required implementation validation

Use actual role logins on disposable PostgreSQL 17.6 and the existing test tooling:

- Fresh migration/organization/site seed and identical rerun on two empty databases.
- Invalid/missing IDs, names and zones, nonexistent owner and conflicting owner.
- Accepted UTC and named zone; rejected offsets, abbreviations, unknown and malformed
  zones; Node/database disagreement fails without persisting a row.
- Concurrent identical and conflicting seeds; no updates or partial data on failure.
- Positive scoped SELECT/INSERT, missing organization/site and foreign organization
  or sibling-site denial; ordinary UPDATE/DELETE cannot change existing rows.
- FK ownership and composite-reference rejection using disposable test fixtures;
  no future business tables added merely to demonstrate the candidate key.
- Runtime read/write/DDL/truncate/elevated-role denial, even with seed settings;
  repeated provisioning does not expand privileges.
- Safe errors without credentials, SQL payloads or foreign resource details.
- `npm test`, typecheck, database suite and disposable native/Compose reproduction.

## Consequences and acceptance

Acceptance authorizes only IOP-026's planned site migration, initial seed,
checks and documentation. No organization/site administration, selectors, users,
grants, source seed, ORM, runtime repository or endpoint. ADR-0018 acceptance is
independent. IOP-123 demo fixtures and adjacent stories remain unactivated; broader
site lifecycle/admin requirements stay deferred after the POC slice is delivered.

## Technical references

Official PostgreSQL 17 references consulted on 2026-09-24:
[recognized zone names](https://www.postgresql.org/docs/17/view-pg-timezone-names.html)
and [row security policies](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
The storage, seed authority and validation rules above are accepted project decisions.
