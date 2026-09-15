# ADR-0015: Local pilot authentication and provider-independent sessions

## Status

Proposed — 2026-09-15. Prepared for [IOP-007](../../planning/items/IOP-007-authentication-model.md).
The owner explicitly selected basic local login and a replaceable provider boundary
for an independent prototype. The session details below remain Proposed; this is
not acceptance of the earlier full credential-lifecycle proposal.

## Context

The owner is building an independent working prototype and currently has no access
to the company Azure/Entra tenant. Authentication should provide a basic working
login while preserving a future third-party integration boundary. Building an
identity-management product is not a prototype objective.

The prototype requires individual login for a same-origin React/NestJS application,
with PostgreSQL and one maintainer. Entra is a future integration. ADR-0004 requires
provider-independent identity; ADR-0014 requires current scoped authorization on
every operation. Neither decision selects credentials or sessions. The seed task
explicitly asks to evaluate local POC login and a future Entra contract; the
following alternatives make those choices concrete.

## Alternatives evaluated

These are project fit judgments, not measured cost or security results.

| Identity option | Benefit | Cost / limitation | Assessment |
| --- | --- | --- | --- |
| Local username/password adapter | Independent pilot setup; no corporate tenant or additional identity service required. | IOP retains basic credential/session protection; prototype accounts are created manually. | Owner-selected direction for the prototype; detailed session mechanism remains proposed. |
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

The minimal flow is:

`login UI → Authentication → local adapter → platform user → IOP session`

The UI submits credentials only to Authentication. The local adapter verifies them
and returns its stable, namespaced subject; Authentication resolves that subject
to a platform `userId`. Session resolution supplies that principal to Users/RBAC.
Domain modules never import an authentication provider or receive credentials.
The browser needs only sign-in, current-session lookup and sign-out behavior.

For the prototype, each manually created account has one local identity mapping.
Keep provider identity distinct from platform user identity, so a future Entra
adapter can authenticate and resolve the same user without rewriting business
modules or role assignments. Do not build a provider registry, simultaneous login
methods, account-linking UI or generic federation framework now. Third-party
integration will need its own redirect/callback flow; replaceability does not mean
all providers implement a username/password interface. Email equality never proves
that two identities belong to the same person.

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

Use a maintained password-hashing library; Argon2id remains the proposed choice.
Do not store plaintext passwords, commit account secrets or build cryptography.
Use generic login failures and basic login throttling. Library settings and
password-input limits belong to the IOP-028 implementation review. See
[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
and [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

Create the small set of prototype accounts through a local operator command or
seed procedure with externally supplied credentials and explicit role assignments.
No registration, invitation, password-reset token, email delivery, account-management
UI, MFA or compromised-password service is a prototype prerequisite. If credentials
need replacement, a restricted operator procedure can replace the hash and revoke
that user's sessions. This is not an organization administrator's global privilege.
A user-facing recovery lifecycle belongs to a later identity integration/design.

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

Login, current-session lookup and logout are semantic contracts,
not selected endpoint paths. Business APIs retain ADR-0011 errors: invalid sessions
return 401, valid but disallowed operations 403 or scoped 404, throttling 429;
infrastructure failure returns a safe service error and never grants access.
Session responses expose only necessary user/display and expiry information, with
`Cache-Control: no-store`. Browser code clears sensitive displayed data on logout
or expiry. Exact DTOs, authentication challenge and error types belong to IOP-028.

### Future Entra adapter contract

This section describes the future integration boundary, not prototype work or a
requirement to obtain corporate access now. IOP-106 must review these details
against the actual tenant and provider configuration when access becomes available.
No Entra SDK, app registration, callback endpoint or test tenant is needed now.

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
Provider email, callback and Entra-outage cases belong to future IOP-106 validation;
they are not prototype acceptance gates.

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
implementation, including cookie/proxy behavior, fixation, logout replay and races.
Verify provider-specific cases only when the corresponding adapter is implemented.
Background service identities and durable job execution remain IOP-010 contracts;
a browser session is not a machine credential.

## Consequences and acceptance boundary

The prototype scope is basic login/logout, current-user resolution, manually
created accounts and a replaceable identity boundary. Essential password/session
protection and accepted scoped permissions remain required. Enterprise account
lifecycle, self-service recovery and multi-provider linking are deferred. It does not provide MFA, corporate
lifecycle synchronization or proof of production readiness. Reconsider a dedicated
provider if those become immediate requirements. Libraries, schema, hashing costs,
throttle thresholds and deployment configuration remain implementation choices.

The owner clarification selects the prototype direction, not every technical
choice in this proposal. PostgreSQL session persistence, cookie policy and timeout
defaults remain recommendations for review. On explicit acceptance, synchronize ARCHITECTURE.md, modules, data model, glossary
and ADR-0004 follow-up notes and close IOP-007 as design. IOP-028 and IOP-106 remain
separately authorized implementation work. Official sources above were consulted
on 2026-09-15; the recommendation and timeout defaults are IOP design judgments.
