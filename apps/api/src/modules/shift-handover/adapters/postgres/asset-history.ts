import {
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import type {
  TimelineAsset,
  SourceQuery,
  SourceResult,
} from "../../../assets/domain/assets";

/** Handover owns its evidence and joins; canonical identity arrives as explicit exact aliases. */
export async function handoverAssetTimeline(
  tx: SiteTransaction,
  scope: { organizationId: string; siteId: string },
  asset: TimelineAsset,
  query: SourceQuery,
): Promise<SourceResult> {
  if (
    tx.context.organizationId !== scope.organizationId ||
    tx.context.siteId !== scope.siteId
  )
    throw new SiteAccessDeniedError();
  await tx.query(
    "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
    [scope.organizationId],
  );
  const decision = await evaluateSiteAccess(tx, {
    userId: tx.context.userId,
    ...scope,
    permissions: ["handover.read"],
  });
  if (!decision.allowed) throw new SiteAccessDeniedError();
  const aliases = asset.aliases.filter(
    (alias) => alias.namespace === "site-equipment",
  );
  if (!aliases.length) return { records: [], total: 0, unmapped: true };
  const cursor = query.cursor;
  const result = await tx.query(
    `WITH matching AS MATERIALIZED (
    SELECT 'handover_'||entry_id||'_'||lpad(revision::text,10,'0') AS id,
      entry_id AS source_record_id,snapshot->>'at' AS recorded_at,
      (recorded_at AT TIME ZONE $6)::date::text AS date,
      snapshot->'entry'->'content'->>'summary' AS title,
      concat_ws(' · ',snapshot->>'action',NULLIF(snapshot->>'note',''),
        'Entry date: '||(snapshot->'entry'->'content'->>'date')) AS summary
    FROM shift_handover.revisions r WHERE organization_id=$1 AND site_id=$2
      AND (recorded_at AT TIME ZONE $6)::date BETWEEN $3::date AND $4::date
      AND EXISTS (SELECT 1 FROM jsonb_array_elements($5::jsonb) alias
        WHERE snapshot->'entry'->'content'->>'equipmentNamespace'=alias->>'namespace'
        AND snapshot->'entry'->'content'->>'equipmentCode'=alias->>'code'
        AND snapshot->'entry'->'content'->>'departmentId'=alias->>'departmentId'
        AND snapshot->'entry'->'content'->>'areaId'=alias->>'areaId')
    ), page AS (SELECT * FROM matching WHERE $7='' OR
      (date COLLATE "C",recorded_at COLLATE "C",'handover' COLLATE "C",id COLLATE "C")<($7 COLLATE "C",$8 COLLATE "C",$9 COLLATE "C",$10 COLLATE "C")
      ORDER BY date COLLATE "C" DESC,recorded_at COLLATE "C" DESC,id COLLATE "C" DESC LIMIT $11)
    SELECT (SELECT count(*)::integer FROM matching) AS total,
      coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'kind','handover','date',date,'recordedAt',recorded_at,
        'title',title,'summary',summary,'sourceRecordId',source_record_id,'periodKind','calendar-date')
        ORDER BY date COLLATE "C" DESC,recorded_at COLLATE "C" DESC,id COLLATE "C" DESC) FROM page),'[]'::jsonb) AS records`,
    [
      scope.organizationId,
      scope.siteId,
      query.from,
      query.to,
      JSON.stringify(aliases),
      query.timeZone,
      cursor?.date ?? "",
      cursor?.recordedAt ?? "",
      cursor?.kind ?? "",
      cursor?.id ?? "",
      query.limit,
    ],
  );
  return {
    records: result.rows[0].records as SourceResult["records"],
    total: Number(result.rows[0].total),
  };
}
