import { assert, type Assignment, type RecordEntry, type Schedule, type Settings } from "./workforce";

export interface ProposalIssue {
  userId: string;
  date: string;
  assignmentId: string;
  code: "custom-hours" | "assignment-conflict";
}
export interface ProposalAssignmentChange {
  before: RecordEntry<"assignment">;
  after?: Assignment;
}

/** Configured full-shift duties follow explicit schedule edits. */
export function planAssignmentChanges(
  schedules: Schedule[], assignments: RecordEntry<"assignment">[], settings: Settings,
) {
  const days = new Map(schedules.map(day => [`${day.userId}_${day.date}`, day]));
  const changes: ProposalAssignmentChange[] = [];
  const issues: ProposalIssue[] = [];
  for (const before of assignments) {
    const assignment = before.data;
    const day = days.get(`${assignment.userId}_${assignment.date}`);
    if (!day) continue;
    if (!["work", "maintenance"].includes(day.status)) {
      changes.push({ before });
      continue;
    }
    if (assignment.start === day.start && assignment.end === day.end) continue;
    const weekday = new Date(day.date).getUTCDay();
    const next = settings.shifts.find(shift => shift.start === day.start && shift.end === day.end && shift.days.includes(weekday));
    const fullShift = settings.shifts.some(shift => shift.id === assignment.shiftId &&
      shift.start === assignment.start && shift.end === assignment.end && shift.days.includes(weekday));
    if (next && fullShift) {
      changes.push({ before, after: {
        ...assignment, shiftId: next.id, start: next.start, end: next.end,
        startsAt: day.startsAt, endsAt: day.endsAt,
      } });
    } else if (assignment.startsAt < day.startsAt || assignment.endsAt > day.endsAt) {
      issues.push({ userId: day.userId, date: day.date, assignmentId: before.id, code: "custom-hours" });
    }
  }
  return { changes, issues };
}

export function checkAssignmentRevisions(
  expected: { id: string; expectedRevision: number }[] | undefined,
  actual: { id: string; expectedRevision: number }[],
) {
  assert(Array.isArray(expected) && expected.length === actual.length, "workforce_conflict");
  const revisions = new Map(expected.map(row => [row?.id, row?.expectedRevision]));
  assert(revisions.size === actual.length && actual.every(row =>
    revisions.get(row.id) === row.expectedRevision), "workforce_conflict");
}
