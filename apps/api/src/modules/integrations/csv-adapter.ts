import { performance } from 'node:perf_hooks';
import { TextDecoder } from 'node:util';

/** Fixed maxima from the accepted POC preservation contract; not upload admission. */
export const CSV_LIMITS = Object.freeze({
  bytes: 5_242_880, records: 20_000, lines: 25_000,
  fieldCodeUnits: 4_096, recordCodeUnits: 32_768, processingMs: 30_000,
});
export const CSV_ADAPTER_REVISION = 'hitliste-poc-v1';
const header = ['Häufigkeit', 'Dauer', 'Bereich', 'Betriebsmittelkennzeichen',
  'Meldetext', 'Typ', 'Meldegruppe'];
const fields = ['frequency', 'duration', 'area', 'equipment', 'message', 'type', 'group'] as const;
type Field = typeof fields[number];
type Code = 'invalid-filename' | 'invalid-encoding' | 'invalid-header' | 'invalid-record' |
  'invalid-value' | 'empty-input' | 'limit-exceeded' | 'processing-timeout' | 'numeric-overflow';

/** One fixed, value-free diagnostic. Failure never exposes a partially parsed dataset. */
export class CsvAdapterError extends Error {
  constructor(readonly code: Code, readonly line?: number, readonly field?: Field) {
    super(`CSV preparation failed: ${code}.`);
    this.name = 'CsvAdapterError';
  }
}
export interface CsvSourceRecord {
  readonly sourceRecordNumber: number;
  readonly reportedFrequency: number;
  readonly accumulatedAlarmSeconds: number;
  readonly originalDuration: string;
  readonly sourceArea: string;
  readonly sourceEquipmentReference: string;
  readonly sourceMessageText: string;
  readonly sourceMessageType: string;
  readonly sourceMessageGroup: string;
  readonly repeatedTuple: boolean;
}
export interface PreparedCsv {
  readonly adapterRevision: string;
  readonly reportingDate: string;
  readonly reportingWindowStatus: 'unknown';
  readonly records: readonly CsvSourceRecord[];
  readonly dataRecordCount: number;
  readonly physicalLineCount: number;
  readonly blankLineCount: number;
  /** All records participating in a repeated tuple, including its first record. */
  readonly repeatedRecordCount: number;
  readonly totalReportedFrequency: number;
  readonly totalAccumulatedAlarmSeconds: number;
}

export function parseCsvReportingDate(filename: string): string {
  const match = typeof filename === 'string' && /^Hitliste-([0-9]{4})([0-9]{2})([0-9]{2})\.csv$/.exec(filename);
  if (!match) throw new CsvAdapterError('invalid-filename');
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
    throw new CsvAdapterError('invalid-filename');
  }
  return `${yearText}-${monthText}-${dayText}`;
}

const trim = (value: string): string => value.replace(/^[ \t]+|[ \t]+$/g, '');
const maxInteger = BigInt(Number.MAX_SAFE_INTEGER);
function exact(value: bigint, line: number, field: Field): number {
  if (value > maxInteger) throw new CsvAdapterError('numeric-overflow', line, field);
  return Number(value);
}

/** A bounded single-line state machine; multiline CSV is outside this source profile. */
function cellsFromLine(record: string, line: number): string[] {
  const cells: string[] = [];
  let cell = '', state: 'start' | 'plain' | 'quoted' | 'closed' = 'start';
  const append = (character: string): void => {
    if (cell.length >= CSV_LIMITS.fieldCodeUnits) throw new CsvAdapterError('limit-exceeded', line, fields[cells.length]);
    cell += character;
  };
  for (let i = 0; i < record.length; i++) {
    const character = record[i];
    if (state === 'quoted') {
      if (character === '"') {
        if (record[i + 1] === '"') { append('"'); i++; }
        else state = 'closed';
      } else append(character);
    } else if (character === ';') {
      cells.push(cell);
      if (cells.length >= 7) throw new CsvAdapterError('invalid-record', line);
      cell = ''; state = 'start';
    } else if (state === 'closed') {
      throw new CsvAdapterError('invalid-record', line);
    } else if (character === '"') {
      if (state !== 'start') throw new CsvAdapterError('invalid-record', line);
      state = 'quoted';
    } else { append(character); state = 'plain'; }
  }
  if (state === 'quoted') throw new CsvAdapterError('invalid-record', line);
  cells.push(cell);
  if (cells.length !== 7) throw new CsvAdapterError('invalid-record', line);
  return cells;
}

/**
 * Pure preparation, not authorization or analytical admission. The caller owns
 * immutable scoped RAW receipt, mapping, publication and the shared processing
 * deadline. Passing an earlier start includes preceding validation in the budget.
 */
