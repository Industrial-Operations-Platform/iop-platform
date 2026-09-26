import type { Pool } from "pg";
import {
  runSiteOperation,
  type SiteTransaction,
} from "../../persistence/site-operation";
import type { ImportSource } from "../integrations";
import {
  AnalyticsError,
  digest,
  scopeTuple,
  dimensions,
  exactTotal,
  validateQuery,
  selectionOf,
  decodeCursor,
  dateLabel,
  type Availability,
  type Analysis,
  type Fact,
  type Dimension,
  type Group,
} from "./analytics";

const manifest = `SELECT coalesce(jsonb_agg(jsonb_build_object('id',import_id,'date',reporting_date::text) ORDER BY import_id),'[]'::jsonb)
  FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3`;
const sourceCte = `source AS MATERIALIZED (SELECT f.*,p.raw_id,p.context FROM oip.facts f JOIN oip.publications p
  USING (organization_id,site_id,source_id,import_id,reporting_date)
  WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3)`;
const dimensionsSql = (
  table: string,
) => `SELECT d.* FROM ${table} f CROSS JOIN LATERAL (VALUES
  ('sector',sector_ref,CASE WHEN payload->>'classificationStatus'='mapped' AND payload->>'sectorLabel'='Unclassified'
    THEN 'Unclassified (sector ' || (payload->>'sectorKey') || ')' ELSE payload->>'sectorLabel' END,
    jsonb_build_array(payload->>'classificationStatus',payload->>'sectorKey')),
  ('area',area_ref,payload->>'sourceArea',jsonb_build_array(payload->>'sourceArea')),
  ('equipment',equipment_ref,(payload->>'sourceArea') || ' / ' || (payload->>'sourceEquipmentReference'),jsonb_build_array(payload->>'sourceArea',payload->>'sourceEquipmentReference')),
  ('message',message_ref,(payload->>'sourceMessageText') || ' [' || (payload->>'sourceMessageType') || ' / ' || (payload->>'sourceMessageGroup') || ']',jsonb_build_array(payload->>'sourceMessageText',payload->>'sourceMessageType',payload->>'sourceMessageGroup'))
) d(kind,reference,label,tuple)`;
const safeCursor = (v: Record<string, unknown>, keys: string[]) => {
  if (
    Object.keys(v).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(v, k))
  )
    throw new AnalyticsError("invalid_selection");
};
export class OipQueries {
  constructor(
    private readonly pool: Pick<Pool, "connect">,
    private readonly source: ImportSource,
  ) {}
  private run<T>(
    actor: string,
    action: (tx: SiteTransaction) => Promise<T>,
  ): Promise<T> {
    return runSiteOperation(
      this.pool,
      {
        userId: actor,
        organizationId: this.source.organizationId,
        siteId: this.source.siteId,
        permissions: ["analytics.read"],
      },
      async (tx) => {
        await tx.query("SET LOCAL statement_timeout='15s'");
        return action(tx);
      },
    );
  }
  private availabilityOf(
    publications: { id: string; date: string }[],
  ): Availability {
    if (publications.length > 1000)
      throw new AnalyticsError("invalid_selection");
    const dates = [...new Set(publications.map((p) => p.date))].sort();
    return {
      revision:
        "r1." +
        digest([
          1,
          ...scopeTuple(this.source),
          publications.map((p) => p.id).sort(),
        ]),
      dates,
      latestDate: dates.at(-1) ?? null,
      siteTimeZone: this.source.siteTimeZone,
    };
  }
  async availability(actor: string): Promise<Availability> {
    return this.run(actor, async (tx) => {
      const r = await tx.query(
        `SELECT (${manifest}) AS publications`,
        scopeTuple(this.source),
      );
      return this.availabilityOf(
        r.rows[0].publications as { id: string; date: string }[],
      );
    });
  }
  async options(
    actor: string,
    input: unknown,
  ): Promise<{
    revision: string;
    options: { reference: string; label: string }[];
    nextCursor: string | null;
  }> {
    const v = input as Record<string, unknown>;
    if (
      !v ||
      typeof v !== "object" ||
      Array.isArray(v) ||
      Object.keys(v).some(
        (k) => !["kind", "revision", "cursor", "pageSize"].includes(k),
      ) ||
      !dimensions.includes(v.kind as Dimension) ||
      typeof v.revision !== "string" ||
      !/^r1\.[A-Za-z0-9_-]{43}$/.test(v.revision) ||
      (v.cursor !== undefined &&
        (typeof v.cursor !== "string" || v.cursor.length > 4096))
    )
      throw new AnalyticsError("invalid_selection");
    const size = v.pageSize ?? 50;
    if (!Number.isInteger(size) || Number(size) < 1 || Number(size) > 100)
      throw new AnalyticsError("invalid_selection");
    let anchor = "";
    if (v.cursor) {
      const c = decodeCursor(String(v.cursor));
      safeCursor(c, ["v", "revision", "kind", "ref"]);
      if (
        c.v !== 1 ||
        c.revision !== v.revision ||
        c.kind !== v.kind ||
        typeof c.ref !== "string" ||
        !/^d1\.[A-Za-z0-9_-]{43}$/.test(c.ref)
      )
        throw new AnalyticsError("invalid_selection");
      anchor = c.ref;
    }
    return this.run(actor, async (tx) => {
      const r = await tx.query(
        `WITH ${sourceCte}, dims AS (${dimensionsSql("source")}), opts AS
        (SELECT reference,min(label) AS label,count(DISTINCT tuple) AS tuples FROM dims WHERE kind=$4 GROUP BY reference)
        SELECT (${manifest}) AS publications,
        (SELECT coalesce(jsonb_agg(o ORDER BY reference),'[]'::jsonb) FROM (SELECT reference,label FROM opts WHERE reference COLLATE "C">$5 COLLATE "C" ORDER BY reference COLLATE "C" LIMIT $6) o) AS options,
        EXISTS(SELECT 1 FROM opts WHERE tuples>1) AS collision,
        ($5='' OR EXISTS(SELECT 1 FROM opts WHERE reference=$5)) AS anchor`,
        [...scopeTuple(this.source), v.kind, anchor, Number(size) + 1],
      );
      const row = r.rows[0];
      const current = this.availabilityOf(
        row.publications as { id: string; date: string }[],
      );
      if (current.revision !== v.revision)
        throw new AnalyticsError("analytics_revision_changed");
      if (row.collision || !row.anchor)
        throw new AnalyticsError("invalid_selection");
      const opts = row.options as { reference: string; label: string }[];
      const more = opts.length > Number(size);
      opts.splice(Number(size));
      return {
        revision: current.revision,
        options: opts,
        nextCursor: more
          ? Buffer.from(
              JSON.stringify({
                v: 1,
                revision: v.revision,
                kind: v.kind,
                ref: opts.at(-1)!.reference,
              }),
            ).toString("base64url")
          : null,
      };
    });
  }
  async query(actor: string, input: unknown): Promise<Analysis> {
    const q = validateQuery(input),
      selection = selectionOf(q),
      fingerprint = digest([1, ...scopeTuple(this.source), selection]);
    let anchor: { date: string; id: string; line: number } | null = null;
    if (q.cursor) {
      const c = decodeCursor(q.cursor);
      safeCursor(c, [
        "v",
        "revision",
        "selection",
        "order",
        "date",
        "id",
        "line",
      ]);
      if (
        c.v !== 1 ||
        c.revision !== q.revision ||
        c.selection !== fingerprint ||
        c.order !== "date-import-line" ||
        typeof c.date !== "string" ||
        typeof c.id !== "string" ||
        !Number.isInteger(c.line) ||
        Number(c.line) < 2 ||
        Number(c.line) > 25000 ||
        !dateLabel(c.date) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
          c.id,
        )
      )
        throw new AnalyticsError("invalid_selection");
      anchor = { date: c.date, id: c.id, line: Number(c.line) };
    }
    return this.run(actor, async (tx) => {
      const sql = `WITH ${sourceCte}, filtered AS MATERIALIZED (SELECT * FROM source WHERE reporting_date >= $4::date AND reporting_date < $5::date
        AND ($6::text[] IS NULL OR sector_ref=ANY($6)) AND ($7::text[] IS NULL OR area_ref=ANY($7))
        AND ($8::text[] IS NULL OR equipment_ref=ANY($8)) AND ($9::text[] IS NULL OR message_ref=ANY($9))
        AND ($10::text[] IS NULL OR NOT message_ref=ANY($10))), dims AS (${dimensionsSql("source")}),
        grouped AS (SELECT d.kind,d.reference,min(d.label) AS label,sum(f.reported_frequency)::text AS frequency,
          sum(f.accumulated_alarm_seconds)::text AS seconds,count(*)::integer AS count
          FROM filtered f CROSS JOIN LATERAL (VALUES ('sector',sector_ref,CASE WHEN payload->>'classificationStatus'='mapped' AND payload->>'sectorLabel'='Unclassified'
            THEN 'Unclassified (sector ' || (payload->>'sectorKey') || ')' ELSE payload->>'sectorLabel' END),
            ('area',area_ref,payload->>'sourceArea'),('equipment',equipment_ref,(payload->>'sourceArea')||' / '||(payload->>'sourceEquipmentReference')),
            ('message',message_ref,(payload->>'sourceMessageText')||' ['||(payload->>'sourceMessageType')||' / '||(payload->>'sourceMessageGroup')||']')) d(kind,reference,label)
          GROUP BY d.kind,d.reference), ranked AS (SELECT *,row_number() OVER(PARTITION BY kind ORDER BY frequency::numeric DESC,reference COLLATE "C") AS rank FROM grouped)
        SELECT (${manifest}) AS publications,
          (SELECT count(*)::integer FROM filtered) AS count,
          (SELECT coalesce(sum(reported_frequency),0)::text FROM filtered) AS frequency,
          (SELECT coalesce(sum(accumulated_alarm_seconds),0)::text FROM filtered) AS seconds,
          (SELECT count(*)::integer FROM filtered WHERE payload->>'classificationStatus'='unclassified') AS unclassified,
          (SELECT count(*)::integer FROM filtered WHERE (payload->>'repeatedTuple')::boolean) AS repeated,
          EXISTS(SELECT 1 FROM dims GROUP BY kind,reference HAVING count(DISTINCT tuple)>1) AS collision,
          EXISTS(SELECT 1 FROM (SELECT 'sector' AS kind,unnest($6::text[]) AS ref UNION ALL SELECT 'area',unnest($7::text[])
            UNION ALL SELECT 'equipment',unnest($8::text[]) UNION ALL SELECT 'message',unnest($9::text[])
            UNION ALL SELECT 'message',unnest($10::text[])) r WHERE NOT EXISTS(SELECT 1 FROM dims d WHERE d.kind=r.kind AND d.reference=r.ref)) AS unavailable,
          ($11::text IS NULL OR EXISTS(SELECT 1 FROM filtered WHERE reporting_date::text=$11 AND import_id::text=$12 AND source_record_number=$13)) AS anchor,
          (SELECT coalesce(jsonb_agg(x ORDER BY x."reportingDate",x."importId",x."sourceRecordNumber"),'[]'::jsonb) FROM
            (SELECT payload || jsonb_build_object('importId',import_id,'rawId',raw_id,'reportingDate',reporting_date::text,
              'sectorRef',sector_ref,'areaRef',area_ref,'equipmentRef',equipment_ref,'messageRef',message_ref,
              'mappingRevision',context->>'mappingRevision','adapterRevision',context->>'adapterRevision',
              'profileRevision',context->>'profileRevision','siteTimeZone',context->>'siteTimeZone') AS data,
              reporting_date::text AS "reportingDate",import_id::text AS "importId",source_record_number AS "sourceRecordNumber"
              FROM filtered WHERE $11::text IS NULL OR (reporting_date,import_id,source_record_number)>($11::date,$12::uuid,$13::integer)
              ORDER BY reporting_date,import_id,source_record_number LIMIT $14) x) AS records,
          (SELECT coalesce(jsonb_agg(r ORDER BY kind,rank),'[]'::jsonb) FROM ranked r WHERE rank<=100) AS groups,
          (SELECT coalesce(jsonb_object_agg(kind,n),'{}'::jsonb) FROM (SELECT kind,count(*)::integer AS n FROM grouped GROUP BY kind) g) AS group_counts`;
      const r = await tx.query(sql, [
        ...scopeTuple(this.source),
        q.from,
        q.toExclusive,
        q.sectors ?? null,
        q.areas ?? null,
        q.equipment ?? null,
        q.messages ?? null,
        q.excludedMessages ?? null,
        anchor?.date ?? null,
        anchor?.id ?? null,
        anchor?.line ?? null,
        q.pageSize + 1,
      ]);
      const row = r.rows[0];
      const available = this.availabilityOf(
        row.publications as { id: string; date: string }[],
      );
      if (available.revision !== q.revision)
        throw new AnalyticsError("analytics_revision_changed");
      if (row.unavailable) throw new AnalyticsError("unavailable_reference");
      if (row.collision || !row.anchor)
        throw new AnalyticsError("invalid_selection");
      const records = (row.records as { data: Fact }[]).map((x) => x.data),
        more = records.length > q.pageSize;
      records.splice(q.pageSize);
      const last = records.at(-1);
      const groups: Record<Dimension, Group[]> = {
        sector: [],
        area: [],
        equipment: [],
        message: [],
      };
      for (const g of row.groups as {
        kind: Dimension;
        reference: string;
        label: string;
        frequency: string;
        seconds: string;
        count: number;
      }[]) {
        groups[g.kind].push({
          reference: g.reference,
          label: g.label,
          reportedFrequency: exactTotal(g.frequency),
          accumulatedAlarmSeconds: exactTotal(g.seconds),
          recordCount: g.count,
        });
      }
      const admittedDates = available.dates.filter(
          (d) => d >= q.from && d < q.toExclusive,
        ),
        missingDates: string[] = [];
      for (
        let day = Date.parse(q.from);
        day < Date.parse(q.toExclusive);
        day += 86400000
      ) {
        const date = new Date(day).toISOString().slice(0, 10);
        if (!admittedDates.includes(date)) missingDates.push(date);
      }
      return {
        revision: available.revision,
        selection,
        recordCount: Number(row.count),
        reportedFrequency: exactTotal(String(row.frequency)),
        accumulatedAlarmSeconds: exactTotal(String(row.seconds)),
        admittedDates,
        missingDates,
        state:
          admittedDates.length === 0
            ? "no-imports"
            : Number(row.count) === 0
              ? "no-matches"
              : "ready",
        unclassifiedCount: Number(row.unclassified),
        repeatedCount: Number(row.repeated),
        records,
        nextCursor:
          more && last
            ? Buffer.from(
                JSON.stringify({
                  v: 1,
                  revision: q.revision,
                  selection: fingerprint,
                  order: "date-import-line",
                  date: last.reportingDate,
                  id: last.importId,
                  line: last.sourceRecordNumber,
                }),
              ).toString("base64url")
            : null,
        groups,
        groupCounts: {
          sector: 0,
          area: 0,
          equipment: 0,
          message: 0,
          ...(row.group_counts as object),
        },
        reportingWindowStatus: "unknown",
      };
    });
  }
}
