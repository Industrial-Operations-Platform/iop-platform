import { t } from "../../../../localization/i18n";
import {
  DetailFacts, Disclosure, MetricCard, MetricGrid, Panel, Table, TableViewport,
} from "../../../../design/components";
import type { Report } from "../../domain/models";
import { singleEquipmentAnalysis } from "../../domain/single-equipment";
import { number } from "../echarts/charts";
import { Plot } from "./Plot";
import { labels } from "./labels";

const noSelection = () => {};
const measure = (value: number | null) => value === null ? t("Unavailable") : number(value);

function peakDescription(peak: { value: number; dates: string[] } | null, unit: string) {
  if (!peak) return t("No activity recorded");
  return `${number(peak.value)} ${t(unit)} · ${peak.dates[0]}` +
    (peak.dates.length > 1 ? t(" · {0} days tied", [number(peak.dates.length)]) : "");
}

export function SingleEquipmentAnalysis({ report }: { report: Report }) {
  const summary = singleEquipmentAnalysis(report);
  if (!summary) return null;
  const message = summary.leadingMessage;
  return (
    <div className="analysis-equipment-detail">
      <Panel>
        <h2>{t("Equipment detail")} · {summary.equipment}</h2>
        <DetailFacts items={[
          { label: t("Selected months"), value: report.selection.months?.join(", ") ??
            `${report.selection.from} – ${new Date(Date.parse(report.selection.toExclusive) - 86400000).toISOString().slice(0, 10)}` },
          ...Object.entries(report.selection.filters ?? {})
            .filter(([field, values]) => field !== "equipment" && values.length > 0)
            .map(([field, values]) => ({ label: labels[field as keyof typeof labels], value: values.join(", ") })),
        ]} />
        <p className="analysis-footnote">
          {t("All figures describe this equipment within the selected dates and filters.")}
        </p>
      </Panel>
      <MetricGrid aria-label={t("Equipment totals")}>
        <MetricCard label="Total frequency" value={number(summary.frequency)}>
          <small>{t("occurrences")}</small>
          <p className="iop-metric-description">{measure(summary.frequencyPerDay)} {t("occurrences/day")}</p>
        </MetricCard>
        <MetricCard label="Accumulated alarm minutes" value={number(summary.minutes)}>
          <small>{t("alarm minutes")}</small>
          <p className="iop-metric-description">{measure(summary.minutesPerDay)} {t("alarm minutes/day")}</p>
        </MetricCard>
        <MetricCard label="Alarm minutes per occurrence" value={measure(summary.minutesPerOccurrence)}>
          <small>{t("Total alarm minutes / total frequency")}</small>
        </MetricCard>
        <MetricCard label="Days with activity" value={summary.activeDays === null ? t("Unavailable") :
          `${number(summary.activeDays)} / ${number(summary.importedDays)}`}>
          <small>{t("{0} eligible imported days", [number(summary.importedDays)])}</small>
        </MetricCard>
      </MetricGrid>
      <p className="analysis-footnote">
        {t("Daily averages include imported days without matching alarms. Missing dates are excluded.")}{" "}
        {t("Alarm time per occurrence is a ratio of source aggregates, not an individual incident duration. Accumulated alarm time is not plant downtime.")}
      </p>
      {report.totals.records === 0 ? (
        <Panel variant="empty">
          <h2>{t("No matching records")}</h2>
          <p>{t("Adjust the dates or dimension filters.")}</p>
        </Panel>
      ) : (
        <div className="analysis-equipment-insights">
          <Plot kind="trend" title={t("Frequency and duration over time")}
            report={report} onSelect={noSelection} />
          <Panel>
            <h2>{t("Activity highlights")}</h2>
            {summary.days ? (
              <DetailFacts items={[
                { label: t("Peak daily frequency"), value: peakDescription(summary.peakFrequency, "occurrences") },
                { label: t("Peak daily alarm time"), value: peakDescription(summary.peakMinutes, "alarm minutes") },
                { label: t("Last reported activity"), value: summary.lastActivity ?? t("No activity recorded") },
                ...(message ? [{ label: t("Most frequent message"), value:
                  <>{message.key}<br />{number(message.frequency)} {t("occurrences")}
                    {summary.frequency > 0 && <> · {number(message.frequency / summary.frequency * 100)}%</>}</> }] : []),
              ]} />
            ) : <p>{t("Daily activity is unavailable for this snapshot.")}</p>}
          </Panel>
        </div>
      )}
      {summary.days && (
        <Disclosure className="analysis-data" variant="panel" summary={t("Explore data · daily equipment activity")}>
          <TableViewport>
            <Table>
              <caption>{t("Daily equipment activity")}</caption>
              <thead><tr>
                <th scope="col" data-align="text">{t("Date")}</th>
                <th scope="col" data-align="number">{t("Frequency")}</th>
                <th scope="col" data-align="number">{t("Minutes")}</th>
              </tr></thead>
              <tbody>{summary.days.map(day => (
                <tr key={day.date}>
                  <th scope="row" data-align="text">{day.date}</th>
                  <td data-align="number">{number(day.frequency)}</td>
                  <td data-align="number">{number(day.minutes)}</td>
                </tr>
              ))}</tbody>
            </Table>
          </TableViewport>
        </Disclosure>
      )}
    </div>
  );
}
