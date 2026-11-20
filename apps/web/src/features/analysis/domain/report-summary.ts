import type { Report, ReportRow } from "./models";
import { eligibleImportedDates } from "./report-days";

/** Aggregate ratios describe source totals, not individual incident durations. */
export function aggregateSummary(totals: ReportRow, importedDays: number) {
  const minutes = totals.seconds / 60;
  return {
    frequency: totals.frequency,
    minutes,
    importedDays,
    frequencyPerDay: importedDays > 0 ? totals.frequency / importedDays : null,
    minutesPerDay: importedDays > 0 ? minutes / importedDays : null,
    minutesPerOccurrence: totals.frequency > 0 ? minutes / totals.frequency : null,
  };
}

export function reportSummary(report: Report) {
  return aggregateSummary(report.totals, eligibleImportedDates(report).length);
}
