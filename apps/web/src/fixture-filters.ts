// Fictional UI preview only. Production semantics and validation belong to OIP.
export const dimensions = ['sectors', 'areas', 'equipment', 'messages', 'excludedMessages'] as const;
export type Dimension = typeof dimensions[number];
export type Selection = { from: string; through: string } & Record<Dimension, string[]>;
export const options: Record<Dimension, readonly (readonly [string, string])[]> = {
  sectors: [['north', 'North'], ['named', 'Unclassified (mapped label)'], ['unmapped', 'Unclassified (no mapping)']],
  areas: [['a', 'Area A'], ['b', 'Area B'], ['c', 'Area C']],
  equipment: [['a-pump', 'Pump · Area A'], ['b-pump', 'Pump · Area B'], ['c-fan', 'Fan · Area C']],
  messages: [['stop', 'Stopped · Alarm · Operations'], ['check', 'Check · Warning · Inspection']],
  excludedMessages: [['stop', 'Stopped · Alarm · Operations'], ['check', 'Check · Warning · Inspection']],
};
export const labels: Record<Dimension, string> = {
  sectors: 'Sectors', areas: 'Areas', equipment: 'Source equipment', messages: 'Included messages', excludedMessages: 'Excluded messages',
};
export const admittedDates = ['2026-06-26', '2026-06-28'];
export const initialSelection = (): Selection => ({ from: '2026-06-28', through: '2026-06-28', sectors: [], areas: [], equipment: [], messages: [], excludedMessages: [] });
export const records = [
  { id: 'line-1', importId: 'preview-import-26', rawId: 'preview-raw-26', filename: 'Demo-20260626.csv', physicalLine: 2, date: '2026-06-26', sectors: 'north', areas: 'a', equipment: 'a-pump', messages: 'stop', frequency: 2, seconds: 60 },
  { id: 'line-2', importId: 'preview-import-28', rawId: 'preview-raw-28', filename: 'Demo-20260628.csv', physicalLine: 2, date: '2026-06-28', sectors: 'north', areas: 'a', equipment: 'a-pump', messages: 'stop', frequency: 3, seconds: 120 },
  { id: 'line-3', importId: 'preview-import-28', rawId: 'preview-raw-28', filename: 'Demo-20260628.csv', physicalLine: 3, date: '2026-06-28', sectors: 'unmapped', areas: 'b', equipment: 'b-pump', messages: 'check', frequency: 4, seconds: 90000 },
  { id: 'line-4', importId: 'preview-import-28', rawId: 'preview-raw-28', filename: 'Demo-20260628.csv', physicalLine: 4, date: '2026-06-28', sectors: 'named', areas: 'c', equipment: 'c-fan', messages: 'stop', frequency: 0, seconds: 0 },
  { id: 'line-5', importId: 'preview-import-28', rawId: 'preview-raw-28', filename: 'Demo-20260628.csv', physicalLine: 5, date: '2026-06-28', sectors: 'north', areas: 'a', equipment: 'a-pump', messages: 'stop', frequency: 1, seconds: 20 },
];
// UTC is used only for Gregorian calendar arithmetic, never source-window inference.
export function calendarDay(label: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(label) || label < '0001-01-01') return NaN;
  const value = Date.parse(`${label}T00:00:00.000Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === label ? value / 86400000 : NaN;
}
export function validate(selection: Selection): string | null {
  const from = calendarDay(selection.from), through = calendarDay(selection.through);
  if (!Number.isFinite(from) || !Number.isFinite(through)) return 'Enter valid reporting dates in YYYY-MM-DD format.';
  if (through < from || through - from >= 366 || selection.through === '9999-12-31') return 'Choose 1–366 reporting dates, with Through on or after From and before 9999-12-31.';
  for (const dimension of dimensions) {
    if (selection[dimension].some(value => !options[dimension].some(([id]) => id === value))) return 'Choose available fixture options.';
  }
  if (selection.messages.some(value => selection.excludedMessages.includes(value))) return 'A message cannot be both included and excluded. Correct the selection.';
  return null;
}
export function canonical(selection: Selection): Selection {
  return { ...selection, ...Object.fromEntries(dimensions.map(key => [key, [...new Set(selection[key])].sort()])) };
}
export function preview(selection: Selection) {
  const error = validate(selection);
  if (error) throw new Error(error);
  const dates = Array.from({ length: calendarDay(selection.through) - calendarDay(selection.from) + 1 }, (_, offset) =>
    new Date((calendarDay(selection.from) + offset) * 86400000).toISOString().slice(0, 10));
  const matching = records.filter(row => row.date >= selection.from && row.date <= selection.through &&
    dimensions.filter(key => key !== 'excludedMessages').every(key => !selection[key].length || selection[key].includes(row[key as Exclude<Dimension, 'excludedMessages'>])) &&
    !selection.excludedMessages.includes(row.messages));
  return {
    matching,
    frequency: matching.reduce((sum, row) => sum + row.frequency, 0),
    seconds: matching.reduce((sum, row) => sum + row.seconds, 0),
    admitted: dates.filter(date => admittedDates.includes(date)),
    missing: dates.filter(date => !admittedDates.includes(date)),
    toExclusive: new Date((calendarDay(selection.through) + 1) * 86400000).toISOString().slice(0, 10),
  };
}
export const optionLabel = (dimension: Dimension, id: string) => options[dimension].find(([value]) => value === id)![1];
