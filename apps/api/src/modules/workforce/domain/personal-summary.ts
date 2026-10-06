import type {
  Assignment,
  RecordEntry,
  Schedule,
  Settings,
  Worker,
} from "./workforce";
export function personalMonths(today: string) {
  const currentFrom = `${today.slice(0, 7)}-01`;
  const previous = new Date(`${currentFrom}T12:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const previousFrom = previous.toISOString().slice(0, 10);
  const previousTo = new Date(Date.parse(`${currentFrom}T12:00:00Z`) - 86400000)
    .toISOString()
    .slice(0, 10);
  return { currentFrom, previousFrom, previousTo };
}
/** Complete scoped records supply schedule facts, never attendance claims. */
export function personalSummary(
  actorId: string,
  today: string,
  records: RecordEntry[],
  settings: Settings,
) {
  const months = personalMonths(today);
  const own = records.filter(
    (r) => !r.deleted && "userId" in r.data && r.data.userId === actorId,
  );
  const worker = own.find((r) => r.kind === "worker")?.data as
    | Worker
    | undefined;
  const schedules = own
    .filter((r) => r.kind === "schedule")
    .map((r) => r.data as Schedule);
  const assignments = own
    .filter((r) => r.kind === "assignment")
    .map((r) => r.data as Assignment);
  const working = (schedule: Schedule) =>
    ["work", "training", "maintenance"].includes(schedule.status);
  const shifts = new Map<
    string,
    { id: string; label: string; count: number }
  >();
  const days = new Set(schedules.filter(working).map((s) => s.date));
  for (const assignment of assignments) days.add(assignment.date);
  for (const day of days) {
    if (day < months.previousFrom || day > months.previousTo) continue;
    const assigned = assignments.filter((a) => a.date === day);
    const schedule = schedules.find((s) => s.date === day && working(s));
    const matching = settings.shifts.find(
      (s) => s.start === schedule?.start && s.end === schedule?.end,
    );
    const dayShifts = assigned.length
      ? assigned.map((a) => ({
          id: a.shiftId,
          label:
            a.shiftLabel ||
            settings.shifts.find((s) => s.id === a.shiftId)?.label ||
            a.shiftId,
        }))
      : [
          {
            id: matching?.id ?? "other",
            label: matching?.label ?? "Other scheduled hours",
          },
        ];
    for (const shift of new Map(dayShifts.map((s) => [s.id, s])).values()) {
      const before = shifts.get(shift.id);
      shifts.set(shift.id, { ...shift, count: (before?.count ?? 0) + 1 });
    }
  }
  const shiftTotal = [...shifts.values()].reduce(
    (sum, shift) => sum + shift.count,
    0,
  );
  const currentDays = [...days].filter(
    (day) => day >= months.currentFrom && day <= today,
  );
  const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();
  return {
    actorId,
    today,
    ...months,
    homeTargetId: worker?.homeTargetId ?? "",
    homeTargetLabel:
      settings.targets.find((t) => t.id === worker?.homeTargetId)?.label ?? "",
    teamLabel:
      (
        settings.teams.find((t) => t.id === worker?.teamId) ??
        settings.teams.find((t) => t.leaderId === actorId)
      )?.label ?? "",
    scheduledDays: [...days].filter(
      (day) => day >= months.previousFrom && day <= months.previousTo,
    ).length,
    shifts: [...shifts.values()].map((shift) => ({
      ...shift,
      percentage: (shift.count / shiftTotal) * 100,
    })),
    saturdays: currentDays.filter((day) => weekday(day) === 6).length,
    sundays: currentDays.filter((day) => weekday(day) === 0).length,
  };
}
