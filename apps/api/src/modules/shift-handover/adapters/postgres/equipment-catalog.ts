import {
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import {
  HandoverEquipmentCatalogError,
  type HandoverEquipmentCandidate,
  type HandoverEquipmentSelection,
} from "../../application/equipment-catalog";

/** Handover publishes its scoped identifier directory without exposing journal entries. */
export async function handoverEquipmentCatalog(
  tx: SiteTransaction,
  scope: { organizationId: string; siteId: string },
  selection: HandoverEquipmentSelection,
): Promise<HandoverEquipmentCandidate[]> {
  if (
    tx.context.organizationId !== scope.organizationId ||
    tx.context.siteId !== scope.siteId
  )
    throw new SiteAccessDeniedError();
  if (
    !selection ||
    Object.keys(selection).sort().join() !== "code,locationIds,search" ||
    !Array.isArray(selection.locationIds) ||
    selection.locationIds.length > 500 ||
    new Set(selection.locationIds).size !== selection.locationIds.length ||
    selection.locationIds.some(
      (id) =>
        typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id),
    ) ||
    [selection.search, selection.code].some(
      (value) =>
        typeof value !== "string" ||
        value.length > 160 ||
        /[\u0000-\u001f\u007f]/.test(value),
    )
  )
    throw new HandoverEquipmentCatalogError("invalid");
  const request = structuredClone(selection);
  await tx.query(
    "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
    [scope.organizationId],
  );
  if (
    !(
      await evaluateSiteAccess(tx, {
        ...scope,
        userId: tx.context.userId,
        permissions: ["handover.read"],
      })
    ).allowed
  )
    throw new SiteAccessDeniedError();
  const result = await tx.query(
    `SELECT namespace,code,department_id,area_id FROM shift_handover.equipment_references
    WHERE organization_id=$1 AND site_id=$2 AND namespace='site-equipment'
    AND (cardinality($3::text[])=0 OR coalesce(NULLIF(area_id,''),department_id)=ANY($3::text[]))
    AND ($4='' OR strpos(lower(code),lower($4))>0) AND ($5='' OR code=$5)
    ORDER BY code COLLATE "C",department_id COLLATE "C",area_id COLLATE "C" LIMIT 10001`,
    [
      scope.organizationId,
      scope.siteId,
      request.locationIds,
      request.search,
      request.code,
    ],
  );
  if (result.rows.length > 10000)
    throw new HandoverEquipmentCatalogError("capacity");
  return result.rows.map((row) => ({
    namespace: "site-equipment",
    sourceId: "",
    code: String(row.code),
    sector: "",
    area: "",
    departmentId: String(row.department_id),
    areaId: String(row.area_id),
  }));
}
