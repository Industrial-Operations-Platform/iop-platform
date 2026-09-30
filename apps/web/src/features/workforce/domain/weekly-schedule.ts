import { entries, weekDates, type Board, type Settings } from "./models";

export interface ScheduleDayDraft {
  date: string;
  status: string;
  start: string;
  end: string;
  expectedRevision: number;
}
export interface WeeklyScheduleInput {
  userId: string;
  weekStart: string;
  days: ScheduleDayDraft[];
}
export function hasWorkingHours(status: string) {
  return ["work", "training", "maintenance"].includes(status);
}
export function weekDrafts(
  board: Board,
  userId: string,
  weekStart: string,
): ScheduleDayDraft[] {
  const schedules = entries(board, "schedule").filter(
    (record) => record.data.userId === userId,
  );
  return weekDates(weekStart).map((date) => {
    const record = schedules.find((entry) => entry.data.date === date);
    return {
      date,
      status: record?.data.status ?? "",
      start: record?.data.start ?? "",
      end: record?.data.end ?? "",
      expectedRevision: record?.revision ?? 0,
    };
  });
}
export function changedDays(
  original: ScheduleDayDraft[],
  drafts: ScheduleDayDraft[],
) {
  return drafts.filter(
    (day, index) =>
      day.status &&
      (["status", "start", "end"] as const).some(
        (field) => day[field] !== original[index]?.[field],
      ),
  );
}
export function scheduleChoice(
  day: ScheduleDayDraft,
  settings: Settings,
): string {
  if (!day.status) return "";
  if (day.status !== "work") return "status:" + day.status;
  const shift = settings.shifts.find(
    (shift) =>
      shift.start === day.start &&
      shift.end === day.end &&
      shift.days.includes(new Date(day.date).getUTCDay()),
  );
  return shift ? "shift:" + shift.id : "status:work";
}
export function applyChoice(
  day: ScheduleDayDraft,
  choice: string,
  settings: Settings,
): ScheduleDayDraft {
  if (!choice) return { ...day, status: "", start: "", end: "" };
  if (choice.startsWith("shift:")) {
    const shift = settings.shifts.find(
      (shift) => "shift:" + shift.id === choice,
    );
    if (!shift || !shift.days.includes(new Date(day.date).getUTCDay()))
      return day;
    return { ...day, status: "work", start: shift.start, end: shift.end };
  }
  const status = choice.slice("status:".length);
  return {
    ...day,
    status,
    start: hasWorkingHours(status)
      ? day.start || settings.shifts[0]?.start || "08:00"
      : "",
    end: hasWorkingHours(status)
      ? day.end || settings.shifts[0]?.end || "17:00"
      : "",
  };
}
