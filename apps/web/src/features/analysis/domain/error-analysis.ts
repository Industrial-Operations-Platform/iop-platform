import type { Report } from "./models";
import { aggregateSummary, reportSummary } from "./report-summary";

/** The server count, rather than a truncated group list, determines the presentation. */
export function hasFewErrors(report: Report): boolean {
  return report.selection.dimension === "message" && report.groupCount >= 1 &&
    report.groupCount <= 2 && report.groups.length === report.groupCount;
}

export function focusedErrorAnalysis(report: Report) {
  if (!hasFewErrors(report)) return undefined;
  const summary = reportSummary(report);
  return {
    ...summary,
    errors: report.groups.map(error => ({
      key: error.key,
      ...aggregateSummary(error, summary.importedDays),
      frequencyShare: summary.frequency > 0 ? error.frequency / summary.frequency * 100 : null,
      durationShare: report.totals.seconds > 0 ? error.seconds / report.totals.seconds * 100 : null,
    })),
  };
}
