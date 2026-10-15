# IOP-211 — Locator model and access execution

Status: Completed locally. Branch `feature/IOP-211-locator-models-and-access`,
created from develop `e9bd49d`. [Permanent request](../items/IOP-211-locator-models-and-access.md).
Planning/owner-decision commit: `2d85191`; application: `f737191`; source tool: `527fab5`.
No merge, push, stage/master promotion or remote deployment was performed.

## Planned scope and ownership

The plan was created before implementation; the planning commit retains the
original execution refinements. All work belongs to this explicit owner request.
Accepted ADR-0037/0039 record its administrator-only access refinement; no unrelated
Proposed ADR was accepted and no new architectural pattern was introduced.

| Slice | Files and execution |
| --- | --- |
| Access and compact identities | Users/RBAC profiles; Assets/AssetDomain and Locator PostgreSQL adapters; Assets-owned operational search; Overview/Locator composition; owning API/PostgreSQL tests. Restrict standalone Assets/model access and Locator writes to current Administrator, retain independent compact receiving authority for operational readers and deny stale grants. |
| Permission migration and fixture compatibility | `20261014090000-administrator-assets-locator.sql`, exact native migration whitelist and local fixture runners/tests. Revoke only superseded non-admin managed writers, retain unrelated grants and operational authors, and use a separate Administrator `assetActor` for new fixture registry writes. |
| Reusable models and placement | API Locator domain/application/file adapter/controller/DTOs; browser Gateway/domain/workspace/editor/viewport/renderer and German resources. Add motor/photoelectric types, exact registered-ID navigation, bounded private candidate review/apply, complete baseline comparison, immutable attributed revisions and manual/survey/link preservation. |
| Source-message evidence | Locator-owned optional contribution; Assets-owned exact mapping/alias reader; OIP-owned original-message reader; source-specific host rule and administrator draft UI. Preserve source/import/physical-record/date evidence, independent grants, limited/unmapped coverage and explicit application. |
| Private source analysis | `scripts/local/locator-schematic-models.cjs`, `locator-models/{analyze.cjs,native-image.swift}`, synthetic regression and modelling guide. Use bounded macOS decoding, stable source-derived identities and inspection overlays without changing original files or database scenes. |
| Host and shared controls | Workspace host, Assets/Maintenance/Overview/Handover adapters, DepartmentScope and optional ViewNavigation text variant, English/German guidance and browser tests. Hide standalone registry from readers, route exact assets into Locator, combine formal navigation and match compact Area/location controls. |
| Current documentation | Asset/Handover/Overview/operator guides and fixture attribution; module/data-model applicability, delivery map, item/backlog and completion guide. Preserve historical story evidence and unrelated statuses. |

## Implementation safeguards

Source circles and narrow cross-belt bars follow the supplied legend and explicit
owner interpretation. They are motor symbols and provisional photoelectric
candidates, never live-state readings or approved physical identities. Existing
generic sensors remain compatible. A source-specific alarm rule recognizes
`Lichtschranke zu lange belegt`; it does not automatically classify a registry
record, create an identity, approve a mapping or choose physical coordinates.

Candidate application compares every prior component value, including labels and
notes. Modified, linked, surveyed or deliberately cleared later revisions are
preserved; stale revisions conflict. Original PNG integrity is checked before an
apply. Oversized proposals require manual review. Current storage stays at 250
scenes,1 MiB per scene and 16 MiB per site; projected aggregate checks occur under
the existing site write lease before scene/revision/placement/Audit mutations.

The overview uses instanced simplified solids and textures bounded to 512 pixels.
Its transform scales the complete source component matrix after rotation, verified
for vertical/diagonal geometry and differing image/tile aspect. Opened scenes retain
full reusable geometry and automatic exact component focus. The administrator
inspector and mobile component rows wrap within their available width. Readers
receive identity/evidence/camera controls without editor/registry actions.

Formal records remain Handover-owned. Shift records inside Shift Handover retain
exact deep links and distinguish immutable transfer/closure/acknowledgement from
current journal issues. The records entry remains accessible when journal context
fails; missing real Workforce prerequisites remain explicit.

