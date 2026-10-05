export type Status = "open" | "in-progress" | "blocked" | "done";
export const statuses: Status[] = ["open", "in-progress", "blocked", "done"];
export interface Priority {
  id: string;
  label: string;
  rank: number;
}
export interface Settings {
  revision: number;
  priorities: Priority[];
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
  canEdit: boolean;
  canReassign: boolean;
}
export interface Catalog {
  actorId: string;
  canContribute: boolean;
  canCoordinate: boolean;
  canAdminister: boolean;
  settings: Settings;
  people: { id: string; name: string }[];
  teams: { id: string; label: string }[];
  locations: { id: string; parentId: string; label: string }[];
  assets: {
    id: string;
    name: string;
    locationId: string;
    status: "unverified" | "validated" | "retired";
  }[];
}
export interface Selection {
  status?: string;
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
export interface SaveInput {
  id: string;
  expectedRevision: number;
  data: RecordData;
  reason: string;
}
export interface Revision {
  record: MaintenanceSnapshot;
  actorId: string;
  actorName: string;
  at: string;
  action: string;
  reason: string;
}
export type MaintenanceSnapshot = Omit<
  MaintenanceRecord,
  "canEdit" | "canReassign"
>;
export interface History {
  record: MaintenanceRecord;
  revisions: Revision[];
  nextBefore: number;
}
export function emptyRecord(priorityId = ""): RecordData {
  return {
    title: "",
    details: "",
    locationId: "",
    assetId: "",
    priorityId,
    assigneeId: "",
    teamId: "",
    status: "open",
    dueDate: "",
    outcome: "",
    blockedReason: "",
    externalReference: "",
  };
}
