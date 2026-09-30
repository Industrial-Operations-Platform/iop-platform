export const statuses = [
  "work",
  "compensation",
  "training",
  "maintenance",
  "vacation",
  "accident",
  "sick",
  "off",
] as const;
export type ScheduleStatus = (typeof statuses)[number];
export type Duty = "zone" | "floating" | "leader" | "maintenance";
export interface ShiftType {
  id: string;
  label: string;
  start: string;
  end: string;
  days: number[];
}
export interface Target {
  id: string;
  label: string;
  phone: string;
}
export interface Team {
  id: string;
  label: string;
  leaderId: string;
}
export interface Settings {
  shifts: ShiftType[];
  targets: Target[];
  teams: Team[];
}
export interface Person {
  id: string;
  name: string;
  profile: string;
}
export interface Worker {
  userId: string;
  teamId: string;
  homeTargetId: string;
}
export interface Schedule {
  userId: string;
  date: string;
  status: ScheduleStatus;
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
  duty: Duty;
  phone: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
}
export interface Payloads {
  settings: Settings;
  worker: Worker;
  schedule: Schedule;
  assignment: Assignment;
}
export type Kind = keyof Payloads;
export interface RecordEntry<K extends Kind = Kind> {
  id: string;
  kind: K;
  revision: number;
  deleted: boolean;
  personName: string;
  data: Payloads[K];
}
export interface Revision {
  record: RecordEntry;
  actorId: string;
  actorName: string;
  at: string;
  action: string;
}
export interface ImportRow {
  userId: string;
  date: string;
  status: ScheduleStatus;
  start: string;
  end: string;
}
export interface ImportInput {
  format: "csv" | "email";
  text: string;
  userId: string;
}
export class WorkforceError extends Error {
  constructor(
    readonly code:
      | "workforce_invalid"
      | "workforce_denied"
      | "workforce_conflict"
      | "workforce_missing"
      | "workforce_schedule_required"
      | "workforce_overlap"
      | "workforce_time_ambiguous"
      | "workforce_import_invalid",
    readonly row?: number,
  ) {
    super(code);
  }
}
export function assert(
  condition: unknown,
  code: WorkforceError["code"] = "workforce_invalid",
): asserts condition {
  if (!condition) throw new WorkforceError(code);
}
export function identifier(value: unknown): asserts value is string {
  assert(
    typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value),
  );
}
export function date(value: unknown): asserts value is string {
  assert(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
  );
}
export function time(value: unknown): asserts value is string {
  assert(
    typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
  );
}
export function label(value: unknown): asserts value is string {
  assert(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= 100 &&
      !/[\x00-\x1f]/.test(value),
  );
}
export function range(from: string, to: string) {
  date(from);
  date(to);
  assert(to >= from && (Date.parse(to) - Date.parse(from)) / 86400000 <= 92);
}
export function overlaps(
  a: { startsAt: string; endsAt: string },
  b: { startsAt: string; endsAt: string },
) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}
export function settings(input: Settings): Settings {
  assert(
    input &&
      Array.isArray(input.shifts) &&
      input.shifts.length > 0 &&
      input.shifts.length <= 12 &&
      Array.isArray(input.targets) &&
      input.targets.length <= 100 &&
      Array.isArray(input.teams) &&
      input.teams.length <= 50,
  );
  for (const rows of [input.shifts, input.targets, input.teams]) {
    assert(rows.every((row) => row && typeof row === "object"));
    assert(new Set(rows.map((r) => r.id)).size === rows.length);
    for (const r of rows) {
      identifier(r.id);
      label(r.label);
    }
  }
  for (const s of input.shifts) {
    time(s.start);
    time(s.end);
    assert(
      s.start !== s.end &&
        Array.isArray(s.days) &&
        s.days.length > 0 &&
        s.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
    );
  }
  for (const t of input.targets)
    assert(
      t.id !== "maintenance" &&
        typeof t.phone === "string" &&
        t.phone.length <= 100 &&
        t.phone !== "maintenance",
    );
  const phones = input.targets.map((t) => t.phone).filter(Boolean);
  assert(new Set(phones).size === phones.length);
  for (const t of input.teams) {
    assert(typeof t.leaderId === "string");
    if (t.leaderId) identifier(t.leaderId);
  }
  return structuredClone(input);
}
