# IOP-218 — Approved publication and local activation

Completed, 2026-10-20. Story branch:
`feature/IOP-218-team-availability`, explicitly based on IOP-217 `f6e0400`.
[Permanent scope](../items/IOP-218-team-availability.md).

## Authorization and integration

The owner requested merging IOP-217 and IOP-218 into `develop`, publishing all
three branches to `origin`, and updating the local Docker images. Retain story
branches and persistent volumes. This slice changes publication evidence only;
application behavior remains the validated IOP-218 implementation `c449e82`.

Fetch confirmed develop `2bc1ca8`. Authorization was committed as `487f47c`.
IOP-217 merged as `dd77c0c`, then IOP-218 as `1ec106e`, without conflicts. Both
source tips are ancestors of develop. Its application tree equals `c449e82`;
only publication documentation differs. The retained [implementation evidence](IOP-218-team-availability-plan.md)
therefore applies: 245 web tests, 61 tooling tests and both desktop/mobile browser
scenarios passed, with API regression and the IOP-217 full API suite unchanged.

## Docker activation and retained scenarios

- Setup/API/web images built successfully on integrated develop; the web build
  and design guard reused validated cache. API/web were recreated and all three
  services are healthy. Web and proxied `/health` return HTTP 200 on port 8080.
- Standard setup verified 78 unchanged seed dates with no imports. Locator copied
  75 retained private files. Private configuration, PostgreSQL version and named
  volumes were preserved; no credentials or users changed.
- Read-only absence inspection reports all 12 scenarios complete, four primary
  groups with five members each, and zero writes. Unrelated Workforce data and
  all Formal Handover records/history retain their original digests.
- Operational inspection confirms all 25 users retain 175 dated weekly records;
  all 128 working user-days have assignments. The eleven retained assignment
  tombstones, six Improvements and four formal transfers remain intact. Original
  data and full analytical totals are unchanged.
- All 250 installed permission assertions across 25 users passed after recreation.
  Initial documentation checks passed for 19 Markdown files and 307 relative
  links; whitespace, conflict-marker and indexed secret checks also passed.

## Publication and closure

The atomic push succeeded. Independent `git ls-remote` verified develop
`1ec106e17c74ec4462142585d66e078710192a2f`, IOP-217
`6aee1c506fb3ec88662d596319fb45d081b05d4d` and IOP-218
`487f47ce774aa6e07dacc9e78ab260abd19b4c03` on origin.

This completion increment updates only this plan, the item and backlog row on
the story branch. It follows the approved merge/push sequence into develop;
final links/status, ancestry, application equality, remote parity and clean-tree
checks accompany closure. Final hashes are reported outside their own commits.
Remote deployment and stage/master promotion are outside this authorization.
