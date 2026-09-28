import { configuredLocations } from "../../modules/platform-core/adapters/configuration/locations";
import type { Catalog } from "../../modules/shift-handover/domain/handover";
export const handoverDefaults = {
  locations: [],
  externalSystemLabel: "External work reference",
  categories: [
    "Safety",
    "Information",
    "Successes",
    "People",
    "Performance",
    "Problems",
  ].map((label) => ({ id: label.toLowerCase(), label })),
};
export function handoverCatalog(
  value: unknown,
  scope: { organizationId: string; siteId: string },
  timeZone: string,
): Catalog {
  if (value === undefined) return { ...handoverDefaults, timeZone };
  const v = value as Record<string, unknown>;
  if (
    !v ||
    Object.keys(v).sort().join() !==
      "categories,externalSystemLabel,locations,organizationId,siteId" ||
    v.organizationId !== scope.organizationId ||
    v.siteId !== scope.siteId ||
    typeof v.externalSystemLabel !== "string" ||
    !v.externalSystemLabel.trim() ||
    v.externalSystemLabel.length > 100 ||
    !Array.isArray(v.categories) ||
    !v.categories.length ||
    v.categories.length > 30
  )
    throw new Error("Invalid handover configuration.");
  const categories = v.categories.map((c) => {
    if (
      !c ||
      Object.keys(c).sort().join() !== "id,label" ||
      typeof c.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,63}$/.test(c.id) ||
      typeof c.label !== "string" ||
      !c.label.trim() ||
      c.label.length > 100
    )
      throw new Error("Invalid category configuration.");
    return { id: c.id, label: c.label };
  });
  if (new Set(categories.map((c) => c.id)).size !== categories.length)
    throw new Error("Duplicate category configuration.");
  return {
    locations: configuredLocations(v.locations),
    categories,
    externalSystemLabel: v.externalSystemLabel,
    timeZone,
  };
}
