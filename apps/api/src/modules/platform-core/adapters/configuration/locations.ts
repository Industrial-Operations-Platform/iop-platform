/** Operator-owned site configuration; source catalogs never create physical identity. */
export interface ConfiguredLocation {
  id: string;
  label: string;
  parentId: string;
  role: "department" | "area" | "location";
  sectorKey: string;
}
export function configuredLocations(value: unknown): ConfiguredLocation[] {
  if (!Array.isArray(value) || value.length > 500)
    throw new Error("Invalid location configuration.");
  const ids = new Set<string>();
  const locations = value.map((row): ConfiguredLocation => {
    if (
      !row ||
      Object.keys(row).sort().join() !== "id,label,parentId,role,sectorKey" ||
      typeof row.id !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(row.id) ||
      ids.has(row.id) ||
      typeof row.label !== "string" ||
      !row.label.trim() ||
      row.label.length > 100 ||
      typeof row.parentId !== "string" ||
      typeof row.sectorKey !== "string" ||
      row.sectorKey.length > 100 ||
      !["department", "area", "location"].includes(row.role)
    )
      throw new Error("Invalid location configuration.");
    ids.add(row.id);
    return { ...row };
  });
  for (const row of locations) {
    const ancestors = new Set([row.id]);
    let parentId = row.parentId;
    while (parentId) {
      const parent = locations.find((location) => location.id === parentId);
      if (!parent || ancestors.has(parentId))
        throw new Error("Invalid location parent.");
      ancestors.add(parentId);
      parentId = parent.parentId;
    }
  }
  return locations;
}
