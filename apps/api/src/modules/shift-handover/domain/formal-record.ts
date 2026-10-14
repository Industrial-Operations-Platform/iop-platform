import { HandoverError, date, exact, text, withinLocation, type Location, type Entry, type IssueState } from "./handover";

export interface ShiftReference {
  id: string;
  date: string;
  shiftTypeId: string;
  label: string;
  targetId: string;
  targetLabel: string;
  startsAt: string;
  endsAt: string;
  assignments: { id: string; revision: number }[];
}
export interface RecordContent {
  shiftId: string;
  shiftDate: string;
  departmentId: string;
  areaId: string;
  title: string;
  summary: string;
  entryIds: string[];
}
export interface EntryEvidence {
  id: string;
  revision: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  content: Omit<Entry["content"], "images">;
  departmentLabel: string;
  areaLabel: string;
  categoryLabel: string;
  responsibleId: string;
  responsibleName: string;
  issueState: IssueState;
  assetReference?: Entry["assetReference"];
}
export interface Acknowledgement {
  actorId: string;
  actorName: string;
  at: string;
  note: string;
}
export interface FormalRecord {
  id: string;
  revision: number;
  state: "draft" | "open" | "closed";
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  shift: ShiftReference;
  departmentLabel: string;
  areaLabel: string;
  content: RecordContent;
  closedBy: string;
  closedByName: string;
  closedAt: string;
  outcome: string;
  entries: EntryEvidence[];
  pending: EntryEvidence[];
  acknowledgements: Acknowledgement[];
}
export interface FormalRevision {
  record: FormalRecord;
  actorId: string;
  actorName: string;
  at: string;
  action: "created" | "corrected" | "published" | "closed" | "acknowledged";
  note: string;
}
export interface RecordSelection {
  from: string;
  to: string;
  departmentId: string;
  areaId: string;
  cursor: string;
}
export interface SaveRecord {
  key: string;
  id: string;
  expectedRevision: number;
  content: RecordContent;
  note: string;
}
export interface TransitionRecord {
  id: string;
  expectedRevision: number;
  action: "publish" | "close" | "acknowledge";
  note: string;
}
export interface RecordPage { records: FormalRecord[]; total: number; nextCursor: string }
export interface RecordHistory { record: FormalRecord; revisions: FormalRevision[]; nextBefore: number }
export interface PreviousShift {
  shift: ShiftReference | null;
  record: FormalRecord | null;
  overlaps: boolean;
  pending: EntryEvidence[];
  pendingTotal: number;
}
export function identifier(value: unknown, required = false): string {
  const id = text(value, 64, required);
  if (id && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)) throw new HandoverError("invalid_handover");
  return id;
}
export function revision(expected: number, actual: number): void {
  if (!Number.isSafeInteger(expected) || expected < 0) throw new HandoverError("invalid_handover");
  if (expected !== actual) throw new HandoverError("handover_conflict");
}
export function validateLocation(departmentId: string, areaId: string, locations: Location[]): void {
  if (!locations.some((l) => l.id === departmentId && l.role === "department") ||
    (areaId && !locations.some((l) => l.id === areaId && l.role === "area" && withinLocation(l.id, departmentId, locations))))
    throw new HandoverError("invalid_handover");
}
export function recordContent(input: RecordContent, locations: Location[]): RecordContent {
  exact(input, ["shiftId", "shiftDate", "departmentId", "areaId", "title", "summary", "entryIds"]);
  if (!Array.isArray(input.entryIds) || input.entryIds.length > 100) throw new HandoverError("invalid_handover");
  const result = { shiftId: identifier(input.shiftId, true), shiftDate: date(input.shiftDate, true), departmentId: identifier(input.departmentId, true),
    areaId: identifier(input.areaId), title: text(input.title, 240, true), summary: text(input.summary, 4000),
    entryIds: input.entryIds.map((id) => identifier(id, true)) };
  if (new Set(result.entryIds).size !== result.entryIds.length) throw new HandoverError("invalid_handover");
  validateLocation(result.departmentId, result.areaId, locations);
  return result;
}
export function selection(input: RecordSelection, locations: Location[]): RecordSelection {
  exact(input, ["from", "to", "departmentId", "areaId", "cursor"]);
  const result = { from: date(input.from, true), to: date(input.to, true),
    departmentId: identifier(input.departmentId), areaId: identifier(input.areaId), cursor: text(input.cursor, 100) };
  if (result.to < result.from || Date.parse(result.to) - Date.parse(result.from) > 92 * 86400000 ||
    (result.areaId && !result.departmentId)) throw new HandoverError("invalid_handover");
  if (result.departmentId) validateLocation(result.departmentId, result.areaId, locations);
  if (result.cursor && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|[A-Za-z0-9_-]{1,64}$/.test(result.cursor))
    throw new HandoverError("invalid_handover");
  return result;
}
export function entryEvidence(entry: Entry): EntryEvidence {
  const { images: _images, ...content } = entry.content;
  return { id: entry.id, revision: entry.revision, authorId: entry.authorId, authorName: entry.authorName,
    createdAt: entry.createdAt, content: structuredClone(content), departmentLabel: entry.departmentLabel,
    areaLabel: entry.areaLabel, categoryLabel: entry.categoryLabel, responsibleId: entry.responsibleId,
    responsibleName: entry.responsibleName, issueState: entry.issueState,
    ...(entry.assetReference ? { assetReference: structuredClone(entry.assetReference) } : {}) };
}
