import { SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import type { ImportSource } from "../../../integrations";
import { AnalysisCalendar } from "../../domain/analysis-calendar";
import { AnalyticsError, exactTotal } from "../../domain/values";
import { hitlisteReadModel } from "./read-model";
import { digest, scopeTuple } from "./analytics";
import { comparisonSelection, type AssetReference, type ComparisonSelection, type Measurement, type Period, type PeriodMeasure } from "../../../improvement-tracking/domain/improvement";
interface Aggregate {
  frequency: string;
  seconds: string;
  records: string;
}
function periodMeasure(period: Period, aggregate: Aggregate, publicationDates: Set<string>, calendar: AnalysisCalendar): PeriodMeasure {
  const eligibleDates: string[] = [],
    excludedDates: string[] = [];
  for (let day = Date.parse(period.from); day < Date.parse(period.toExclusive); day += 86400000) {
    const date = new Date(day).toISOString().slice(0, 10);
    (calendar.includes(date) ? eligibleDates : excludedDates).push(date);
  }
  return {
    ...period,
    eligibleDates,
    excludedDates,
    admittedDates: eligibleDates.filter(d => publicationDates.has(d)),
    missingDates: eligibleDates.filter(d => !publicationDates.has(d)),
    frequency: exactTotal(aggregate.frequency),
    alarmSeconds: exactTotal(aggregate.seconds),
    records: exactTotal(aggregate.records)
  };
}
/** OIP owns the exact measures and publication snapshot; no causal or downtime interpretation. */
export async function improvementComparison(tx: SiteTransaction, source: ImportSource, selection: ComparisonSelection, asset: AssetReference | null, initialProfileVersion: string, calendar = new AnalysisCalendar()): Promise<Measurement> {
  comparisonSelection(selection);
  if (tx.context.organizationId !== source.organizationId || tx.context.siteId !== source.siteId) throw new SiteAccessDeniedError();
  await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [source.organizationId]);
  if (!(await evaluateSiteAccess(tx, {
    ...source,
    userId: tx.context.userId,
    permissions: ["analytics.read"]
  })).allowed) throw new SiteAccessDeniedError();
  const aliases = (asset?.aliases ?? []).filter(a => a.namespace === "analytics" && a.sourceId === source.sourceId).map(({
    code,
    sector,
    area
  }) => ({
    code,
    sector,
    area
  }));
  const mapped = selection.scope === "selection" || aliases.length > 0;
  const result = await tx.query(`WITH ready AS MATERIALIZED (${hitlisteReadModel}),
    expected AS (SELECT coalesce((SELECT version::text FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$4::text) AS version),
    manifest AS MATERIALIZED (SELECT import_id::text AS id,reporting_date::text AS date FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),
    selected AS MATERIALIZED (SELECT * FROM ready WHERE NOT (extract(isodow FROM reporting_date)::integer=ANY($5::integer[]))
      AND (($6::boolean AND EXISTS(SELECT 1 FROM jsonb_array_elements($7::jsonb) alias WHERE values->>'equipment'=alias->>'code' AND values->>'sector'=alias->>'sector' AND values->>'area'=alias->>'area'))
        OR (NOT $6::boolean AND ($8='' OR values->>'sector'=$8) AND ($9='' OR values->>'area'=$9) AND ($10='' OR values->>'equipment'=$10) AND ($11='' OR values->>'message'=$11)))),
    periods AS (SELECT 'before' AS period,$12::date AS from_date,$13::date AS to_date UNION ALL SELECT 'after',$14::date,$15::date),
    measures AS (SELECT p.period,coalesce(sum(f.reported_frequency),0)::text AS frequency,coalesce(sum(f.accumulated_alarm_seconds),0)::text AS seconds,count(f.import_id)::text AS records
      FROM periods p LEFT JOIN selected f ON f.reporting_date>=p.from_date AND f.reporting_date<p.to_date GROUP BY p.period)
    SELECT (SELECT version FROM expected) AS profile_version,
      ((SELECT count(*) FROM ready)=(SELECT count(*) FROM oip.facts WHERE organization_id=$1 AND site_id=$2 AND source_id=$3)
       AND NOT EXISTS(SELECT 1 FROM ready CROSS JOIN expected WHERE profile_version<>expected.version)) AS projection_valid,
      (SELECT coalesce(jsonb_agg(manifest ORDER BY id),'[]'::jsonb) FROM manifest) AS publications,
      (SELECT jsonb_object_agg(period,jsonb_build_object('frequency',frequency,'seconds',seconds,'records',records)) FROM measures) AS measures`, [...scopeTuple(source), initialProfileVersion, calendar.excludedWeekdays, selection.scope === "asset", JSON.stringify(aliases), selection.filters.sector, selection.filters.area, selection.filters.equipment, selection.filters.message, selection.before.from, selection.before.toExclusive, selection.after.from, selection.after.toExclusive]);
  const row = result.rows[0];
  if (row.projection_valid !== true) throw new AnalyticsError("analytics_projection_unavailable");
  const publications = row.publications as {
      id: string;
      date: string;
    }[],
    dates = new Set(publications.map(p => p.date));
  const aggregates = row.measures as {
    before: Aggregate;
    after: Aggregate;
  };
  return {
    sourceId: source.sourceId,
    siteTimeZone: source.siteTimeZone,
    publicationRevision: "ic1." + digest([1, ...scopeTuple(source), row.profile_version, calendar.excludedWeekdays, publications]),
    profileVersion: String(row.profile_version),
    selection: structuredClone(selection),
    aliases,
    mapped,
    before: periodMeasure(selection.before, aggregates.before, dates, calendar),
    after: periodMeasure(selection.after, aggregates.after, dates, calendar)
  };
}
