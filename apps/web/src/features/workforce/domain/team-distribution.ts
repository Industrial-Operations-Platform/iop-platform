import { touchesDate } from "./leader-availability";
import { entries, type Board, type Person, type RecordEntry } from "./models";

export interface TeamDay {
  date: string;
  schedule?: RecordEntry<"schedule">;
  shiftLabel: string;
  assignments: RecordEntry<"assignment">[];
  unassigned: boolean;
}
export interface TeamMember {
  person: Person;
  technicalLevel: string;
  days: TeamDay[];
}
export interface TeamDistribution {
  id: string;
  label: string;
  members: TeamMember[];
}

/** Primary groups organize the current directory without changing planning authority. */
export function teamDistribution(board: Board, dates: readonly string[]): TeamDistribution[] {
  const people = new Map(board.people.map((person) => [person.id, person]));
  const workers = entries(board, "worker");
  const schedules = entries(board, "schedule");
  const assignments = entries(board, "assignment").sort((a, b) =>
    a.data.startsAt.localeCompare(b.data.startsAt) || a.id.localeCompare(b.id));
  return board.settings.teams.filter((team) => team.leaderId === board.actorId).map((team) => ({
    id: team.id,
    label: team.label,
    members: workers.filter((worker) => worker.data.teamId === team.id && people.has(worker.data.userId))
      .map((worker): TeamMember => {
        const person = people.get(worker.data.userId)!;
        return {
          person,
          technicalLevel: board.settings.technicalLevels?.find((level) => level.id === worker.data.technicalLevelId)?.label ?? worker.data.technicalLevelLabel ?? "",
          days: dates.map((date): TeamDay => {
            const schedule = schedules.find((entry) => entry.data.userId === person.id && entry.data.date === date);
            const allocated = assignments.filter((entry) => entry.data.userId === person.id &&
              (entry.data.date === date || touchesDate(entry.data, date, board.timeZone)));
            return {
              date,
              schedule,
              shiftLabel: schedule ? board.settings.shifts.find((shift) => shift.days.includes(new Date(date + "T12:00:00Z").getUTCDay()) && shift.start === schedule.data.start && shift.end === schedule.data.end)?.label ?? "" : "",
              assignments: allocated,
              // A previous night's duty does not allocate the new day's schedule.
              unassigned: !!schedule && ["work", "maintenance"].includes(schedule.data.status) && !allocated.some((entry) => entry.data.date === date),
            };
          }),
        };
      }).sort((a, b) => a.person.name.localeCompare(b.person.name) || a.person.id.localeCompare(b.person.id)),
  }));
}
