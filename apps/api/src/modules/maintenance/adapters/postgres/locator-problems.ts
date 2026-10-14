import {SiteAccessDeniedError,type SiteTransaction} from '../../../../persistence/site-operation';
import {evaluateSiteAccess} from '../../../users-rbac';
import type {TimelineAsset} from '../../../assets/domain/assets';
/** Maintenance publishes scoped open work; this is work evidence, never live equipment health. */
export async function locatorMaintenanceProblems(tx:SiteTransaction,assets:TimelineAsset[]) {
  if(!(await evaluateSiteAccess(tx,{...tx.context,permissions:['maintenance.read']})).allowed)throw new SiteAccessDeniedError();
  const result=await tx.query(`WITH targets AS (SELECT asset->>'id' AS asset_id,asset->'aliases' AS aliases
    FROM jsonb_array_elements($3::jsonb) asset)
    SELECT t.asset_id,m.id,m.snapshot->'data'->>'title' AS title,m.status,m.snapshot->>'updatedAt' AS recorded_at
    FROM maintenance.records m CROSS JOIN targets t
    WHERE m.organization_id=$1 AND m.site_id=$2 AND m.status<>'done'
    AND (m.asset_id=t.asset_id OR EXISTS(SELECT 1 FROM jsonb_array_elements(t.aliases) alias
      JOIN jsonb_array_elements(coalesce(m.snapshot->'data'->'equipment','[]'::jsonb)) target
      ON target->>'namespace'=alias->>'namespace' AND target->>'code'=alias->>'code'
      AND target->>'departmentId'=alias->>'departmentId' AND target->>'areaId'=alias->>'areaId'
      WHERE alias->>'namespace'='site-equipment'))
    ORDER BY m.updated_at DESC,m.id,t.asset_id LIMIT 201`,
    [tx.context.organizationId,tx.context.siteId,JSON.stringify(assets)]);
  if(result.rows.length>200)throw new Error('Maintenance evidence capacity exceeded.');
  return result.rows.map(row=>({assetId:row.asset_id as string,kind:'maintenance' as const,id:row.id as string,
    title:row.title as string,status:row.status as string,recordedAt:row.recorded_at as string}));
}
