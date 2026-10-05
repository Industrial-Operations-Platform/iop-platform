export type AssetStatus = "unverified" | "validated" | "retired";
export interface Alias {
  namespace: string;
  sourceId: string;
  code: string;
  departmentId: string;
  areaId: string;
  sector: string;
  area: string;
}
export interface AssetContent {
  code: string;
  name: string;
  type: string;
  locationId: string;
  status: AssetStatus;
  validationNote: string;
  description: string;
  aliases: Alias[];
}
export interface Asset {
  id: string;
  revision: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  content: AssetContent;
}
export interface Context {
  actorId: string;
  timeZone: string;
  canManage: boolean;
  locations: Location[];
}
export interface Location {
  id: string;
  parentId: string;
  label: string;
  role?: string;
}
/** Presentation selection follows configured ancestry without guessing location names. */
export function withinLocation(
  id: string,
  ancestor: string,
  locations: Location[],
) {
  const seen = new Set<string>();
  while (id && !seen.has(id)) {
    if (id === ancestor) return true;
    seen.add(id);
    id = locations.find((location) => location.id === id)?.parentId ?? "";
  }
  return false;
}
export interface Selection {
  search: string;
  status: "" | AssetStatus;
  locationId: string;
  cursor: string;
}
export interface Page {
  assets: Asset[];
  total: number;
  nextCursor: string;
}
export interface SaveInput {
  key: string;
  id: string;
  expectedRevision: number;
  note: string;
  content: AssetContent;
}
export interface Revision {
  asset: Asset;
  actorId: string;
  actorName: string;
  action: string;
  note: string;
  at: string;
}
export interface History {
  asset: Asset;
  revisions: Revision[];
  nextBefore: number;
}
export type SourceKind = "maintenance" | "handover" | "analytics";
export interface TimelineRecord {
  id: string;
  kind: SourceKind;
  date: string;
  recordedAt: string;
  title: string;
  summary: string;
  sourceRecordId: string;
  periodKind: "calendar-date" | "daily-aggregate";
  frequency?: number;
  seconds?: number;
}
export interface SourceCoverage {
  kind: SourceKind;
  status: "available" | "not-authorized" | "unmapped" | "unavailable";
  total: number;
}
export interface Timeline {
  asset: Asset;
  records: TimelineRecord[];
  sources: SourceCoverage[];
  total: number;
  nextCursor: string;
}
export interface TimelineSelection {
  id: string;
  from: string;
  to: string;
  cursor: string;
  kind?: SourceKind;
}
export const emptySelection: Selection = {
  search: "",
  status: "",
  locationId: "",
  cursor: "",
};
export function emptyAsset(): AssetContent {
  return {
    code: "",
    name: "",
    type: "",
    locationId: "",
    status: "unverified",
    validationNote: "",
    description: "",
    aliases: [],
  };
}
export function emptyAlias(): Alias {
  return {
    namespace: "site-equipment",
    sourceId: "",
    code: "",
    departmentId: "",
    areaId: "",
    sector: "",
    area: "",
  };
}
