# Integration readiness

Integrations owns a scoped WinCC/Ultimo/Entra registry with nonsecret configuration
and immutable revisions. Administrator edits configuration; Administrator, Team
Leader and Task Force inspect readiness/history. Every operation checks current
profile, membership and grants on a pinned scoped transaction.

`contract-ready` means typed adapters and local normalization tests exist. It never
means a real provider is connected. Disabled/configuration-pending/transport-pending
states enumerate actual missing inputs; last successful connection stays absent.
No registry operation makes outbound requests or changes local authentication.

WinCC receives exact aggregate counts/alarm seconds with unknown source windows.
Ultimo retains opaque external references and maps vendor statuses through adapter
configuration; unmapped statuses remain unknown. Entra accepts claims only from
an injected verifying transport with approved tenant/issuer; it neither parses
unverified tokens nor assigns platform permissions. Real transports must validate
signature/audience/expiry, provenance, budgets and receiver contracts before use.

Endpoint metadata must be HTTPS without credentials, query or fragment. Store a
logical credential reference, never a password/token. Credential binding is private
operator configuration. Original vendor schemas and mappings stay in adapters.

Pending: authorized endpoints, reviewed source schema/version, credentials, Entra
identity/audience policy, actual transports and real compatibility/freshness evidence.
Local fixture tests cannot satisfy real-connection acceptance.
