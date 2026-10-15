# IOP-211 — Locator model and access execution

Status: In progress. Branch `feature/IOP-211-locator-models-and-access`, created from
develop `e9bd49d`. [Permanent request](../items/IOP-211-locator-models-and-access.md).

## Scope, ownership and steps

1. Inspect private source drawings/traces and current Assets/Locator/Handover read
   boundaries. Record the explicit motor/photoelectric-sensor interpretation and
   administrator-only management refinement in relevant accepted ADRs.
2. Backend slice: enforce Administrator-only standalone Assets/AssetDomain and
   Locator writes, retain narrow authorized operational identity references for
   Team Leader/Task Force, correct managed role grants without destroying custom
   data and verify existing profile/grant revocation behavior. Root coordinates
   any migration/provisioning changes before applying them.
3. Geometry slice: bounded source-specific schematic analysis/import tooling,
   stable individual motors/photoelectric sensors/conveyors and broad private scene
   preparation. Retain uncertain symbols/calibration as pending, review source
   overlays and never replace operator-modified geometry or inferred identities.
4. Root model slice: reusable motor/photoelectric-sensor kinds, matching rendering/
   editor/catalog/DTOs and safe source-message classification. Keep original generic
   sensor compatibility and explicit stable registered-asset linking/creation.
5. Browser slice: administrator-only registry/model navigation and edit actions,
   reader-only fault/component focusing, operational deep links into Locator,
   consistent Area/location compact control and formal records inside Handover.
6. Assemble, generate reviewed contracts, migrate/rebuild the local installation,
   safely advance eligible scene drafts, inspect actual light/dark desktop/narrow
   rendering and source geometry, run relevant real tests and document evidence.
7. Synchronize permissions/model/operator guides, item/backlog and completion;
   create logical local commits. Retain the review branch and ask separately about
   publication after concrete completion.

Files: Users/RBAC and Assets/Locator adapters/use cases, receiving-owned operational
ports, relevant PostgreSQL migration/tests; source-specific local tooling/private
traces; Locator domain/catalog/render/editor/contracts; browser host/Handover/Overview
adapters/styles and owning tests; ADR-0037/0039 refinements and selected guides.
Parallel work shares this one story branch with disjoint owned files. No shared
build or overlapping edit without coordination. No unrelated translation/cleanup.

### Browser execution refinement recorded before edits

The browser slice owns `apps/web/src/host/WorkspaceApp.tsx`, shared
`design/components/DepartmentScope.tsx`, `operational-overview/adapters/react/AreaOverview.tsx`,
the journal/formal Handover React adapters and reusable Handover navigation/guidance,
`localization/formal-handover-de.ts`, and their React/E2E tests. The existing compact
department control gains optional caption/empty-label inputs so Area/location uses
the same native control, dimensions, keyboard behavior and semantic identity tokens.

Separate Administrator-only standalone Assets/Asset management presentation from
Administrator/Team Leader/Task Force operational capabilities. Centralize asset
navigation: Administrator opens Digital Asset Record; authorized readers open
Locator with an explicit `initialAssetId` and visit token. Pass a reader presentation
guard to Locator, including Administrator layout previews, and omit its standalone
asset-record callback for readers. Backend-owned profile checks remain authoritative.
Do not expose new advanced features to Technician or restrict ordinary journal work.

Remove the separate Formal Handover sidebar entry and use one shared Handover view
navigation including Shift records. Keep independent formal components/use cases and
the internal exact formal-record route; highlight Shift Handover for this route.
Optional journal-view callbacks preserve deep links back to journal reports. Add
short English/German guidance distinguishing current unresolved journal issues from
immutable transfer/closure and receiving acknowledgement evidence. Preserve existing
journey assertions while adapting Administrator-owned registry journeys and adding
reader Locator navigation coverage. Unit/type/design checks may run independently;
no shared build or Playwright server starts until root signals coordinated readiness.

