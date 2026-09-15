# ADR-0014: Explicit permissions with scoped role assignments

## Status

Accepted — explicitly approved by the owner following the proposal review. Prepared under [IOP-006](../../planning/items/IOP-006-rbac-model.md).
The accepted authorization baseline is synchronized under the
[acceptance plan](../../planning/completed/IOP-006-rbac-acceptance-plan.md).

## Context

IOP needs reusable enterprise boundaries while delivering a small CSV analytics
pilot with individual access. The owner explicitly wants basic pilot authentication
and room for future enterprise identity integration, not that integration now.
Authentication implementation belongs to IOP-007. This decision addresses what an
identified user may do, independently of how that identity was verified.

Accepted [personas](../../product/personas-and-pilot-workflow.md) establish that
Team Leaders and Taskforce consult/filter predefined executive and detail reports.
The Administrator manages imports, quality review, configuration and users.
Management receives presentations and needs no account. Personas are business
responsibilities, not hard-coded customer-specific role names.

ADR-0012 requires explicit organization/site scope with no implicit all-site access.
ADR-0013 adds shared-table isolation and RLS; it does not define business grants.
The seed item requests a Role → Permission → Scope matrix but enumerates no models.
The alternatives below are project design judgments against these requirements.

## Alternatives evaluated

| Model | Benefit | Limitation for this scope | Recommendation |
| --- | --- | --- | --- |
| Global Reader/Admin roles | Small initial model. | An Admin flag does not say which organization/site is allowed; encourages broad bypasses and mixes data access with administration. | Reject. |
| Named permissions bundled into explicit scoped roles | Small reviewable catalog; separates domain operations, assignment scope and identity; supports the confirmed pilot responsibilities. | Requires explicit assignments and receiving-module checks; additions need catalog review. | Select with ownership/status conditions described below. |
| Direct per-user permission grants | Fine-grained exceptions without defining roles. | Harder to review and revoke consistently as users grow; duplicates common bundles. | Do not add for the pilot. |
| General attribute/relationship policy engine | Can express ownership, relationships and dynamic conditions across complex domains. | No established need for arbitrary policies or an external engine in the pilot; adds policy lifecycle/tooling. | Defer the engine; retain mandatory ownership/status checks in the selected model. |
| Identity-provider groups/roles used directly | Can align with corporate identity management. | Couples permissions to the provider and cannot replace IOP site ownership and grants. | Reject direct use; a future adapter may map verified identity through an explicitly designed provisioning process. |

