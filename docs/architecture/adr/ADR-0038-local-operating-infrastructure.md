# ADR-0038 — Local operating infrastructure

## Status

Accepted for [IOP-208](../../planning/items/IOP-208-local-delivery-infrastructure.md)
under the owner's explicit 2026-10-14 delegation of development decisions in
[IOP-203](../../planning/items/IOP-203-platform-completion.md). This implements
selected local capabilities, not remote hosting or release acceptance.

## Decisions

Reuse existing modular boundaries, PostgreSQL and pinned authorized transactions.
CI repeats established checks with Node 24.21.0/npm 10.9.2, synthetic disposable
PostgreSQL/Chromium and read-only repository token permissions. Publication and
remote CI success remain separate evidence.

Full backup captures a consistent exported PostgreSQL snapshot while holding the
existing exclusive maintenance lease `190147`.
The running API holds a shared lifetime lease; operators stop API/web and any
workers/setup operations while keeping the database active before backup, and
restart services after either success or failure. Include the full database, private
installation/configuration and explicitly supplied external reference roots;
exclude earlier backup archives and keep the separate random 32-byte encryption
key outside those roots. Stream an authenticated AES-256-GCM archive with SHA-256
file metadata; reject unsafe paths/symlinks and changed source files. Private
working directories are mode 0700 and files/key mode 0600. Backup lifetime defaults
to 30 elapsed days; explicit bounded cleanup never touches source installation.
Restore only into a newly created network-isolated Docker database/container and
new private directory. Restore actual roles/owners/grants and compare independent
full table counts/digests and RLS/grant metadata before declaring verification.
Never replace or run archive SQL against the active installation. Restored Audit
expiry must be purged through its separate retention authority before activation.

Durable jobs use site-scoped PostgreSQL leasing, bounded attempts/backoff and
idempotent request fingerprints. `jobs.manage` is explicitly assigned to
Administrators. Every retrieval and execution rechecks current initiating-user
grants; registered handlers separately declare required business permissions.
Effects and final job outcome use the same authorized transaction. Missing handlers
or external configuration produce retained pending states; a generic queue does
not confer access or claim provider delivery. A finite local tick is reusable by
an operator loop; no global RLS-bypass queue polling is introduced.

Audit follows Accepted ADR-0017: explicit versioned allowlisted event schemas,
atomic module append contracts, 365-day site change/maintenance retention and separate operator
inspection/retention credentials. Ordinary runtime appends/deduplicates only;
inspection records its purpose before releasing scoped results, and purge records
an atomic summary. No product role gains Audit browsing. Capture coverage is
listed explicitly; absent source emitters remain pending rather than inferred from
module revisions. Platform-security collection requires its own authority and is
not disguised as a customer-scoped payload; its 90-day general security collector
and the organization RBAC envelope remain pending. Separate operator roles receive
only execution of locked-search-path, bounded `SECURITY DEFINER` functions. The
functions verify the actual session role against an explicit registered site target
and retain forced scoped RLS under their migrator owner. They grant no broad table
authority or ordinary runtime delete/update capability.

## References

- [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) and
  [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html): exported
  snapshots, custom archives, ownership/privilege restoration and isolated execution.
- [GitHub Node CI](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs):
  locked install, Node setup and workflow execution. Action versions verified from
  their official repositories on 2026-10-14.
