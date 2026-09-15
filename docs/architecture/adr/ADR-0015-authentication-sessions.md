# ADR-0015: Local pilot authentication and provider-independent sessions

## Status

Proposed — 2026-09-15. Prepared for [IOP-007](../../planning/items/IOP-007-authentication-model.md).
Owner acceptance is pending; this does not change the accepted architecture.

## Context

The pilot requires individual login for a same-origin React/NestJS application,
with PostgreSQL and one maintainer. Entra is a future integration. ADR-0004 requires
provider-independent identity; ADR-0014 requires current scoped authorization on
every operation. Neither decision selects credentials or sessions. The seed task
explicitly asks to evaluate local POC login and a future Entra contract; the
following alternatives make those choices concrete.

## Alternatives evaluated

These are project fit judgments, not measured cost or security results.

| Identity option | Benefit | Cost / limitation | Assessment |
| --- | --- | --- | --- |
| Local username/password adapter | Independent pilot setup; no corporate tenant or additional identity service required. | IOP owns credential protection, provisioning, recovery and abuse controls. | Recommend for the bounded pilot. |
| Separate OIDC provider for pilot accounts | Moves credential lifecycle to a dedicated identity system; can later federate. | Adds provider selection, configuration, availability and operating responsibilities. | Reconsider if managed identity is available or MFA/self-service is required now. |
| Entra from the start | Corporate sign-in and provider-managed authentication policy. | Requires tenant access, registration and corporate onboarding; these prerequisites are not established. | Define the future contract; defer implementation. |
| Shared login or bypass | Minimal demonstration setup. | Loses individual attribution and cannot establish the accepted user/RBAC boundary. | Reject. |

| Browser session option | Benefit | Cost / limitation | Assessment |
| --- | --- | --- | --- |
| Opaque cookie with server-side session | Central expiry and revocation; keeps provider credentials out of browser code. | Database lookup and cookie/CSRF controls required. | Recommend. |
| Self-contained bearer JWT in browser | Useful for independently operated API clients. | Revocation requires additional state or expiry delay; browser token exposure and refresh lifecycle add work. | No demonstrated pilot benefit. |
| Provider tokens sent directly by SPA | Fits some external API architectures. | Couples browser login to provider token handling; API must validate its own audience and still resolve platform authorization. | Defer; not required for this same-origin pilot. |

## Proposed decision

### Identity boundary and ownership

Authentication owns provider adapters, verified identity bindings, credentials and
sessions. Users/RBAC owns stable platform user identity, active status, organization
membership and assignments. Domain modules receive a trusted principal with `userId`
and authentication context; they receive no password, provider token or provider
role as a grant. Only the authentication boundary can construct that context.

An adapter verifies proof and supplies a namespaced identity: configured provider
instance, verified issuer and stable subject. A unique binding maps that identity
to one platform user. Local subjects are immutable opaque account IDs; usernames
are lookup labels. Multiple explicitly linked identities may map to one user.
Email/name equality never creates a binding. Unknown, ambiguous, disabled or
unlinked identities cannot obtain a business session.

Identity bindings, local credentials and sessions are explicitly platform-global
security data, accessible through narrow Authentication/Users contracts. They are
not unscoped business-data repositories. Membership and assignment queries remain
organization-scoped under ADR-0013/0014. An organization access admin cannot reset
another organization's access through a shared user's global password or disable
that user globally.

### Local pilot credentials and provisioning

Use individual, operator-provisioned accounts; no public registration, shared admin
password or default credentials. Local authentication must be explicitly enabled
in deployment configuration. Provisioning/bootstrap is a restricted operator
procedure with actor, reason and target evidence, separate from organization
`access.manage`. Bind the initial user and grant each organization/site role
explicitly; identity creation alone grants nothing.

