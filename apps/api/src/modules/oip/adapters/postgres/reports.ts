import { digest, scopeTuple } from "../../analytics";
import { exactTotal, AnalyticsError } from "../../domain/values";
import {
  reportDimensions,
  labelWhitespace,
} from "../../domain/reporting-profile";
import type {
  ReportRequest,
  ReportResult,
  ReportRow,
  ExecutiveLeader,
} from "../../domain/report";
import type { ReportRepository } from "../../application/ports";
import { PgReportingProfiles } from "./reporting-profiles";
interface ReportSnapshot {
  publications: { id: string; date: string }[];
  profile_version: string;
  totals: Record<string, unknown>;
  executive: (Record<string, unknown> &
    Pick<ExecutiveLeader, "dimension" | "metric">)[];
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
  projection_valid: boolean;
}
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
      const metric = q.metric === "frequency" ? "frequency" : "seconds";
      const sql = `WITH p AS MATERIALIZED (SELECT coalesce((SELECT config FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$4::jsonb) AS config,
    coalesce((SELECT version::text FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$5::text) AS version,$8::text AS whitespace),
   manifest AS MATERIALIZED (SELECT import_id,reporting_date FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),
   ready AS MATERIALIZED (SELECT f.organization_id,f.site_id,f.source_id,f.import_id,f.source_record_number,
     f.datum AS reporting_date,f.haufigkeit AS reported_frequency,f.dauer_sekunden AS accumulated_alarm_seconds,f.profile_version,
     jsonb_build_object('sector',s.name,'area',b.name,'equipment',e.kennzeichen,'message',m.name,'type',t.name,'messageGroup',g.name,
       'frequency',f.haufigkeit::text,'duration',f.dauer_sekunden::text) AS values,s.is_unclassified AS unmapped
     FROM analytics.fact_hitliste f
     JOIN analytics.sektor s ON (s.organization_id,s.site_id,s.source_id,s.id)=(f.organization_id,f.site_id,f.source_id,f.sektor_id)
     JOIN analytics.bereich b ON (b.organization_id,b.site_id,b.source_id,b.id)=(f.organization_id,f.site_id,f.source_id,f.bereich_id)
     JOIN analytics.betriebsmittel e ON (e.organization_id,e.site_id,e.source_id,e.id,e.bereich_id)=(f.organization_id,f.site_id,f.source_id,f.betriebsmittel_id,f.bereich_id)
     JOIN analytics.meldetext m ON (m.organization_id,m.site_id,m.source_id,m.id)=(f.organization_id,f.site_id,f.source_id,f.meldetext_id)
     JOIN analytics.meldung_typ t ON (t.organization_id,t.site_id,t.source_id,t.id)=(f.organization_id,f.site_id,f.source_id,f.typ_id)
     JOIN analytics.meldegruppe g ON (g.organization_id,g.site_id,g.source_id,g.id)=(f.organization_id,f.site_id,f.source_id,f.meldegruppe_id)
     WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3),
   selected AS MATERIALIZED (SELECT * FROM ready n WHERE reporting_date >= $6::date AND reporting_date < $7::date ${predicates.map((x) => "AND " + x).join(" ")}
    AND (${search}::text='' OR EXISTS (SELECT 1 FROM jsonb_each_text(n.values) field WHERE position(${search}::text in lower(field.value))>0))),
   groups AS MATERIALIZED (SELECT values->>'${q.dimension}' AS key,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected GROUP BY 1),
   executive_groups AS (SELECT d.dimension,d.metric,values->>d.dimension AS key,
     sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records
     FROM selected CROSS JOIN (VALUES ('sector','frequency'),('area','duration'),('equipment','frequency'),('message','frequency')) d(dimension,metric)
     GROUP BY d.dimension,d.metric,values->>d.dimension),
   executive_ranked AS (SELECT *,row_number() OVER(PARTITION BY dimension ORDER BY
     CASE WHEN metric='duration' THEN seconds::numeric ELSE frequency::numeric END DESC,key COLLATE "C") AS rank
     FROM executive_groups WHERE CASE WHEN metric='duration' THEN seconds::numeric ELSE frequency::numeric END > 0),
   leaders AS (SELECT * FROM groups ORDER BY ${metric}::numeric DESC,key COLLATE "C" LIMIT 10),
   timeline AS (SELECT date_trunc('${q.period}',reporting_date)::date::text AS period,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected GROUP BY 1),
   series AS (SELECT date_trunc('${q.period}',reporting_date)::date::text AS period,values->>'${q.dimension}' AS key,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected WHERE values->>'${q.dimension}' IN(SELECT key FROM leaders) GROUP BY 1,2),
   monthly AS (SELECT to_char(reporting_date,'YYYY-MM') AS period,values->>'${q.dimension}' AS key,sum(reported_frequency)::text AS frequency,sum(accumulated_alarm_seconds)::text AS seconds,count(*)::text AS records FROM selected WHERE values->>'${q.dimension}' IN(SELECT key FROM leaders) GROUP BY 1,2),
   opts AS (SELECT key,value,count(*) AS n FROM ready CROSS JOIN LATERAL jsonb_each_text(values) GROUP BY key,value),
   rankedopts AS (SELECT *,row_number() OVER(PARTITION BY key ORDER BY value COLLATE "C") AS pos FROM opts)
   SELECT (SELECT version FROM p) AS profile_version,(SELECT coalesce(jsonb_agg(jsonb_build_object('id',import_id,'date',reporting_date::text) ORDER BY import_id),'[]'::jsonb) FROM manifest) AS publications,
    (SELECT jsonb_build_object('frequency',coalesce(sum(reported_frequency),0)::text,'seconds',coalesce(sum(accumulated_alarm_seconds),0)::text,'records',count(*)::text) FROM selected) AS totals,
    (SELECT coalesce(jsonb_agg(e ORDER BY dimension),'[]'::jsonb) FROM executive_ranked e WHERE rank=1) AS executive,
    ((SELECT count(*) FROM ready)=(SELECT count(*) FROM oip.facts WHERE organization_id=$1 AND site_id=$2 AND source_id=$3)
      AND NOT EXISTS(SELECT 1 FROM ready CROSS JOIN p WHERE profile_version<>p.version)) AS projection_valid,
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
      if (!r.projection_valid)
        throw new AnalyticsError("analytics_projection_unavailable");
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
        executive: r.executive.map((x) => ({
          ...asRow(x),
          dimension: x.dimension,
          metric: x.metric,
        })),
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
