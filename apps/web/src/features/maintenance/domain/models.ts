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
  category?: "corrective" | "preventive" | "inspection";
  repairTarget?: string;
  equipment?: EquipmentReference[];
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
  locations: { id: string; parentId: string; label: string; role?: string }[];
  assets: {
    id: string;
    name: string;
    locationId: string;
    status: "unverified" | "validated" | "retired";
  }[];
}
export interface Selection {
  history?: boolean;
  doneFrom?: string;
  doneTo?: string;
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
    category: "corrective",
    repairTarget: "",
    equipment: [],
    linkedEntries: [],
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

export interface EquipmentReference {
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
/** Maintenance reads published report summaries; Handover keeps their histories. */
export interface RelatedEntry {
  id: string;
  revision: number;
  content: {
    categoryId: string;
    summary: string;
    details: string;
    date: string;
    equipmentCode: string;
    condition: string;
    dueDate: string;
    feedbackDueDate: string;
  };
  departmentLabel: string;
  areaLabel: string;
  categoryLabel: string;
  responsibleName: string;
  issueState: "none" | "open" | "in-progress" | "resolved";
  latestUpdate?: { note: string; actorName: string; at: string };
}
export interface RelatedSelection {
  locationId: string;
  equipment: EquipmentReference[];
  search?: string;
  cursor?: string;
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
export interface Assignments {
  records: MaintenanceRecord[];
  events: AssignmentEvent[];
}
