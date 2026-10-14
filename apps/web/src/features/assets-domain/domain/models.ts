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
export interface Context {
  canManage: boolean;
  sourceId: string;
  catalog: TypeCatalog;
}
export interface Detail {
  asset: RegistryReference;
  enrichment: Enrichment | null;
  related: RegistryReference[];
  canManage: boolean;
}
export interface SaveEnrichment {
  assetId: string;
  expectedRevision: number;
  reason: string;
  data: EnrichmentData;
}
export interface SaveMapping {
  id: string;
  expectedRevision: number;
  reason: string;
  data: MappingData;
}
export interface ModelHistory {
  revisions: EnrichmentRevision[];
  nextBefore: number;
}
export interface MappingHistory {
  revisions: MappingRevision[];
  nextBefore: number;
}
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
export function mappingState(mapping: Mapping): MappingState {
  return mapping.data.status === "approved" ? "mapped" : mapping.data.status === "rejected" ? "rejected" : mapping.data.candidateIds.length > 1 ? "ambiguous" : "pending";
}
