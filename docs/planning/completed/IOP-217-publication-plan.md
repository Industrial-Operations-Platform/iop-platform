# IOP-217 — Approved publication and local activation

Completed, 2026-10-20. Story branch:
`feature/IOP-217-admin-configuration-demos`, based on develop `2bc1ca8`.
[Permanent scope](../items/IOP-217-admin-configuration-demos.md).

## Authorization and integration

The owner requested merging IOP-217 and its dependent IOP-218 into develop,
publishing both story branches and develop to origin, and updating local Docker
images. Preserve application records, private configuration and persistent volumes.
No new product behavior is included.

The fetched develop baseline was `2bc1ca8`. Authorization was committed as
`6aee1c5`; IOP-217 merged as `dd77c0c`, followed by IOP-218 as `1ec106e`, without
conflicts. Both story tips are ancestors of the integrated branch. The only
differences from validated combined implementation `c449e82` are publication
documentation, preserving the [story test evidence](IOP-217-admin-configuration-demos-plan.md).
The existing 531 API, 245 web and 61 tooling test results apply unchanged.

## Local activation and checks

- Docker built setup/API/web successfully on integrated develop, including the
  cached web build/design guard. Image IDs: setup `20132e75981e`, API
  `1185a3aafb74`, web `912661478473`. Unchanged runtime content reproduced the
  existing API/web image IDs.
- Standard setup completed: 78 seed dates, 42,220 rows, frequency 212,411 and
  56,391,042 exact seconds; zero dates imported and 78 unchanged. Locator copied
  75 retained private files. API/web were recreated; database volumes retained.
- Database, API and web are healthy. Web and proxied `/health` return HTTP 200
  at `http://127.0.0.1:8080`; health proves process response only.
- All 250 installed permission assertions passed again across 25 active users.
  Read-only inspection confirmed six Improvements, four formal transfers, 175
  weekly rows and all 128 working user-days assigned. Original-data digest and
  analytical totals remain unchanged: 60,735 facts, 104 publications, frequency
  316,864 and 79,968,310 seconds. IOP-218 absence states remain intact.
- Initial checks passed: 19 changed Markdown files, 307 relative links, no
  conflict markers, clean whitespace and indexed secret hygiene (1,230 files).

## Publication and closure

The atomic push succeeded. Independent `git ls-remote` verified develop
`1ec106e17c74ec4462142585d66e078710192a2f`, IOP-217
`6aee1c506fb3ec88662d596319fb45d081b05d4d` and IOP-218
`487f47ce774aa6e07dacc9e78ab260abd19b4c03` on origin.

This completion increment changes only this plan, the item and backlog row on
the story branch. It follows the approved merge/push sequence into develop;
final link/status, ancestry, application equality, remote parity and clean-tree
checks accompany closure. Final hashes are reported outside their own commits.
Remote deployment and stage/master promotion are outside this authorization.
