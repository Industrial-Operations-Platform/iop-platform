import type { SiteTransaction } from "../../../../persistence/site-operation";
import { SiteAccessDeniedError } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import type { Asset } from "../../domain/assets";
import type { AssetReference } from "../../../improvement-tracking/domain/improvement";
interface Scope {
  organizationId: string;
  siteId: string;
}
async function authorize(tx: SiteTransaction, scope: Scope) {
  if (tx.context.organizationId !== scope.organizationId || tx.context.siteId !== scope.siteId) throw new SiteAccessDeniedError();
  await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [scope.organizationId]);
  if (!(await evaluateSiteAccess(tx, {
    ...scope,
    userId: tx.context.userId,
    permissions: ["assets.read"]
  })).allowed) throw new SiteAccessDeniedError();
}
function reference(asset: Asset): AssetReference {
  return {
    id: asset.id,
    name: asset.content.name,
    code: asset.content.code,
    status: asset.content.status,
    aliases: asset.content.aliases.map(a => ({
      ...a
    }))
  };
}
/** Assets owns identity and exact analytical aliases; the consumer never joins asset storage. */
export async function improvementAsset(tx: SiteTransaction, scope: Scope, id: string): Promise<AssetReference | null> {
  await authorize(tx, scope);
  const r = await tx.query("SELECT snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND id=$3 FOR SHARE", [scope.organizationId, scope.siteId, id]);
  return r.rows[0] ? reference(r.rows[0].snapshot as Asset) : null;
}
export async function improvementAssets(tx: SiteTransaction, scope: Scope): Promise<AssetReference[]> {
  await authorize(tx, scope);
  // Initial choices only. The browser uses Assets' paginated query for full lookup.
  const r = await tx.query("SELECT snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND status<>'retired' ORDER BY code COLLATE \"C\",id COLLATE \"C\" LIMIT 100", [scope.organizationId, scope.siteId]);
  return r.rows.map(r => reference(r.snapshot as Asset));
}
