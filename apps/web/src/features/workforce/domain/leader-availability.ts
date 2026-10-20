import type { Assignment, Schedule } from "./models";

interface Interval { startsAt: string; endsAt: string }
const valid = (interval: Interval) => Boolean(interval.startsAt && interval.endsAt && Date.parse(interval.startsAt) < Date.parse(interval.endsAt));

/** Planned availability is independent of team membership or planning authority. */
export function leaderAvailability(
  leader: Assignment,
  own: readonly (Assignment | Schedule)[],
  now: string,
) {
  const availableNow = valid(leader) && Date.parse(leader.startsAt) <= Date.parse(now) && Date.parse(now) < Date.parse(leader.endsAt);
  const duringOwnShift = valid(leader) && own.some((interval) => valid(interval) &&
    Date.parse(interval.startsAt) < Date.parse(leader.endsAt) && Date.parse(leader.startsAt) < Date.parse(interval.endsAt));
  return { availableNow, duringOwnShift };
}

export function previousDate(date: string) {
  return new Date(Date.parse(date + "T12:00:00Z") - 86_400_000).toISOString().slice(0, 10);
}

/** End instants are exclusive, so a shift ending at midnight belongs to the previous day. */
export function touchesDate(interval: Interval, date: string, timeZone: string) {
  if (!valid(interval)) return false;
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const from = format.format(new Date(interval.startsAt));
  const to = format.format(new Date(Date.parse(interval.endsAt) - 1));
  return from <= date && date <= to;
}
