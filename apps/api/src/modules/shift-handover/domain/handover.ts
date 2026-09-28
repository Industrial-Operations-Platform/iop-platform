export class HandoverError extends Error {
  constructor(
    readonly code:
      | "invalid_handover"
      | "handover_denied"
      | "handover_missing"
      | "handover_conflict",
  ) {
    super(code);
  }
}
export interface Location {
  id: string;
  label: string;
  parentId: string;
  role: "department" | "area" | "location";
  sectorKey: string;
}
export interface Choice {
  id: string;
  label: string;
}
export interface Catalog {
  locations: Location[];
  categories: Choice[];
  externalSystemLabel: string;
  timeZone: string;
}
export interface Person {
  id: string;
  name: string;
}
export interface Content {
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
}
export type IssueState = "none" | "open" | "in-progress" | "resolved";
export interface Entry {
  id: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  content: Content;
  departmentLabel: string;
  areaLabel: string;
  categoryLabel: string;
  equipmentReferenceId: string;
  responsibleId: string;
  responsibleName: string;
  issueState: IssueState;
  highlighted: boolean;
  highlightedAt: string;
}
export interface Revision {
  entry: Entry;
  actorId: string;
  actorName: string;
  action: string;
  note: string;
  at: string;
}
export interface Page {
  entries: Entry[];
  nextCursor: string;
  total: number;
}
export interface History {
  entry: Entry;
  revisions: Revision[];
  nextBefore: number;
}
export interface Selection {
  from: string;
  to: string;
  departmentId: string;
  areaId: string;
  equipmentReferenceId: string;
  categoryId: string;
  state: "" | IssueState | "pending";
  search: string;
  highlights: boolean;
  cursor: string;
}
export const emptySelection: Selection = {
  from: "",
  to: "",
  departmentId: "",
  areaId: "",
  equipmentReferenceId: "",
  categoryId: "",
  state: "",
  search: "",
  highlights: false,
  cursor: "",
};
function invalid(): never {
  throw new HandoverError("invalid_handover");
}
export function exact(
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== [...keys].sort().join()
  )
    invalid();
}
export function text(value: unknown, max: number, required = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) ||
    (required && !value.trim())
  )
    invalid();
  return value.trim();
}
export function date(value: unknown, required = false): string {
  const result = text(value, 10, required);
  if (
    result &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(result) ||
      Number(result.slice(0, 4)) < 1900 ||
      Number(result.slice(0, 4)) > 2200 ||
      (Number.isFinite(Date.parse(result + "T00:00:00Z"))
        ? new Date(result + "T00:00:00Z").toISOString()
        : ""
      ).slice(0, 10) !== result)
  )
    invalid();
  return result;
}
export function validContent(input: Content, catalog: Catalog): Content {
  exact(input, [
    "date",
    "categoryId",
    "summary",
    "details",
    "departmentId",
    "areaId",
    "equipmentCode",
    "equipmentNamespace",
    "condition",
    "externalReference",
    "challenge",
    "cause",
    "measure",
    "dueDate",
    "feedbackDueDate",
    "discuss",
  ]);
  const value: Content = {
    date: date(input.date, true),
    categoryId: text(input.categoryId, 64, true),
    summary: text(input.summary, 240, true),
    details: text(input.details, 4000),
    departmentId: text(input.departmentId, 64),
    areaId: text(input.areaId, 64),
    equipmentCode: text(input.equipmentCode, 160),
    equipmentNamespace: text(input.equipmentNamespace, 64, true),
    condition: input.condition,
    externalReference: text(input.externalReference, 160),
    challenge: text(input.challenge, 2000),
    cause: text(input.cause, 2000),
    measure: text(input.measure, 2000),
    dueDate: date(input.dueDate),
    feedbackDueDate: date(input.feedbackDueDate),
    discuss: input.discuss,
  };
  if (
    typeof value.discuss !== "boolean" ||
    ![
      "",
      "damaged",
      "inspection-needed",
      "blocked",
      "repaired",
      "restored",
    ].includes(value.condition) ||
    !catalog.categories.some((c) => c.id === value.categoryId)
  )
    invalid();
  const department = catalog.locations.find(
    (l) => l.id === value.departmentId && l.role === "department",
  );
  if (value.departmentId && !department) invalid();
  if (
    value.areaId &&
    !catalog.locations.some(
      (l) =>
        l.id === value.areaId &&
        l.role === "area" &&
        withinLocation(l.id, value.departmentId, catalog.locations),
    )
  )
    invalid();
  if ((value.equipmentCode || value.condition) && !department) invalid();
  if (value.condition && !value.equipmentCode) invalid();
  return value;
}
export function validSelection(input: Selection): Selection {
  exact(input, Object.keys(emptySelection));
  const result = { ...input, from: date(input.from), to: date(input.to) };
  for (const key of [
    "departmentId",
    "areaId",
    "equipmentReferenceId",
    "categoryId",
  ] as const)
    result[key] = text(input[key], 64);
  result.search = text(input.search, 240);
  result.cursor = text(input.cursor, 100);
  if (
    typeof input.highlights !== "boolean" ||
    !["", "none", "open", "in-progress", "resolved", "pending"].includes(
      input.state,
    )
  )
    invalid();
  if (
    result.from &&
    result.to &&
    (result.from > result.to ||
      Date.parse(result.to) - Date.parse(result.from) > 3660 * 86400000)
  )
    invalid();
  if (
    result.cursor &&
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}\.\d{3}Z|\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)?\|[0-9a-f-]{36}$/.test(
      result.cursor,
    )
  )
    invalid();
  return result;
}
export function requireRevision(entry: Entry, expected: number): void {
  if (!Number.isSafeInteger(expected) || expected < 1) invalid();
  if (entry.revision !== expected) throw new HandoverError("handover_conflict");
}
export function requireEditor(
  entry: Entry,
  actor: string,
  coordinator: boolean,
): void {
  if (!coordinator && entry.authorId !== actor)
    throw new HandoverError("handover_denied");
}
export function changeIssue(
  entry: Entry,
  actor: string,
  coordinator: boolean,
  state: IssueState,
  note: string,
): void {
  if (!coordinator && entry.authorId !== actor && entry.responsibleId !== actor)
    throw new HandoverError("handover_denied");
  if (
    !["open", "in-progress", "resolved"].includes(state) ||
    (entry.issueState === "none" && state !== "open") ||
    entry.issueState === state
  )
    invalid();
  text(note, 4000, true);
  entry.issueState = state;
}

export function withinLocation(
  id: string,
  ancestor: string,
  locations: Location[],
): boolean {
  const seen = new Set<string>();
  while (id && !seen.has(id)) {
    if (id === ancestor) return true;
    seen.add(id);
    id = locations.find((location) => location.id === id)?.parentId ?? "";
  }
  return false;
}
