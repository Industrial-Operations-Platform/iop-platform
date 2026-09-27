export function AnalysisCalendarNotice({
  excludedWeekdays = [],
}: {
  excludedWeekdays?: number[];
}) {
  if (!excludedWeekdays.length) return null;
  const weekdays = [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return (
    <p className="analysis-footnote">
      Excluded from analysis:{" "}
      {excludedWeekdays.map((day) => weekdays[day]).join(", ")}. Totals, charts
      and KPI averages use eligible reporting dates. Original files remain
      available in administration.
    </p>
  );
}
