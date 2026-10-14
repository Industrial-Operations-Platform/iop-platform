import type {SiteTransaction} from '../../../../persistence/site-operation';
import type {TimelineAsset} from '../../domain/assets';
/** Assets publishes exact identity/alias context; consumers never read its tables. */
export async function locatorEvidenceAssets(tx:SiteTransaction, ids:string[]):Promise<TimelineAsset[]> {
  if(ids.length>500)throw new Error('Asset evidence capacity exceeded.');
  const result=await tx.query(`SELECT id,snapshot->'content'->'aliases' AS aliases FROM assets.records
    WHERE organization_id=$1 AND site_id=$2 AND id=ANY($3::text[])`,
    [tx.context.organizationId,tx.context.siteId,[...new Set(ids)]]);
  return result.rows.map(row=>({id:row.id as string,aliases:row.aliases as TimelineAsset['aliases']}));
}
