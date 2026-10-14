export const statuses = ["planned", "in-progress", "blocked", "implemented", "evaluated", "cancelled"] as const;
export type Status = typeof statuses[number];
export type Metric = "frequency" | "alarm-seconds";
export interface Person {
  id: string;
  name: string;
}
export interface Location {
  id: string;
  label: string;
  parentId: string;
}
export interface AssetReference {
  id: string;
  name: string;
  code: string;
  status: string;
}
export interface IssueReference {
  id: string;
  title: string;
  state: string;
  revision: number;
  equipmentCode: string;
  area: string;
}
export interface Target {
  objective: string;
  metric: Metric;
  reductionPercent: number | null;
}
export interface ActionData {
  title: string;
  hypothesis: string;
  locationId: string;
  assetId: string;
  issueId: string;
  ownerId: string;
  dueDate: string;
  status: Status;
  implementedDate: string;
  target: Target;
  result: string;
  blockedReason: string;
  cancellationReason: string;
}
export interface Action {
  id: string;
  revision: number;
  data: ActionData;
  authorId: string;
  authorName: string;
  ownerName: string;
  assetName: string;
  issueTitle: string;
  locationLabel: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  comparisonCount: number;
}
export interface ActionView extends Action {
  canEdit: boolean;
  canCoordinate: boolean;
}
export interface Revision {
  action: Action;
  actorId: string;
  actorName: string;
  at: string;
  change: "created" | "updated" | "status-changed" | "evidence-added" | "comparison-saved";
  reason: string;
  referenceId: string;
}
export interface Evidence {
  id: string;
  actionId: string;
  actionRevision: number;
  kind: "note" | "result";
  note: string;
  externalReference: string;
  supersedesId: string;
  actorId: string;
  actorName: string;
  at: string;
}
export interface Period {
  from: string;
  toExclusive: string;
}
export interface Filters {
  sector: string;
  area: string;
  equipment: string;
  message: string;
}
export interface ComparisonSelection {
  before: Period;
  after: Period;
  scope: "asset" | "selection";
  filters: Filters;
}
export interface PeriodMeasure extends Period {
  eligibleDates: string[];
  admittedDates: string[];
  missingDates: string[];
  excludedDates: string[];
  frequency: number;
  alarmSeconds: number;
  records: number;
}
export interface Measurement {
  sourceId: string;
  siteTimeZone: string;
  publicationRevision: string;
  profileVersion: string;
  selection: ComparisonSelection;
  aliases: {
    code: string;
    sector: string;
    area: string;
  }[];
  before: PeriodMeasure;
  after: PeriodMeasure;
  mapped: boolean;
}
export interface Comparison extends Measurement {
  warnings: string[];
  frequencyPerObservedDate: {
    before: number | null;
    after: number | null;
    change: number | null;
    reductionPercent: number | null;
  };
  alarmSecondsPerObservedDate: {
    before: number | null;
    after: number | null;
    change: number | null;
    reductionPercent: number | null;
  };
  target: Target;
  observedTarget: "not-assessable" | "met" | "not-met" | "not-quantified";
  attribution: string;
}
export interface SavedComparison {
  id: string;
  actionId: string;
  actionRevision: number;
  actorId: string;
  actorName: string;
  at: string;
  note: string;
  comparison: Comparison;
}
export interface Selection {
  status?: Status | "";
  ownerId?: string;
  locationId?: string;
  assetId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}
export interface Page {
  actions: ActionView[];
  total: number;
  nextCursor: string;
  statusCounts: Record<Status, number>;
}
export interface Catalog {
  actorId: string;
  canContribute: boolean;
  canCoordinate: boolean;
  people: Person[];
  locations: Location[];
  assets: AssetReference[];
}
export interface SaveAction {
  id: string;
  expectedRevision: number;
  reason: string;
  data: ActionData;
}
export interface AddEvidence {
  id: string;
  actionId: string;
  expectedRevision: number;
  kind: "note" | "result";
  note: string;
  externalReference: string;
  supersedesId: string;
}
export interface CompareAction {
  actionId: string;
  expectedRevision: number;
  selection: ComparisonSelection;
}
export interface SaveComparison extends CompareAction {
  id: string;
  note: string;
}
export interface History {
  action: ActionView;
  revisions: Revision[];
  nextBefore: number;
}
export interface EvidencePage {
  evidence: Evidence[];
  nextCursor: string;
}
export interface ComparisonPage {
  comparisons: SavedComparison[];
  nextCursor: string;
}
export function emptyAction(locationId = ""): ActionData {
  return {
    title: "",
    hypothesis: "",
    locationId,
    assetId: "",
    issueId: "",
    ownerId: "",
    dueDate: "",
    status: "planned",
    implementedDate: "",
    target: {
      objective: "",
      metric: "frequency",
      reductionPercent: null
    },
    result: "",
    blockedReason: "",
    cancellationReason: ""
  };
}
export function emptyComparison(): ComparisonSelection {
  return {
    before: {
      from: "",
      toExclusive: ""
    },
    after: {
      from: "",
      toExclusive: ""
    },
    scope: "selection",
    filters: {
      sector: "",
      area: "",
      equipment: "",
      message: ""
    }
  };
}