## Validation evidence

| Gate | Result |
| --- | --- |
| Complete API | 51 suites /529 tests passed after final capacity correction; an earlier isolated health socket close was followed by its 8-test focused pass and two complete green runs. |
| Complete web | 39 suites /213 tests passed after thumbnail correction. Final editor/style follow-up passed 17 focused Locator/design tests. |
| Complete real PostgreSQL | 31 suites /327 tests passed against isolated private builds in 412.663s, including RLS, current profiles/stale grants, owner ports, migration preservation, classification, fixtures, Audit, jobs and backup/isolated restore. |
| Final Locator capacity | 7 real PostgreSQL tests passed in 13.837s after the aggregate correction. Rejected over-budget creates/replacements preserve all scene/revision/placement/Audit fingerprints; equal-size replacement and prior reads remain valid. |
| Browser journeys |All 57 Playwright cases passed; final Handover/mobile cosmetics passed 16 focused unit tests and 8 browser cases, including light/dark hover tokens and operational reader paths. |
| Scripts/configuration | 6 script suites /32 tests, including 7 source-recognition regressions;77 database-configuration tests passed. |
| Type/build/contracts |Root API/web/database typecheck, generated OpenAPI/browser contract check, architecture/design checks and final Docker API/setup/web builds passed using Node 24.21.0. |
| Documentation |Relative links, IDs/statuses and diff whitespace checked; current guides reconciled without rewriting unrelated historical evidence. |

## Actual local installation

Migration 90000 and final images are installed; database/API/web are healthy at
`http://127.0.0.1:8080`. Setup reconciled 78 historical dates and 42,220 rows with
zero imports or replacements. No plant/provider connection or fixture run occurred.

All 72 original PNG hashes are unchanged. The reviewed 71-view candidate contains
10,678 provisional components: 2,314 conveyors, 10 retained curves, 5 retained scanners,
5,532 motor symbols and 2,817 photoelectric-bar candidates. All 80 original traced
components are preserved. Maximum 510 components / 301,397 compact bytes per scene;
candidate 8,252,443 bytes, SHA-256
`a99bcd4cfab1d8ecf120c6e439477164ca4193276e2b992a7de6a9e282e9f844`.

Root and source slice inspected dense, curved and diagonal overlays across all
four source families. Emergency-stop/initiator/status/title-button false matches
were corrected in the actual heuristic while retaining strict synthetic assertions.
The administrator API applied 70 eligible scene revisions; one already matched.
All 71 source models now report current. The separate six-component demonstration
and other unchanged scene data were preserved exactly. No registry identities or
canonical placements were automatically created.

Actual imported alarm evidence was read for 10 registered assets:38 original
messages, six photoelectric suggestions, no writes. Actual Area/Handover QA passed
12 checks across 1440/390px light/dark cases with blocked mutation routes. Actual
WebGL model QA covered a 248-component source scene, both component kinds, discarded
administrator drafts, reader previews and four administrator layouts:1440/820/390px
light and 390px dark. Final installed assets showed no overflow, page errors, failed
API calls or QA saves. Profile previews prove presentation; real PostgreSQL actors
prove server restrictions. Software-rendered overview initialization measured about
11.4s in the initial browser run; this is a local observation, not pilot acceptance.

Private before/after scenes, candidate/overlay review and browser evidence remain
under ignored `.local-platform/locator*` and `/private/tmp/iop-211-review/`. Original
geometry, images, credentials and cookies were never added to Git/public bundles.

## Remaining owner input and review

Manual completion includes labels, exact registry links, uncertain/occluded symbols,
curves and unsupported angles/diagonal bars, transport direction, measured scale,
elevation, common origin/orientation and exact physical sensor positions. Repeated
source views can depict the same equipment; counts are symbol instances, not a
unique physical inventory. Exact fault focus becomes available only for explicit
registered placements; unplaced assets remain pending. Real providers and future
Technician/maintenance Locator rollout retain their separate prerequisites.

The requested software/local increment is complete. Owner functional review and
explicit approval to merge this story into develop and push both refs to origin
remain pending; implementation does not authorize publication.