The Assets React workspace's own presentation gate and `test/assets.spec.tsx`
also change: administrator capabilities must not reveal registry editing in a
Team Leader/Task Force layout preview. Preserve registration/alias/rejection journey
assertions under Administrator, extend denied-profile coverage, and keep full
Digital Asset Record E2E journeys under their now-required Administrator actor.
Reader role cases gain explicit Locator navigation instead of losing journey checks.
Locator's Administrator-only creation shortcut may open the existing Assets
workspace; no new registry lifecycle or inferred equipment identity is introduced.
`MaintenanceWorkspace.tsx` also gains an optional asset-action label: Administrator
keeps Open asset record; readers see Locate asset for the Locator destination. Add
the explicit German label in the existing general dictionary without touching the
root-owned Locator resource import. Tracking's existing Open linked asset label is
already destination-neutral.

Current documentation reconciliation is limited to the relevant access/navigation
sections in `docs/product/maintenance-assets.md`, `docs/product/asset-domain.md`,
`docs/product/shift-handover.md`, `docs/development/maintenance-assets.md`,
`docs/development/formal-handover.md`, `docs/development/shift-handover.md`,
`docs/development/operational-overview.md`, `docs/development/running-poc.md`,
`docs/development/platform-completion.md` and
`docs/architecture/asset-domain-integration.md`. Historical story evidence remains
unchanged. Root retains source-model/classification and final
delivery evidence.

The Shift records navigation action remains independent of journal-context loading
or failure: its own authorized formal context supplies its prerequisites. Keep
journal controls disabled during their own loading and verify this source-failure
case without adding a fallback or weakening either application's server checks.

Final visual refinements recorded before edits: add an optional text button variant
to shared `ViewNavigation.tsx`, used only by `HandoverViewNavigation`, to prevent
primary-action hover styling from filling an active Handover tab with blue while
retaining dark selected ink. Legacy navigation defaults, keyboard behavior, source
callbacks and all journey assertions remain unchanged. Verify hovered selected
Shift records uses the shared active-surface token in both reader viewports/themes.
Document the optional presentation API in `design/components/README.md`.
Root owns the corresponding narrow Locator stylesheet adjustment: at widths up to
600px, the component label button spans its row and verification/problem badges
wrap underneath. Retain semantic palette/typography tokens and component selection.
Rebuild the web workspace and run focused reader/browser visual checks after these
two changes; root coordinates the final Docker web rebuild and actual source QA.

## Validation

### Browser slice evidence

The host now separates Administrator-only Assets/model management from operational
reader navigation, forwards exact asset IDs to Locator, and presents formal records
under one Shift Handover entry. Optional journal/formal callbacks preserve original
record identities and ordinary journal permissions. Shared compact scope controls
and English/German source guidance are complete. Current access/navigation guide
sections and the shared presentation API reference are reconciled.

- `npm test --workspace=@iop/web`: 39 suites / **211 tests passed** (61.095 seconds).
- `npm run test:e2e --workspace=@iop/web`: **57 passed** (2.2 minutes), preserving all
  original journeys and adapting registry ownership to Administrator. Reader cases
  exercise exact Locator focus, retained Handover source navigation, integrated
  Shift records and the honest missing-Workforce prerequisite.
- After the final opt-in Handover text-hover and mobile component-row refinements,
  `npm run build --workspace=@iop/web` passed type/design/bundle checks; focused
  Handover/formal/shared-component/design tests passed **16 tests**.
- Final browser command:
  `npm run test:e2e --workspace=@iop/web -- maintenance-assets.spec.ts handover-navigation.spec.ts --grep 'operational navigation|handover home navigation'`:
  **8 passed** (22.5 seconds). This covers ordinary journal 1440/820/375px and all
  operational profiles, including Team Leader 1440px light and Task Force 390px
  dark. Computed-token assertions confirm selected-tab hover uses active surface
  and selected ink. Screenshots confirm readable component labels/badges, no page
  overflow, and no reader editing/standalone registry actions.
- Actual local 8080 read-only QA: **4 cases / 12 checks passed** for Area compact
  controls and integrated formal/journal navigation at 1440/390px in light/dark.
  Native department/area controls share computed field styles and remain bounded;
  exact Shift records/Journal navigation and the shared sidebar work with real
  configured context. No page errors, failed API responses or attempted domain
  mutations occurred. The private runner permits only read operations; cookie,
  results and screenshots remain under `/private/tmp/iop-211-review/`, outside Git.
