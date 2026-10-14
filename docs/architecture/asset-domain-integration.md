# Asset domain composition contract

IOP-209 provides new sibling APIs/components; its story branch deliberately does
not edit shared runtime, workspace, permission catalogs, generated contracts or
privilege-provisioning allowlists. Root composition uses the following seams.

## API and import publication

```ts
const assetDomainComposition = composeAssetDomain(pool, this.source, this.analysisCalendar);
this.assetDomain = assetDomainComposition.domain;
```

Register `AssetDomainController` next to the existing Assets controller. Its
structural runtime dependency needs only `actor(request)` and `assetDomain`.
Keep the existing OIP publication projection, then call:

```ts
await profileRepository.project(tx, importId);
await assetDomainComposition.published(tx, importId);
```

Both callbacks must execute inside the same site transaction after OIP inserts the
published facts. The callback takes the shared access lease and existing Assets
site lease before reading current mapping decisions; review/publication races
therefore cannot publish stale canonical links. The internal receiving-owned decision/projection ports require current imports.submit
and expose no general registry response. Native importers therefore need no
assets.read grant; interactive review/Pareto retain independent Assets permissions.
Do not use concurrent queries on that pinned PostgreSQL connection. The supplied calendar must match other OIP queries.

The reviewed POST contracts under `/api/v1/asset-domain/` are `catalog`, `configure`,
`references`, `detail`, `save`, `history`, `mapping-query`, `mapping-source`,
`save-mapping`, `mapping-history`, `candidates` and `pareto`.
Catalog returns configuration/permissions only. References/mapping-query default
to 30 results and accept exact bounded search/cursors; references include compact
enrichment summaries and complete matching totals. Detail includes scoped current
parent/controller names. Source candidates use original immutable source fields.
`mapping-source` returns `{ mapping: Mapping | null }` for the exact tuple.
Regenerate the combined reviewed OpenAPI schema after controller registration.

## Browser composition

```tsx
const application = new AssetDomainApplication(new HttpAssetDomainGateway(), () => crypto.randomUUID());
<AssetDomainWorkspace
  application={application}
  timeZone={timeZone}
  homeVisit={homeVisit}
  initialAssetId={assetId}
  onOpenAsset={openDigitalAssetRecord}
/>
```

Expose the workspace to current Administrator/Team Leader/Task Force profiles
only, alongside the Digital Asset Record. The independent server checks remain
authoritative. Spread `assetDomainGerman` from `localization/asset-domain-de.ts`
into the shared German dictionary; English is the default source. Legacy asset
components/fixtures need no enrichment fields.

## Explicit privilege provisioning

Migration `20261014060000-asset-domain.sql` has forced RLS and exact column grants.
Add these tables to the existing provision guard, with SELECT/INSERT columns shown
below. Only the listed UPDATE columns are granted; immutable rows have none.
Do not grant table-level SELECT/INSERT/UPDATE or DELETE.

| Table | SELECT / INSERT columns | UPDATE columns |
| --- | --- | --- |
| assets.model_catalog | organization_id, site_id, revision, snapshot | revision, snapshot |
| assets.model_catalog_revisions | organization_id, site_id, revision, actor_id, at, snapshot | — |
| assets.enrichments | organization_id, site_id, asset_id, revision, type_id, parent_id, survey_status, snapshot | revision, type_id, parent_id, survey_status, snapshot |
| assets.enrichment_revisions | organization_id, site_id, asset_id, revision, actor_id, at, snapshot | — |
| assets.controller_links | organization_id, site_id, asset_id, target_id, kind, channel, is_active | is_active |
| assets.source_mappings | organization_id, site_id, id, revision, source_key, snapshot | revision, snapshot |
| assets.source_mapping_revisions | organization_id, site_id, mapping_id, revision, actor_id, at, snapshot | — |
| oip.canonical_asset_links | organization_id, site_id, source_id, import_id, source_record_number, asset_id, mapping_id, mapping_revision, state, revision_key, snapshot | asset_id, mapping_id, mapping_revision, state, revision_key, snapshot |
| oip.canonical_asset_link_history | organization_id, site_id, source_id, import_id, source_record_number, revision_key, asset_id, mapping_id, mapping_revision, state, snapshot | — |

No new schema/permission bundle is introduced. Existing `assets.read/manage` and
independent OIP grants are checked against current profiles in each transaction.
The disposable module tests verify runtime RLS, immutable privilege denial and
foreign-scope rejection; the assembled host must retain its post-migration
provision validation after extending the allowlists.
