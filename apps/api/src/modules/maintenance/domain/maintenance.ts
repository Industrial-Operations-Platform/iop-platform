export const statuses = ["open", "in-progress", "blocked", "done"] as const;
export type Status = (typeof statuses)[number];
export interface Priority {
  id: string;
  label: string;
  rank: number;
}
export interface Location {
  id: string;
  parentId: string;
  label: string;
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
  assert(Object.keys(input).sort().join(",") === expected.join(","));
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
}
export function selection(value: unknown): asserts value is Selection {
  assert(value && typeof value === "object" && !Array.isArray(value));
  const input = value as Selection;
  assert(
    Object.keys(input).every((key) =>
      [
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
  return (Object.keys(first) as (keyof RecordData)[]).every(
    (key) => first[key] === second[key],
  );
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