OWASP recommends least privilege, default denial and permission validation on every
request, and discusses the flexibility of attribute/relationship models relative
to plain RBAC. Our scoped roles still require resource ownership and active-status
checks; a role name alone never authorizes access. See
[OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
Nest supports role and permission checks using guards; that capability does not
choose IOP policy or cover non-HTTP execution. See
[Nest authorization](https://docs.nestjs.com/security/authorization).
No authorization library or policy service is selected.

## Decision

### Permission and assignment contract

Use a small, version-controlled permission catalog owned by the relevant modules.
Permissions name operations, not pages, job titles or customer labels. Keep role
bundles explicit and reviewable; the pilot has no custom-role editor, per-user
exceptions, wildcard permission, explicit-deny rules or role hierarchy.

An assignment identifies a platform user, a known role and exactly one valid scope:
organization (`organizationId`) or site (`organizationId`, `siteId`). Each role
has one allowed scope kind. Multiple assignments may compose responsibilities.
A user must be active and have active organization membership. Site access also
requires a matching site-role assignment; membership alone grants no permission.
The assignment must reference a site owned by that organization. No separate,
redundant site-membership flag is required for pilot authorization.

Allow an operation only when all of these hold:

1. Authentication has supplied a valid platform principal and the user is active.
2. Active organization membership and the requested target's ownership are valid.
3. A current assignment at exactly the required scope includes every permission
   required by the operation. Permissions may combine across matching assignments.
4. The receiving module verifies the target record, referenced records and its own
   domain conditions within that same scope.

Otherwise deny. Unknown permissions, role IDs, scope kinds, missing assignments,
missing site selectors and unavailable authorization state never broaden access.
Organization assignments apply only to organization operations; site assignments
apply only to that site. There is no inheritance to existing or newly created sites,
no location-based scope and no cross-organization role. Any future cross-site read
must validate the full explicit site set under ADR-0012 before executing it.

### Pilot Role → Permission → Scope matrix

These identifiers are accepted semantic contract names, not implemented schemas.
Each permission has one scope kind; `manage` is bounded by its described operation,
not permission to execute arbitrary actions. Permission additions require review.

| Permission | Owner and allowed behavior | Scope | Role bundle |
| --- | --- | --- | --- |
| `analytics.read` | OIP: query/filter predefined executive/detail reports and inspect contributing normalized records, period, provenance references and quality context. Does not expose unrestricted RAW payloads or edit reports. | Site | `analytics-reader` |
| `imports.submit` | Integrations: submit the supported CSV to the configured target site. Does not authorize arbitrary source connections or industrial writes. | Site | `site-operator` |
| `imports.review` | Integrations: inspect import status, reconciliation, rejected/unresolved rows and scoped RAW evidence needed for quality review. Does not imply deletion or replay/correction actions whose contracts are not yet defined. | Site | `site-operator` |
| `site-configuration.manage` | Owning modules: maintain the site's supported source mappings and report configuration using implemented metrics/groupings/charts. No new formulas, site transfer, role edits or platform secrets. | Site | `site-operator` |
| `access.manage` | Users/RBAC: inspect and administer organization membership and the fixed role assignments in this organization, subject to the delegation rules below. | Organization | `organization-access-admin` |

`site-operator` does not implicitly contain `analytics-reader`. Give a user both
when they need both responsibilities. `organization-access-admin` does not include
site data access or site configuration. The scope type is part of each permission's
contract, not something inferred from a null site field.

| Confirmed pilot responsibility | Accepted assignments |
| --- | --- |
| Team Leader | `analytics-reader` for each explicitly authorized site. |
| Taskforce investigator | The same `analytics-reader` bundle for each explicitly authorized site. No separate role solely because the job label differs. |
| Administrator / initial data operator | `organization-access-admin` for the organization, plus `site-operator` and `analytics-reader` for each site they operate and inspect. |
| Management recipient | No account or assignment required for receiving the Team Leader's presentation. |

One organization and one site can use this exact model without a selector UI or
hierarchy-management product. The server still receives/resolves an explicit,
authorized target. Customer-facing labels may be configured independently of
stable permission identifiers. Reuse in another business application comes from
the actor/action/scope contract and module-owned permissions, not carrying OIP's
analytics permissions into every application.

### Access administration and escalation boundaries

An `organization-access-admin` is explicitly trusted to administer access throughout
its own organization. It may grant/revoke the three fixed bundles, including another
access administrator or its own site access, but must create explicit assignments
for each site. This is deliberate delegation authority, not an implicit data grant.
If administrators must be unable to grant themselves access, a separate approval
or separation-of-duties design would be required; it is not part of this pilot.

Validate both actor authority and every assignment's organization/site ownership.
Do not authorize an assignment mutation merely because its ID exists. An admin in
A cannot modify membership or assignments in B, disable a shared platform identity
globally, change role definitions, bypass RLS or grant arbitrary new permissions.
Removing membership in A stops A access and revokes its assignments; restoring
membership must not silently reactivate those former grants. Other organizations'
access remains independent.

Membership records expose only the user information needed for administration in
that organization. No global user directory or arbitrary identity search is implied.
Identity creation/linking and account recovery are IOP-007 contracts. Keep the
initial administrator bootstrap and exceptional recovery as explicit operator
procedures in implementation, not a public self-promotion endpoint. They must
record actor, organization, assignment and reason; no default shared admin login.

Ordinary access administration must not remove/demote the last active access admin
of an organization. Check this atomically with the mutation so concurrent removals
cannot both pass. Global identity disablement must still stop access even if that
leaves an organization requiring operator recovery. Exact locking and recovery
mechanisms remain implementation/authentication work.

### Enforcement, revocation and persistence

Authentication maps identity to a platform principal under ADR-0004. Users/RBAC
owns current membership, assignments and authorization decisions. Platform Core
owns organization/site identity. Receiving modules declare permissions and enforce
resource invariants. HTTP guards can reject requests early, but internal calls,
workers and configuration-loading paths must use equivalent checks.

The authorization contract takes principal, action and explicit target and returns
allow/deny with safe internal reason information. Provider tokens and group names
do not become business permissions. UI visibility only helps navigation; direct
API/record access must enforce the same rules. Follow ADR-0011's 403 for disallowed
operations and scoped 404 behavior for inaccessible resources without revealing
foreign identifiers. Infrastructure failure cannot become an allow result.

Resolve current authorization on every operation; do not keep a permission snapshot
for the lifetime of a login token. For the pilot, avoid a permission-result cache.
A completed revocation must affect checks started afterward. An already-authorized
in-flight operation may finish; immediate cancellation of all work is not promised.
Recheck each new job execution/chunk/retry and result retrieval. Sensitive access
mutations serialize authority validation with their mutation so a completed
revocation cannot be bypassed by a later grant transaction using stale state.
Exact transaction coordination needs verification in implementation.

Business authorization precedes installation of the validated database context
required by ADR-0013. RLS constrains rows to that context; it does not decide which
role can import or manage access. Membership/assignment lookup must use a narrow
Users/RBAC contract constrained by principal and target organization; it cannot
require the very permission it is resolving or open a global business-data bypass.
Detailed lookup policies and schema design remain implementation review gates.

Represent memberships and assignments as organization-owned data, with explicit
site ownership on site assignments and constraints on role/scope compatibility.
Do not store permissions as arbitrary strings supplied by the browser or provider.
Role definitions are controlled application configuration, not editable customer
business data. Access mutations must produce traceable actor/action/target and
before/after grant information; audit storage/delivery belongs to IOP-009.

Report configuration remains file-based under the accepted IOP-002 decision.
`site-configuration.manage` describes who may approve/apply scoped changes, without
adding a configuration UI. A future loader/admin command must validate the acting
principal and target, configuration scope and supported values; privileged deployment
file access remains an operational trust boundary, not a protection supplied by RBAC.

### Minimal pilot and deferred expansion

The pilot needs the fixed catalog, assignments, centralized evaluation and checks
at the relevant module operations. A small authorized provisioning mechanism may
manage initial memberships and assignments; this design does not require a user or
role-management UI. No enterprise federation, arbitrary policy language, group sync,
role inheritance, approval workflow, custom roles, export permission or deferred
module permission catalog is introduced. Credentials and session handling remain
IOP-007, preserving the owner's basic-authentication-first direction.

Future needs can add reviewed module permissions and bundles behind the same
contract. Consider an attribute/relationship engine only when concrete rules no
longer fit this explicit model. Such expansion must not silently broaden existing
roles or newly created sites. Keep ADR-0013's isolation controls for the pilot.

## Review scenarios and future implementation verification

These are design walkthroughs, not executed tests. A/B are fictional organizations;
A1/A2/B1 are their sites.

| Scenario | Expected behavior |
| --- | --- |
| Reader at A1 queries executive/detail reports and contributing normalized evidence | Allow within A1, preserving period/quality context. |
| Reader submits CSV, opens unrestricted RAW or changes configuration | Deny absent the appropriate site-operator permissions. |
| Site operator reviews A1 import but has no analytics-reader assignment | Import review allowed; analytical report access denied until explicitly granted. |
| User is a member of A but has no assignments | Deny business operations; login alone gives no data access. |
| Organization access admin queries A1 analytics without site assignment | Deny; explicit delegated self-assignment is possible and traceable. |
| A1 reader requests A2/B1, or pairs A with B1 | Deny; role label and foreign IDs cannot override target ownership. |
| Admin in A attempts to grant a role at B1 or change B membership | Deny before mutation. |
| User combines reader at A1 and operator at A2 | Permissions combine only within each target; no A1 imports or A2 report access implied. |
| A new site is created or a site selector is omitted | No automatic grants; missing site for a site operation is rejected. |
| Unknown role, permission, wildcard or incompatible assignment is submitted | Reject; no configurable escalation through arbitrary identifiers. |
| Membership is removed and later recreated | A access stops; previous assignments do not revive automatically; B is unaffected. |
| Last two admins are concurrently demoted | At most one demotion succeeds; ordinary administration retains an active admin. |
| Admin authority is revoked while a grant request is pending | Serialized authority check prevents stale grant mutation after revocation wins; verify both transaction orders. |
| Login persists after revocation or user disablement | New authorization checks deny; previously issued token is not a permission snapshot. |
| Job is queued before access loss | New execution/chunks/retries and result retrieval recheck and deny; no worker bypass. |
| Forged browser role or future provider group claims Admin | No grant without verified identity mapping and explicit platform assignments. |
| Direct internal call or configuration loader bypasses a controller | Receiving contract still checks action/scope; no guard-only authorization. |
| Proposed future multi-site report includes unauthorized A2 | Deny the whole requested set, not a silently incomplete total. |

Implementation must verify these positive and negative cases using the accepted
Jest, API and PostgreSQL testing stack, including transaction races and runtime RLS
credentials. No runner, schema, authorization service or performance result exists
in this documentation-only task.

## Consequences and acceptance boundary

Three small bundles cover the confirmed responsibilities without encoding customer
job titles or building enterprise identity integration. Explicit per-site grants
cost more provisioning steps than a global admin flag but keep scope visible.
Access administration is powerful within one organization; its delegation behavior
must be understood when assigning the role. This proposal deliberately avoids
custom policies and their conflict rules for the pilot.

The owner explicitly accepted this matrix and its delegation rules. ARCHITECTURE.md,
modules, data model, glossary and affected ADR follow-up notes are synchronized.
IOP-006 is complete as design; no implementation or adjacent story is activated.
Official OWASP and Nest sources informed the evaluation; acceptance came from the
owner's explicit confirmation. Runtime authorization verification remains future work.
