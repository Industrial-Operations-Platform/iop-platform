# IOP-207 — External integration readiness

## Status and goal

In progress under the owner's [IOP-203](IOP-203-platform-completion.md) authorization.
Prepare IOP-102/104–107 receiving boundaries and provider adapter structure.

## Scope and acceptance

- [ ] Generic scoped integration registry and explicit unconfigured/ready/error
  status with required-input checklist and safe freshness/error metadata.
- [ ] Read-only WinCC, Ultimo and Entra adapter interfaces and contract-tested
  local fixtures, independent of core entities and provider credentials.
- [ ] Missing real transports/configuration remain clearly unimplemented; no
  simulated fixture is reported as a successful provider connection.
- [ ] Operator-facing readiness view and safe configuration/secret references.

## Evidence and remaining work

Execution plan is created on `feature/IOP-207-integration-readiness` before edits.
Real API/schema/access details, credentials, corporate identity policy and authorized
compatibility checks remain pending.
