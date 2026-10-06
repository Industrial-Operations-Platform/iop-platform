import type { SiteTransaction } from "../../persistence/site-operation";
import type { ImportSource } from "../../modules/integrations";
import type {
  Location,
  EquipmentCandidate,
} from "../../modules/assets/domain/assets";
import { AssetError } from "../../modules/assets/domain/assets";
import {
  importedEquipmentCatalog,
  ImportedEquipmentCatalogError,
} from "../../modules/oip/adapters/postgres/equipment-catalog";
import { handoverEquipmentCatalog } from "../../modules/shift-handover/adapters/postgres/equipment-catalog";
import { HandoverEquipmentCatalogError } from "../../modules/shift-handover/application/equipment-catalog";
import { evaluateSiteAccess } from "../../modules/users-rbac";
function within(location: Location, ancestor: string, locations: Location[]) {
  let parent = location.parentId;
  const seen = new Set<string>();
  while (parent && !seen.has(parent)) {
    if (parent === ancestor) return true;
    seen.add(parent);
    parent = locations.find((node) => node.id === parent)?.parentId ?? "";
  }
  return false;
}
/** Explicit configured source context only; no code-prefix or physical identity inference. */
export async function assetEquipmentCatalog(
  tx: SiteTransaction,
  source: ImportSource,
  locations: Location[],
  selection = { code: "", search: "" },
): Promise<EquipmentCandidate[]> {
  try {
    const imported = await importedEquipmentCatalog(tx, source, selection);
    const handoverAllowed = (
      await evaluateSiteAccess(tx, {
        ...source,
        userId: tx.context.userId,
        permissions: ["handover.read"],
      })
    ).allowed;
    const reported = handoverAllowed
      ? await handoverEquipmentCatalog(tx, source, {
          locationIds: [],
          search: selection.search,
          code: selection.code,
        })
      : [];
    const candidates = imported.map((candidate) => {
      const departments = locations.filter(
        (location) =>
          location.role === "department" &&
          location.sectorKey === candidate.sector,
      );
      const department = departments.length === 1 ? departments[0] : undefined;
      const areas = department
        ? locations.filter(
            (location) =>
              location.role === "area" &&
              location.label === candidate.area &&
              within(location, department.id, locations),
          )
        : [];
      return {
        ...candidate,
        departmentId: department?.id ?? "",
        areaId: areas.length === 1 ? areas[0].id : "",
      };
    });
    return [...candidates, ...reported];
  } catch (error) {
    if (
      error instanceof ImportedEquipmentCatalogError ||
      error instanceof HandoverEquipmentCatalogError
    )
      throw new AssetError(
        error.code === "capacity" ? "asset_capacity" : "invalid_asset",
      );
    throw error;
  }
}
