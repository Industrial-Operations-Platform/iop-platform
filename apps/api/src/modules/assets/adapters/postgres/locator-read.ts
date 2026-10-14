import type { SiteTransaction } from '../../../../persistence/site-operation';
/** Assets owns this bounded Locator read. The composition requires current assets.read. */
export async function locatorAsset(tx: SiteTransaction, id: string) {
  const result = await tx.query('SELECT id,code,status,location_id,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND id=$3', [tx.context.organizationId, tx.context.siteId, id]);
  const row = result.rows[0];
  return row ? { id: row.id as string, code: row.code as string, name: (row.snapshot as {
      content: {
        name: string;
      };
    }).content.name, locationId: row.location_id as string, status: row.status as string } : null;
}
export async function locatorAssets(tx: SiteTransaction, search: string) {
  const needle = search.toLowerCase();
  const result = await tx.query("SELECT id,code,status,location_id,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND status<>'retired' AND ($3='' OR strpos(lower(code),$3)>0 OR strpos(lower(snapshot->'content'->>'name'),$3)>0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(snapshot->'content'->'aliases') alias WHERE strpos(lower(alias->>'code'),$3)>0)) ORDER BY code,id LIMIT 200", [tx.context.organizationId, tx.context.siteId, needle]);
  return result.rows.map(row => ({ id: row.id as string, code: row.code as string, name: (row.snapshot as {
      content: {
        name: string;
      };
    }).content.name, locationId: row.location_id as string, status: row.status as string }));
}
