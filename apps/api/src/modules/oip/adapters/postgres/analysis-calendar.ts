import type { AnalysisCalendar } from "../../domain/analysis-calendar";

/** Only constructor-validated ISO weekday integers enter this SQL literal. */
export function eligibleReportingDate(
  calendar: AnalysisCalendar,
  column = "reporting_date",
): string {
  return `EXTRACT(ISODOW FROM ${column})::integer <> ALL(ARRAY[${calendar.excludedWeekdays.join(",")}]::integer[])`;
}
