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
  aliases: {
    sourceId: string;
    namespace: string;
    code: string;
    sector: string;
    area: string;
  }[];
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
export class ImprovementError extends Error {
  constructor(readonly code: "invalid_improvement" | "improvement_denied" | "improvement_missing" | "improvement_conflict" | "improvement_capacity" | "improvement_analytics_unavailable") {
    super(code);
  }
}
export function assert(value: unknown, code: ImprovementError["code"] = "invalid_improvement"): asserts value {
  if (!value) throw new ImprovementError(code);
}
export function object(value: unknown): asserts value is Record<string, unknown> {
  assert(value && typeof value === "object" && !Array.isArray(value));
}
export function exact(value: unknown, keys: string[]) {
  object(value);
  assert(Object.keys(value).sort().join(",") === [...keys].sort().join(","));
}
export function identifier(value: unknown, optional = false): asserts value is string {
  assert(typeof value === "string" && (optional && value === "" || /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/.test(value)));
}
export function text(value: unknown, max: number, required = false): asserts value is string {
  assert(typeof value === "string" && value.length <= max && (!required || !!value.trim()) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value));
}
export function date(value: unknown, optional = false): asserts value is string {
  assert(typeof value === "string");
  if (optional && value === "") return;
  assert(/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
}
export function revision(value: unknown, zero = true): asserts value is number {
  assert(Number.isSafeInteger(value) && Number(value) >= (zero ? 0 : 1) && Number(value) < 2147483647);
}
export function validateData(value: unknown): asserts value is ActionData {
  exact(value, ["title", "hypothesis", "locationId", "assetId", "issueId", "ownerId", "dueDate", "status", "implementedDate", "target", "result", "blockedReason", "cancellationReason"]);
  const d = value as unknown as ActionData;
  text(d.title, 160, true);
  text(d.hypothesis, 8000);
  identifier(d.locationId);
  identifier(d.assetId, true);
  identifier(d.issueId, true);
  identifier(d.ownerId, true);
  date(d.dueDate, true);
  date(d.implementedDate, true);
  assert(statuses.includes(d.status));
  exact(d.target, ["objective", "metric", "reductionPercent"]);
  text(d.target.objective, 2000, true);
  assert(["frequency", "alarm-seconds"].includes(d.target.metric));
  assert(d.target.reductionPercent === null || typeof d.target.reductionPercent === "number" && Number.isFinite(d.target.reductionPercent) && d.target.reductionPercent >= 0 && d.target.reductionPercent <= 100);
  text(d.result, 8000);
  text(d.blockedReason, 2000);
  text(d.cancellationReason, 2000);
  assert(!["implemented", "evaluated"].includes(d.status) || !!d.implementedDate);
  assert(d.status !== "evaluated" || !!d.result.trim());
  assert(d.status !== "blocked" || !!d.blockedReason.trim());
  assert(d.status !== "cancelled" || !!d.cancellationReason.trim());
  assert(new TextEncoder().encode(JSON.stringify(d)).length <= 40000);
}
export function transition(before: Status, after: Status, reason: string) {
  const allowed: Record<Status, readonly Status[]> = {
    planned: ["planned", "in-progress", "blocked", "cancelled"],
    "in-progress": ["planned", "in-progress", "blocked", "implemented", "cancelled"],
    blocked: ["planned", "in-progress", "blocked", "implemented", "cancelled"],
    implemented: ["in-progress", "blocked", "implemented", "evaluated", "cancelled"],
    evaluated: ["in-progress", "implemented", "evaluated", "cancelled"],
    cancelled: ["planned", "cancelled"]
  };
  assert(allowed[before].includes(after));
  assert(before === after || !!reason.trim());
}
export function selection(value: unknown): asserts value is Selection {
  object(value);
  assert(Object.keys(value).every(k => ["status", "ownerId", "locationId", "assetId", "search", "cursor", "limit"].includes(k)));
  const s = value as Selection;
  assert(s.status === undefined || s.status === "" || statuses.includes(s.status));
  for (const k of ["ownerId", "locationId", "assetId"] as const) if (s[k] !== undefined) identifier(s[k], true);
  if (s.search !== undefined) text(s.search, 200);
  if (s.cursor !== undefined) text(s.cursor, 220);
  assert(s.limit === undefined || Number.isSafeInteger(s.limit) && s.limit >= 1 && s.limit <= 100);
}
export function comparisonSelection(value: unknown): asserts value is ComparisonSelection {
  exact(value, ["before", "after", "scope", "filters"]);
  const s = value as unknown as ComparisonSelection;
  for (const p of [s.before, s.after]) {
    exact(p, ["from", "toExclusive"]);
    date(p.from);
    date(p.toExclusive);
    const days = (Date.parse(p.toExclusive) - Date.parse(p.from)) / 86400000;
    assert(days >= 1 && days <= 366);
  }
  assert(s.before.toExclusive <= s.after.from);
  assert(s.scope === "asset" || s.scope === "selection");
  exact(s.filters, ["sector", "area", "equipment", "message"]);
  for (const v of Object.values(s.filters)) text(v, 1000);
  assert(s.scope !== "selection" || Object.values(s.filters).some(v => !!v.trim()));
  assert(s.scope !== "asset" || Object.values(s.filters).every(v => v === ""));
}
export function descendants(locations: Location[], root: string) {
  const set = new Set([root]);
  let size = 0;
  while (size !== set.size) {
    size = set.size;
    for (const l of locations) if (set.has(l.parentId)) set.add(l.id);
  }
  return [...set];
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + stable(v)).join(",") + "}";
  return JSON.stringify(value);
}
function average(before: PeriodMeasure, after: PeriodMeasure, metric: "frequency" | "alarmSeconds") {
  const a = before.admittedDates.length ? before[metric] / before.admittedDates.length : null;
  const b = after.admittedDates.length ? after[metric] / after.admittedDates.length : null;
  return {
    before: a,
    after: b,
    change: a === null || b === null ? null : b - a,
    reductionPercent: a === null || b === null || a === 0 ? null : (a - b) / a * 100
  };
}
function weekdayMix(dates: string[]) {
  const counts = Array(7).fill(0) as number[];
  dates.forEach(d => counts[new Date(d + "T00:00:00Z").getUTCDay()]++);
  return counts.join(",");
}
export function assess(measurement: Measurement, target: Target): Comparison {
  const {
    before,
    after
  } = measurement;
  const warnings: string[] = [];
  if (!measurement.mapped) warnings.push("No analytical aliases are mapped to this asset.");
  if (!before.admittedDates.length || !after.admittedDates.length) warnings.push("One or both periods have no admitted imports; missing data is not zero.");
  if (before.missingDates.length || after.missingDates.length) warnings.push("Reporting-date coverage is incomplete; missing imports are not zero measures.");
  if (before.eligibleDates.length !== after.eligibleDates.length) warnings.push("Periods contain different numbers of eligible reporting dates.");
  if (before.admittedDates.length !== after.admittedDates.length) warnings.push("Periods contain different numbers of admitted reporting dates.");
  if (weekdayMix(before.admittedDates) !== weekdayMix(after.admittedDates)) warnings.push("Observed reporting dates have different weekday distributions.");
  if (!before.records || !after.records) warnings.push("One or both periods have no matching source records; confirm source scope and mappings.");
  const unavailable = { before: null, after: null, change: null, reductionPercent: null };
  const frequencyPerObservedDate = measurement.mapped ? average(before, after, "frequency") : { ...unavailable },
    alarmSecondsPerObservedDate = measurement.mapped ? average(before, after, "alarmSeconds") : { ...unavailable };
  const metric = target.metric === "frequency" ? frequencyPerObservedDate : alarmSecondsPerObservedDate;
  if (metric.before === 0) warnings.push("The selected metric has a zero baseline; percentage reduction cannot be calculated.");
  const assessable = measurement.mapped && before.admittedDates.length > 0 && after.admittedDates.length > 0 && !before.missingDates.length && !after.missingDates.length && before.eligibleDates.length === after.eligibleDates.length && weekdayMix(before.admittedDates) === weekdayMix(after.admittedDates) && !!before.records && !!after.records && metric.reductionPercent !== null;
  return {
    ...measurement,
    warnings,
    frequencyPerObservedDate,
    alarmSecondsPerObservedDate,
    target: structuredClone(target),
    observedTarget: target.reductionPercent === null ? "not-quantified" : !assessable ? "not-assessable" : metric.reductionPercent! >= target.reductionPercent ? "met" : "not-met",
    attribution: "Observed change in source aggregates does not establish causality. Reporting windows and production exposure are unknown; accumulated alarm seconds are not plant downtime."
  };
}
