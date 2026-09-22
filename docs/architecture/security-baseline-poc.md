# Local POC security baseline

Defined under [IOP-014](../planning/items/IOP-014-security-baseline.md) for the
[owner-approved POC](../product/scope-poc.md). This is a delivery requirements
baseline, not evidence that the controls are implemented. It applies only to
manual CSV → preparation → verified analysis → presentation by one local operator.
It introduces no identity mechanism and does not accept [ADR-0018](adr/ADR-0018-local-poc-execution-context.md).

## Trust boundary and dedicated operation

Trust the dedicated local machine, its operating-system account and the operator
who controls configuration and development commands. Do not claim isolation from
other local processes, a privileged database operator or a compromised host.
Treat browser requests, filenames, CSV cells and source labels as untrusted data,
even when the operator selects the input manually.

Use loopback listeners for the browser host and API; any published database port
must also remain local. No LAN/public binding, tunnel, shared hosting or production
database belongs to this demonstration. Container networking, if delivered, must
preserve that host exposure boundary. Use a dedicated demo database/storage target
and keep authorized reference input outside the repository and browser public assets.
Only synthetic fixtures belong in version control. Local runtime storage permissions
must restrict access to the intended operating-system account.

Loopback exposure does not establish caller identity or prove that an unrelated
web page cannot send a mutation. Before delivering business mutations, specify and
test permitted browser origins, unexpected Host values and cross-origin requests,
including simple form submissions, missing/null origins and direct API calls.
CORS response visibility alone is not mutation authorization. Exact origin/host
checks belong to the host delivery plan; they must fail closed for unsupported
callers without making local tools an authorization bypass.

The existing [IOP-016 host](../../apps/api/README.md) exposes only public process
health, with loopback binding, validated PORT and sanitized failures. Health gives
no business-readiness or scoped-data-access guarantee. This document does not
retroactively claim that business-origin checks or persistence exist.

## Configuration and secrets

The IOP-018 configuration slice must document accepted fields, sources/precedence,
required values and validation at startup or before applying a configuration change.
Reject malformed or contradictory values without partially applying configuration.
Defaults may cover documented non-sensitive host settings; missing business scope
must never default to unrestricted access or silently select the first site.

- Validate explicit organization/site/source ownership, site time zone and source
  mapping references before use. Keep customer labels and source schemas in scoped
  configuration/adapters. Unknown mapping outcomes stay visible.
- Examples and fixtures contain placeholders or fictional values only. Keep secrets,
  connection credentials, production records and local configuration out of Git,
  frontend bundles, screenshots, errors and logs. Ignore rules do not remove already
  tracked content; review the staged diff before committing configuration examples.
- Frontend configuration is public. Keep database credentials server-side; future
  runtime credentials must differ from migration/owner credentials and must not
  bypass RLS. Do not add secrets merely to support the health-only host.
- Validate explicit development activation and dedicated targets before any future
  local execution adapter is used. No fallback from failed authentication to local
  mode. ADR-0018's proposed startup/identity mechanism still requires acceptance.
- A demo reset must verify its dedicated target and reject missing/foreign targets
  before deleting data. Reset design and executable evidence belong to IOP-128;
  this baseline does not authorize a reset command or production recovery tooling.

## Bounded input and safe interpretation

Each delivered path must declare finite budgets in its contract/configuration and
verify them server-side. Browser checks improve feedback but are not enforcement.
Do not rely solely on Content-Length or a filename extension to validate an upload.

| Surface | Required bounds and rejection behavior | Delivery owner |
| --- | --- | --- |
| HTTP request | Limit actual body bytes, supported media types, field lengths and collection sizes; reject malformed types and unsupported fields/values. | API delivery, IOP-110 |
| Manual CSV | Limit total bytes, rows, columns, field/record length and processing time; bound retained validation errors and temporary storage. Stop on exceeded budgets without publishing partial analytics. | IOP-041–048, IOP-110 |
| CSV semantics | Declare encoding, delimiter, headers and numeric/date formats in the adapter; validate required values, finite nonnegative counts/durations and conversion/aggregate overflow. Reject unsupported shapes without silent coercion or row loss. | CSV contract and importer slices |
| Analytical query | Allow only supported filters/sorts/groupings; bound date/filter collections and detail page size under the accepted API strategy. Never translate arbitrary client expressions into SQL. | IOP-089–097 |
| Configuration | Validate shape, supported values, mapping size and scope references before activation; report the failing field without exposing its secret value. | IOP-018, IOP-109–110 |

Exact numeric budgets are delivery choices, not measured performance promises here.
Before enabling a path, its plan must record units, finite defaults, maximum allowed
configuration, timeout behavior and boundary cases at and above each limit. Choose
values against the representative synthetic fixture and record observed timings;
unlimited or unspecified runtime defaults do not meet this baseline.

