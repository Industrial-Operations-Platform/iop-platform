import { t } from "../../../../localization/i18n";
import { useEffect, useRef } from "react";
import { Panel } from "../../../../design/components";
import type { Report } from "../../domain/models";
import { mountChart, pareto, type ChartKind } from "../echarts/charts";
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
  useEffect(() => {
    if (element.current)
      return mountChart(element.current, kind, report, onSelect);
  }, [kind, report, onSelect]);
  return (
    <Panel variant="chart">
      <h2>{title}</h2>
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
