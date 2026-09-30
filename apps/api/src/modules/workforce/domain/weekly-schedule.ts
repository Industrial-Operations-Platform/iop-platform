import {
  assert,
  date,
  identifier,
  type ImportRow,
  type Schedule,
} from "./workforce";

export interface WeeklyScheduleInput {
  userId: string;
  weekStart: string;
  days: (Omit<ImportRow, "userId"> & { expectedRevision: number })[];
}

export function validateWeek(input: WeeklyScheduleInput): string {
  assert(input && typeof input === "object");
  identifier(input.userId);
  date(input.weekStart);
  assert(new Date(input.weekStart).getUTCDay() === 1);
  assert(
    Array.isArray(input.days) &&
      input.days.length > 0 &&
      input.days.length <= 7,
  );
  const end = new Date(Date.parse(input.weekStart) + 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  const seen = new Set<string>();
  for (const day of input.days) {
    assert(day && typeof day === "object");
    date(day.date);
    assert(
      day.date >= input.weekStart && day.date <= end && !seen.has(day.date),
    );
    assert(
      Number.isSafeInteger(day.expectedRevision) && day.expectedRevision >= 0,
    );
    seen.add(day.date);
  }
  return end;
}

/** Storage and transport may reorder keys. Source kind alone is not a schedule change. */
export function sameSchedule(previous: Schedule, next: Schedule): boolean {
  return (
    ["userId", "date", "status", "start", "end", "startsAt", "endsAt"] as const
  ).every((field) => previous[field] === next[field]);
}