Parse only the supported CSV; do not execute cell contents, accept uploaded code,
fetch cell URLs or unpack archives as an implicit feature. Original filenames are
metadata, never filesystem paths. Constrain retained input and temporary files to
the dedicated storage root using application-controlled identifiers. Preserve RAW
and provenance within admission limits; oversized or malformed input must not force
unbounded RAW retention. The importer must document rejected-input cleanup and
reconciliation; retention infrastructure remains deferred.

Use parameterized persistence operations and render labels/error excerpts as text,
not executable markup. Do not evaluate spreadsheet formulas. Export is deferred;
this baseline makes no claim that arbitrary CSV cells are safe to open in another
spreadsheet application. Bounded error responses may identify row/field and a safe
reason, without dumping payloads, credentials, database details or foreign records.

Duplicate reporting dates within organization/site/source must be rejected even
when a file is renamed. Failure must not leave partially visible analytical facts;
accepted/rejected counts and unresolved mappings must remain explainable. Exact
import transaction/reconciliation mechanics belong to their importer slice. Unknown
reporting windows remain unknown; validation must not invent occurrence timestamps
or discard unclassified records from totals.

## Scoped access remains mandatory

Retain [ADR-0012](adr/ADR-0012-organization-site-scope.md),
[ADR-0013](adr/ADR-0013-tenancy-data-isolation.md) and
[ADR-0014](adr/ADR-0014-scoped-rbac.md):

- Resolve a valid platform principal through an accepted host mechanism, then check
  current membership, exact action grants and explicit organization/site ownership.
  Browser actor/role/scope values are not authority; missing scope is not a wildcard.
- Preserve scope on source configuration, import runs, RAW evidence, normalized rows,
  detail references and aggregates. Validate foreign references even within the same
  organization. Report readers do not gain unrestricted RAW access; import review
  requires the accepted `imports.review` permission.
- Use scoped relational constraints, enabled/forced RLS and a non-owner runtime role
  without bypass privileges. Install validated transaction-local scope on a pinned
  connection; verify rollback and connection reuse do not leak context. RLS does not
  replace module permission checks or protect files automatically.
- Deny absent grants, invalid ownership or unavailable authorization state. Errors
  must not expose foreign record existence/content. Verify direct API and internal
  operation paths, not just hidden UI controls.

Runtime business access remains blocked on acceptance of ADR-0018 or another
mechanism. Its suggested seeded principal/grants are not implemented or accepted
by IOP-014. Independent configuration, parsing and health work can continue.

## Scenario review and implementation evidence handoff

These are documentation walkthroughs with required future outcomes, not executed
security tests. Fictional organizations A/B and sites A1/A2/B1 provide negative
cases even though the demonstration configures only one organization/site.

| Scenario | Expected outcome / evidence required before path delivery |
| --- | --- |
| Start the existing API and read health | Public fixed process status only; IOP-016 holds prior executable evidence. No principal or database inferred. |
| Select LAN/shared mode or an unrelated reset target | Local demonstration refuses unsafe exposure/target; startup and reset delivery prove rejection. |
| Missing scope, malformed configuration or secret-bearing failure | Reject safely with a field/reason, no secret echo, no partial activation. |
| Valid supported synthetic CSV within every budget | Retain bounded RAW/provenance and reconcile normalized frequency/duration and quality counts. |
| Actual upload exceeds bytes despite misleading length, or huge cell/row/error count | Bounded rejection and cleanup; no partial analytical result. Test at the limit and one above. |
| Invalid number/date, markup, SQL text or path traversal filename | No execution or path escape; safe validation/text handling, bounded reasons and preserved reconciliation. |
| Rename an already imported reporting-date file | Reject duplicate within the same organization/site/source; no automatic replacement. |
| Forge browser principal, omit scope or request A2/B1 using A1 context | Deny; no broader scope or foreign content returned. Requires accepted execution mechanism. |
| Reader requests RAW or imports; operator lacks analytics grant | Enforce the separate permission bundles; no implicit inheritance. |
| Foreign scoped reference, missing database context or connection reused after rollback | Constraints/RLS deny; actual non-owner credentials and pooled connections prove no leakage. |
| Unrelated browser origin submits a mutation, including simple form requests | Reject before a business side effect; verify the selected origin/host controls and allowed local caller path. |
| Valid local import followed by filtered overview/detail | Explicit current grants and consistent scoped totals; unknown/unclassified data remains visible. |

Relevant executable tests accompany the delivering stories, including negative
scope/grant/RLS tests for POC runtime access. Completing this design does not
complete IOP-018/019, ingestion, IOP-108–110 or the POC journey.

## Deferred boundary

No login/session/password design, corporate identity, external integration security,
full audit/retention platform, shared hosting, workers, export, production recovery
or general security certification is introduced. Before shared use, revisit the
trust model and deliver real authentication, current scoped authorization and the
operating controls relevant to that deployment, as required by the POC scope.
