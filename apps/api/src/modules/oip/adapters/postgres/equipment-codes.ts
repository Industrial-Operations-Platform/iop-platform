import type { SiteTransaction } from "../../../../persistence/site-operation";
import type { ImportSource } from "../../../integrations";
import { scopeTuple } from "./analytics";

/** Imported source identifiers only; callers retain their own durable reference identity. */
export async function importedEquipmentCodes(
  tx: SiteTransaction,
  source: ImportSource,
  selection: {
    sector: string;
    area: string;
    search: string;
    after: string;
    exact: boolean;
  },
): Promise<{ codes: string[]; nextCursor: string }> {
  const result = await tx.query(
    `SELECT DISTINCT e.kennzeichen COLLATE "C" AS code
     FROM analytics.fact_hitliste f
     JOIN analytics.sektor s ON (s.organization_id,s.site_id,s.source_id,s.id)=(f.organization_id,f.site_id,f.source_id,f.sektor_id)
     JOIN analytics.bereich b ON (b.organization_id,b.site_id,b.source_id,b.id)=(f.organization_id,f.site_id,f.source_id,f.bereich_id)
     JOIN analytics.betriebsmittel e ON (e.organization_id,e.site_id,e.source_id,e.id,e.bereich_id)=(f.organization_id,f.site_id,f.source_id,f.betriebsmittel_id,f.bereich_id)
     WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3
     AND s.name=$4 AND b.name=$5 AND length(e.kennzeichen) BETWEEN 1 AND 160
     AND (CASE WHEN $8 THEN e.kennzeichen=$6 ELSE strpos(lower(e.kennzeichen),lower($6))>0 END)
     AND e.kennzeichen COLLATE "C">$7 COLLATE "C" ORDER BY code LIMIT 51`,
    [
      ...scopeTuple(source),
      selection.sector,
      selection.area,
      selection.search,
      selection.after,
      selection.exact,
    ],
  );
  const codes = result.rows.slice(0, 50).map((row) => String(row.code));
  return { codes, nextCursor: result.rows.length > 50 ? codes.at(-1)! : "" };
}