export function prepareCsv(filename: string, bytes: Buffer, startedAt = performance.now()): PreparedCsv {
  const checkTime = (): void => {
    const now = performance.now();
    if (!Number.isFinite(startedAt) || startedAt > now || now - startedAt >= CSV_LIMITS.processingMs) {
      throw new CsvAdapterError('processing-timeout');
    }
  };
  checkTime();
  const reportingDate = parseCsvReportingDate(filename);
  if (!Buffer.isBuffer(bytes) || bytes.length > CSV_LIMITS.bytes) throw new CsvAdapterError('limit-exceeded');
  if (bytes.length < 2 || bytes.length % 2 || bytes[0] !== 0xff || bytes[1] !== 0xfe) {
    throw new CsvAdapterError('invalid-encoding');
  }
  let text: string;
  try {
    // Remove exactly the required BOM. Preserve any subsequent BOM as source text.
    text = new TextDecoder('utf-16le', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(2));
  } catch { throw new CsvAdapterError('invalid-encoding'); }
  if (text.includes('\0')) throw new CsvAdapterError('invalid-encoding');
  checkTime();
  const records: CsvSourceRecord[] = [];
  const firstByTuple = new Map<string, number>();
  let physicalLineCount = 0, blankLineCount = 0, repeatedRecordCount = 0;
  let totalFrequency = 0n, totalSeconds = 0n, headerSeen = false;
  // Scan line lengths before slicing; the decoded input is itself byte bounded.
  for (let start = 0; start < text.length;) {
    checkTime();
    const line = ++physicalLineCount;
    if (line > CSV_LIMITS.lines) throw new CsvAdapterError('limit-exceeded', line);
    let end = start;
    while (end < text.length && text[end] !== '\r' && text[end] !== '\n') {
      if (end - start >= CSV_LIMITS.recordCodeUnits) throw new CsvAdapterError('limit-exceeded', line);
      end++;
    }
    if (text[end] === '\r' && text[end + 1] !== '\n') throw new CsvAdapterError('invalid-record', line);
    const record = text.slice(start, end);
    start = end + (text[end] === '\r' ? 2 : 1);
    if (/^[ \t]*$/.test(record)) { blankLineCount++; continue; }
    const cells = cellsFromLine(record, line);
    if (!headerSeen) {
      if (cells.some((cell, index) => cell !== header[index])) throw new CsvAdapterError('invalid-header', line);
      headerSeen = true; continue;
    }
    if (records.length >= CSV_LIMITS.records) throw new CsvAdapterError('limit-exceeded', line);
    const values = cells.map(trim);
    values.forEach((value, index) => {
      if (value.length === 0) throw new CsvAdapterError('invalid-value', line, fields[index]);
    });
    const [frequency, duration, sourceArea, sourceEquipmentReference, sourceMessageText, sourceMessageType, sourceMessageGroup] = values;
    if (!/^[0-9]+$/.test(frequency)) throw new CsvAdapterError('invalid-value', line, 'frequency');
    const durationParts = /^([0-9]+) ([0-9]{1,2}):([0-9]{2}):([0-9]{2})$/.exec(duration);
    if (!durationParts || Number(durationParts[2]) > 23 || Number(durationParts[3]) > 59 || Number(durationParts[4]) > 59) {
      throw new CsvAdapterError('invalid-value', line, 'duration');
    }
    const frequencyInteger = BigInt(frequency);
    const seconds = BigInt(durationParts[1]) * 86400n + BigInt(durationParts[2]) * 3600n +
      BigInt(durationParts[3]) * 60n + BigInt(durationParts[4]);
    const reportedFrequency = exact(frequencyInteger, line, 'frequency');
    const accumulatedAlarmSeconds = exact(seconds, line, 'duration');
    totalFrequency += frequencyInteger; totalSeconds += seconds;
    exact(totalFrequency, line, 'frequency'); exact(totalSeconds, line, 'duration');
    const tuple = JSON.stringify(values.slice(2));
    const first = firstByTuple.get(tuple);
    if (first !== undefined) {
      if (!records[first].repeatedTuple) {
        records[first] = { ...records[first], repeatedTuple: true };
        repeatedRecordCount++;
      }
      repeatedRecordCount++;
    } else firstByTuple.set(tuple, records.length);
    records.push({ sourceRecordNumber: line, reportedFrequency, accumulatedAlarmSeconds,
      originalDuration: cells[1], sourceArea, sourceEquipmentReference, sourceMessageText,
      sourceMessageType, sourceMessageGroup, repeatedTuple: first !== undefined });
  }
  if (records.length === 0) throw new CsvAdapterError('empty-input');
  checkTime();
  return { adapterRevision: CSV_ADAPTER_REVISION, reportingDate, reportingWindowStatus: 'unknown',
    records, dataRecordCount: records.length, physicalLineCount, blankLineCount, repeatedRecordCount,
    totalReportedFrequency: Number(totalFrequency), totalAccumulatedAlarmSeconds: Number(totalSeconds) };
}
