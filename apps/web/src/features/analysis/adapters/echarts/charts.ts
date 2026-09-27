import { init, use, type EChartsCoreOption } from "echarts/core";
import {
  BarChart,
  LineChart,
  ScatterChart,
  HeatmapChart,
} from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  AriaComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { Report, ReportRow } from "../../domain/models";
use([
  BarChart,
  LineChart,
  ScatterChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  AriaComponent,
  SVGRenderer,
]);
export type ChartKind =
  | "frequency"
  | "duration"
  | "scatter"
  | "monthly"
  | "trend"
  | "heatmap"
  | "pareto"
  | "messages";
export const number = (n: number) =>
  new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(n);
const value = (r: ReportRow, metric: string) =>
  metric === "duration" ? r.minutes : r.frequency;
function calendar(report: Report): string[] {
  const result: string[] = [],
    date = new Date(report.selection.from + "T00:00:00Z");
  if (report.selection.period === "week")
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (report.selection.period === "month") date.setUTCDate(1);
  while (date.getTime() < Date.parse(report.selection.toExclusive)) {
    result.push(date.toISOString().slice(0, 10));
    if (report.selection.period === "month")
      date.setUTCMonth(date.getUTCMonth() + 1);
    else
      date.setUTCDate(
        date.getUTCDate() + (report.selection.period === "week" ? 7 : 1),
      );
  }
  return result;
}
export function options(kind: ChartKind, r: Report): EChartsCoreOption {
  const groupLabel = (key: string) =>
    r.selection.dimension === "duration"
      ? number(Number(key) / 60) + " min"
      : key;
  const metric = r.selection.metric,
    unit = metric === "duration" ? "Duration (minutes)" : "Frequency";
  const base: EChartsCoreOption = {
    color: ["#138df4", "#2424a5", "#f3773d", "#147e8a", "#a755ad"],
    animation: false,
    aria: { enabled: true },
    tooltip: { trigger: "axis", renderMode: "richText" },
    grid: { left: 20, right: 28, top: 42, bottom: 38, containLabel: true },
    textStyle: { fontFamily: "Inter, system-ui, sans-serif", color: "#576779" },
    legend: { type: "scroll", top: 0 },
  };
  const groups = (kind === "duration" ? r.durationGroups : r.groups).slice(
    0,
    10,
  );
  if (kind === "frequency" || kind === "duration")
    return {
      ...base,
      xAxis: {
        type: "value",
        name: kind === "duration" ? "Minutes" : "Frequency",
        nameLocation: "middle",
        nameGap: 25,
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: groups.map((x) => x.key),
        axisLabel: { width: 170, overflow: "truncate", formatter: groupLabel },
      },
      series: [
        {
          type: "bar",
          data: groups.map((x) => ({
            name: x.key,
            value: kind === "duration" ? x.minutes : x.frequency,
          })),
          itemStyle: { color: kind === "duration" ? "#164f84" : "#138df4" },
          barMaxWidth: 28,
        },
      ],
    };
  if (kind === "scatter")
    return {
      ...base,
      tooltip: { trigger: "item", renderMode: "richText" },
      xAxis: {
        type: "value",
        name: "Duration (minutes)",
        nameLocation: "middle",
        nameGap: 27,
      },
      yAxis: { type: "value", name: "Frequency" },
      series: [
        {
          type: "scatter",
          symbolSize: 12,
          data: r.groups.map((x) => ({
            name: x.key,
            value: [x.minutes, x.frequency],
          })),
        },
      ],
    };
  if (kind === "monthly" || kind === "messages") {
    const months = [...new Set(r.monthly.map((x) => x.period))].sort();
    return {
      ...base,
      xAxis: {
        type: "category",
        data: groups.map((x) => x.key),
        axisLabel: {
          rotate: 25,
          width: 100,
          overflow: "truncate",
          formatter: groupLabel,
        },
      },
      yAxis: { type: "value", name: unit },
      grid: { left: 20, right: 24, top: 42, bottom: 85, containLabel: true },
      series: months.map((month) => ({
        name: month,
        type: kind === "messages" ? "bar" : "line",
        ...(kind === "messages" ? { stack: "months" } : {}),
        connectNulls: false,
        data: groups.map((g) => {
          const p = r.monthly.find(
            (x) => x.period === month && x.key === g.key,
          );
          return p ? value(p, metric) : null;
        }),
      })),
    };
  }
  if (kind === "trend") {
    const dates = calendar(r),
      at = new Map(r.timeline.map((x) => [x.period, x]));
    return {
      ...base,
      legend: { data: ["Frequency", "Duration (minutes)"] },
      xAxis: { type: "category", data: dates },
      yAxis: [
        { type: "value", name: "Frequency" },
        { type: "value", name: "Minutes" },
      ],
      dataZoom: [{ type: "inside" }, { type: "slider", height: 14, bottom: 0 }],
      series: [
        {
          name: "Frequency",
          type: "line",
          connectNulls: false,
          data: dates.map((d) => at.get(d)?.frequency ?? null),
        },
        {
          name: "Duration (minutes)",
          type: "line",
          yAxisIndex: 1,
          connectNulls: false,
          data: dates.map((d) => at.get(d)?.minutes ?? null),
        },
      ],
    };
  }
  if (kind === "heatmap") {
    const dates = [...new Set(r.series.map((x) => x.period))].sort(),
      keys = groups.map((x) => x.key);
    const points = r.series
      .filter((x) => keys.includes(x.key))
      .map((x) => [
        dates.indexOf(x.period),
        keys.indexOf(x.key),
        value(x, metric),
      ]);
    return {
      ...base,
      tooltip: { position: "top", renderMode: "richText" },
      grid: { left: 20, right: 24, top: 15, bottom: 75, containLabel: true },
      xAxis: { type: "category", data: dates },
      yAxis: {
        type: "category",
        data: keys,
        axisLabel: { width: 165, overflow: "truncate", formatter: groupLabel },
      },
      visualMap: {
        min: 0,
        max: Math.max(1, ...points.map((x) => x[2])),
        orient: "horizontal",
        left: "center",
        bottom: 0,
        inRange: { color: ["#e8f4ff", "#0875cc"] },
      },
      series: [{ type: "heatmap", data: points }],
      dataZoom: [{ type: "inside", xAxisIndex: 0 }],
    };
  }
  let cumulative = 0;
  const total = value(r.totals, metric);
  return {
    ...base,
    xAxis: {
      type: "category",
      data: r.groups.map((x) => x.key),
      axisLabel: {
        rotate: 30,
        width: 100,
        overflow: "truncate",
        formatter: groupLabel,
      },
    },
    yAxis: [
      { type: "value", name: unit },
      { type: "value", name: "Cumulative % of total", max: 100 },
    ],
    series: [
      { type: "bar", data: r.groups.map((x) => value(x, metric)) },
      {
        type: "line",
        yAxisIndex: 1,
        data: r.groups.map((x) => {
          cumulative += value(x, metric);
          return total ? (100 * cumulative) / total : 0;
        }),
      },
    ],
  };
}
export function mountChart(
  element: HTMLElement,
  kind: ChartKind,
  report: Report,
  onSelect: (key: string) => void,
): () => void {
  const chart = init(element, undefined, { renderer: "svg" });
  chart.setOption(options(kind, report));
  chart.on("click", (params) => {
    if (
      [
        "frequency",
        "duration",
        "scatter",
        "monthly",
        "messages",
        "pareto",
      ].includes(kind) &&
      params.name
    )
      onSelect(params.name);
  });
  const observer = new ResizeObserver(() => chart.resize());
  observer.observe(element);
  return () => {
    observer.disconnect();
    chart.dispose();
  };
}
