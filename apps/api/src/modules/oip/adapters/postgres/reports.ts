import { digest, scopeTuple } from "../../analytics";
import { exactTotal } from "../../domain/values";
import {
  reportDimensions,
  textFields,
  labelWhitespace,
} from "../../domain/reporting-profile";
import type {
  ReportRequest,
  ReportResult,
  ReportRow,
} from "../../domain/report";
import type { ReportRepository } from "../../application/ports";
import { PgReportingProfiles } from "./reporting-profiles";
interface ReportSnapshot {
  publications: { id: string; date: string }[];
  profile_version: string;
  totals: Record<string, unknown>;
  options: { field: string; value: string }[];
  option_counts: Record<string, number>;
  groups: Record<string, unknown>[];
  duration_groups: Record<string, unknown>[];
  group_count: number;
  timeline: Record<string, unknown>[];
  series: Record<string, unknown>[];
  monthly: Record<string, unknown>[];
  records: Record<string, unknown>[];
  unclassified: number;
}
const payloadFields = {
  area: "sourceArea",
  equipment: "sourceEquipmentReference",
  message: "sourceMessageText",
  type: "sourceMessageType",
  messageGroup: "sourceMessageGroup",
};
const normalize = (field: string) =>
  `CASE WHEN (p.config->'normalization'->>'collapseWhitespace')::boolean THEN regexp_replace(${trim(field)},'[' || $8::text || ']+',' ','g') ELSE ${trim(field)} END`;
const unicode = (field: string) =>
  `CASE WHEN (p.config->'normalization'->>'unicodeNfc')::boolean THEN normalize(f.payload->>'${field}',NFC) ELSE f.payload->>'${field}' END`;
const trim = (field: string) =>
  `CASE WHEN (p.config->'normalization'->>'trim')::boolean THEN btrim(${unicode(field)},$8::text) ELSE ${unicode(field)} END`;
