import type { Report, ReportRequest } from "./models";
import { eligibleImportedDates } from "./report-days";

export function selectedEquipment(selection: ReportRequest): string | undefined {
  const equipment = selection.filters?.equipment;
  return equipment?.length === 1 && equipment[0] !== "" ? equipment[0] : undefined;
}

export function needsDailyTimeline(selection: ReportRequest): boolean {
  return selection.period === "week" ||
    (selection.period === "month" && selectedEquipment(selection) !== undefined);
}

export interface EquipmentDay {
  date: string;
  frequency: number;
  minutes: number;
}

function peak(days: EquipmentDay[], metric: "frequency" | "minutes") {
  const maximum = days.reduce((max, day) => Math.max(max, day[metric]), 0);
  return maximum > 0 ? {
    value: maximum,
    dates: days.filter(day => day[metric] === maximum).map(day => day.date),
  } : null;
}

/** Describes the complete filtered server snapshot, never bounded groups or source pages. */
export function singleEquipmentAnalysis(report: Report) {
  const equipment = selectedEquipment(report.selection);
  if (equipment === undefined) return undefined;
  const dates = eligibleImportedDates(report);
  const dailyTimeline = report.selection.period === "day" ? report.timeline : report.dailyTimeline;
  const at = new Map(dailyTimeline?.map(point => [point.period, point]));
  const days: EquipmentDay[] | undefined = dailyTimeline === undefined ? undefined : dates.map(date => ({
    date,
    frequency: at.get(date)?.frequency ?? 0,
    minutes: (at.get(date)?.seconds ?? 0) / 60,
  }));
  const activeDays = days?.filter(day => day.frequency > 0 || day.minutes > 0);
  const minutes = report.totals.seconds / 60;
  return {
    equipment,
    importedDays: dates.length,
    frequency: report.totals.frequency,
    minutes,
    frequencyPerDay: dates.length ? report.totals.frequency / dates.length : null,
    minutesPerDay: dates.length ? minutes / dates.length : null,
    minutesPerOccurrence: report.totals.frequency > 0 ? minutes / report.totals.frequency : null,
    days,
    activeDays: activeDays?.length ?? null,
    lastActivity: activeDays?.at(-1)?.date ?? null,
    peakFrequency: days ? peak(days, "frequency") : null,
    peakMinutes: days ? peak(days, "minutes") : null,
    leadingMessage: report.executive.find(leader => leader.dimension === "message"),
  };
}
