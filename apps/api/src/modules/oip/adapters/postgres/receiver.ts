import type { SiteTransaction } from "../../../../persistence/site-operation";
import type {
  ImportPublication,
  BatchStatus,
  ClassifiedCsv,
  PreparedCsv,
  ImportSource,
} from "../../../integrations";
import { dimensionReference } from "./analytics";
import { AnalyticsError } from "../../domain/analytics";

export interface PublicationInput {
  classified: ClassifiedCsv;
  prepared: PreparedCsv;
  inputSha256: string;
}
export class OipReceiver implements ImportPublication<PublicationInput> {
  constructor(
    private readonly source: ImportSource,
    private readonly project?: (
      tx: SiteTransaction,
      importId: string,
    ) => Promise<void>,
  ) {}
  async publish(
    tx: SiteTransaction,
    batch: BatchStatus,
    input: PublicationInput,
  ): Promise<number> {
    const { classified: c, prepared: p } = input;
    const s = this.source;
    const invalid = (): never => {
      throw new AnalyticsError("invalid_publication");
    };
    if (
      tx.context.organizationId !== s.organizationId ||
      tx.context.siteId !== s.siteId ||
      input.inputSha256 !== batch.sha256 ||
      batch.sourceId !== s.sourceId ||
      batch.reportingDate !== c.reportingDate ||
      c.reportingDate !== p.reportingDate ||
      c.mapping.organizationId !== s.organizationId ||
      c.mapping.siteId !== s.siteId ||
      c.mapping.sourceId !== s.sourceId ||
      c.mapping.mappingRevision !== s.mappingRevision ||
      c.adapterRevision !== s.adapterRevision ||
      c.reportingWindowStatus !== "unknown" ||
      c.records.length < 1 ||
      c.records.length > 20000 ||
      c.records.length !== p.records.length ||
      c.records.length !== c.dataRecordCount
    )
      invalid();
    const seen = new Set<number>();
    const sectors = new Map(
      c.mapping.sectors.map((x) => [x.sectorKey, x.label]),
    );
    const areas = new Map(
      c.mapping.areas.map((x) => [x.sourceArea, x.sectorKey]),
    );
    const rows = c.records.map((r, index) => {
      const original = p.records[index];
      if (
        !original ||
        Object.keys(original).some(
          (key) =>
            original[key as keyof typeof original] !==
            r[key as keyof typeof original],
        ) ||
        !Number.isInteger(r.sourceRecordNumber) ||
        r.sourceRecordNumber < 2 ||
        r.sourceRecordNumber > 25000 ||
        seen.has(r.sourceRecordNumber) ||
        ![r.reportedFrequency, r.accumulatedAlarmSeconds].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        ) ||
        ![
          r.sourceArea,
          r.sourceEquipmentReference,
          r.sourceMessageText,
          r.sourceMessageType,
          r.sourceMessageGroup,
        ].every(
          (v) =>
            typeof v === "string" &&
            v.length > 0 &&
            v.length <= 4096 &&
            !/[\0\r\n]/.test(v),
        ) ||
        (r.classificationStatus === "mapped"
          ? !r.sectorKey ||
            !sectors.has(r.sectorKey) ||
            areas.get(r.sourceArea) !== r.sectorKey
          : r.classificationStatus !== "unclassified" ||
            r.sectorKey !== null ||
            areas.has(r.sourceArea))
      )
        invalid();
      seen.add(r.sourceRecordNumber);
      return {
        line: r.sourceRecordNumber,
        frequency: r.reportedFrequency,
        seconds: r.accumulatedAlarmSeconds,
        sector: dimensionReference(
          s,
          "sector",
          r.sectorKey === null ? ["unclassified"] : ["mapped", r.sectorKey],
        ),
        area: dimensionReference(s, "area", [r.sourceArea]),
        equipment: dimensionReference(s, "equipment", [
          r.sourceArea,
          r.sourceEquipmentReference,
        ]),
        message: dimensionReference(s, "message", [
          r.sourceMessageText,
          r.sourceMessageType,
          r.sourceMessageGroup,
        ]),
        payload: {
          ...r,
          sectorLabel:
            r.sectorKey === null ? "Unclassified" : sectors.get(r.sectorKey),
        },
      };
    });
    const totalFrequency = rows.reduce(
        (sum, r) => sum + BigInt(r.frequency),
        0n,
      ),
      totalSeconds = rows.reduce((sum, r) => sum + BigInt(r.seconds), 0n);
    if (
      totalFrequency > BigInt(Number.MAX_SAFE_INTEGER) ||
      totalSeconds > BigInt(Number.MAX_SAFE_INTEGER)
    )
      invalid();
    const values = [
      s.organizationId,
      s.siteId,
      s.sourceId,
      batch.importId,
      batch.reportingDate,
    ];
    await tx.query(
      `INSERT INTO oip.publications (organization_id,site_id,source_id,import_id,reporting_date,raw_id,record_count,context)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        ...values,
        batch.rawId,
        rows.length,
        JSON.stringify({
          mappingRevision: s.mappingRevision,
          adapterRevision: s.adapterRevision,
          profileRevision: s.profileRevision,
          siteTimeZone: s.siteTimeZone,
          reportingWindowStatus: "unknown",
          mapping: c.mapping,
        }),
      ],
    );
    await tx.query(
      `INSERT INTO oip.facts (organization_id,site_id,source_id,import_id,reporting_date,source_record_number,
      reported_frequency,accumulated_alarm_seconds,sector_ref,area_ref,equipment_ref,message_ref,payload)
      SELECT $1,$2,$3,$4,$5,line,frequency,seconds,sector,area,equipment,message,payload
      FROM jsonb_to_recordset($6::jsonb) AS r(line integer,frequency bigint,seconds bigint,sector text,area text,equipment text,message text,payload jsonb)`,
      [...values, JSON.stringify(rows)],
    );
    if (this.project) await this.project(tx, batch.importId);
    return rows.length;
  }
  async inspect(
    tx: SiteTransaction,
    batch: BatchStatus,
  ): Promise<number | null> {
    const s = this.source;
    const result = await tx.query(
      `SELECT p.record_count, p.raw_id::text, count(f.source_record_number)::integer AS actual
      FROM oip.publications p LEFT JOIN oip.facts f USING (organization_id,site_id,source_id,import_id)
      WHERE p.organization_id=$1 AND p.site_id=$2 AND p.source_id=$3 AND p.import_id=$4
      GROUP BY p.record_count,p.raw_id`,
      [s.organizationId, s.siteId, s.sourceId, batch.importId],
    );
    if (!result.rows.length) return null;
    const row = result.rows[0];
    if (row.raw_id !== batch.rawId || row.record_count !== row.actual)
      throw new AnalyticsError("invalid_publication");
    return Number(row.actual);
  }
}
