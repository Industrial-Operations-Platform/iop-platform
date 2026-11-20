import { t } from "../../../../localization/i18n";
import { DetailFacts, MetricCard, MetricGrid, Panel } from "../../../../design/components";
import type { Report } from "../../domain/models";
import { focusedErrorAnalysis } from "../../domain/error-analysis";
import { number } from "../echarts/charts";
import { Plot } from "./Plot";
import { labels } from "./labels";

const measure = (value: number | null) => value === null ? t("Unavailable") : number(value);
const percent = (value: number | null) => value === null ? t("Unavailable") : `${number(value)}%`;

export function FocusedErrorAnalysis({ report, onSelect }: {
  report: Report;
  onSelect: (key: string) => void;
}) {
  const summary = focusedErrorAnalysis(report);
  if (!summary) return null;
  return (
    <div className="analysis-error-detail">
      <Panel>
        <h2>{t("Error details")}</h2>
        <p>{t("Matching errors in the selected dates and filters.")}</p>
        <DetailFacts items={[
          { label: t("Selected months"), value: report.selection.months?.join(", ") ??
            `${report.selection.from} – ${new Date(Date.parse(report.selection.toExclusive) - 86400000).toISOString().slice(0, 10)}` },
          ...Object.entries(report.selection.filters ?? {}).filter(([, values]) => values.length > 0)
            .map(([field, values]) => ({ label: labels[field as keyof typeof labels], value: values.join(", ") })),
        ]} />
      </Panel>
      <MetricGrid aria-label={t("Error totals")}>
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
        <MetricCard label="Matching error types" value={number(summary.errors.length)}>
          <small>{t("{0} eligible imported days", [number(summary.importedDays)])}</small>
        </MetricCard>
      </MetricGrid>
      <p className="analysis-footnote">
        {t("Daily averages include imported days without matching alarms. Missing dates are excluded.")}{" "}
        {t("Alarm time per occurrence is a ratio of source aggregates, not an individual incident duration. Accumulated alarm time is not plant downtime.")}
      </p>
      <div className="analysis-error-insights">
        <Plot kind="scatter" title={t("Duration versus frequency")}
          report={report} onSelect={onSelect} />
        <div className="analysis-error-summaries" aria-label={t("Matching error details")}>
          {summary.errors.map(error => (
            <Panel key={error.key}>
              <h3>{error.key}</h3>
              <DetailFacts items={[
                { label: t("Frequency"), value: `${number(error.frequency)} ${t("occurrences")}` },
                { label: t("Alarm minutes"), value: number(error.minutes) },
                { label: t("Daily average"), value: `${measure(error.frequencyPerDay)} ${t("occurrences/day")}` },
                { label: t("Alarm minutes per occurrence"), value: measure(error.minutesPerOccurrence) },
                { label: t("Share of total frequency"), value: percent(error.frequencyShare) },
                { label: t("Share of total alarm time"), value: percent(error.durationShare) },
              ]} />
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
