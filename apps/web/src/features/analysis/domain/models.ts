// Application-owned values. HTTP adapters check compatibility with generated DTOs.
export interface LocalUser {
  id: string;
  name: string;
}
export interface DemoScope {
  organizationId: string;
  siteId: string;
  sourceId: string;
  siteTimeZone: string;
}
export interface DemoContext {
  canImport: boolean;
  enabled: boolean;
  users: LocalUser[];
  user: LocalUser | null;
  scope: DemoScope | null;
}
export interface Diagnostic {
  code: string;
  line?: number;
  field?: string;
  reason?: string;
}
export interface ImportSummary {
  importId: string;
  originalFilename: string;
  reportingDate: string;
  /** @enum {string} */
  outcome: "received" | "succeeded" | "rejected" | "failed";
  receivedAt: string;
  submittedBy: string;
  admittedRecordCount: number | null;
  reasonCode: string | null;
  byteLength: number;
}
export interface ImportReview {
  importId: string;
  rawId: string;
  sourceId: string;
  reportingDate: string;
  originalFilename: string;
  sha256: string;
  byteLength: number;
  /** @enum {string} */
  outcome: "received" | "succeeded" | "rejected" | "failed";
  dataRecordCount: number | null;
  admittedRecordCount: number | null;
  rejectedRecordCount: number | null;
  reasonCode: string | null;
  inspectedValidCount: number;
  inspectedInvalidCount: number;
  inspectionComplete: boolean;
  unclassifiedCount: number;
  repeatedCount: number;
  diagnostics: Diagnostic[];
  diagnosticsTruncated: boolean;
}
export interface Availability {
  revision: string;
  dates: string[];
  latestDate: string | null;
  siteTimeZone: string;
}
export interface Normalization {
  trim: boolean;
  unicodeNfc: boolean;
  collapseWhitespace: boolean;
}
export interface AreaSector {
  area: string;
  sector: string;
}
export interface ValueAlias {
  /** @enum {string} */
  field: "area" | "equipment" | "message" | "type" | "messageGroup";
  from: string;
  to: string;
}
export interface ExecutiveKpiDefinition {
  id: string;
  label: string;
  message: string;
  metric: "frequency" | "duration";
  goal: number | null;
}
export interface ExecutiveKpi extends ExecutiveKpiDefinition {
  total: number;
  average: number | null;
  historicalAverage: number | null;
  reference: number | null;
  referenceKind: "goal" | "historical";
  changePercent: number | null;
  status: "better" | "worse" | "equal" | "unavailable";
}
export interface MonthlyExecutive {
  month: string;
  importedDays: number;
  calendarDays: number;
  historicalDays: number;
  kpis: ExecutiveKpi[];
}
export interface ReportingProfile {
  executiveKpis?: ExecutiveKpiDefinition[];
  normalization: Normalization;
  unclassifiedLabel: string;
  areaSectors: AreaSector[];
  aliases: ValueAlias[];
}
export interface ProfileResult {
  version: string;
  profile: ReportingProfile;
}
export interface ReportRequest {
  executive?: boolean;
  from: string;
  toExclusive: string;
  /** @enum {string} */
  dimension:
    | "sector"
    | "area"
    | "equipment"
    | "message"
    | "type"
    | "messageGroup"
    | "frequency"
    | "duration";
  /** @enum {string} */
  period: "day" | "week" | "month";
  /** @enum {string} */
  metric: "frequency" | "duration";
  filters?: {
    [key: string]: string[];
  };
  search?: string;
  page?: number;
  revision?: string;
}
export interface ReportRow {
  key: string;
  frequency: number;
  seconds: number;
  minutes: number;
  records: number;
}
export interface ReportPoint {
  key: string;
  frequency: number;
  seconds: number;
  minutes: number;
  records: number;
  period: string;
}
export interface ReportRecord {
  area: string;
  equipment: string;
  message: string;
  type: string;
  messageGroup: string;
  sector: string;
  date: string;
  importId: string;
  line: number;
  frequency: number;
  seconds: number;
  minutes: number;
}
export interface ExecutiveLeader extends ReportRow {
  dimension: "sector" | "area" | "equipment" | "message";
  metric: "frequency" | "duration";
}
export interface Report {
  monthlyExecutive?: MonthlyExecutive;
  revision: string;
  profileVersion: string;
  selection: ReportRequest;
  totals: ReportRow;
  executive: ExecutiveLeader[];
  groups: ReportRow[];
  durationGroups: ReportRow[];
  groupCount: number;
  timeline: ReportPoint[];
  series: ReportPoint[];
  monthly: ReportPoint[];
  options: {
    [key: string]: string[];
  };
  optionCounts: {
    [key: string]: number;
  };
  dates: string[];
  records: ReportRecord[];
  recordCount: number;
  page: number;
  pageCount: number;
  unclassifiedCount: number;
}
export type Dimension = ReportRequest["dimension"];
export const dimensions: Dimension[] = [
  "sector",
  "area",
  "equipment",
  "message",
  "type",
  "messageGroup",
  "frequency",
  "duration",
];
