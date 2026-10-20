import type { SiteTransaction } from "../../../../persistence/site-operation";
import { createHash } from "node:crypto";
import { SiteAccessDeniedError } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import { sitePersonProfile } from "../../../users-rbac/adapters/postgres/site-people";
import {
  AssetError, cursorValue, encodeCursor, exact, identifier, text,
  type AssetReference,
} from "../../domain/assets";

/** Receiving-owned operational identity page, excluding models, aliases and record content. */
export async function operationalAssets(
  tx: SiteTransaction,
  query: { search: string; locationIds: readonly string[]; cursor: string },
): Promise<{ assets: AssetReference[]; total: number; nextCursor: string }> {
  const { organizationId, siteId, userId } = tx.context;
  if (!["administrator", "team-leader", "task-force"].includes(
    await sitePersonProfile(tx, organizationId, siteId, userId),
  ) || !(await evaluateSiteAccess(tx, {
    organizationId, siteId, userId, permissions: ["assets.read", "locator.read"],
  })).allowed) throw new SiteAccessDeniedError();

  const search = text(query.search, 160), locations = [...new Set(query.locationIds.map(id => identifier(id, true)))].sort();
  if (locations.length > 1000) throw new AssetError("asset_capacity");
  const locationKey = createHash('sha256').update(JSON.stringify(locations)).digest('hex');
  let code = "", id = "";
  if (query.cursor) {
    const cursor = cursorValue(text(query.cursor, 4000));
    exact(cursor, ["v", "search", "locations", "code", "id"]);
    if (cursor.v !== 1 || cursor.search !== search || cursor.locations !== locationKey)
      throw new AssetError("invalid_asset");
    code = text(cursor.code, 160, true);
    id = identifier(cursor.id, true);
  }
  const result = await tx.query(
    `WITH matching AS MATERIALIZED (
      SELECT id,code,status,location_id,snapshot->'content'->>'name' AS name
      FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND status<>'retired'
      AND ($3='' OR strpos(lower(code),lower($3))>0 OR strpos(lower(snapshot->'content'->>'name'),lower($3))>0)
      AND (cardinality($4::text[])=0 OR location_id=ANY($4::text[]))
    ), page AS (
      SELECT * FROM matching WHERE $5='' OR (code COLLATE "C",id COLLATE "C")>($5 COLLATE "C",$6 COLLATE "C")
      ORDER BY code COLLATE "C",id COLLATE "C" LIMIT 26
    ) SELECT (SELECT count(*)::integer FROM matching) AS total,
      coalesce((SELECT jsonb_agg(page ORDER BY code COLLATE "C",id COLLATE "C") FROM page),'[]'::jsonb) AS records`,
    [organizationId, siteId, search, locations, code, id],
  );
  const rows = result.rows[0].records as { id: string; code: string; name: string; status: AssetReference["status"]; location_id: string }[];
  const assets = rows.slice(0, 25).map(row => ({ id: row.id, code: row.code, name: row.name, status: row.status, locationId: row.location_id }));
  const last = assets.at(-1);
  return { assets, total: Number(result.rows[0].total), nextCursor: rows.length > 25 && last
    ? encodeCursor({ v: 1, search, locations: locationKey, code: last.code, id: last.id }) : "" };
}
