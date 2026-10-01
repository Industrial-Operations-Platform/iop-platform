# IOP-189 — Local test-account password reset

Status: Completed

Branch: `docs/IOP-189-local-test-passwords`, from `develop` at `eb50f48`.
Authorization: [owner request](../items/IOP-189-local-test-passwords.md).
The unmerged IOP-188 branch remains intact and outside this operation.

1. Inspect existing local accounts with the setup image and configured scope.
   Refuse accounts shared with another organization/site.
2. Use a temporary operator script outside the repository, reusing NodePasswords
   and existing authentication tables. Supply the password through private stdin.
   In one transaction under the organization access lock, update only target
   credentials, revoke their sessions and append a credential-free operator audit.
3. Verify each salted hash, no mandatory password change, unchanged identity/access
   and operational data, plus representative real login/logout and service health.
4. Remove temporary scripts, record counts/evidence, validate documentation links,
   archive this plan and commit the documentation locally. Ask before publication.

Expected repository files: this plan, the permanent item and backlog only.
No product implementation changes or new architectural patterns. Full application
tests are unnecessary for this data-only operation; validate the actual operation.

## Evidence

- Existing installation: 25 credentials, all active, no deleted accounts.
- One transaction updated all 25 credentials with independently salted Argon2id
  hashes, incremented credential versions, cleared failures/blocks and disabled
  mandatory password change. All 25 saved hashes were verified before commit.
- Revoked four prior sessions and recorded one password-free operator audit per
  account. Account names, IDs, profiles, memberships, role assignments and
  Workforce/Handover records/revisions had identical before/after fingerprints.
- Verified real login, correct account context and logout for Administrator,
  Task Force, Team Leader and Technician through `http://127.0.0.1:8080`.
  An initial internal-container HTTP probe was rejected with 403 by host/origin
  protection after the successful commit; the external loopback probes passed.
  The reset was not repeated. Verification sessions were logged out.
- Web `/` and API `/health` returned HTTP 200. No rebuild, restart, schema change
  or operational data reset was needed. Temporary operator scripts were removed;
  the password only entered through non-echoed stdin and was not saved in files.
- Documentation link/status checks and `git diff --check` pass. No application
  code changed, so no application suite was rerun. Commit this documentation
  locally; publication is pending approval. Restore the prior IOP-188 working
  branch afterward, preserving its pending review state.
