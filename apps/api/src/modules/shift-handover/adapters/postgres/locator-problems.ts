import {SiteAccessDeniedError,type SiteTransaction} from '../../../../persistence/site-operation';
import {evaluateSiteAccess} from '../../../users-rbac';
import type {TimelineAsset} from '../../../assets/domain/assets';
/** Handover owns current pending reports and matching its retained source references. */
export async function locatorHandoverProblems(tx:SiteTransaction,assets:TimelineAsset[]) {
  if(!(await evaluateSiteAccess(tx,{...tx.context,permissions:['handover.read']})).allowed)throw new SiteAccessDeniedError();
  const result=await tx.query(`WITH targets AS (SELECT asset->>'id' AS asset_id,asset->'aliases' AS aliases
    FROM jsonb_array_elements($3::jsonb) asset)
    SELECT t.asset_id,e.id,e.snapshot->'content'->>'summary' AS title,
      e.snapshot->>'issueState' AS status,e.snapshot->>'updatedAt' AS recorded_at
    FROM shift_handover.entries e CROSS JOIN targets t
    WHERE e.organization_id=$1 AND e.site_id=$2 AND coalesce(e.snapshot->>'deleted','false')<>'true'
    AND e.snapshot->>'issueState' IN ('open','in-progress')
    AND (e.snapshot->'content'->>'assetId'=t.asset_id OR EXISTS(
      SELECT 1 FROM jsonb_array_elements(t.aliases) alias WHERE alias->>'namespace'='site-equipment'
      AND e.snapshot->'content'->>'equipmentNamespace'=alias->>'namespace'
      AND e.snapshot->'content'->>'equipmentCode'=alias->>'code'
      AND e.snapshot->'content'->>'departmentId'=alias->>'departmentId'
      AND e.snapshot->'content'->>'areaId'=alias->>'areaId'))
    ORDER BY e.snapshot->>'updatedAt' DESC,e.id,t.asset_id LIMIT 201`,
    [tx.context.organizationId,tx.context.siteId,JSON.stringify(assets)]);
  if(result.rows.length>200)throw new Error('Handover evidence capacity exceeded.');
  return result.rows.map(row=>({assetId:row.asset_id as string,kind:'handover' as const,id:row.id as string,
    title:row.title as string,status:row.status as string,recordedAt:row.recorded_at as string}));
}
