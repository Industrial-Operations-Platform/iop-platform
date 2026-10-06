/** Retained reporting identity only; no issue body or physical validation is exposed. */
export interface HandoverEquipmentCandidate {
  namespace: "site-equipment";
  sourceId: "";
  code: string;
  sector: "";
  area: "";
  departmentId: string;
  areaId: string;
}
export interface HandoverEquipmentSelection {
  locationIds: string[];
  search: string;
  code: string;
}
export class HandoverEquipmentCatalogError extends Error {
  constructor(readonly code: "invalid" | "capacity") {
    super("handover_equipment_catalog_" + code);
  }
}
