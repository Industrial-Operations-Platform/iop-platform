export class AssetError extends Error {
  constructor(
    readonly code:
      | "invalid_asset"
      | "asset_denied"
      | "asset_missing"
      | "asset_conflict"
      | "asset_alias_conflict"
      | "asset_capacity",
  ) {
    super(code);
  }
}
export type AssetStatus = "unverified" | "validated" | "retired";
export interface Location {
  id: string;
  label: string;
  parentId: string;
  role: string;
  sectorKey: string;
}
export interface Alias {
  namespace: string;
  sourceId: string;
  code: string;
  departmentId: string;
  areaId: string;
  sector: string;
  area: string;
}
export interface TimelineAsset {
  id: string;
  aliases: Alias[];
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
  locationDetails?: string;
}
export interface EquipmentCandidate {
  namespace: "analytics" | "site-equipment";
  sourceId: string;
  code: string;
  sector: string;
  area: string;
  departmentId: string;
  areaId: string;
}
export interface EquipmentSelection {
  locationId: string;
  search?: string;
  code?: string;
  sourceId?: string;
  sector?: string;
  area?: string;
  cursor?: string;
}
export interface EquipmentPage {
  candidates: EquipmentCandidate[];
  total: number;
  nextCursor: string;
  sources: string[];
  sectors: string[];
  areas: string[];
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
export interface AssetReference {
  id: string;
  code: string;
  name: string;
  locationId: string;
  status: AssetStatus;
}
export interface AssetRevision {
  asset: Asset;
  actorId: string;
  actorName: string;
  action: string;
  note: string;
  at: string;
}
export interface AssetSelection {
  search: string;
  status: "" | "current" | AssetStatus;
  locationId: string;
  cursor: string;
}
export interface AssetPage {
  assets: Asset[];
  total: number;
  nextCursor: string;
}
export interface AssetHistory {
  asset: Asset;
  revisions: AssetRevision[];
  nextBefore: number;
}
export type TimelineKind = "maintenance" | "handover" | "analytics";
export interface TimelineRecord {
  id: string;
  kind: TimelineKind;
  date: string;
  recordedAt: string;
  title: string;
  summary: string;
  sourceRecordId: string;
  periodKind: "calendar-date" | "daily-aggregate";
  frequency?: number;
  seconds?: number;
}
export interface TimelineCursor {
  date: string;
  recordedAt: string;
  kind: TimelineKind;
  id: string;
}
export interface SourceQuery {
  from: string;
  to: string;
  cursor: TimelineCursor | null;
  limit: number;
  timeZone: string;
}
export interface SourceResult {
  records: TimelineRecord[];
  total: number;
  unmapped?: boolean;
}
export interface TimelineSelection {
  id: string;
  from: string;
  to: string;
  cursor: string;
  kind?: TimelineKind;
}
export interface TimelineCoverage {
  kind: TimelineKind;
  status: "available" | "not-authorized" | "unmapped" | "unavailable";
  total: number;
}
export interface TimelinePage {
  asset: Asset;
  records: TimelineRecord[];
  sources: TimelineCoverage[];
  total: number;
  nextCursor: string;
}

export function exact(
  value: unknown,
  keys: string[],
): asserts value is Record<string, unknown> {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    throw new AssetError("invalid_asset");
}
export function text(value: unknown, max: number, required = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    (required && !value.trim())
  )
    throw new AssetError("invalid_asset");
  return value;
}
export function identifier(value: unknown, required = false): string {
  const result = text(value, 64, required);
  if (result && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(result))
    throw new AssetError("invalid_asset");
  return result;
}
export function prose(value: unknown, max: number, required = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) ||
    (required && !value.trim())
  )
    throw new AssetError("invalid_asset");
  return value;
}
export function aliasKey(alias: Alias): string {
  return JSON.stringify([
    alias.namespace,
    alias.sourceId,
    alias.code,
    alias.departmentId,
    alias.areaId,
    alias.sector,
    alias.area,
  ]);
}
export function validContent(
  value: unknown,
  locations: Location[],
): AssetContent {
  exact(value, [
    "code",
    "name",
    "type",
    "locationId",
    "status",
    "validationNote",
    "description",
    "aliases",
    ...(Object.hasOwn(value ?? {}, "locationDetails")
      ? ["locationDetails"]
      : []),
  ]);
  const status = value.status as AssetStatus;
  if (
    !["unverified", "validated", "retired"].includes(status) ||
    !Array.isArray(value.aliases) ||
    value.aliases.length > 30
  )
    throw new AssetError("invalid_asset");
  const locationId = identifier(value.locationId);
  if (locationId && !locations.some((location) => location.id === locationId))
    throw new AssetError("invalid_asset");
  const aliases: Alias[] = value.aliases.map((input) => {
    exact(input, [
      "namespace",
      "sourceId",
      "code",
      "departmentId",
      "areaId",
      "sector",
      "area",
    ]);
    const alias: Alias = {
      namespace: text(input.namespace, 64, true),
      sourceId: identifier(input.sourceId),
      code: text(input.code, 160, true),
      departmentId: identifier(input.departmentId),
      areaId: identifier(input.areaId),
      sector: text(input.sector, 100),
      area: text(input.area, 160),
    };
    if (
      [alias.departmentId, alias.areaId].some(
        (id) => id && !locations.some((location) => location.id === id),
      )
    )
      throw new AssetError("invalid_asset");
    if (
      alias.namespace === "site-equipment" &&
      (!alias.departmentId || alias.sourceId || alias.sector || alias.area)
    )
      throw new AssetError("invalid_asset");
    if (alias.namespace === "site-equipment" && alias.areaId) {
      let parent = locations.find((location) => location.id === alias.areaId);
      while (parent && parent.id !== alias.departmentId)
        parent = locations.find((location) => location.id === parent!.parentId);
      if (!parent) throw new AssetError("invalid_asset");
    }
    if (
      alias.namespace === "analytics" &&
      (!alias.sourceId ||
        !alias.sector ||
        !alias.area ||
        alias.departmentId ||
        alias.areaId)
    )
      throw new AssetError("invalid_asset");
    return alias;
  });
  if (new Set(aliases.map(aliasKey)).size !== aliases.length)
    throw new AssetError("asset_alias_conflict");
  text(value.name, 200, true);
  const code = text(value.code, 160, true);
  return {
    code,
    name: code,
    type: text(value.type, 100),
    locationId,
    status,
    validationNote: prose(value.validationNote, 2000, status === "validated"),
    description: prose(value.description, 4000),
    aliases,
    locationDetails:
      value.locationDetails === undefined
        ? ""
        : prose(value.locationDetails, 2000),
  };
}
/** Old attributed snapshots retain their original names; new metadata has a readable default. */
export function readableContent(content: AssetContent): AssetContent {
  return { ...content, locationDetails: content.locationDetails ?? "" };
}
export function validEquipmentSelection(
  input: unknown,
): Required<EquipmentSelection> {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !Object.hasOwn(input, "locationId") ||
    Object.keys(input).some(
      (key) =>
        ![
          "locationId",
          "search",
          "code",
          "sourceId",
          "sector",
          "area",
          "cursor",
        ].includes(key),
    )
  )
    throw new AssetError("invalid_asset");
  const value = input as EquipmentSelection;
  return {
    locationId: identifier(value.locationId),
    search: text(value.search ?? "", 160),
    code: text(value.code ?? "", 160),
    sourceId: identifier(value.sourceId ?? ""),
    sector: text(value.sector ?? "", 100),
    area: text(value.area ?? "", 160),
    cursor: text(value.cursor ?? "", 2000),
  };
}
export function validSelection(input: unknown): AssetSelection {
  exact(input, ["search", "status", "locationId", "cursor"]);
  if (
    !["", "current", "unverified", "validated", "retired"].includes(
      String(input.status),
    )
  )
    throw new AssetError("invalid_asset");
  return {
    search: text(input.search, 160),
    status: input.status as AssetSelection["status"],
    locationId: identifier(input.locationId),
    cursor: text(input.cursor, 2000),
  };
}
export function date(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value + "T00:00:00.000Z").toISOString().slice(0, 10) !== value
  )
    throw new AssetError("invalid_asset");
  return value;
}
export function validTimeline(input: unknown): TimelineSelection {
  exact(input, [
    "id",
    "from",
    "to",
    "cursor",
    ...(Object.hasOwn(input ?? {}, "kind") ? ["kind"] : []),
  ]);
  const from = date(input.from),
    to = date(input.to);
  if (from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > 365)
    throw new AssetError("invalid_asset");
  if (
    Object.hasOwn(input, "kind") &&
    !["maintenance", "handover", "analytics"].includes(String(input.kind))
  )
    throw new AssetError("invalid_asset");
  return {
    id: identifier(input.id, true),
    from,
    to,
    cursor: text(input.cursor, 2000),
    ...(Object.hasOwn(input, "kind")
      ? { kind: input.kind as TimelineKind }
      : {}),
  };
}
export function cursorValue(token: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(decodeURIComponent(token));
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new AssetError("invalid_asset");
  }
}
export function encodeCursor(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}
export function timelineCursor(
  token: string,
  asset: Asset,
  selection: TimelineSelection,
): TimelineCursor | null {
  if (!token) return null;
  const value = cursorValue(token);
  exact(value, [
    "v",
    "assetId",
    "revision",
    "from",
    "to",
    "sourceKind",
    "date",
    "recordedAt",
    "kind",
    "id",
  ]);
  if (
    value.v !== 1 ||
    value.assetId !== asset.id ||
    value.from !== selection.from ||
    value.to !== selection.to ||
    value.sourceKind !== (selection.kind ?? "")
  )
    throw new AssetError("invalid_asset");
  if (value.revision !== asset.revision) throw new AssetError("asset_conflict");
  const day = date(value.date),
    recordedAt = text(value.recordedAt, 30),
    kind = value.kind as TimelineKind;
  if (
    day < selection.from ||
    day > selection.to ||
    !["maintenance", "handover", "analytics"].includes(kind) ||
    (recordedAt &&
      (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(recordedAt) ||
        !Number.isFinite(Date.parse(recordedAt))))
  )
    throw new AssetError("invalid_asset");
  return { date: day, recordedAt, kind, id: text(value.id, 200, true) };
}
export function compareTimeline(
  left: TimelineCursor,
  right: TimelineCursor,
): number {
  for (const field of ["date", "recordedAt", "kind", "id"] as const) {
    if (left[field] !== right[field])
      return left[field] > right[field] ? -1 : 1;
  }
  return 0;
}
