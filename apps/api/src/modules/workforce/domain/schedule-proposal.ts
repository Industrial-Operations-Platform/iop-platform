import { assert, range, type Person, type Schedule, type Settings } from "./workforce";
import { validateWeek, type WeeklyScheduleInput } from "./weekly-schedule";

export interface ScheduleProposal {
  weeks: WeeklyScheduleInput[];
}
export interface ScheduleProposalPreview extends ScheduleProposal {
  from: string;
  to: string;
}
export function validateProposal(input: ScheduleProposal) {
  assert(input && Array.isArray(input.weeks) &&
    input.weeks.length > 0 && input.weeks.length <= 100);
  const users = new Set<string>();
  for (const week of input.weeks) {
    validateWeek(week);
    assert(!users.has(week.userId) && week.weekStart === input.weeks[0].weekStart);
    users.add(week.userId);
  }
}
export function validatePreview(input: ScheduleProposalPreview) {
  validateProposal(input);
  range(input.from, input.to);
  const end = validateWeek(input.weeks[0]);
  assert(input.from <= input.weeks[0].weekStart && input.to >= end);
}
export interface ScheduleLoad {
  days: number;
  minutes: number;
  saturdays: number;
  sundays: number;
  unknownDays: number;
  shifts: { id: string; label: string; count: number }[];
}
function load(
  schedules: Schedule[], settings: Settings, periodDays: number,
): ScheduleLoad {
  const working = schedules.filter((day) =>
    ["work", "training", "maintenance"].includes(day.status),
  );
  const shifts = settings.shifts.map((shift) => ({
    id: shift.id, label: shift.label, count: 0,
  }));
  const other = { id: "", label: "Other scheduled hours", count: 0 };
  for (const day of working) {
    const index = settings.shifts.findIndex((shift) =>
      shift.start === day.start && shift.end === day.end &&
      shift.days.includes(new Date(day.date).getUTCDay()),
    );
    (index < 0 ? other : shifts[index]).count++;
  }
  return {
    days: working.length,
    minutes: working.reduce((sum, day) =>
      sum + (Date.parse(day.endsAt) - Date.parse(day.startsAt)) / 60000, 0,
    ),
    saturdays: working.filter((day) => new Date(day.date).getUTCDay() === 6).length,
    sundays: working.filter((day) => new Date(day.date).getUTCDay() === 0).length,
    unknownDays: periodDays - schedules.length,
    shifts: [...shifts, other],
  };
}
/** Count personal availability once per start date; duties never multiply hours. */
export function compareScheduleLoads(
  people: Person[], before: Schedule[], proposed: Schedule[],
  settings: Settings, from: string, to: string,
) {
  const replacements = new Map(proposed.map((day) => [`${day.userId}_${day.date}`, day]));
  const after = before.map((day) => replacements.get(`${day.userId}_${day.date}`) ?? day);
  const existing = new Set(before.map((day) => `${day.userId}_${day.date}`));
  after.push(...proposed.filter((day) => !existing.has(`${day.userId}_${day.date}`)));
  const periodDays = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
  return people.map((person) => ({
    userId: person.id,
    name: person.name,
    before: load(before.filter((day) => day.userId === person.id), settings, periodDays),
    after: load(after.filter((day) => day.userId === person.id), settings, periodDays),
  }));
}
