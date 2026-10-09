export class HandoverError extends Error {
  constructor(
    readonly code:
      | "invalid_handover"
      | "handover_denied"
      | "handover_missing"
      | "handover_conflict"
      | "handover_today_only"
      | "handover_equipment_unavailable",
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
export type CategoryWorkflow = "safety" | "information" | "success" | "people" | "technical-problem" | "technical-blocked";
export interface Choice {
  publisherProfiles?: string[];
  canPublish?: boolean;
  workflow?: CategoryWorkflow;
  id: string;
  label: string;
  carryForward?: boolean;
  coordinatorOnly?: boolean;
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
export interface ImageAttachment {
  name: string;
  dataUrl: string;
}
export interface ResolutionReference {
  source: "handover" | "maintenance";
  id: string;
  expectedRevision: number;
}
export interface CompletionTarget extends ResolutionReference {
  title: string;
  location: string;
  canComplete: boolean;
}
export interface CompletionPage {
  targets: CompletionTarget[];
  nextCursor: string;
  total: number;
}
export interface Content {
  displayUntil?: string;
  resolutions?: ResolutionReference[];
  mentionIds?: string[];
  images?: ImageAttachment[];
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
export interface CompletedReference {
  source: "handover" | "maintenance";
  id: string;
  title: string;
  location: string;
}
export interface Entry {
  completedReferences?: CompletedReference[];
  notificationAt?: string;
  mentionedPeople?: Person[];
  deleted?: boolean;
  latestUpdate?: { note: string; actorName: string; at: string };
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
export interface NotificationRead {
  id: string;
  at: string;
}
export interface Selection {
  notificationReads?: NotificationRead[];
  displayOn?: string;
  resolutionCandidates?: boolean;
  excludeAttention?: boolean;
  resolvedFrom?: string;
  resolvedTo?: string;
  resolvedForMe?: boolean;
  departmentMatrix?: boolean;
  notificationsAfter?: string;
  dueFrom?: string;
  dueTo?: string;
  responsibleId?: string;
  externalReference?: string;
  condition?: Content["condition"];
  from: string;
  to: string;
  departmentId: string;
  areaId: string;
  equipmentReferenceId: string;
  categoryId: string;
  state: "" | IssueState | "pending";
  search: string;
  highlights: boolean;
  mine?: boolean;
  attention?: boolean;
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
export function validMentions(input: unknown): string[] {
  if (!Array.isArray(input) || input.length > 20) invalid();
  const ids = input.map((id) => text(id, 64, true));
  if (new Set(ids).size !== ids.length) invalid();
  return ids;
}
export function validImages(input: unknown): ImageAttachment[] {
  if (!Array.isArray(input) || input.length > 2) invalid();
  return input.map((image) => {
    exact(image, ["name", "dataUrl"]);
    const name = text(image.name, 160, true);
    const dataUrl = text(image.dataUrl, 65536, true);
    if (
      !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        dataUrl,
      )
    )
      invalid();
    const [header, data] = dataUrl.split(",");
    if (
      data.length % 4 !== 0 ||
      (header.includes("png") && !data.startsWith("iVBORw0KGgo")) ||
      (header.includes("jpeg") && !data.startsWith("/9j/")) ||
      (header.includes("webp") &&
        (!data.startsWith("UklGR") || data.slice(11, 16) !== "XRUJQ"))
    )
      invalid();
    return { name, dataUrl };
  });
}
export function validResolutions(input: unknown): ResolutionReference[] {
  if (!Array.isArray(input) || input.length > 20) invalid();
  const result = input.map((reference) => {
    exact(reference, ["source", "id", "expectedRevision"]);
    if (!["handover", "maintenance"].includes(reference.source as string) ||
      !Number.isSafeInteger(reference.expectedRevision) || (reference.expectedRevision as number) < 1 || (reference.expectedRevision as number) > 2147483647) invalid();
    return { source: reference.source as ResolutionReference["source"], id: text(reference.id, 64, true), expectedRevision: reference.expectedRevision as number };
  });
  if (new Set(result.map((r) => r.id)).size !== result.length || new Set(result.map((r) => r.source)).size > 1) invalid();
  return result;
}
export function validContent(input: Content, catalog: Catalog): Content {
  exact(input, [
    ...["displayUntil", "resolutions", "mentionIds", "images"].filter((key) =>
      Object.hasOwn(input ?? {}, key),
    ),
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
    ...(input.displayUntil !== undefined ? { displayUntil: date(input.displayUntil, true) } : {}),
    ...(input.resolutions !== undefined ? { resolutions: validResolutions(input.resolutions) } : {}),
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
    ...(input.mentionIds !== undefined
      ? { mentionIds: validMentions(input.mentionIds) }
      : {}),
    ...(input.images !== undefined
      ? { images: validImages(input.images) }
      : {}),
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
  const workflow = catalog.categories.find((c) => c.id === value.categoryId)?.workflow;
  if (workflow === "safety" && (value.equipmentCode || value.condition)) invalid();
  if (value.condition && !value.equipmentCode && !workflow?.startsWith("technical-")) invalid();
  if (workflow?.startsWith("technical-")) {
    const classification = catalog.categories.find((c) => c.workflow === (value.condition === "blocked" ? "technical-blocked" : "technical-problem"));
    if (!classification) invalid();
    value.categoryId = classification.id;
  }
  if (workflow === "information") {
    value.displayUntil ??= value.date;
    if (value.displayUntil < value.date) invalid();
  } else if (value.displayUntil) invalid();
  if (workflow === "success") {
    if (!value.resolutions?.length) invalid();
  } else if (value.resolutions?.length) invalid();
  return value;
}
export function validSelection(input: Selection): Selection {
  exact(input, [
    ...Object.keys(emptySelection),
    ...(Object.hasOwn(input ?? {}, "mine") ? ["mine"] : []),
    ...(Object.hasOwn(input ?? {}, "attention") ? ["attention"] : []),
    ...[
      "displayOn",
      "resolutionCandidates",
      "notificationReads",
      "departmentMatrix",
      "excludeAttention",
      "resolvedFrom",
      "resolvedTo",
      "resolvedForMe",
      "notificationsAfter",
      "dueFrom",
      "dueTo",
      "responsibleId",
      "externalReference",
      "condition",
    ].filter((key) => Object.hasOwn(input ?? {}, key)),
  ]);
  if (
    (input.departmentMatrix !== undefined &&
      typeof input.departmentMatrix !== "boolean") ||
    (input.excludeAttention !== undefined &&
      typeof input.excludeAttention !== "boolean") ||
    (input.resolvedForMe !== undefined &&
      typeof input.resolvedForMe !== "boolean") ||
    (input.mine !== undefined && typeof input.mine !== "boolean") ||
    (input.attention !== undefined && typeof input.attention !== "boolean")
  )
    invalid();
  const result = { ...input, from: date(input.from), to: date(input.to) };
  for (const key of [
    "departmentId",
    "areaId",
    "equipmentReferenceId",
    "categoryId",
  ] as const)
    result[key] = text(input[key], 64);
  if (input.displayOn !== undefined) result.displayOn = date(input.displayOn, true);
  if (input.resolutionCandidates !== undefined && typeof input.resolutionCandidates !== "boolean") invalid();
  if (input.notificationReads !== undefined) {
    if (!Array.isArray(input.notificationReads) || input.notificationReads.length > 1000) invalid();
    result.notificationReads = input.notificationReads.map((read) => {
      exact(read, ["id", "at"]);
      const id = text(read.id, 64, true);
      const at = text(read.at, 24, true);
      if (!Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) invalid();
      return { id, at };
    });
  }
  if (input.notificationsAfter !== undefined) {
    const since = input.notificationsAfter;
    if (
      typeof since !== "string" ||
      since < "1970-01-01T00:00:00.000Z" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(since) ||
      !Number.isFinite(Date.parse(since)) ||
      new Date(since).toISOString() !== since
    )
      invalid();
  }
  if (input.dueFrom !== undefined) result.dueFrom = date(input.dueFrom);
  if (input.dueTo !== undefined) result.dueTo = date(input.dueTo);
  if (
    result.dueFrom &&
    result.dueTo &&
    (result.dueFrom > result.dueTo ||
      Date.parse(result.dueTo) - Date.parse(result.dueFrom) > 3660 * 86400000)
  )
    invalid();
  if (input.responsibleId !== undefined)
    result.responsibleId = text(input.responsibleId, 64);
  if (input.externalReference !== undefined)
    result.externalReference = text(input.externalReference, 160).trim();
  if (
    input.condition !== undefined &&
    ![
      "",
      "damaged",
      "inspection-needed",
      "blocked",
      "repaired",
      "restored",
    ].includes(input.condition)
  )
    invalid();
  if (input.resolvedFrom !== undefined)
    result.resolvedFrom = date(input.resolvedFrom, true);
  if (input.resolvedTo !== undefined)
    result.resolvedTo = date(input.resolvedTo, true);
  if (
    !!result.resolvedFrom !== !!result.resolvedTo ||
    (result.resolvedFrom &&
      result.resolvedTo &&
      (result.resolvedFrom > result.resolvedTo ||
        Date.parse(result.resolvedTo) - Date.parse(result.resolvedFrom) >
          366 * 86400000))
  )
    invalid();
  if (input.resolvedForMe && !result.resolvedFrom) invalid();
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

export function siteDate(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
}
