export type Kind = "settings" | "worker" | "schedule" | "assignment";
export interface ShiftType {
  id: string;
  label: string;
  start: string;
  end: string;
  days: number[];
}
export interface Settings {
  shifts: ShiftType[];
  targets: { id: string; label: string; phone: string }[];
  teams: { id: string; label: string; leaderId: string }[];
}
export interface Person {
  id: string;
  name: string;
  profile: string;
}
export interface Schedule {
  userId: string;
  date: string;
  status: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
  source: string;
}
export interface Assignment {
  targetLabel?: string;
  shiftLabel?: string;
  phoneLabel?: string;
  userId: string;
  date: string;
  shiftId: string;
  targetId: string;
  duty: string;
  phone: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
}
export interface Worker {
  userId: string;
  teamId: string;
  homeTargetId: string;
}
export interface Payloads {
  settings: Settings;
  worker: Worker;
  schedule: Schedule;
  assignment: Assignment;
}
export interface RecordEntry<K extends Kind = Kind> {
  id: string;
  kind: K;
  revision: number;
  deleted: boolean;
  personName: string;
  data: Payloads[K];
}
export interface Board {
  actorId: string;
  timeZone: string;
  canPlan: boolean;
  canAdminister: boolean;
  people: Person[];
  settings: Settings;
  records: RecordEntry[];
}
export interface SaveInput {
  kind: Kind;
  id: string;
  expectedRevision: number;
  deleted: boolean;
  data: Payloads[Kind];
}
export interface ImportInput {
  format: "csv" | "email";
  text: string;
  userId: string;
}
export interface Preview {
  id: string;
  expectedRevision: number;
  data: Schedule;
  outcome: string;
}
export interface Revision {
  record: RecordEntry;
  actorId: string;
  actorName: string;
  at: string;
  action: string;
}
export function weekDates(selected: string) {
  const day = new Date(`${selected}T12:00:00Z`),
    weekday = day.getUTCDay();
  day.setUTCDate(day.getUTCDate() - ((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) =>
    new Date(day.getTime() + i * 86400000).toISOString().slice(0, 10),
  );
}
export function entries<K extends Kind>(
  board: Board,
  kind: K,
): RecordEntry<K>[] {
  return board.records.filter(
    (r) => r.kind === kind && !r.deleted,
  ) as RecordEntry<K>[];
}

/** Keep historical assignments visible after a configured label/target is retired. */
export function visibleTargets(board: Board) {
  const targets = [...board.settings.targets];
  for (const { data } of entries(board, "assignment"))
    if (data.targetId && !targets.some((t) => t.id === data.targetId))
      targets.push({
        id: data.targetId,
        label: data.targetLabel || data.targetId,
        phone: data.phoneLabel || "",
      });
  return targets;
}
export function visibleShifts(board: Board) {
  const shifts = [...board.settings.shifts];
  for (const { data } of entries(board, "assignment"))
    if (!shifts.some((s) => s.id === data.shiftId))
      shifts.push({
        id: data.shiftId,
        label: data.shiftLabel || data.shiftId,
        start: data.start,
        end: data.end,
        days: [0, 1, 2, 3, 4, 5, 6],
      });
  return shifts;
}

export interface PersonalSummary {
  actorId: string;
  today: string;
  currentFrom: string;
  previousFrom: string;
  previousTo: string;
  homeTargetId: string;
  homeTargetLabel: string;
  teamLabel: string;
  scheduledDays: number;
  shifts: { id: string; label: string; count: number; percentage: number }[];
  saturdays: number;
  sundays: number;
}
