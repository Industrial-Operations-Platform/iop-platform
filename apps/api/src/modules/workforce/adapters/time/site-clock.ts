import type { SiteClock } from "../../application/workforce";
import { assert, date, time } from "../../domain/workforce";
/** Resolve site wall times, rejecting missing or repeated local times explicitly. */
export class IntlSiteClock implements SiteClock {
  interval(day: string, start: string, end: string, zone: string) {
    date(day);
    time(start);
    time(end);
    assert(start !== end);
    const endDay =
      end <= start
        ? new Date(Date.parse(day) + 86400000).toISOString().slice(0, 10)
        : day;
    const startsAt = this.resolve(day, start, zone),
      endsAt = this.resolve(endDay, end, zone);
    assert(
      endsAt > startsAt &&
        Date.parse(endsAt) - Date.parse(startsAt) <= 24 * 3600000,
    );
    return { startsAt, endsAt };
  }
  private resolve(day: string, clock: string, zone: string): string {
    const nominal = Date.parse(`${day}T${clock}:00Z`);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const offsets = new Set<number>();
    const wall = (instant: number) => {
      const parts = Object.fromEntries(
        formatter.formatToParts(instant).map((p) => [p.type, p.value]),
      );
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`;
    };
    for (const delta of [-86400000, 0, 86400000])
      offsets.add(Date.parse(wall(nominal + delta)) - (nominal + delta));
    const matches = [...offsets]
      .map((offset) => nominal - offset)
      .filter((value) => wall(value) === `${day}T${clock}:00Z`);
    assert(matches.length === 1, "workforce_time_ambiguous");
    return new Date(matches[0]).toISOString();
  }
}
