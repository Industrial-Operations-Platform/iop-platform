# ADR-0018: Bounded local POC execution context

## Status

Proposed — prepared under [IOP-142](../../planning/items/IOP-142-poc-delivery-scope.md).
The owner accepted a local single-operator POC without login; the mechanism below
has not been accepted. No runtime implementation is authorized by this proposal.
ADR-0015 and ADR-0017 IDs are reserved on existing review branches.

## Context

The [POC scope](../../product/scope-poc.md) postpones login and interactive access
administration. Accepted ADR-0004 keeps providers out of the domain; ADR-0012/0013/0014
require an actor, permissions, explicit scope and isolated persistence. A hard-coded
allow-all guard or missing-scope default would contradict those decisions.

## Proposed decision

Introduce a development-only execution adapter at the host boundary for the local
POC. It supplies a stable seeded platform principal and explicitly configured
organization/site target. It does not claim to verify a human identity. Keep the
same provider-independent operation context consumed by business modules.

- Seed an active development user, organization membership and explicit `site-operator` and
  `analytics-reader` assignments at the configured site. Neither role inherits
  the other; both are needed for import and analysis. Use the existing permission catalog;
  do not grant organization administration, wildcard scope or cross-site authority.
- Evaluate those explicit grants for each operation. No user CRUD, login/session,
  role delegation or membership editor is needed for the POC.
- Require explicit development-mode activation and validated configuration; reject
  absent or mismatched actor, scope, membership or grants. The browser cannot select
  an arbitrary trusted principal. Any requested foreign scope is rejected.
- Limit the mode to a dedicated local demo environment, with browser/API listeners
  restricted to loopback and no shared/public hosting. Treat the local machine and
  its operator as trusted; this is not identity isolation between local processes.
  Verify browser-origin protection for mutations rather than assuming loopback alone
  prevents requests from unrelated web pages.
- Preserve ADR-0013 transaction-local scope, scoped constraints, enabled/forced RLS
  and a non-owner runtime role. RAW files and derived data preserve the same scope.
- Fail startup if this mode is selected for shared/deployed operation. Do not add
  a fallback that silently enables it after authentication fails.
- Before shared use, replace the host adapter with accepted real authentication and
  complete lifecycle/admin and authorization verification. Preserve module contracts.

This would be a narrow exception to the verified-authenticated-actor prerequisite
for this explicit local mode only, not a replacement of scope or RBAC semantics.
Accepted ADRs remain unchanged until this record is accepted. Detailed seed and
origin/startup checks must be planned and tested before implementation is complete.

## Alternatives

| Option | Assessment |
| --- | --- |
| Implement local passwords and sessions immediately | Defeats the approved login deferral and adds credential lifecycle work. |
| Remove actor/permission checks or disable RLS | Reject: bypasses accepted boundaries and creates migration risk. |
| Explicit local principal with bounded grants | Recommended: small replaceable host adapter, retaining domain checks; cannot authenticate people. |
| Pure static UI mockup | Useful for independent UI work but does not validate the full CSV/persistence workflow. |

## Validation required before delivery

Prove successful local import/read, rejected foreign/missing scope and missing grants,
RLS under real runtime credentials, rollback/pool reuse, no client-selected actor,
origin rejection for mutations, and refusal to start in a nonlocal deployment mode.
Document the dedicated reset target and show that real authentication never falls
back to this adapter. No such tests have run in this documentation-only repository.

## Consequences and acceptance boundary

Only the minimal seeded identity/grant evaluation is required by this proposal;
full IOP-027–031 capabilities remain later work. This adds a small host boundary and
its tests but avoids implementing temporary credential infrastructure. It does not
make a no-login POC safe for shared access or establish production readiness.

Dependent runtime work must wait for acceptance. Pure parser, fixture, bootstrap and
UI work may proceed under their own plans. Product scope/dependency documentation
can be completed while this mechanism remains Proposed.
