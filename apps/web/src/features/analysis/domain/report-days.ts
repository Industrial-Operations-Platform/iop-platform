import type { Report } from "./models";

/** Imported coverage is independent of matching rows; missing imports never become zeros. */
export function eligibleImportedDates(report: Report): string[] {
  return [...new Set(report.dates.filter(date =>
    date >= report.selection.from && date < report.selection.toExclusive &&
    (!report.selection.months || report.selection.months.includes(date.slice(0, 7))) &&
    !report.excludedWeekdays?.includes(new Date(`${date}T00:00:00Z`).getUTCDay() || 7),
  ))].sort();
}
