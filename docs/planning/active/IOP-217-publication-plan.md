# IOP-217 — Approved publication and local activation

In progress, 2026-10-20. Story branch:
`feature/IOP-217-admin-configuration-demos`, based on develop `2bc1ca8`.
[Permanent scope](../items/IOP-217-admin-configuration-demos.md).

## Authorization and scope

The owner requested merging IOP-217 and its dependent IOP-218 into develop,
publishing both story branches and develop to origin, and updating local Docker
images. Preserve application records, private configuration and persistent volumes.
No new product behavior is included.

Files: this plan (moved to `completed/` at closure), the IOP-217 item and its
backlog row. IOP-218 records its own publication and activation evidence.

## Steps and validation

1. Fetch origin and confirm the clean source and develop baseline; record this
   authorization before merging IOP-217, followed by IOP-218.
2. Verify source ancestry and equality of the integrated application tree with
   the already validated IOP-218 tip `c449e82`. Check documentation and whitespace.
3. Build setup/API/web images on develop, run standard local setup and Locator
   reference copy, then activate the services without deleting volumes.
4. Inspect installed permission enforcement and retained demo data; retain prior
   story test evidence when application content is unchanged.
5. Atomically push the three approved refs and verify remote parity. Complete
   each story's evidence on its branch, merge and publish those documentation
   increments, then verify final ancestry and a clean develop checkout.

## Initial evidence

- Fetch succeeded; local and origin develop are `2bc1ca8`. IOP-217's validated
  implementation is `f6e0400`, contained in IOP-218 `c449e82`.
- Existing database, API and web are healthy. Only application images will be
  rebuilt; the pinned PostgreSQL version and data volumes remain unchanged.

Final merge, runtime and publication evidence will be recorded before closure.
