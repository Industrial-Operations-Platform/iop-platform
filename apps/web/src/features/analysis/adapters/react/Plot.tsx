import { t } from "../../../../localization/i18n";
import { useEffect, useRef } from "react";
import { Panel } from "../../../../design/components";
import { useAppearance } from "../../../../design/useAppearance";
import { appearanceIdentity } from "../../../../design/identity";
import type { Report } from "../../domain/models";
import { monthlyAverages } from "../../domain/monthly-averages";
import { mountChart, number, pareto, type ChartKind } from "../echarts/charts";
export function Plot({
  kind,
  report,
  onSelect,
  title,
}: {
  kind: ChartKind;
  report: Report;
  onSelect: (key: string) => void;
  title: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof mountChart> | undefined>(undefined);
  const { resolved } = useAppearance();
  const averages = kind === "daily-overlay" || kind === "trend" ? monthlyAverages(report) : [];
  useEffect(() => {
    if (!element.current) return;
    const mounted = mountChart(element.current, appearanceIdentity(resolved));
    chart.current = mounted;
    return () => {
      mounted?.dispose();
      chart.current = undefined;
    };
  }, [resolved]);
  useEffect(() => {
    chart.current?.update(kind, report, onSelect);
  }, [kind, report, onSelect, resolved]);
  return (
    <Panel variant="chart">
      <h2>{title}</h2>
      {averages.length > 0 && (
        <div className="analysis-monthly-averages" role="note" aria-label={t("Monthly daily averages")}
          title={t("Averages use eligible imported days, including days with no matching alarms. Missing dates are excluded.")}>
          {(["frequency", "minutes"] as const).map(metric => (
            <div className="analysis-average-series" data-series={metric} key={metric}
              role="group" aria-label={t(metric === "frequency" ? "Frequency" : "Alarm minutes")}>
              <span className="analysis-average-label">
                {t(metric === "frequency" ? "Frequency" : "Alarm minutes")}
                <span>{t("Daily average")}</span>
              </span>
              <ul>
                {averages.map(average => (
                  <li key={average.month}>
                    <span>{average.month}</span>{" · "}<strong>Ø {number(average[metric])}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {(kind === "frequency" || kind === "duration") && (
        <p className="analysis-footnote">
          {pareto(report, kind).summary}
          {t(
            " Cumulative share uses all matching groups across the selected months. Solid bars include the group reaching 80%. ",
          )}
        </p>
      )}
      <div
        ref={element}
        className="analysis-plot"
        role="img"
        aria-label={title + t("; values available in the data tables below")}
      />
    </Panel>
  );
}
