# ADR-0030 — Local demo user selection and composed POC

## Status

Accepted for this local POC under the owner's explicit 2026-09-27 request for user
switching and delegated implementation decisions without intermediate approval
waits. This does not accept a third-party identity provider or shared-user login.

## Decision

Extend ADR-0018's configured local principal to a bounded configured list of seeded
principals. The operator chooses a named demo user; the host resolves only an
allowlisted ID, checks current scoped grants and issues an opaque, expiring,
HttpOnly, SameSite=Strict local cookie. Selection is explicitly impersonation for
a trusted local demonstration, never proof of human identity. Switching invalidates
the previous cookie and clears frontend request/data state. Browser-supplied actor,
organization, site or source never bypasses configured authority.

A provider-independent host principal resolver supplies a platform user ID to
existing Users/RBAC operations. Future third-party login replaces this resolver
and session establishment; OIP and Integrations continue using platform principal
and scoped permissions. No temporary password system or provider is selected.

Require explicit local-demo activation, native loopback listeners, configured exact
loopback browser origins, non-owner database credentials and startup refusal for
production/container/shared mode. Reject untrusted Host/Origin and cross-site fetch
metadata. Mutations additionally require an explicit same-origin custom header;
no CORS access is enabled. Configuration absence leaves only health available and
never silently enables demo identity. Runtime credentials/privileges and current
principal/membership/grants are verified, with forced RLS retained.

Compose the existing CSV/batch/mapping contracts with the OIP receiver on the
accepted pinned transaction. Bound upload bytes, one active upload, processing time,
queries, options and detail pages. Read snapshots and references follow ADR-0028.
Original-file access requires imports.review independently of analytics.read.

For ADR-0029 offline reset, the single host holds a shared session advisory lock;
reset requires its exclusive counterpart and verifies no runtime connections.
Host startup refuses maintenance contention before enabling business requests.
All application writers take the same shared transaction lock, so a stopped host
cannot leave a delayed publisher crossing maintenance. A private installation
marker and exact target selectors constrain migrator cleanup; runtime receives no
reset/delete privileges. The migrator has an explicit maintenance-only metadata
read policy across retained receipts for quota reconciliation; the command reads
only aggregate counts/bytes and never returns foreign payloads. Exact-target DELETE
policies remain separate. The trusted operator must stop the host before reset.
Direct administrative database access remains outside this local-process safeguard.

## Verification

Exercise actual HTTP/database/browser import and history, user switching and
revocation, denied scope/origin, immutable classified publication, revision-bound
pagination, quota/rollback and offline reset. Do not claim third-party login,
production security or owner usability feedback from automated checks.