Use a maintained password-hashing library with Argon2id and unique salts. Select
and benchmark parameters in implementation against current guidance; do not build
cryptography. Adopt a minimum 15-character password for this single-factor pilot,
support at least 64 characters, allow password managers/paste, reject common or
compromised passwords, and avoid arbitrary composition rules or periodic rotation.
Never log passwords or store plaintext/reversible credentials. See
[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
and [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

Unknown-user, disabled-user and wrong-password login failures use a generic public
response and comparable verification work. Apply bounded per-account and source
throttling, with deployment-wide consistency; specify thresholds in IOP-028.
Recovery uses verified operator assistance and a short-lived, single-use secret
with restricted password-setup authority, delivered outside repository/logs. No
normal business session is issued until setup completes. Password reset/change
revokes existing sessions. Define secure delivery, expiry and atomic consumption
before implementation; no recovery UI or email service is selected here.

### Session contract and lifecycle

After successful proof and active-user resolution, issue a new unpredictable opaque
session secret using a maintained session mechanism and cryptographic randomness.
Store its digest plus user/binding reference, creation, last activity, absolute
expiry and revocation state in PostgreSQL. Do not introduce Redis or use an
in-memory development store as the deployed session authority. Nest documents
session integration, but its example does not select an IOP library or store:
[Nest sessions](https://docs.nestjs.com/techniques/session).

Send the secret only in a host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookie,
with `Path=/` and no Domain attribute; prefer the `__Host-` prefix. Serve deployed
login/session traffic over HTTPS. Use same-origin routing, including a development
proxy; local TLS/configuration is an IOP-015 implementation concern, not permission
to weaken deployed cookies. No session secret in URLs or browser Web Storage.

Proposed pilot limits are 30 minutes idle and 8 hours absolute, enforced server-side;
these are project defaults for review, not measured user requirements. Background
polling must not keep an unattended session alive indefinitely. No remember-me or
refresh-token mechanism is needed for the pilot. Rotate after login and successful
reauthentication; never promote an anonymous session identifier. Expired/revoked
sessions cannot be refreshed or resurrected by a racing activity update. See
[OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

Every request resolves current session and user status; unavailable state fails
closed. Logout revokes the current server session and clears its cookie. Global
user disablement, credential recovery or identity unlinking invalidates affected
sessions; disablement stops every new authentication check. Re-enabling a user
must not restore old sessions. Membership/role revocation changes current business
access without needing logout, as required by ADR-0014. Already-authorized work may
finish. Verify atomic revocation/activity races with the eventual persistence layer.

Use anti-CSRF tokens bound to the session and validate request origin for unsafe
browser operations, including login and logout. Login may use a short-lived
pre-authentication context; it confers no business identity. SameSite is an extra
control, not the sole defense. GET must not mutate business state. Validate uploads
as unsafe operations too. OIDC callbacks use the separate correlated protocol
state described below. See [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Login, current-session lookup, logout and password setup are semantic contracts,
not selected endpoint paths. Business APIs retain ADR-0011 errors: invalid sessions
return 401, valid but disallowed operations 403 or scoped 404, throttling 429;
infrastructure failure returns a safe service error and never grants access.
Session responses expose only necessary user/display and expiry information, with
`Cache-Control: no-store`. Browser code clears sensitive displayed data on logout
or expiry. Exact DTOs, authentication challenge and error types belong to IOP-028.

### Future Entra adapter contract

Use server-mediated OIDC authorization code flow with PKCE S256 and a maintained
library. Correlate a short-lived, single-use login transaction with the initiating
browser, expected provider, state, nonce, redirect URI and PKCE verifier. Exchange
the code on the server and validate signature, trusted issuer, audience, lifetime
and nonce before mapping identity. Use configured metadata/trusted issuers, not
arbitrary discovery URLs from input. Keep secrets/tokens inside the adapter.
See [Microsoft code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
and [OIDC](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc).

Bind `(provider instance, issuer, subject)` to the platform user. Entra tenant and
object IDs may be retained as verified adapter metadata for explicitly reviewed
migration/linking; tenant ID is not an IOP organization grant. Email and preferred
username are mutable display/lookup data, not identity keys. See
[Microsoft claims reference](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference).
No just-in-time membership, email-based linking or direct group-to-permission
mapping is selected. Operator-controlled linking must verify the target identity
and preserve the existing platform user and explicit grants.

The backend creates the same IOP session after Entra login. ID tokens are evidence
for the OIDC client, not bearer credentials for IOP business endpoints. Graph tokens
are not IOP API credentials. No Graph access, token refresh storage or provider
password collection is required for sign-in. IOP logout ends the IOP session;
provider-wide logout is a separate integration concern. Existing IOP sessions
cannot promise immediate detection of Entra account disablement: local disablement
remains immediate on new checks; federation revocation/reauthentication policy must
be settled in IOP-106 before enterprise rollout. Never silently fall back to local
password login for a federated-only account after provider failure.

## Design walkthroughs and future tests

These are expected outcomes reviewed on paper, not executed security tests.

| Scenario | Expected result |
| --- | --- |
| Valid local login, active user, explicit site grant | Fresh session; only granted operations at that site succeed. |
| Valid identity without membership/role | No business access; authentication is not authorization. |
| Wrong password, unknown user, disabled account | Generic failure; throttling; no session. |
| Forged, expired or logged-out cookie | No authenticated principal; replay fails. |
| Activity update races with logout/reset | Revocation cannot be undone by a stale write. |
| User disabled then re-enabled | Old sessions stay invalid. |
| Role removed while session remains valid | New operation checks deny the removed grant. |
| Session/authorization database unavailable | Safe failure, no cached allow or anonymous elevation. |
| Cross-site POST/upload/logout or login CSRF | Rejected before state mutation. |
| Provider email matches another user's email | No automatic linking or grants. |
| Wrong issuer/audience/nonce, reused code/state | Reject callback; do not create session. |
| Organization A admin attempts global password reset | Deny; organization authority is not global identity authority. |
| Entra outage or external account disablement | No fallback login; document existing-session limitation. |
| Worker starts after actor loses access | Recheck current actor/action/scope; never copy browser credentials into jobs. |

Verify these with Jest, Supertest, Playwright and PostgreSQL integration tests in
implementation, including cookie/proxy behavior, fixation, reset replay and races.
Background service identities and durable job execution remain IOP-010 contracts;
a browser session is not a machine credential.

## Consequences and acceptance boundary

This keeps pilot setup small and preserves future federation, while taking on
real password/recovery/session responsibilities. It does not provide MFA, corporate
lifecycle synchronization or proof of production readiness. Reconsider a dedicated
provider if those become immediate requirements. Libraries, schema, hashing costs,
throttle thresholds and deployment configuration remain implementation choices.

On explicit acceptance, synchronize ARCHITECTURE.md, modules, data model, glossary
and ADR-0004 follow-up notes and close IOP-007 as design. IOP-028 and IOP-106 remain
separately authorized implementation work. Official sources above were consulted
on 2026-09-15; the recommendation and timeout defaults are IOP design judgments.
