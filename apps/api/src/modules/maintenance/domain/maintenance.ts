export const statuses = ["open", "in-progress", "blocked", "done"] as const;
export type Status = (typeof statuses)[number];
export const categories = ["corrective", "preventive", "inspection"] as const;
export type Category = (typeof categories)[number];
export interface EquipmentTarget {
  namespace: "site-equipment";
  code: string;
  departmentId: string;
  areaId: string;
}
export interface LinkedEntry {
  id: string;
  expectedRevision: number;
  disposition: "include" | "exclude";
  reason: string;
}
export interface IssueScope {
  locationIds: string[];
  equipment: EquipmentTarget[];
}
/** Receiving-owned projection of journal evidence; Handover retains its records. */
export interface RelatedEntry {
  id: string;
  revision: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  content: {
    date: string;
    categoryId: string;
    summary: string;
    details: string;
    departmentId: string;
    areaId: string;
    equipmentCode: string;
    equipmentNamespace: string;
    condition:
      | ""
      | "damaged"
      | "inspection-needed"
      | "blocked"
      | "repaired"
      | "restored";
    externalReference: string;
    challenge: string;
    cause: string;
    measure: string;
    dueDate: string;
    feedbackDueDate: string;
    discuss: boolean;
  };
  departmentLabel: string;
  areaLabel: string;
  categoryLabel: string;
  equipmentReferenceId: string;
  responsibleId: string;
  responsibleName: string;
  issueState: "none" | "open" | "in-progress" | "resolved";
  highlighted: boolean;
  highlightedAt: string;
  latestUpdate?: { note: string; actorName: string; at: string };
}
export interface RelatedPage {
  entries: RelatedEntry[];
  total: number;
  nextCursor: string;
}
export interface AssignmentEvent {
  id: string;
  recordId: string;
  title: string;
  at: string;
  revision: number;
}
export interface Priority {
  id: string;
  label: string;
  rank: number;
}
export interface Location {
  id: string;
  parentId: string;
  label: string;
  role?: "department" | "area" | "location";
  sectorKey?: string;
}
export interface Person {
  id: string;
  name: string;
}
export interface Team {
  id: string;
  label: string;
}
export interface AssetReference {
  id: string;
  name: string;
  locationId: string;
  status: "unverified" | "validated" | "retired";
}
export interface RecordData {
  category?: Category;
  repairTarget?: string;
  equipment?: EquipmentTarget[];
  linkedEntries?: LinkedEntry[];
  title: string;
  details: string;
  locationId: string;
  assetId: string;
  priorityId: string;
  assigneeId: string;
  teamId: string;
  status: Status;
  dueDate: string;
  outcome: string;
  blockedReason: string;
  externalReference: string;
}
export interface MaintenanceRecord {
  id: string;
  revision: number;
  data: RecordData;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  locationLabel: string;
  assetName: string;
  priorityLabel: string;
  assigneeName: string;
  teamLabel: string;
  assignedAt?: string;
  completedAt?: string;
}
export interface RecordView extends MaintenanceRecord {
  canEdit: boolean;
  canReassign: boolean;
}
export interface Revision {
  record: MaintenanceRecord;
  actorId: string;
  actorName: string;
  at: string;
  action: "created" | "updated" | "status-changed";
  reason: string;
}
export interface Settings {
  revision: number;
  priorities: Priority[];
}
export interface Selection {
  category?: Category | "";
  history?: boolean;
  doneFrom?: string;
  doneTo?: string;
  status?: Status | "";
  priorityId?: string;
  locationId?: string;
  assetId?: string;
  assigneeId?: string;
  teamId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  cursor?: string;
  limit?: number;
}
export interface Page {
  records: MaintenanceRecord[];
  total: number;
  nextCursor: string;
  statusCounts: Record<Status, number>;
}
export class MaintenanceError extends Error {
  constructor(
    readonly code:
      | "invalid_maintenance"
      | "maintenance_denied"
      | "maintenance_missing"
      | "maintenance_conflict"
      | "maintenance_capacity",
  ) {
    super(code);
  }
}
export function assert(
  condition: unknown,
  code: MaintenanceError["code"] = "invalid_maintenance",
): asserts condition {
  if (!condition) throw new MaintenanceError(code);
}
export function identifier(
  value: unknown,
  optional = false,
): asserts value is string {
  assert(
    typeof value === "string" &&
      ((optional && value === "") ||
        /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/.test(value)),
  );
}
export function text(
  value: unknown,
  maximum: number,
  required = false,
): asserts value is string {
  assert(
    typeof value === "string" &&
      value.length <= maximum &&
      (!required || !!value.trim()) &&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
  );
}
export function date(
  value: unknown,
  optional = false,
): asserts value is string {
  assert(typeof value === "string");
  if (optional && value === "") return;
  assert(
    /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
  );
}
export function priorities(value: unknown): asserts value is Priority[] {
  assert(Array.isArray(value) && value.length > 0 && value.length <= 20);
  const ids = new Set<string>(),
    ranks = new Set<number>();
  for (const priority of value) {
    assert(priority && typeof priority === "object");
    identifier(priority.id);
    text(priority.label, 80, true);
    assert(
      Number.isSafeInteger(priority.rank) &&
        priority.rank >= 0 &&
        priority.rank <= 100 &&
        !ids.has(priority.id) &&
        !ranks.has(priority.rank),
    );
    ids.add(priority.id);
    ranks.add(priority.rank);
  }
}
export function data(value: unknown): asserts value is RecordData {
  assert(value && typeof value === "object" && !Array.isArray(value));
  const input = value as RecordData;
  const expected = [
    "title",
    "details",
    "locationId",
    "assetId",
    "priorityId",
    "assigneeId",
    "teamId",
    "status",
    "dueDate",
    "outcome",
    "blockedReason",
    "externalReference",
  ].sort();
  assert(
    expected.every((key) => Object.hasOwn(input, key)) &&
      Object.keys(input).every(
        (key) =>
          expected.includes(key) ||
          ["category", "repairTarget", "equipment", "linkedEntries"].includes(
            key,
          ),
      ),
  );
  assert(input.category === undefined || categories.includes(input.category));
  if (input.repairTarget !== undefined) text(input.repairTarget, 2000);
  if (input.equipment !== undefined) equipment(input.equipment);
  if (input.linkedEntries !== undefined) linkedEntries(input.linkedEntries);
  text(input.title, 160, true);
  text(input.details, 8000);
  identifier(input.locationId);
  identifier(input.assetId, true);
  identifier(input.priorityId);
  identifier(input.assigneeId, true);
  identifier(input.teamId, true);
  assert(statuses.includes(input.status));
  date(input.dueDate, true);
  text(input.outcome, 4000);
  text(input.blockedReason, 2000);
  text(input.externalReference, 200);
  assert(input.status !== "done" || !!input.outcome.trim());
  assert(input.status !== "blocked" || !!input.blockedReason.trim());
  assert(new TextEncoder().encode(JSON.stringify(input)).length <= 48000);
}
export function selection(value: unknown): asserts value is Selection {
  assert(value && typeof value === "object" && !Array.isArray(value));
  const input = value as Selection;
  assert(
    Object.keys(input).every((key) =>
      [
        "category",
        "history",
        "doneFrom",
        "doneTo",
        "status",
        "priorityId",
        "locationId",
        "assetId",
        "assigneeId",
        "teamId",
        "search",
        "dueFrom",
        "dueTo",
        "cursor",
        "limit",
      ].includes(key),
    ),
  );
  assert(
    input.category === undefined ||
      input.category === "" ||
      categories.includes(input.category),
  );
  assert(input.history === undefined || typeof input.history === "boolean");
  if (input.doneFrom !== undefined) date(input.doneFrom, true);
  if (input.doneTo !== undefined) date(input.doneTo, true);
  assert(!input.doneFrom || !input.doneTo || input.doneFrom <= input.doneTo);
  assert(
    input.status === undefined ||
      input.status === "" ||
      statuses.includes(input.status),
  );
  for (const key of [
    "priorityId",
    "locationId",
    "assetId",
    "assigneeId",
    "teamId",
  ] as const)
    if (input[key] !== undefined) identifier(input[key], true);
  if (input.search !== undefined) text(input.search, 200);
  if (input.dueFrom !== undefined) date(input.dueFrom, true);
  if (input.dueTo !== undefined) date(input.dueTo, true);
  assert(!input.dueFrom || !input.dueTo || input.dueFrom <= input.dueTo);
  if (input.cursor !== undefined) text(input.cursor, 300);
  assert(
    input.limit === undefined ||
      (Number.isSafeInteger(input.limit) &&
        input.limit >= 1 &&
        input.limit <= 100),
  );
}
export function transition(before: Status, after: Status, reason: string) {
  if (before === "done" && after !== "done") assert(!!reason.trim());
}
export function sameData(first: RecordData, second: RecordData) {
  const a = normalized(first),
    b = normalized(second);
  return (Object.keys(a) as (keyof RecordData)[]).every(
    (key) => stableValue(a[key]) === stableValue(b[key]),
  );
}
function stableValue(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableValue).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, "en"))
        .map(([key, item]) => JSON.stringify(key) + ":" + stableValue(item))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function sameEquipment(
  first: EquipmentTarget[],
  second: EquipmentTarget[],
) {
  return (
    first.length === second.length &&
    first.every((target) =>
      second.some(
        (other) =>
          target.namespace === other.namespace &&
          target.code === other.code &&
          target.departmentId === other.departmentId &&
          target.areaId === other.areaId,
      ),
    )
  );
}
export function normalized(input: RecordData): RecordData & {
  category: Category;
  repairTarget: string;
  equipment: EquipmentTarget[];
  linkedEntries: LinkedEntry[];
} {
  return {
    ...input,
    category: input.category ?? "corrective",
    repairTarget: input.repairTarget ?? "",
    equipment: input.equipment ?? [],
    linkedEntries: input.linkedEntries ?? [],
  };
}
export function equipment(value: unknown): asserts value is EquipmentTarget[] {
  assert(Array.isArray(value) && value.length <= 30);
  const tuples = new Set<string>();
  for (const target of value) {
    assert(
      target &&
        typeof target === "object" &&
        !Array.isArray(target) &&
        Object.keys(target).sort().join(",") ===
          "areaId,code,departmentId,namespace",
    );
    assert(target.namespace === "site-equipment");
    text(target.code, 160, true);
    identifier(target.departmentId);
    identifier(target.areaId, true);
    const tuple = JSON.stringify([
      target.namespace,
      target.code,
      target.departmentId,
      target.areaId,
    ]);
    assert(!tuples.has(tuple));
    tuples.add(tuple);
  }
}
export function linkedEntries(value: unknown): asserts value is LinkedEntry[] {
  assert(Array.isArray(value) && value.length <= 100);
  const ids = new Set<string>();
  for (const entry of value) {
    assert(
      entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        Object.keys(entry).sort().join(",") ===
          "disposition,expectedRevision,id,reason",
    );
    identifier(entry.id);
    assert(
      Number.isSafeInteger(entry.expectedRevision) &&
        entry.expectedRevision >= 1 &&
        entry.expectedRevision <= 2147483647 &&
        !ids.has(entry.id),
    );
    assert(entry.disposition === "include" || entry.disposition === "exclude");
    text(entry.reason, 2000, entry.disposition === "exclude");
    ids.add(entry.id);
  }
}
export function instant(value: unknown): asserts value is string {
  assert(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString() === value &&
      value >= "1970-01-01T00:00:00.000Z",
  );
}
export function currentWeeks(at: string, timeZone: string) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
  const calendar = new Date(day + "T00:00:00.000Z");
  const offset = (calendar.getUTCDay() + 6) % 7;
  const monday = calendar.getTime() - offset * 86400000;
  return {
    doneFrom: new Date(monday - 7 * 86400000).toISOString().slice(0, 10),
    doneTo: new Date(monday + 6 * 86400000).toISOString().slice(0, 10),
  };
}
export function descendants(locations: Location[], root: string): string[] {
  const ids = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const location of locations)
      if (ids.has(location.parentId) && !ids.has(location.id)) {
        ids.add(location.id);
        changed = true;
      }
  }
  return [...ids];
}
