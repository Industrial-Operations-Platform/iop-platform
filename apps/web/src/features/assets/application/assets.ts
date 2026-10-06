import type {
  Asset,
  Context,
  History,
  Page,
  SaveInput,
  Selection,
  Timeline,
  TimelineSelection,
  EquipmentSelection,
  EquipmentCatalog,
  EquipmentCandidate,
  AssetContent,
  Alias,
} from "../domain/models";
export interface Gateway {
  context(): Promise<Context>;
  query(selection: Selection): Promise<Page>;
  save(input: SaveInput): Promise<Asset>;
  detail(id: string): Promise<Asset>;
  history(id: string, before?: number): Promise<History>;
  timeline(selection: TimelineSelection): Promise<Timeline>;
  equipmentCatalog(selection: EquipmentSelection): Promise<EquipmentCatalog>;
}

/** A deliberate source choice retains exact aliases without validating identity. */
export function contentFromEquipment(
  content: AssetContent,
  candidate: EquipmentCandidate,
): AssetContent {
  const additions: Alias[] = [];
  if (candidate.namespace === "analytics")
    additions.push({
      namespace: "analytics",
      sourceId: candidate.sourceId,
      code: candidate.code,
      sector: candidate.sector,
      area: candidate.area,
      departmentId: "",
      areaId: "",
    });
  if (candidate.departmentId)
    additions.push({
      namespace: "site-equipment",
      sourceId: "",
      code: candidate.code,
      sector: "",
      area: "",
      departmentId: candidate.departmentId,
      areaId: candidate.areaId,
    });
  const aliases = content.aliases.filter(
    (alias) =>
      !["analytics", "site-equipment"].includes(alias.namespace) ||
      alias.code === candidate.code,
  );
  for (const alias of additions)
    if (
      !aliases.some((value) =>
        Object.entries(alias).every(
          ([key, field]) => value[key as keyof Alias] === field,
        ),
      )
    )
      aliases.push(alias);
  if (aliases.length > 30)
    throw new Error(
      "The source alias limit is reached. Remove an alias before selecting another code.",
    );
  return {
    ...content,
    code: candidate.code,
    name: candidate.code,
    locationId:
      candidate.areaId || candidate.departmentId || content.locationId,
    status: "unverified",
    validationNote: "",
    aliases,
  };
}
export class AssetsApplication {
  constructor(
    private readonly gateway: Gateway,
    private readonly ids: () => string,
  ) {}
  newKey() {
    return this.ids();
  }
  context() {
    return this.gateway.context();
  }
  query(selection: Selection) {
    return this.gateway.query(selection);
  }
  save(input: SaveInput) {
    return this.gateway.save(input);
  }
  detail(id: string) {
    return this.gateway.detail(id);
  }
  history(id: string, before?: number) {
    return this.gateway.history(id, before);
  }
  timeline(selection: TimelineSelection) {
    return this.gateway.timeline(selection);
  }
  equipmentCatalog(selection: EquipmentSelection) {
    return this.gateway.equipmentCatalog(selection);
  }
}
