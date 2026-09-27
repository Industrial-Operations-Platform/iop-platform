# ADR-0035 — Transitional authentication and user administration

## Status

Proposed — 2026-09-27, under [IOP-165](../../planning/items/IOP-165-operational-home.md).
The owner requested temporary security, administrator-created users and later
corporate identity integration. The owner confirmed four profiles: Administrator,
Technician, Task Force and Team Leader; only Administrator imports, and the other
three have identical capabilities until further modules exist. Credential/session
mechanisms below still require acceptance before implementation under ADR-0007.

## Proposed decision

Use an explicit local username/password adapter behind
[ADR-0004](ADR-0004-authentication-abstraction.md), with individual accounts and
opaque, revocable server-side sessions. Keep deployment on the owner's loopback
Docker stack. Authentication owns credentials, identity bindings and sessions;
Users/RBAC owns stable user IDs, organization membership and scoped assignments.
Business modules receive the platform principal, never credentials/provider claims.

An administrator creates a new local identity through a bounded orchestration use
case and assigns existing fixed bundles for the authorized organization/sites.
There is no public registration, shared default password, global user search,
arbitrary permission editor or customer-tenant dependency. Initial administrator
bootstrap is an explicit operator command, separate from runtime credentials.

| Profile | Current assignments |
| --- | --- |
| Administrator | Organization access admin; site operator and analytics reader at each explicitly assigned site |
| Technician | Analytics reader at each explicitly assigned site |
| Task Force | Same as Technician |
| Team Leader | Same as Technician |

These are presentation profiles over [ADR-0014](ADR-0014-scoped-rbac.md) bundles.
No publication, workforce-management or maintenance permission is granted before
that module's contract exists. Only the administrator profile receives import tools
in this increment. Profile display is not an authorization source. Changing a label
cannot grant access; mutations validate explicit assignments and target ownership.

Store local credentials with unique salts and Argon2id password hashing; select a
maintained compatible implementation and benchmark its work factor before coding.
Use a one-time initial secret with mandatory password change; expose it only at
creation to the authorized administrator and never log or retain it in plaintext.
Credential reset is limited to identities exclusively owned by this local
installation's organization; shared identities require operator recovery. Do not
reset another organization's credentials through `access.manage`.

Persist only digests of unpredictable session tokens, with expiry and revocation.
Use HttpOnly/SameSite cookies, explicit same-origin/CSRF protection and bounded
login attempts. Secure cookies and HTTPS are mandatory for any later remote mode;
the current loopback-only HTTP exception must not enable LAN/public exposure.
Logout, password changes and account disablement invalidate affected sessions.
Resolve current user/membership/grants on every business operation. Remove the
impersonation selector and its endpoints from authenticated mode; no fallback to
the local demo principal after failed authentication or missing configuration.

Serialize authority checks and access mutations, preserve the last active access
administrator, keep forced RLS and non-owner runtime credentials, and write minimal
actor/action/target and grant-change evidence atomically. No credentials enter audit
records. Define reviewed migration/lookup policies and endpoint DTOs in the access
implementation plan before schema edits.

Future corporate authentication resolves a verified provider identity to the same
platform user. Bind by stable provider issuer/subject (with tenant validation in the
adapter), never automatically by matching email. Linking requires an authenticated,
reviewed migration procedure; preserve authorship, assignments and history, then
disable temporary credentials. Provider selection, SDKs, tenant registration and
the actual corporate flow remain deferred.

## Alternatives and consequences

A separate identity service avoids application-owned credentials but adds another
service to the local demonstration. It remains an alternative if the owner prefers
it. Waiting for the corporate tenant blocks individual access unnecessarily. The
existing selector remains impersonation and cannot meet the requested security.

This proposal extends ADR-0030/0034 only after acceptance. Their existing local
selector remains active until replacement is implemented and verified. The older
unmerged ADR-0015 proposal is not accepted or merged by this document.

Start can independently consume existing authorized analytical contracts and show
honest placeholders. Scheduling, published technician updates, validated assets and
repair/blocking states remain owned by their respective modules. Analytical source
labels stay in configuration/adapters and do not define a universal location tree.

## Required verification

Test login denial/throttling, session rotation/expiry/logout, mandatory initial
password change, revoked access, forged roles/scope, direct forbidden imports,
cross-organization access/reset denial, concurrent last-admin removal and atomic
user provisioning. Test that provider identity binding preserves a platform ID
without matching by email. Browser tests cover login, user creation, assignment,
home identity and logout; run real PostgreSQL RLS/migration tests.

References: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
and [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
These sources guide credential/session protection; product scope and identity
migration choices above are project proposals, not external requirements.
