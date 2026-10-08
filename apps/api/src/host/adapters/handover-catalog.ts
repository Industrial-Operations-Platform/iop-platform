import { configuredLocations } from "../../modules/platform-core/adapters/configuration/locations";
import type { Catalog, CategoryWorkflow } from "../../modules/shift-handover/domain/handover";
const workflowDefaults: Record<string, CategoryWorkflow> = {
  safety: "safety", information: "information", successes: "success", people: "people",
  performance: "technical-blocked", problems: "technical-problem",
};
const workflows = new Set(Object.values(workflowDefaults));
const carryForwardDefaults = new Set(["problems", "performance"]);
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
  ].map((label) => ({
    id: label.toLowerCase(),
    label,
    carryForward: carryForwardDefaults.has(label.toLowerCase()),
    coordinatorOnly: label.toLowerCase() === "information",
    workflow: workflowDefaults[label.toLowerCase()],
    ...(label.toLowerCase() === "information" ? { publisherProfiles: ["team-leader"] } : {}),
  })),
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
      Object.keys(c)
        .filter((key) => !["carryForward", "coordinatorOnly", "workflow", "publisherProfiles"].includes(key))
        .sort()
        .join() !== "id,label" ||
      (c.publisherProfiles !== undefined && (!Array.isArray(c.publisherProfiles) || !c.publisherProfiles.length || c.publisherProfiles.length > 10 || c.publisherProfiles.some((profile: unknown) => typeof profile !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(profile)))) ||
      (c.workflow !== undefined && !workflows.has(c.workflow)) ||
      (c.carryForward !== undefined && typeof c.carryForward !== "boolean") ||
      (c.coordinatorOnly !== undefined && typeof c.coordinatorOnly !== "boolean") ||
      typeof c.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,63}$/.test(c.id) ||
      typeof c.label !== "string" ||
      !c.label.trim() ||
      c.label.length > 100
    )
      throw new Error("Invalid category configuration.");
    const workflow = c.workflow ?? workflowDefaults[c.id];
    return {
      workflow,
      ...(c.publisherProfiles ? { publisherProfiles: c.publisherProfiles } : workflow === "information" ? { publisherProfiles: ["team-leader"] } : {}),
      id: c.id,
      label: c.label,
      carryForward: c.carryForward ?? carryForwardDefaults.has(c.id),
      coordinatorOnly: c.coordinatorOnly ?? workflow === "information",
    };
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
