export type FieldKind = "text" | "number" | "boolean" | "date";
export interface MetadataField {
  key: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  unit: string;
}
export interface AssetType {
  id: string;
  label: string;
  active: boolean;
  canContain: boolean;
  isController: boolean;
  fields: MetadataField[];
}
export interface TypeCatalog {
  revision: number;
  types: AssetType[];
}
export interface RegistryReference {
  id: string;
  code: string;
  name: string;
  status: "unverified" | "validated" | "retired";
}
export interface ControllerRelation {
  kind: "controlled-by";
  targetId: string;
  channel: string;
}
export interface Survey {
  status: "pending" | "validated" | "rejected";
  note: string;
  evidenceReference: string;
}
export interface EnrichmentData {
  typeId: string;
  parentId: string;
  controllers: ControllerRelation[];
  manufacturer: string;
  model: string;
  serial: string;
  metadata: Record<string, string | number | boolean>;
  survey: Survey;
}
export interface Enrichment {
  assetId: string;
  revision: number;
  data: EnrichmentData;
  actorId: string;
  actorName: string;
  updatedAt: string;
  surveyReviewerId: string;
  surveyReviewerName: string;
  surveyReviewedAt: string;
}
export interface EnrichmentSummary {
  assetId: string;
  revision: number;
  typeId: string;
  parentId: string;
  surveyStatus: Survey["status"];
}
export interface ReferencePage {
  assets: RegistryReference[];
  enrichments: EnrichmentSummary[];
  total: number;
  nextCursor: string;
}
export interface DomainQuery {
  search?: string;
  cursor?: string;
  limit?: number;
}
export interface MappingPage {
  mappings: Mapping[];
  total: number;
  nextCursor: string;
}
export interface EnrichmentRevision {
  enrichment: Enrichment;
  reason: string;
  actorId: string;
  actorName: string;
  at: string;
}
export interface SourceTuple {
  sourceId: string;
  namespace: "source-equipment";
  area: string;
  code: string;
}
export interface MappingData {
  source: SourceTuple;
  status: "pending" | "approved" | "rejected";
  candidateIds: string[];
  note: string;
}
export type MappingState = "mapped" | "pending" | "ambiguous" | "rejected" | "unmapped";
export interface Mapping {
  id: string;
  revision: number;
  data: MappingData;
  actorId: string;
  actorName: string;
  updatedAt: string;
}
export interface MappingRevision {
  mapping: Mapping;
  reason: string;
  actorId: string;
  actorName: string;
  at: string;
}
export interface MappingDecision {
  id: string;
  revision: number;
  source: SourceTuple;
  state: MappingState;
  assetId: string;
  candidateIds: string[];
}
export interface SourceCandidate extends SourceTuple {
  records: number;
}
export interface ParetoSelection {
  from: string;
  toExclusive: string;
  metric: "frequency" | "alarm-seconds";
  limit?: number;
}
export interface ParetoGroup {
  assetId: string;
  assetCode?: string;
  frequency: number;
  alarmSeconds: number;
  records: number;
  cumulativePercent: number | null;
}
export interface CanonicalPareto {
  selection: ParetoSelection;
  groups: ParetoGroup[];
  groupCount: number;
  totals: {
    frequency: number;
    alarmSeconds: number;
    records: number;
  };
  mapped: {
    frequency: number;
    alarmSeconds: number;
    records: number;
  };
  unresolved: {
    frequency: number;
    alarmSeconds: number;
    records: number;
  };
  states: Record<string, number>;
  missingDates: string[];
  admittedDates: string[];
  projectionRevision: string;
  limitations: string;
}
export const defaultTypes: AssetType[] = [{
  id: "generic",
  label: "Generic asset",
  active: true,
  canContain: true,
  isController: false,
  fields: []
}, {
  id: "sensor",
  label: "Sensor",
  active: true,
  canContain: false,
  isController: false,
  fields: []
}, {
  id: "motor",
  label: "Motor",
  active: true,
  canContain: false,
  isController: false,
  fields: []
}, {
  id: "conveyor",
  label: "Conveyor",
  active: true,
  canContain: true,
  isController: false,
  fields: []
}, {
  id: "controller",
  label: "Controller",
  active: true,
  canContain: false,
  isController: true,
  fields: []
}];
export function emptyEnrichment(): EnrichmentData {
  return {
    typeId: "generic",
    parentId: "",
    controllers: [],
    manufacturer: "",
    model: "",
    serial: "",
    metadata: {},
    survey: {
      status: "pending",
      note: "",
      evidenceReference: ""
    }
  };
}
export class AssetDomainError extends Error {
  constructor(readonly code: "invalid_asset_domain" | "asset_domain_denied" | "asset_domain_missing" | "asset_domain_conflict" | "asset_domain_cycle" | "asset_domain_capacity" | "asset_domain_projection_unavailable") {
    super(code);
  }
}
export function assert(v: unknown, code: AssetDomainError["code"] = "invalid_asset_domain"): asserts v {
  if (!v) throw new AssetDomainError(code);
}
export function object(v: unknown): asserts v is Record<string, unknown> {
  assert(v && typeof v === "object" && !Array.isArray(v));
}
export function exact(v: unknown, keys: string[]) {
  object(v);
  assert(Object.keys(v).sort().join(",") === keys.slice().sort().join(","));
}
export function id(v: unknown, optional = false): asserts v is string {
  assert(typeof v === "string" && (optional && v === "" || /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/.test(v)));
}
export function text(v: unknown, max: number, required = false): asserts v is string {
  assert(typeof v === "string" && v.length <= max && (!required || !!v.trim()) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v));
}
export function rev(v: unknown) {
  assert(Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) < 2147483647);
}
export function date(v: unknown): asserts v is string {
  assert(typeof v === "string" && /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
}
export function validateTypes(types: unknown): asserts types is AssetType[] {
  assert(Array.isArray(types) && types.length > 0 && types.length <= 50);
  const ids = new Set<string>();
  for (const type of types) {
    exact(type, ["id", "label", "active", "canContain", "isController", "fields"]);
    id(type.id);
    text(type.label, 100, true);
    assert(!ids.has(type.id));
    ids.add(type.id);
    for (const k of ["active", "canContain", "isController"]) assert(typeof type[k] === "boolean");
    assert(Array.isArray(type.fields) && type.fields.length <= 30);
    const keys = new Set<string>();
    for (const field of type.fields) {
      exact(field, ["key", "label", "kind", "required", "unit"]);
      id(field.key);
      assert(!keys.has(field.key) && !["manufacturer", "model", "serial"].includes(field.key));
      keys.add(field.key);
      text(field.label, 100, true);
      assert(["text", "number", "boolean", "date"].includes(field.kind));
      assert(typeof field.required === "boolean");
      text(field.unit, 40);
    }
  }
}
export function validateData(v: unknown): asserts v is EnrichmentData {
  exact(v, ["typeId", "parentId", "controllers", "manufacturer", "model", "serial", "metadata", "survey"]);
  const d = v as unknown as EnrichmentData;
  id(d.typeId);
  id(d.parentId, true);
  for (const key of ["manufacturer", "model", "serial"] as const) text(d[key], 200);
  object(d.metadata);
  assert(Object.keys(d.metadata).length <= 30);
  for (const [key, value] of Object.entries(d.metadata)) {
    id(key);
    assert(["string", "number", "boolean"].includes(typeof value));
    if (typeof value === "string") text(value, 2000);
    if (typeof value === "number") assert(Number.isFinite(value));
  }
  assert(Array.isArray(d.controllers) && d.controllers.length <= 30);
  const links = new Set<string>();
  for (const r of d.controllers) {
    exact(r, ["kind", "targetId", "channel"]);
    assert(r.kind === "controlled-by");
    id(r.targetId);
    text(r.channel, 160);
    const key = r.targetId + "\u0000" + r.channel;
    assert(!links.has(key));
    links.add(key);
  }
  exact(d.survey, ["status", "note", "evidenceReference"]);
  assert(["pending", "validated", "rejected"].includes(d.survey.status));
  text(d.survey.note, 4000, d.survey.status !== "pending");
  text(d.survey.evidenceReference, 400, d.survey.status !== "pending");
  assert(new TextEncoder().encode(JSON.stringify(d)).length <= 40000);
}
export function metadataSchema(data: EnrichmentData, type: AssetType) {
  assert(Object.keys(data.metadata).every(key => type.fields.some(f => f.key === key)));
  for (const field of type.fields) {
    const value = data.metadata[field.key];
    assert(!field.required || value !== undefined && value !== "");
    if (value === undefined || value === "") continue;
    if (field.kind === "text") {
      text(value, 2000);
    } else if (field.kind === "number") assert(typeof value === "number" && Number.isFinite(value));else if (field.kind === "boolean") assert(typeof value === "boolean");else date(value);
  }
}
export function validateMapping(v: unknown): asserts v is MappingData {
  exact(v, ["source", "status", "candidateIds", "note"]);
  const d = v as unknown as MappingData;
  exact(d.source, ["sourceId", "namespace", "area", "code"]);
  id(d.source.sourceId);
  assert(d.source.namespace === "source-equipment");
  text(d.source.area, 4096);
  text(d.source.code, 4096, true);
  assert(["pending", "approved", "rejected"].includes(d.status));
  assert(Array.isArray(d.candidateIds) && d.candidateIds.length <= 30 && new Set(d.candidateIds).size === d.candidateIds.length);
  d.candidateIds.forEach(v => id(v));
  text(d.note, 4000, true);
  assert(d.status !== "approved" || d.candidateIds.length === 1);
}
export function decision(m: Mapping): MappingDecision {
  return {
    id: m.id,
    revision: m.revision,
    source: m.data.source,
    state: m.data.status === "approved" ? "mapped" : m.data.status === "rejected" ? "rejected" : m.data.candidateIds.length > 1 ? "ambiguous" : "pending",
    assetId: m.data.status === "approved" ? m.data.candidateIds[0] : "",
    candidateIds: m.data.candidateIds
  };
}
export function sourceKey(s: SourceTuple) {
  return JSON.stringify([s.sourceId, s.namespace, s.area, s.code]);
}
export function stable(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + stable(v)).join(",") + "}";
  return JSON.stringify(v);
}
export function paretoSelection(v: unknown): asserts v is ParetoSelection {
  object(v);
  assert(Object.keys(v).every(k => ["from", "toExclusive", "metric", "limit"].includes(k)));
  const s = v as unknown as ParetoSelection;
  date(s.from);
  date(s.toExclusive);
  const days = (Date.parse(s.toExclusive) - Date.parse(s.from)) / 86400000;
  assert(days >= 1 && days <= 366);
  assert(["frequency", "alarm-seconds"].includes(s.metric));
  assert(s.limit === undefined || Number.isSafeInteger(s.limit) && s.limit >= 1 && s.limit <= 100);
}
export function domainQuery(v: unknown): asserts v is DomainQuery {
  object(v);
  assert(Object.keys(v).every(k => ["search", "cursor", "limit"].includes(k)));
  const s = v as DomainQuery;
  if (s.search !== undefined) text(s.search, 200);
  if (s.cursor !== undefined) text(s.cursor, 4096);
  assert(s.limit === undefined || Number.isSafeInteger(s.limit) && s.limit >= 1 && s.limit <= 100);
}
export function validateSource(v: unknown): asserts v is SourceTuple {
  exact(v, ["sourceId", "namespace", "area", "code"]);
  const s = v as unknown as SourceTuple;
  id(s.sourceId);
  assert(s.namespace === "source-equipment");
  text(s.area, 4096);
  text(s.code, 4096, true);
}
