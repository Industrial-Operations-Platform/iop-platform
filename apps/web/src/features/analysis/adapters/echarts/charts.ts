import { identity, chartPalette } from "../../../../design/identity";
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
  | "area-ranking"
  | "daily-matrix"
  | "daily-overlay"
  | "frequency"
  | "duration"
  | "scatter"
  | "monthly"
  | "trend"
  | "heatmap"
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
    if (
      report.selection.period !== "day" ||
      !report.excludedWeekdays?.includes(date.getUTCDay() || 7)
    )
      result.push(date.toISOString().slice(0, 10));
    if (report.selection.period === "month")
      date.setUTCMonth(date.getUTCMonth() + 1);
    else
      date.setUTCDate(
        date.getUTCDate() + (report.selection.period === "week" ? 7 : 1),
      );
  }
  return report.selection.months
    ? result.filter((period) => {
        if (report.selection.period !== "week")
          return report.selection.months!.includes(period.slice(0, 7));
        const end = new Date(Date.parse(period) + 7 * 86400000)
          .toISOString()
          .slice(0, 10);
        return report.selection.months!.some((month) => {
          const [year, index] = month.split("-").map(Number);
          const monthEnd = new Date(Date.UTC(year, index, 1))
            .toISOString()
            .slice(0, 10);
          return period < monthEnd && end > month + "-01";
        });
      })
    : result;
}
export function options(kind: ChartKind, r: Report): EChartsCoreOption {
  const groupLabel = (key: string) =>
    r.selection.dimension === "duration"
      ? number(Number(key) / 60) + " min"
      : key;
  const metric = r.selection.metric,
    unit = metric === "duration" ? "Duration (minutes)" : "Frequency";
  const base: EChartsCoreOption = {
    color: chartPalette,
    animation: false,
    aria: { enabled: true },
    tooltip: { trigger: "axis", renderMode: "richText" },
    grid: { left: 20, right: 28, top: 42, bottom: 38, containLabel: true },
    textStyle: { fontFamily: identity.font, color: identity.chartText },
    legend: { type: "scroll", top: 0 },
  };
  if (kind === "area-ranking") {
    const rows = r.groups;
    return {
      ...base,
      grid: { left: 15, right: 38, top: 15, bottom: 35, containLabel: true },
      xAxis: {
        type: "value",
        name: "Frequency",
        nameLocation: "middle",
        nameGap: 25,
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: rows.map((x) => x.key),
        axisLabel: { width: 150, overflow: "truncate" },
      },
      dataZoom: [
        {
          type: "slider",
          yAxisIndex: 0,
          right: 0,
          width: 12,
          startValue: 0,
          endValue: Math.max(0, Math.min(14, rows.length - 1)),
          filterMode: "empty",
        },
      ],
      series: [
        {
          type: "bar",
          barMaxWidth: 25,
          itemStyle: { color: identity.chartFrequency },
          data: rows.map((x) => ({ name: x.key, value: x.frequency })),
        },
      ],
    };
  }
  if (kind === "daily-matrix") {
    const dates = calendar(r),
      keys = r.groups.map((x) => x.key),
      coverage = new Set(r.dates);
    const at = new Map(
      r.series.map((x) => [JSON.stringify([x.key, x.period]), x.frequency]),
    );
    const points = keys.flatMap((key, row) =>
      dates.flatMap((day, column) =>
        coverage.has(day)
          ? [[column, row, at.get(JSON.stringify([key, day])) ?? 0]]
          : [],
      ),
    );
    return {
      ...base,
      tooltip: {
        position: "top",
        renderMode: "richText",
        formatter: (point: { value: number[] }) => {
          const [column, row, frequency] = point.value;
          return `${keys[row]}\n${dates[column]}\nFrequency: ${number(frequency)}`;
        },
      },
      grid: { left: 15, right: 38, top: 35, bottom: 70, containLabel: true },
      xAxis: {
        type: "category",
        position: "top",
        data: dates,
        axisLabel: {
          formatter: (date: string) => String(Number(date.slice(8))),
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: keys,
        axisLabel: { width: 145, overflow: "truncate" },
      },
      visualMap: {
        min: 0,
        max: Math.max(1, ...points.map((x) => x[2])),
        orient: "horizontal",
        left: "center",
        bottom: 0,
        inRange: { color: [identity.heatmapLow, identity.heatmapHigh] },
      },
      dataZoom: [
        {
          type: "slider",
          yAxisIndex: 0,
          right: 0,
          width: 12,
          startValue: 0,
          endValue: Math.max(0, Math.min(14, keys.length - 1)),
          filterMode: "empty",
        },
        { type: "inside", xAxisIndex: 0 },
      ],
      series: [{ type: "heatmap", data: points }],
    };
  }
  if (kind === "daily-overlay") {
    const dates = calendar(r),
      at = new Map(r.timeline.map((x) => [x.period, x])),
      coverage = new Set(r.dates);
    return {
      ...base,
      legend: { type: "scroll", top: 0, data: ["Frequency", "Alarm minutes"] },
      grid: { left: 15, right: 15, top: 65, bottom: 40, containLabel: true },
      xAxis: {
        type: "category",
        data: dates,
        name: "Day",
        nameLocation: "middle",
        nameGap: 25,
        axisLabel: {
          formatter: (date: string) => String(Number(date.slice(8))),
        },
      },
      yAxis: [
        { type: "value", name: "Frequency" },
        { type: "value", name: "Alarm minutes", splitLine: { show: false } },
      ],
      series: [
        {
          name: "Frequency",
          type: "line",
          connectNulls: false,
          showSymbol: true,
          symbolSize: 4,
          itemStyle: { color: identity.chartFrequency },
          areaStyle: { opacity: 0.16 },
          data: dates.map((d) =>
            coverage.has(d) ? (at.get(d)?.frequency ?? 0) : null,
          ),
        },
        {
          name: "Alarm minutes",
          type: "line",
          yAxisIndex: 1,
          connectNulls: false,
          showSymbol: true,
          symbolSize: 4,
          itemStyle: { color: identity.chartComparison },
          areaStyle: { opacity: 0.16 },
          data: dates.map((d) =>
            coverage.has(d) ? (at.get(d)?.minutes ?? 0) : null,
          ),
        },
      ],
    };
  }
  const groups = (kind === "duration" ? r.durationGroups : r.groups).slice(
    0,
    10,
  );
  if (kind === "frequency" || kind === "duration") {
    const barMetric = kind === "duration" ? "duration" : metric;
    return {
      ...base,
      xAxis: {
        type: "value",
        name: barMetric === "duration" ? "Minutes" : "Frequency",
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
            value: value(x, barMetric),
          })),
          itemStyle: {
            color:
              barMetric === "duration"
                ? identity.chartDuration
                : identity.chartFrequency,
          },
          barMaxWidth: 28,
        },
      ],
    };
  }
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
    const months = [
      ...new Set(r.selection.months ?? r.monthly.map((x) => x.period)),
    ].sort();
    const colors = months.map(
      (_, index) =>
        chartPalette[index] ?? `hsl(${(index * 137.508) % 360}, 65%, 42%)`,
    );
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
      legend: { type: "scroll", top: 0, data: months },
      series: months.map((month, index) => ({
        itemStyle: { color: colors[index] },
        lineStyle: { color: colors[index] },
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
      legend: {
        type: "scroll",
        top: 0,
        data: ["Frequency", "Duration (minutes)"],
      },
      grid: { left: 20, right: 28, top: 52, bottom: 78, containLabel: true },
      xAxis: { type: "category", data: dates },
      yAxis: [
        { type: "value", name: "Frequency" },
        { type: "value", name: "Minutes" },
      ],
      dataZoom: [
        { type: "inside" },
        { type: "slider", height: 24, bottom: 16 },
      ],
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
        inRange: { color: [identity.heatmapLow, identity.heatmapHigh] },
      },
      series: [{ type: "heatmap", data: points }],
      dataZoom: [{ type: "inside", xAxisIndex: 0 }],
    };
  }
  throw new Error("Unsupported analysis chart");
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
    if (kind === "daily-matrix" && Array.isArray(params.value)) {
      const group = report.groups[Number(params.value[1])];
      if (group) onSelect(group.key);
      return;
    }
    if (
      [
        "area-ranking",
        "frequency",
        "duration",
        "scatter",
        "monthly",
        "messages",
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
