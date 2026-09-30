import { t, locale } from "../../../../localization/i18n";
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
  MarkLineComponent,
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
  MarkLineComponent,
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
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(n);
const value = (r: ReportRow, metric: string) =>
  metric === "duration" ? r.minutes : r.frequency;
export function pareto(report: Report, metric: "frequency" | "duration") {
  const rows = (
    metric === "frequency" ? report.frequencyGroups : report.durationGroups
  ).slice(0, 10);
  const measure = (row: ReportRow) =>
    metric === "duration" ? row.seconds : row.frequency;
  const total = measure(report.totals);
  let accumulated = 0;
  const points = rows.map((row) => {
    const inLeadingShare = total > 0 && accumulated < total * 0.8;
    accumulated += measure(row);
    return {
      row,
      inLeadingShare,
      percent: total > 0 ? (accumulated / total) * 100 : 0,
    };
  });
  const coverage = points.at(-1)?.percent ?? 0;
  const crossing = points.findIndex((point) => point.percent >= 80);
  const summary =
    total === 0
      ? "No accumulated value; the 80% share is undefined."
      : crossing >= 0
        ? `The first ${crossing + 1} groups contribute ${number(points[crossing].percent)}% of the total (80% threshold).`
        : `Top ${rows.length} covers ${number(coverage)}% of the total; reaching 80% requires additional groups.`;
  return { points, summary };
}

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
        name: t("Frequency"),
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
        name: t("Day"),
        nameLocation: "middle",
        nameGap: 25,
        axisLabel: {
          formatter: (date: string) => String(Number(date.slice(8))),
        },
      },
      yAxis: [
        { type: "value", name: t("Frequency") },
        { type: "value", name: t("Alarm minutes"), splitLine: { show: false } },
      ],
      series: [
        {
          name: t("Frequency"),
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
          name: t("Alarm minutes"),
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
  const groups = (kind === "heatmap" ? r.frequencyGroups : r.groups).slice(
    0,
    10,
  );
  if (kind === "frequency" || kind === "duration") {
    const barMetric = kind === "duration" ? "duration" : "frequency";
    const { points } = pareto(r, barMetric);
    const color =
      barMetric === "duration"
        ? identity.chartDuration
        : identity.chartFrequency;
    return {
      ...base,
      grid: { left: 20, right: 35, top: 85, bottom: 45, containLabel: true },
      tooltip: { trigger: "item", renderMode: "richText" },
      legend: { top: 0, data: ["Total", "Cumulative %"] },
      xAxis: [
        {
          type: "value",
          name: barMetric === "duration" ? "Minutes" : "Frequency",
          nameLocation: "middle",
          nameGap: 28,
        },
        {
          type: "value",
          min: 0,
          max: 100,
          position: "top",
          axisLabel: { formatter: "{value}%" },
          splitLine: { show: false },
        },
      ],
      yAxis: {
        type: "category",
        inverse: true,
        data: points.map(({ row }) => row.key),
        axisLabel: { width: 170, overflow: "truncate", formatter: groupLabel },
      },
      series: [
        {
          name: t("Total"),
          type: "bar",
          data: points.map(({ row, inLeadingShare }) => ({
            name: row.key,
            value: value(row, barMetric),
            itemStyle: { opacity: inLeadingShare ? 1 : 0.4 },
          })),
          itemStyle: { color },
          barMaxWidth: 28,
        },
        {
          name: t("Cumulative %"),
          type: "line",
          xAxisIndex: 1,
          data: points.map(({ row, percent }) => ({
            name: row.key,
            value: [percent, row.key],
          })),
          encode: { x: 0, y: 1, tooltip: [0] },
          tooltip: {
            valueFormatter: (value: unknown) => `${number(Number(value))}%`,
          },
          itemStyle: { color: identity.chartAccent },
          lineStyle: { color: identity.chartAccent },
          symbolSize: 7,
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ xAxis: 80 }],
            label: { formatter: "80%", position: "insideEndTop" },
            lineStyle: { color: identity.chartComparison, type: "dashed" },
          },
        },
      ],
    };
  }
  if (kind === "scatter") {
    const keys = r.groups.map((row) => row.key).sort();
    return {
      ...base,
      tooltip: { trigger: "item", renderMode: "richText" },
      xAxis: {
        type: "value",
        name: t("Duration (minutes)"),
        nameLocation: "middle",
        nameGap: 27,
      },
      yAxis: { type: "value", name: t("Frequency") },
      series: [
        {
          type: "scatter",
          symbolSize: 12,
          data: r.groups.map((x) => ({
            name: x.key,
            value: [x.minutes, x.frequency],
            itemStyle: {
              color: `hsl(${(keys.indexOf(x.key) * 137.508) % 360}, 65%, 42%)`,
            },
          })),
        },
      ],
    };
  }
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
        type: "line",
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
        { type: "value", name: t("Frequency") },
        { type: "value", name: t("Minutes") },
      ],
      dataZoom: [
        { type: "inside" },
        { type: "slider", height: 24, bottom: 16 },
      ],
      series: [
        {
          name: t("Frequency"),
          type: "line",
          connectNulls: false,
          data: dates.map((d) => at.get(d)?.frequency ?? null),
        },
        {
          name: t("Duration (minutes)"),
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
        inverse: true,
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
