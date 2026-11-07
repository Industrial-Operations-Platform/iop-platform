import type { Report } from "./models";

export interface MonthlyAverage {
  month: string;
  days: number;
  frequency: number;
  minutes: number;
}

/** Full filtered timeline totals, divided by eligible imported days, never by row count.
 * Weekly buckets can cross months, so they require the matching daily timeline.
 */
export function monthlyAverages(report: Report): MonthlyAverage[] {
  const daily = report.selection.period === "day" || report.dailyTimeline !== undefined;
  if (!daily && report.selection.period !== "month") return [];
  const dates = new Set(report.dates.filter(date =>
    date >= report.selection.from && date < report.selection.toExclusive &&
    (!report.selection.months || report.selection.months.includes(date.slice(0, 7))) &&
    !report.excludedWeekdays?.includes(new Date(`${date}T00:00:00Z`).getUTCDay() || 7),
  ));
  const months = new Map<string, MonthlyAverage>();
  for (const date of dates) {
    const month = date.slice(0, 7);
    const entry = months.get(month) ?? { month, days: 0, frequency: 0, minutes: 0 };
    entry.days++;
    months.set(month, entry);
  }
  for (const point of report.dailyTimeline ?? report.timeline) {
    if (daily && !dates.has(point.period)) continue;
    const entry = months.get(point.period.slice(0, 7));
    if (entry) {
      entry.frequency += point.frequency;
      entry.minutes += point.minutes;
    }
  }
  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).map(entry => ({
    ...entry, frequency: entry.frequency / entry.days, minutes: entry.minutes / entry.days,
  }));
}