- Relative-link review of the planned current guides found **66 valid links**, zero
  missing targets. `git diff --check` passed. Temporary browser/API preview servers
  exited and released ports 3000/4173.

The browser slice created no shared-root commit and performed no plant/domain
writes. Full web/browser gates preceded the final cosmetic refinements; focused
checks above verify their affected paths. Root owns final Docker assembly, source
geometry/rotation review, integration evidence and story closure.

Use Node 24.21.0. Check current Administrator/Team Leader/Task Force/Technician
profiles, stale writer grants, direct API denial, bounded operational lookups,
role changes/revocation and exact organization/site RLS. Exercise stable source
component IDs, guarded enrichment/idempotency, editable labels/asset links and
source-message classification limits. Run type/build/contract/architecture/design,
API and focused browser/real PostgreSQL tests; broaden only for integrated risks.
Validate original/private file integrity, source-based visual overlays, actual
read-only navigation and administrator edit flow, light/dark and narrow overflow.
Record exact derived scene/component counts, ambiguous/unsupported views and
remaining manual corrections. Documentation checks links, IDs and status mirrors.

## Root model/placement refinement before edits

Add exact `locate(assetId)` so deep links bypass fuzzy/bounded directory search and
focus only explicit placements. Add a private bounded model-candidate file adapter,
administrator-only preview and per-scene apply operations: compare the entire prior
component baseline, preserve every manual/linked/surveyed change, reject stale
revisions and keep generated geometry provisional. Apply source-backed drafts only
after visual review. Existing import/reference contracts and source files remain
compatible; the dedicated candidate file is bounded independently of old traces.
Owning files are Locator domain/application/files composition/controller/DTOs and
their tests, plus the browser Gateway/workspace/render/editor and German resource.

## Source modelling refinement

The source-modelling slice owns `scripts/local/locator-schematic-models.cjs`, its
source-specific native image-analysis adapter under `scripts/local/locator-models/`,
focused synthetic tests and ignored private candidates/overlays. The supplied legend
and explicit owner interpretation distinguish circular motors from narrow
photoelectric-sensor bars. Each generated component retains stable image evidence,
unknown elevation, provisional verification and no inferred registered identity.
The finite tool validates original content hashes, never edits reference PNGs or
database scenes, and prepares previous-component baselines for a receiving-owned
Administrator upgrade that preserves operator edits and explicit links.
Inspect representative overlays from all four source families and record both
detected and uncertain coverage. Native analysis uses installed macOS frameworks;
no new runtime/image dependency or shared build is required.

## Source modelling evidence

The finite source adapter, native decoder/overlay helper, seven synthetic
regressions and [operator guide](../../development/locator-schematic-modelling.md)
are ready. Actual `wincc-symbols-4` analysis prepares all 71 private equipment
views, grouped 20/12/17/22 across their four source families, with 10,678
provisional symbol instances: 2,314 straight/diagonal conveyors, ten retained
curves, five retained scanner references, 5,532 motor symbols and 2,817 candidate
photoelectric bars. The exact 80 original components remain upgrade baselines.
The 8,252,443-byte private candidate file has SHA-256
`a99bcd4cfab1d8ecf120c6e439477164ca4193276e2b992a7de6a9e282e9f844`;
the largest scene has 510 components and 301,397 compact serialized bytes.
All generated component bounds/identities are valid and all 72 original PNG
hashes remain unchanged. Generated components have no registered-asset link,
unknown elevation and provisional verification.

Actual final overlays in ignored `.local-platform/locator-inspection/IOP-211-v4/`
were reviewed for BV, dense Einlagerloop, diagonal Passerelle1, AP TaSo,
Abzug VR Halle A, Pick Tower4, B-Sky Zuführung VR and passive B8701.
Detected emergency-stop/initiator/header-button false positives were corrected
in the recognition rules and protected by unchanged count assertions.
`acceptance-review.json` retains private aggregate integrity/boundary evidence.
Overlays show detected rails; the original three scenes deliberately retain
their richer manual topology rather than replacing it with partial detection.

