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

export interface Context extends Catalog {
  people: Person[];
  actorId: string;
  canCoordinate: boolean;
}
export interface CreateEntry {
  key: string;
  content: Content;
  issue: boolean;
  responsibleId: string;
}
export interface ChangeEntry {
  id: string;
  expectedRevision: number;
  action: "correct" | "follow-up" | "state" | "assign" | "highlight";
  note: string;
  content?: Content;
  state?: IssueState;
  responsibleId?: string;
  highlighted?: boolean;
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

export interface EquipmentSelection {
  departmentId: string;
  areaId: string;
  search: string;
  after: string;
}
export interface EquipmentPage {
  codes: string[];
  nextCursor: string;
}
