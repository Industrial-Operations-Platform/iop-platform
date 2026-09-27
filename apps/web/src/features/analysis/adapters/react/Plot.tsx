import { useEffect, useRef } from "react";
import { Panel } from "../../../../design/components";
import type { Report } from "../../domain/models";
import { mountChart, type ChartKind } from "../echarts/charts";
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
      <div
        ref={element}
        className="analysis-plot"
        role="img"
        aria-label={title + "; values available in the data tables below"}
      />
    </Panel>
  );
}