Focused source-tool tests pass seven of seven; `git diff --check` passes.
No actual database scenes, original reference images, shared builds or root
commits were changed by this slice. Root owns the authorized guarded model
application and integrated browser/permission/persistence validation.
These are provisional symbol counts, not a unique physical inventory. Diagonal
sensor bars, other conveyor angles, remaining curves/occlusion, true identity,
scale, elevations, flow direction and global registration remain explicit review
or plant inputs; repeated source illustrations do not create duplicate Assets.

## Thumbnail transform review refinement

Independent review found the instanced overview scaled local component axes before
rotation, so vertical/diagonal solids did not align with a source image stretched
to a differently proportioned navigation tile. Before changes, scope the fix to
an exported `thumbnailMatrix` helper in the isolated Three.js renderer and focused
geometry regressions for 90-degree/45-degree source-to-tile transforms. Compose
the source component matrix first and multiply by the thumbnail x/y/z scale;
leave individual-scene geometry, stored components and actual database models
untouched. Run the focused geometry suite and notify root before shared rebuilding.

The helper now composes thumbnail scale with the complete source transform. The
focused `locator-geometry` suite passes five tests, including actual nonmatching
source/tile proportions, vertical endpoints, diagonal corners and elevation.
`git diff --check` passes. The renderer/test slice is frozen for root's final web
rebuild; original scene geometry, private candidates and database records are
unchanged by this correction.

## Backend access refinement

The backend slice retains `assets-reader` for Administrator, Team Leader and Task
Force as compact receiving-port authority. Standalone registry and model use cases
also require the current Administrator profile; keeping this internal grant does
not expose their endpoints. Non-administrators lose managed `assets-administrator`
and `locator-manager` assignments. Locator reads require a current Administrator,
Team Leader or Task Force profile plus the read grant; all writes and reported
`canManage` capabilities additionally require Administrator, even with stale grants.
Maintenance, Handover and Tracking compact-reference ports and import-owned
publication decisions retain their existing independent authorizations.

Owned files: Users/RBAC profile catalog, Assets and AssetDomain PostgreSQL stores,
Locator PostgreSQL store, a compact Assets-owned operational search adapter,
Overview/Locator host composition as necessary, a supplemental permission migration
and owning API/PostgreSQL tests. The exact native-demo migration-name whitelist
also gains this supplemental migration without relaxing unknown-history rejection.
Overview receives compact identity search rather
than invoking the now Administrator-only registry. No browser/model/tracing files,
shared runtime, generated bindings or provisioning allowlists are edited here.

Validation covers direct operation denial for all non-administrator profiles,
forged/stale writer grants, read-only Locator capabilities and fault-source grant
independence, compact lookups and native importers, revocation, exact scope and
migration preservation. Focused source unit checks may run immediately; shared
builds and database suites wait for the root integration signal.

## Exact source classification evidence refinement

The root accepted an optional Locator-owned `ClassificationEvidenceSource` port
after the model-candidate constructor argument. The backend slice owns its plain
application contract, Assets-owned exact reviewed mapping/alias lookup, OIP-owned
bounded original alarm-message evidence and the host callback. Root owns the
Locator use case, DTO/controller and source-specific phrase rule/UI application.
The Administrator-only request starts with an explicitly linked asset ID, requires
independent Assets and analytical authority and returns original import/line/date
provenance, complete per-source counts and explicit limited/unmapped coverage.
No equipment-name/image matching, registry creation, source mapping or automatic
classification write is introduced. Reviewed source conflicts suppress alias
fallback. Existing manual classifications change only through an explicit draft
edit and attributed Administrator save.

Additional owned files: `asset-locator/application/classification-evidence.ts`,
Assets/OIP PostgreSQL classification evidence adapters, `host/locator-composition.ts`
and focused source-owner/real PostgreSQL tests. Validate exact source tuples,
negative phrase evidence, preserved originals, unrelated source/organization
exclusion, finite evidence budgets and current profile/grant revocation. This
reuses existing owner-defined read ports and pinned transactions; no schema,
runtime privilege or new architectural pattern is required.

