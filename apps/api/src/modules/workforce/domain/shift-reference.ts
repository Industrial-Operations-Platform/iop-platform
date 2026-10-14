import { type Assignment, type RecordEntry } from "./workforce";

export interface ShiftProjection {
  key: string;
  date: string;
  shiftTypeId: string;
  label: string;
  targetId: string;
  targetLabel: string;
  startsAt: string;
  endsAt: string;
  assignments: { id: string; revision: number }[];
}
/** Exact dated assignment intervals are evidence; configured defaults are not actual work. */
export function projectShifts(records: RecordEntry<"assignment">[]): ShiftProjection[] {
  const groups = new Map<string, ShiftProjection>();
  for (const record of records) {
    const a = record.data as Assignment;
    if (record.deleted || a.duty !== "zone" || !a.targetId) continue;
    const key = JSON.stringify([a.date, a.shiftId, a.targetId, a.startsAt, a.endsAt]);
    const group = groups.get(key) ?? {
      key, date: a.date, shiftTypeId: a.shiftId, label: a.shiftLabel ?? a.shiftId,
      targetId: a.targetId, targetLabel: a.targetLabel ?? a.targetId,
      startsAt: a.startsAt, endsAt: a.endsAt, assignments: [],
    };
    group.assignments.push({ id: record.id, revision: record.revision });
    groups.set(key, group);
  }
  return [...groups.values()].map((shift) => ({ ...shift,
    assignments: shift.assignments.sort((a, b) => a.id.localeCompare(b.id)),
  })).sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.key.localeCompare(b.key));
}
