# IOP-189 — Local test-account password reset

Status: Completed

The owner requests the same supplied password for all existing local accounts to
switch identities during testing. Apply it to non-deleted accounts in the configured
organization/site, without a forced password change. Preserve account names, IDs,
profiles, access state and business data. Revoke existing sessions and clear login
failure counters. Use separate Argon2id salts and never commit or log the password.
This is a one-time local operator action, not a default for future accounts.

Follow the existing local authentication ownership and operator boundary in
[ADR-0035](../../architecture/adr/ADR-0035-transitional-authentication.md).
No application change, schema change or deployment is required.

[Execution plan](../completed/IOP-189-local-test-passwords-plan.md).

Completed for all 25 existing active accounts. Four profiles passed real login/
logout checks; stored identities, access and operational data remained unchanged.
