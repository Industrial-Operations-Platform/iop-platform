# IOP-207 — External integration readiness

## Status and goal

Completed local readiness slice under the owner's [IOP-203](IOP-203-platform-completion.md) authorization.
Prepare IOP-102/104–107 receiving boundaries and provider adapter structure.

## Scope and acceptance

- [x] Generic scoped integration registry and explicit disabled/configuration-pending/
  transport-pending states with required-input checklist and absent successful
  connection metadata; no observed freshness/error is fabricated.
- [x] Read-only WinCC, Ultimo and Entra adapter interfaces and contract-tested
  local fixtures, independent of core entities and provider credentials.
- [x] Missing real transports/configuration remain clearly unimplemented; no
  simulated fixture is reported as a successful provider connection.
- [x] Operator-facing readiness view and safe configuration/secret references.

## Evidence and remaining work

The [completed execution](../completed/IOP-207-integration-readiness-plan.md)
records API 6, web 2 and real PostgreSQL 4 checks plus actual local desktop/390px
review of three disabled providers, with no page errors or horizontal overflow.
Host/controller/navigation, generated contracts, current scoped permissions and
German resources are integrated.

IOP-102 closes only configurable-source registry acceptance. IOP-104–107 remain
In progress for actual provider transports, reviewed source schema/version,
private access/credentials, corporate identity policy/principal mapping and
authorized real compatibility/connection/freshness observations. Actual corporate
login is pending; readiness never replaces the local Authentication adapter.
