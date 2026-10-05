import {
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import type { ImportSource } from "../../../integrations";
import type {
  TimelineAsset,
  SourceQuery,
  SourceResult,
} from "../../../assets/domain/assets";
import { hitlisteReadModel } from "./read-model";
import { scopeTuple } from "./analytics";
import { exactTotal, AnalyticsError } from "../../domain/values";

/** Source aggregates remain date-labelled evidence; their original import/line references are retained. */
export async function analyticAssetTimeline(
  tx: SiteTransaction,
  source: ImportSource,
  asset: TimelineAsset,
  query: SourceQuery,
  initialProfileVersion: string,
): Promise<SourceResult> {
  if (
    tx.context.organizationId !== source.organizationId ||
    tx.context.siteId !== source.siteId
  )
    throw new SiteAccessDeniedError();
  await tx.query(
    "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
    [source.organizationId],
  );
  const decision = await evaluateSiteAccess(tx, {
    userId: tx.context.userId,
    organizationId: source.organizationId,
    siteId: source.siteId,
    permissions: ["analytics.read"],
  });
  if (!decision.allowed) throw new SiteAccessDeniedError();
  const aliases = asset.aliases.filter(
    (alias) =>
      alias.namespace === "analytics" && alias.sourceId === source.sourceId,
  );
  if (!aliases.length) return { records: [], total: 0, unmapped: true };
  const cursor = query.cursor;
  const result = await tx.query(
    `WITH ready AS MATERIALIZED (${hitlisteReadModel}),
    expected AS (SELECT coalesce((SELECT version::text FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$12::text) AS version),
    matching AS MATERIALIZED (SELECT 'analytics_'||import_id::text||'_'||lpad(source_record_number::text,10,'0') AS id,
      import_id::text||':'||source_record_number::text AS source_record_id,reporting_date::text AS date,
      values->>'message' AS title,concat_ws(' · ',values->>'equipment',values->>'sector',values->>'area') AS summary,
      reported_frequency::text AS frequency,accumulated_alarm_seconds::text AS seconds
      FROM ready WHERE reporting_date BETWEEN $4::date AND $5::date
      AND EXISTS(SELECT 1 FROM jsonb_array_elements($6::jsonb) alias
        WHERE values->>'equipment'=alias->>'code' AND values->>'sector'=alias->>'sector' AND values->>'area'=alias->>'area')),
    page AS (SELECT * FROM matching WHERE $7='' OR
      (date COLLATE "C",'' COLLATE "C",'analytics' COLLATE "C",id COLLATE "C")<($7 COLLATE "C",$8 COLLATE "C",$9 COLLATE "C",$10 COLLATE "C")
      ORDER BY date COLLATE "C" DESC,id COLLATE "C" DESC LIMIT $11)
    SELECT ((SELECT count(*) FROM ready)=(SELECT count(*) FROM oip.facts WHERE organization_id=$1 AND site_id=$2 AND source_id=$3)
      AND NOT EXISTS(SELECT 1 FROM ready CROSS JOIN expected WHERE profile_version<>expected.version)) AS projection_valid,
      (SELECT count(*)::integer FROM matching) AS total,
      coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'kind','analytics','date',date,'recordedAt','',
        'title',title,'summary',summary,'sourceRecordId',source_record_id,'periodKind','daily-aggregate','frequency',frequency,'seconds',seconds)
        ORDER BY date COLLATE "C" DESC,id COLLATE "C" DESC) FROM page),'[]'::jsonb) AS records`,
    [
      ...scopeTuple(source),
      query.from,
      query.to,
      JSON.stringify(aliases),
      cursor?.date ?? "",
      cursor?.recordedAt ?? "",
      cursor?.kind ?? "",
      cursor?.id ?? "",
      query.limit,
      initialProfileVersion,
    ],
  );
  const row = result.rows[0];
  if (row.projection_valid !== true)
    throw new AnalyticsError("analytics_projection_unavailable");
  const records = (
    row.records as (Omit<
      SourceResult["records"][number],
      "frequency" | "seconds"
    > & { frequency: string; seconds: string })[]
  ).map((record) => ({
    ...record,
    frequency: exactTotal(record.frequency),
    seconds: exactTotal(record.seconds),
  }));
  return { records, total: Number(row.total) };
}
