import type { SiteTransaction } from '../../../../persistence/site-operation';
import { SiteAccessDeniedError } from '../../../../persistence/site-operation';
import { evaluateSiteAccess } from '../../../users-rbac';
import { sitePersonProfile } from '../../../users-rbac/adapters/postgres/site-people';
import { identifier } from '../../domain/assets';

export interface AssetClassificationSource {
  sourceId: string;
  area: string;
  code: string;
  origin: 'reviewed-mapping' | 'exact-alias';
  mappingId: string;
  mappingRevision: number;
}
/** Exact declared source references only; reviewed decisions suppress conflicting alias fallback. */
export async function assetClassificationSources(
  tx: SiteTransaction,
  source: { organizationId: string; siteId: string; sourceId: string },
  assetId: string,
): Promise<{ sources: AssetClassificationSource[]; totalSources: number } | null> {
  identifier(assetId, true);
  if (tx.context.organizationId !== source.organizationId || tx.context.siteId !== source.siteId ||
    await sitePersonProfile(tx, source.organizationId, source.siteId, tx.context.userId) !== 'administrator' ||
    !(await evaluateSiteAccess(tx, { ...source, userId: tx.context.userId, permissions: ['assets.read'] })).allowed)
    throw new SiteAccessDeniedError();
  const result = await tx.query(`WITH requested AS MATERIALIZED (
      SELECT id,status,snapshot->'content'->'aliases' AS aliases FROM assets.records
      WHERE organization_id=$1 AND site_id=$2 AND id=$4
    ), reviewed AS (
      SELECT m.snapshot->'data'->'source'->>'sourceId' AS source_id,m.snapshot->'data'->'source'->>'area' AS area,
        m.snapshot->'data'->'source'->>'code' AS code,'reviewed-mapping' AS origin,m.id AS mapping_id,m.revision AS mapping_revision
      FROM assets.source_mappings m CROSS JOIN requested a
      WHERE m.organization_id=$1 AND m.site_id=$2 AND a.status='validated'
      AND m.snapshot->'data'->>'status'='approved' AND jsonb_array_length(m.snapshot->'data'->'candidateIds')=1
      AND m.snapshot->'data'->'candidateIds'->>0=a.id
      AND m.snapshot->'data'->'source'->>'sourceId'=$3 AND m.snapshot->'data'->'source'->>'namespace'='source-equipment'
    ), aliases AS (
      SELECT DISTINCT value->>'sourceId' AS source_id,value->>'area' AS area,value->>'code' AS code,
        'exact-alias' AS origin,'' AS mapping_id,0 AS mapping_revision
      FROM requested CROSS JOIN LATERAL jsonb_array_elements(aliases) value
      WHERE value->>'namespace'='analytics' AND value->>'sourceId'=$3
      AND length(value->>'area')>0 AND length(value->>'code')>0
      AND NOT EXISTS (SELECT 1 FROM assets.source_mappings m WHERE m.organization_id=$1 AND m.site_id=$2
        AND m.snapshot->'data'->'source'->>'sourceId'=$3 AND m.snapshot->'data'->'source'->>'namespace'='source-equipment'
        AND m.snapshot->'data'->'source'->>'area'=value->>'area' AND m.snapshot->'data'->'source'->>'code'=value->>'code'
        AND m.snapshot->'data'->>'status' IN ('approved','rejected'))
    ), sources AS MATERIALIZED (SELECT * FROM reviewed UNION ALL SELECT * FROM aliases),
    page AS (SELECT * FROM sources ORDER BY area COLLATE "C",code COLLATE "C" LIMIT 30)
    SELECT EXISTS(SELECT 1 FROM requested) AS exists,(SELECT count(*)::integer FROM sources) AS total,
      coalesce((SELECT jsonb_agg(page ORDER BY area COLLATE "C",code COLLATE "C") FROM page),'[]'::jsonb) AS records`,
    [source.organizationId, source.siteId, source.sourceId, assetId]);
  const row = result.rows[0];
  if (!row.exists) return null;
  const records = row.records as { source_id: string; area: string; code: string; origin: AssetClassificationSource['origin']; mapping_id: string; mapping_revision: number }[];
  return { totalSources: Number(row.total), sources: records.map(item => ({ sourceId: item.source_id, area: item.area,
    code: item.code, origin: item.origin, mappingId: item.mapping_id, mappingRevision: item.mapping_revision })) };
}