The existing linked local fixture also needs a separate current Administrator
`assetActor` for new registry writes while preserving its Team Leader journal/work
author and Technician worker. Update its runner and owning fixture tests; ordinary
fixture manager discovery already honors the new store gate. Retained manifests
remain inspectable, while incompatible apply requests fail without rewriting
existing attribution or data. This validation uses disposable fixtures only and
does not run a fixture against the installed plant data.

### Backend validation evidence

The access slice passed 8 focused API/HTTP suites with 40 tests and a private API
TypeScript build. Four owning PostgreSQL suites passed 36 tests for registry/model
denial, read-only Locator, exact compact search, stale grants, role transitions and
the supplemental permission migration. The later classification integration passed
the 11-test AssetDomain suite with original source provenance, limited evidence,
reviewed/alias precedence, retained manual classifications, current authorization
and one-connection pool safety. Corrected Maintenance and both local fixture suites
also passed. Formal Handover, Tracking, native analytical reset and site Audit
receiving regressions passed without broadening their authority.

The complete real PostgreSQL regression passed **31 suites and 327 tests** in
412.663 seconds against private emitted API/database artifacts. Coverage includes
current permissions, migration/native reset, receiving-owned references, exact
classification evidence, retained fixture attribution, site Audit, jobs and
backup/isolated restore. Shared build output and the active installation were
untouched. Backend source is frozen for root assembly; final integrated browser
results remain owned by the root validation pass. No shared-root commit was created
by this slice.

### Locator aggregate capacity correction

Independent review found that individually valid saved scenes could exceed the
existing 16 MiB aggregate read budget. Before further edits, extend this slice to
check the projected current site total under the existing `locator.manage` site
lease, before writing scene, revision, placement or Audit records. Reuse the
domain-owned `locatorLimits` constants supplied by root; retain 250 scenes, 1 MiB
per scene and 16 MiB total without increasing budgets. A replacement must subtract
its previous snapshot rather than double-counting it.

Owned changes are the Locator PostgreSQL store and its real PostgreSQL test. The
test will approach the actual aggregate limit with valid scoped fixture scenes,
reject a crossing create/replacement, compare all four projections for exact
preservation and prove the previous listing remains readable. Use private API
compilation and the focused owning PostgreSQL suite; the prior full 327-test gate
remains evidence for the unchanged broader slice. Root separately owns oversized
individual model-preview handling and renderer work. No live data or shared-root
commit is involved.

The correction passed private API compilation and the owning real PostgreSQL
suite: **7 tests passed in 13.837 seconds**. Both crossing writes preserved exact
SHA-256/count fingerprints of scenes, immutable revisions, placements and actual
site Audit. An equal-size replacement succeeded near the aggregate limit, proving
the old snapshot is subtracted, and the previous site listing remained readable.
The source slice is frozen again for root assembly; no migration or budget change
was required.

## Classification and overview refinements before edits

The selected registered asset can request an Administrator-only provisional
classification hint. Assets supplies exact reviewed mappings or unambiguous source
aliases; OIP supplies bounded original alarm messages and import/line/date evidence,
with independent grants and exact scope. A source-specific host rule recognizes the
owner-provided Lichtschranke message; generic Locator records no automatic type or
identity change. Applying a suggestion changes only the explicit selected draft and
requires the normal attributed revision save.

Broad modelling increases the navigation overview from80 to thousands of source
components. Use simplified instanced thumbnail geometry and bounded thumbnail
textures in the renderer adapter while retaining full reusable geometry in each
opened scene. This preserves source coordinates and selection and avoids tens of
thousands of separate overview draw calls. Verify actual browser interaction.

### Administrator editor visual refinement

Actual source-scene QA exposed numeric three-field rows overflowing the25rem
Administrator inspector, despite the reader layout fitting correctly. Before
edits, constrain only Locator component-editor fields to the inspector width and
wrap field rows into responsive columns. Keep shared field defaults unchanged.
Verify actual1440/820/390px administrator layouts and retain full value editing;
geometry coordinates are not rounded or changed to conceal the issue.