const asRow = (r: Record<string, unknown>): ReportRow => {
  const frequency = exactTotal(String(r.frequency)),
    seconds = exactTotal(String(r.seconds));
  return {
    key: String(r.key ?? ""),
    frequency,
    seconds,
    minutes: seconds / 60,
    records: exactTotal(String(r.records)),
  };
};
export class PgReportRepository implements ReportRepository {
  constructor(private readonly profiles: PgReportingProfiles) {}
  async query(actor: string, q: ReportRequest): Promise<ReportResult> {
    const source = this.profiles.source;
    return this.profiles.run(actor, false, async (tx) => {
      await tx.query("SET LOCAL statement_timeout='30s'");
      const vals: unknown[] = [
        ...scopeTuple(source),
        JSON.stringify(this.profiles.initial),
        this.profiles.initialVersion,
        q.from,
        q.toExclusive,
        labelWhitespace,
      ];
      const bind = (v: unknown) => {
        vals.push(v);
        return "$" + vals.length;
      };
      const predicates = reportDimensions
        .filter((k) => q.filters[k]?.length)
        .map((k) => `n.values->>'${k}'=ANY(${bind(q.filters[k])}::text[])`);
      const search = bind(q.search.toLowerCase()),
        offset = bind((q.page - 1) * 50);
      const valueExpressions = textFields
        .map(
          (k) =>
            `'${k}',coalesce(p.config->'compiled'->'aliases'->'${k}'->>(n.${k.toLowerCase()}),n.${k.toLowerCase()})`,
        )
        .join(",");
      const metric = q.metric === "frequency" ? "frequency" : "seconds";
      const sql = `WITH p AS MATERIALIZED (SELECT coalesce((SELECT config FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$4::jsonb) AS config,
    coalesce((SELECT version::text FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$5::text) AS version),
   manifest AS MATERIALIZED (SELECT import_id,reporting_date FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),
   norm AS MATERIALIZED (SELECT f.*,${textFields.map((k) => normalize(payloadFields[k]) + " AS " + k.toLowerCase()).join(",")} FROM oip.facts f CROSS JOIN p WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3),
   aliased AS (SELECT n.*,jsonb_build_object(${valueExpressions},'frequency',n.reported_frequency::text,'duration',n.accumulated_alarm_seconds::text) AS fields FROM norm n CROSS JOIN p),
   ready AS MATERIALIZED (SELECT a.*,fields||jsonb_build_object('sector',coalesce(p.config->'compiled'->'areas'->>(fields->>'area'),p.config->>'unclassifiedLabel')) AS values,
    p.config->'compiled'->'areas'->>(fields->>'area') IS NULL AS unmapped FROM aliased a CROSS JOIN p),
   selected AS MATERIALIZED (SELECT * FROM ready n WHERE reporting_date >= $6::date AND reporting_date < $7::date ${predicates.map((x) => "AND " + x).join(" ")}
    AND (${search}::text='' OR EXISTS (SELECT 1 FROM jsonb_each_text(n.values) field WHERE position(${search}::text in lower(field.value))>0))),
   groups AS MATERIALIZED (SELECT values->>'${q.dimension}' AS key,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected GROUP BY 1),
   leaders AS (SELECT * FROM groups ORDER BY ${metric}::numeric DESC,key COLLATE "C" LIMIT 10),
   timeline AS (SELECT date_trunc('${q.period}',reporting_date)::date::text AS period,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected GROUP BY 1),
   series AS (SELECT date_trunc('${q.period}',reporting_date)::date::text AS period,values->>'${q.dimension}' AS key,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected WHERE values->>'${q.dimension}' IN(SELECT key FROM leaders) GROUP BY 1,2),
   monthly AS (SELECT to_char(reporting_date,'YYYY-MM') AS period,values->>'${q.dimension}' AS key,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected WHERE values->>'${q.dimension}' IN(SELECT key FROM leaders) GROUP BY 1,2),
   opts AS (SELECT key,value,count(*) AS n FROM ready CROSS JOIN LATERAL jsonb_each_text(values) GROUP BY key,value),
   rankedopts AS (SELECT *,row_number() OVER(PARTITION BY key ORDER BY value COLLATE "C") AS pos FROM opts)
   SELECT (SELECT version FROM p) AS profile_version,(SELECT coalesce(jsonb_agg(jsonb_build_object('id',import_id,'date',reporting_date::text) ORDER BY import_id),'[]'::jsonb) FROM manifest) AS publications,
    (SELECT jsonb_build_object('frequency',coalesce(sum(reported_frequency),0)::text,'seconds',coalesce(sum(accumulated_alarm_seconds),0)::text,'records',count(*)::text) FROM selected) AS totals,
    (SELECT count(*)::integer FROM selected WHERE unmapped) AS unclassified,
    (SELECT coalesce(jsonb_agg(g),'[]'::jsonb) FROM(SELECT * FROM groups ORDER BY ${metric}::numeric DESC,key COLLATE "C" LIMIT 100)g) AS groups,
    (SELECT coalesce(jsonb_agg(g),'[]'::jsonb) FROM(SELECT * FROM groups ORDER BY seconds::numeric DESC,key COLLATE "C" LIMIT 100)g) AS duration_groups,
    (SELECT count(*)::integer FROM groups) AS group_count,
    (SELECT coalesce(jsonb_agg(t ORDER BY period),'[]'::jsonb) FROM timeline t) AS timeline,
    (SELECT coalesce(jsonb_agg(t ORDER BY period,key),'[]'::jsonb) FROM series t) AS series,
    (SELECT coalesce(jsonb_agg(t ORDER BY period,key),'[]'::jsonb) FROM monthly t) AS monthly,
    (SELECT coalesce(jsonb_agg(jsonb_build_object('field',key,'value',value)),'[]'::jsonb) FROM rankedopts WHERE pos<=200) AS options,
    (SELECT coalesce(jsonb_object_agg(key,n),'{}'::jsonb) FROM(SELECT key,count(*) AS n FROM opts GROUP BY key)x) AS option_counts,
    (SELECT coalesce(jsonb_agg(r),'[]'::jsonb) FROM(SELECT values,reporting_date::text AS date,import_id::text AS import_id,source_record_number AS line,reported_frequency::text AS frequency,accumulated_alarm_seconds::text AS seconds FROM selected ORDER BY reporting_date,import_id,source_record_number LIMIT 50 OFFSET ${offset})r) AS records`;
      const r = (await tx.query(sql, vals))
        .rows[0] as unknown as ReportSnapshot;
      const pubs = r.publications as { id: string; date: string }[];
      const revision =
        "a1." +
        digest([
          1,
          ...scopeTuple(source),
          pubs.map((p) => p.id).sort(),
          r.profile_version,
        ]);
      const totals = asRow(r.totals);
      const options: Record<string, string[]> = {};
      for (const o of r.options) {
        (options[o.field] ??= []).push(o.value);
      }
      const points = (xs: Record<string, unknown>[]) =>
        xs.map((x) => ({ ...asRow(x), period: String(x.period) }));
      return {
        revision,
        profileVersion: r.profile_version,
        selection: q,
        totals,
        groups: r.groups.map(asRow),
        durationGroups: r.duration_groups.map(asRow),
        groupCount: r.group_count,
        timeline: points(r.timeline),
        series: points(r.series),
        monthly: points(r.monthly),
        options,
        optionCounts: r.option_counts,
        dates: pubs.map((x) => x.date).sort(),
        records: r.records.map((x: Record<string, unknown>) => ({
          ...(x.values as object),
          date: String(x.date),
          importId: String(x.import_id),
          line: Number(x.line),
          frequency: exactTotal(String(x.frequency)),
          seconds: exactTotal(String(x.seconds)),
          minutes: exactTotal(String(x.seconds)) / 60,
        })),
        recordCount: totals.records,
        page: q.page,
        pageCount: Math.ceil(totals.records / 50),
        unclassifiedCount: r.unclassified,
      };
    });
  }
}
