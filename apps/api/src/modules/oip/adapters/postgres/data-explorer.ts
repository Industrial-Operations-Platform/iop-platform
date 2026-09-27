import { digest, scopeTuple } from "../../analytics";
import { AnalyticsError, exactTotal } from "../../domain/values";
import type {
  MessageCatalog,
  SourceRowsRequest,
  SourceRowsResult,
} from "../../domain/source-rows";
import type { DataExplorerRepository } from "../../application/ports";
import { PgReportingProfiles } from "./reporting-profiles";
import { hitlisteReadModel } from "./read-model";
export class PgDataExplorer implements DataExplorerRepository {
  constructor(private readonly profiles: PgReportingProfiles) {}
  messages(actor: string, after: string | null): Promise<MessageCatalog> {
    return this.profiles.run(actor, false, async (tx) => {
      await tx.query("SET LOCAL statement_timeout='30s'");
      const result = await tx.query(
        `SELECT DISTINCT m.name COLLATE "C" AS value FROM analytics.meldetext m
        JOIN analytics.fact_hitliste f ON (f.organization_id,f.site_id,f.source_id,f.meldetext_id)=(m.organization_id,m.site_id,m.source_id,m.id)
        WHERE m.organization_id=$1 AND m.site_id=$2 AND m.source_id=$3 AND ($4::text IS NULL OR m.name COLLATE "C">$4::text COLLATE "C")
        ORDER BY value LIMIT 201`,
        [...scopeTuple(this.profiles.source), after],
      );
      const values = result.rows.slice(0, 200).map((x) => String(x.value));
      return {
        values,
        nextCursor: result.rows.length > 200 ? values[values.length - 1] : null,
      };
    });
  }
  sourceRows(
    actor: string,
    selection: SourceRowsRequest,
  ): Promise<SourceRowsResult> {
    return this.profiles.review(actor, async (tx) => {
      await tx.query("SET LOCAL statement_timeout='30s'");
      const order = selection.sort
        .map((s) => `(values->>'${s.field}') COLLATE "C" ${s.direction}`)
        .concat("source_record_number ASC")
        .join(",");
      const result = await tx.query(
        `WITH ready AS MATERIALIZED (${hitlisteReadModel} AND f.import_id=$4::uuid),
        profile AS (SELECT coalesce((SELECT version::text FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3),$5::text) AS version),
        rows AS (SELECT row_number() OVER(ORDER BY ${order}) AS ordinal,values,reporting_date::text AS date,import_id::text AS import_id,source_record_number AS line,reported_frequency::text AS frequency,accumulated_alarm_seconds::text AS seconds
          FROM ready ORDER BY ${order} LIMIT 50 OFFSET $6)
        SELECT (SELECT version FROM profile) AS version,
          EXISTS(SELECT 1 FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=$4::uuid) AS published,
          ((SELECT count(*) FROM ready)=(SELECT count(*) FROM oip.facts WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=$4::uuid)
            AND NOT EXISTS(SELECT 1 FROM ready CROSS JOIN profile WHERE profile_version<>profile.version)) AS valid,
          (SELECT count(*)::integer FROM ready) AS count,(SELECT coalesce(jsonb_agg(rows ORDER BY ordinal),'[]'::jsonb) FROM rows) AS records`,
        [
          ...scopeTuple(this.profiles.source),
          selection.importId,
          this.profiles.initialVersion,
          (selection.page - 1) * 50,
        ],
      );
      const r = result.rows[0];
      if (!r.published) throw new AnalyticsError("unavailable_reference");
      if (!r.valid)
        throw new AnalyticsError("analytics_projection_unavailable");
      return {
        revision:
          "a1." +
          digest([
            ...scopeTuple(this.profiles.source),
            selection.importId,
            r.version,
            this.profiles.initialVersion,
          ]),
        page: selection.page,
        pageCount: Math.ceil(Number(r.count) / 50),
        recordCount: Number(r.count),
        records: (r.records as Record<string, unknown>[]).map((x) => ({
          ...(x.values as Record<string, string>),
          date: String(x.date),
          importId: String(x.import_id),
          line: Number(x.line),
          frequency: exactTotal(String(x.frequency)),
          seconds: exactTotal(String(x.seconds)),
          minutes: exactTotal(String(x.seconds)) / 60,
        })),
      };
    });
  }
}
