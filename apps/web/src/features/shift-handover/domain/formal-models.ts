import type { Location, Entry } from "./models";
type IssueState = Entry["issueState"];
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
export interface FormalContext { actorId: string; canManageRecords: boolean; locations: Location[]; timeZone: string }
export interface CandidatePage { entries: EntryEvidence[]; total: number }
