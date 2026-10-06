import type { SiteTransaction } from "../../../../persistence/site-operation";
import { SiteAccessDeniedError } from "../../../../persistence/site-operation";
import type { ImportSource } from "../../../integrations";
import { evaluateSiteAccess } from "../../../users-rbac";
export interface ImportedEquipmentCandidate {
  namespace: "analytics";
  sourceId: string;
  code: string;
  sector: string;
  area: string;
}
export class ImportedEquipmentCatalogError extends Error {
  constructor(readonly code: "capacity" | "invalid") {
    super("imported_equipment_catalog_" + code);
  }
}
/** Identifier-only owner contract; imports and analytical facts remain read-only. */
export async function importedEquipmentCatalog(
  tx: SiteTransaction,
  source: ImportSource,
  selection = { code: "", search: "" },
): Promise<ImportedEquipmentCandidate[]> {
  if (
    tx.context.organizationId !== source.organizationId ||
    tx.context.siteId !== source.siteId ||
    !(
      await evaluateSiteAccess(tx, {
        organizationId: source.organizationId,
        siteId: source.siteId,
        userId: tx.context.userId,
        permissions: ["assets.read"],
      })
    ).allowed
  )
    throw new SiteAccessDeniedError();
  if (
    !selection ||
    Object.keys(selection).sort().join() !== "code,search" ||
    [selection.code, selection.search].some(
      (value) =>
        typeof value !== "string" ||
        value.length > 160 ||
        /[\u0000-\u001f\u007f]/.test(value),
    )
  )
    throw new ImportedEquipmentCatalogError("invalid");
  const narrowed = selection.code || selection.search;
  const identities = narrowed
    ? `WITH requested AS MATERIALIZED (
    SELECT id,bereich_id FROM analytics.betriebsmittel WHERE organization_id=$1 AND site_id=$2 AND source_id=$3
      AND ($4='' OR kennzeichen=$4) AND ($5='' OR strpos(lower(kennzeichen),lower($5))>0)
    ), identities AS MATERIALIZED (
      SELECT DISTINCT f.sektor_id,f.bereich_id,f.betriebsmittel_id FROM requested e
      JOIN analytics.fact_hitliste f ON f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3
        AND f.betriebsmittel_id=e.id AND f.bereich_id=e.bereich_id)`
    : `WITH identities AS MATERIALIZED (
      SELECT DISTINCT sektor_id,bereich_id,betriebsmittel_id FROM analytics.fact_hitliste
      WHERE organization_id=$1 AND site_id=$2 AND source_id=$3)`;
  const result = await tx.query(
    `${identities} SELECT DISTINCT e.kennzeichen COLLATE "C" AS code,s.name COLLATE "C" AS sector,b.name COLLATE "C" AS area
  FROM identities f
  JOIN analytics.sektor s ON s.organization_id=$1 AND s.site_id=$2 AND s.source_id=$3 AND s.id=f.sektor_id
  JOIN analytics.bereich b ON b.organization_id=$1 AND b.site_id=$2 AND b.source_id=$3 AND b.id=f.bereich_id
  JOIN analytics.betriebsmittel e ON e.organization_id=$1 AND e.site_id=$2 AND e.source_id=$3 AND e.id=f.betriebsmittel_id AND e.bereich_id=f.bereich_id
  WHERE length(e.kennzeichen) BETWEEN 1 AND 160 ORDER BY code,sector,area LIMIT 10001`,
    [
      source.organizationId,
      source.siteId,
      source.sourceId,
      ...(narrowed ? [selection.code, selection.search] : []),
    ],
  );
  if (result.rows.length > 10000)
    throw new ImportedEquipmentCatalogError("capacity");
  return result.rows.map((row) => ({
    namespace: "analytics",
    sourceId: source.sourceId,
    code: String(row.code),
    sector: String(row.sector),
    area: String(row.area),
  }));
}
