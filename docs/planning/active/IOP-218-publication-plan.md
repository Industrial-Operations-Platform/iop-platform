# IOP-218 — Approved publication and local activation

In progress, 2026-10-20. Story branch:
`feature/IOP-218-team-availability`, explicitly based on IOP-217 `f6e0400`.
[Permanent scope](../items/IOP-218-team-availability.md).

## Authorization and scope

The owner requested merging IOP-217 and IOP-218 into `develop`, publishing all
three branches to `origin`, and updating the local Docker images. Retain story
branches and persistent volumes. This slice changes publication evidence only;
application behavior remains the validated IOP-218 implementation `c449e82`.

Files: this plan (moved to `completed/` at closure), the IOP-218 item and its
backlog row. The separate IOP-217 publication plan owns its story evidence.

## Steps and validation

1. Fetch origin; verify clean source branches and the develop baseline. Record
   authorization on each story branch before integration.
2. Merge IOP-217, then IOP-218 into develop without rewriting history. Check
   ancestry, conflict markers and equality with the validated application tree.
3. Rebuild setup/API/web images from integrated develop. Run the standard local
   setup and Locator reference copy, then activate and check healthy services.
4. Inspect retained demos and permissions. Reuse story tests when application
   equality holds; run the integrated build/design guards through Docker.
5. Publish the three approved refs atomically; verify remote parity. Complete
   story documentation on its source branch, merge and publish that evidence,
   then verify clean develop and final remote parity.

## Initial evidence

- Fetch succeeded; local and origin develop are `2bc1ca8`. The source checkout is
  clean. IOP-217 is `f6e0400`; IOP-218 is `c449e82` and contains IOP-217.
- Existing API, web and database containers are healthy. Their persistent volumes
  remain in place throughout the update.

Final merge, runtime and publication evidence will be recorded before closure.
