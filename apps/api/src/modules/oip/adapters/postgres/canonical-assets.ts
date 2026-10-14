import { SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import type { ImportSource } from "../../../integrations";
import { evaluateSiteAccess } from "../../../users-rbac";
import { AnalysisCalendar } from "../../domain/analysis-calendar";
import { exactTotal } from "../../domain/values";
import { scopeTuple, digest } from "./analytics";
import { assert, type MappingDecision, type SourceCandidate, type ParetoSelection, type CanonicalPareto } from "../../../assets/domain/enrichment";
async function authorize(tx: SiteTransaction, source: ImportSource, permissions: string[] = ["analytics.read", "assets.read"]) {
  if (tx.context.organizationId !== source.organizationId || tx.context.siteId !== source.siteId) throw new SiteAccessDeniedError();
  await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [source.organizationId]);
  if (!(await evaluateSiteAccess(tx, {
    ...source,
    userId: tx.context.userId,
    permissions
  })).allowed) throw new SiteAccessDeniedError();
}
/** Derived links preserve original immutable RAW/fact identity and mapping revision evidence. */
export async function projectCanonicalAssetLinks(tx: SiteTransaction, source: ImportSource, decisions: MappingDecision[]) {
  await authorize(tx, source);
  await writeCanonicalAssetLinks(tx, source, decisions, null);
}
/** Internal receiving-owned publication callback; valid imports need no registry-read grant. */
export async function publishCanonicalAssetLinks(tx: SiteTransaction, source: ImportSource, decisions: MappingDecision[], importId: string) {
  await authorize(tx, source, ["imports.submit"]);
  await writeCanonicalAssetLinks(tx, source, decisions, importId);
}
async function writeCanonicalAssetLinks(tx: SiteTransaction, source: ImportSource, decisions: MappingDecision[], importId: string | null) {
  assert(decisions.length <= 30000, "asset_domain_capacity");
  assert(decisions.every(d => d.source.sourceId === source.sourceId && d.source.namespace === "source-equipment"));
  await tx.query(`WITH facts AS MATERIALIZED (
 SELECT f.*,m.decision FROM oip.facts f LEFT JOIN LATERAL (
  SELECT value AS decision FROM jsonb_array_elements($4::jsonb) WHERE value->'source'->>'area'=f.payload->>'sourceArea'
   AND value->'source'->>'code'=f.payload->>'sourceEquipmentReference' LIMIT 1) m ON true
 WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3 AND ($5::uuid IS NULL OR f.import_id=$5)
 AND ($5::uuid IS NOT NULL OR m.decision IS NOT NULL)
 ), selected AS MATERIALIZED (SELECT organization_id,site_id,source_id,import_id,source_record_number,
 NULLIF(decision->>'assetId','') AS asset_id,NULLIF(decision->>'id','') AS mapping_id,coalesce((decision->>'revision')::integer,0) AS mapping_revision,
 coalesce(decision->>'state','unmapped') AS state,coalesce((decision->>'id')||':'||(decision->>'revision')||':'||(decision->>'state'),'unmapped') AS revision_key,
 jsonb_build_object('importId',import_id,'sourceRecordNumber',source_record_number,'source',jsonb_build_object('sourceId',source_id,'namespace','source-equipment','area',payload->>'sourceArea','code',payload->>'sourceEquipmentReference'),
 'mappingId',coalesce(decision->>'id',''),'mappingRevision',coalesce((decision->>'revision')::integer,0),'state',coalesce(decision->>'state','unmapped'),'assetId',coalesce(decision->>'assetId',''),'candidateIds',coalesce(decision->'candidateIds','[]'::jsonb),'appliedAt',CURRENT_TIMESTAMP,'grain','source-aggregate') AS snapshot FROM facts
 ), written AS (INSERT INTO oip.canonical_asset_links(organization_id,site_id,source_id,import_id,source_record_number,asset_id,mapping_id,mapping_revision,state,revision_key,snapshot)
 SELECT organization_id,site_id,source_id,import_id,source_record_number,asset_id,mapping_id,mapping_revision,state,revision_key,snapshot FROM selected
 ON CONFLICT(organization_id,site_id,source_id,import_id,source_record_number) DO UPDATE SET asset_id=EXCLUDED.asset_id,mapping_id=EXCLUDED.mapping_id,mapping_revision=EXCLUDED.mapping_revision,state=EXCLUDED.state,revision_key=EXCLUDED.revision_key,snapshot=EXCLUDED.snapshot
 WHERE canonical_asset_links.revision_key<>EXCLUDED.revision_key RETURNING *)
 INSERT INTO oip.canonical_asset_link_history(organization_id,site_id,source_id,import_id,source_record_number,revision_key,asset_id,mapping_id,mapping_revision,state,snapshot)
 SELECT organization_id,site_id,source_id,import_id,source_record_number,revision_key,asset_id,mapping_id,mapping_revision,state,snapshot FROM written ON CONFLICT DO NOTHING`, [...scopeTuple(source), JSON.stringify(decisions), importId]);
}
export async function canonicalSourceCandidates(tx: SiteTransaction, source: ImportSource, search: string, cursor: string) {
  await authorize(tx, source);
  let area = "",
    code = "";
  if (cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
      assert(Array.isArray(parsed) && parsed.length === 2 && parsed.every(v => typeof v === "string" && v.length <= 4096));
      [area, code] = parsed;
    } catch {
      assert(false);
    }
  }
  const r = await tx.query(`WITH grouped AS (SELECT payload->>'sourceArea' AS area,payload->>'sourceEquipmentReference' AS code,count(*)::text AS records FROM oip.facts
 WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND ($4='' OR strpos(lower(concat_ws(' ',payload->>'sourceArea',payload->>'sourceEquipmentReference')),lower($4))>0)
 AND ($5='' AND $6='' OR (payload->>'sourceArea' COLLATE "C",payload->>'sourceEquipmentReference' COLLATE "C")>($5 COLLATE "C",$6 COLLATE "C")) GROUP BY 1,2) SELECT area,code,records FROM grouped ORDER BY area COLLATE "C",code COLLATE "C" LIMIT 31`, [...scopeTuple(source), search, area, code]);
  const candidates: SourceCandidate[] = r.rows.slice(0, 30).map(r => ({
      sourceId: source.sourceId,
      namespace: "source-equipment",
      area: String(r.area),
      code: String(r.code),
      records: exactTotal(String(r.records))
    })),
    last = candidates.at(-1);
  return {
    candidates,
    nextCursor: r.rows.length > 30 && last ? Buffer.from(JSON.stringify([last.area, last.code])).toString("base64url") : ""
  };
}
export async function canonicalAssetPareto(tx: SiteTransaction, source: ImportSource, selection: ParetoSelection, calendar = new AnalysisCalendar()): Promise<CanonicalPareto> {
  await authorize(tx, source);
  const metric = selection.metric === "frequency" ? "frequency" : "seconds";
  const r = await tx.query(`WITH selected AS MATERIALIZED (
 SELECT f.*,l.asset_id,coalesce(l.state,'unprepared') AS link_state,coalesce(l.revision_key,'unprepared') AS link_revision FROM oip.facts f LEFT JOIN oip.canonical_asset_links l
 USING(organization_id,site_id,source_id,import_id,source_record_number)
 WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3 AND f.reporting_date>=$4::date AND f.reporting_date<$5::date AND NOT(extract(isodow FROM f.reporting_date)::integer=ANY($6::integer[]))
 ), groups AS (SELECT asset_id,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected WHERE link_state='mapped' GROUP BY asset_id),
 states AS (SELECT link_state,count(*)::text AS count FROM selected GROUP BY link_state)
 SELECT coalesce((SELECT jsonb_agg(g ORDER BY ${metric}::numeric DESC,asset_id) FROM (SELECT * FROM groups ORDER BY ${metric}::numeric DESC,asset_id LIMIT $7) g),'[]'::jsonb) AS groups,
 (SELECT count(*)::text FROM groups) AS group_count,
 (SELECT jsonb_build_object('frequency',coalesce(sum(reported_frequency),0)::text,'seconds',coalesce(sum(accumulated_alarm_seconds),0)::text,'records',count(*)::text,'mappedFrequency',coalesce(sum(reported_frequency) FILTER(WHERE link_state='mapped'),0)::text,'mappedSeconds',coalesce(sum(accumulated_alarm_seconds) FILTER(WHERE link_state='mapped'),0)::text,'mappedRecords',count(*) FILTER(WHERE link_state='mapped')::text) FROM selected) AS totals,
 coalesce((SELECT jsonb_object_agg(link_state,count) FROM states),'{}'::jsonb) AS states,
 coalesce((SELECT jsonb_agg(link_revision ORDER BY link_revision) FROM (SELECT DISTINCT link_revision FROM selected) revisions),'[]'::jsonb) AS links,
 coalesce((SELECT jsonb_agg(jsonb_build_object('date',reporting_date::text,'id',import_id::text) ORDER BY reporting_date) FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND reporting_date>=$4::date AND reporting_date<$5::date),'[]'::jsonb) AS dates`, [...scopeTuple(source), selection.from, selection.toExclusive, calendar.excludedWeekdays, selection.limit ?? 50]);
  const row = r.rows[0],
    t = row.totals as Record<string, string>,
    totals = {
      frequency: exactTotal(t.frequency),
      alarmSeconds: exactTotal(t.seconds),
      records: exactTotal(t.records)
    },
    mapped = {
      frequency: exactTotal(t.mappedFrequency),
      alarmSeconds: exactTotal(t.mappedSeconds),
      records: exactTotal(t.mappedRecords)
    },
    denominator = selection.metric === "frequency" ? totals.frequency : totals.alarmSeconds;
  let cumulative = 0;
  const groups = (row.groups as {
    asset_id: string;
    frequency: string;
    seconds: string;
    records: string;
  }[]).map(g => {
    const frequency = exactTotal(g.frequency),
      alarmSeconds = exactTotal(g.seconds);
    cumulative += selection.metric === "frequency" ? frequency : alarmSeconds;
    return {
      assetId: g.asset_id,
      frequency,
      alarmSeconds,
      records: exactTotal(g.records),
      cumulativePercent: denominator ? cumulative / denominator * 100 : null
    };
  });
  const publications = row.dates as {
      date: string;
      id: string;
    }[],
    imported = new Set(publications.map(p => p.date)),
    admittedDates: string[] = [],
    missingDates: string[] = [];
  for (let d = Date.parse(selection.from); d < Date.parse(selection.toExclusive); d += 86400000) {
    const day = new Date(d).toISOString().slice(0, 10);
    if (calendar.includes(day)) (imported.has(day) ? admittedDates : missingDates).push(day);
  }
  return {
    selection,
    groups,
    groupCount: exactTotal(String(row.group_count)),
    totals,
    mapped,
    unresolved: {
      frequency: totals.frequency - mapped.frequency,
      alarmSeconds: totals.alarmSeconds - mapped.alarmSeconds,
      records: totals.records - mapped.records
    },
    states: Object.fromEntries(Object.entries(row.states as Record<string, string>).map(([k, v]) => [k, exactTotal(v)])),
    admittedDates,
    missingDates,
    projectionRevision: "cap1." + digest([scopeTuple(source), selection, row.links, publications]),
    limitations: "Canonical coverage contains only explicit reviewed source mappings. Missing imports are not zero; source aggregates are not individual incidents, alarm seconds are not downtime, and ranking does not establish causality."
  };
}
