import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { prepareCsv, parseCsvReportingDate, CsvAdapterError, CSV_LIMITS } from '../src/modules/integrations';

const filename = 'Hitliste-20260701.csv';
const header = 'Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe';
const row = '2;0 0:01:30;Area A;=0007;Fault;01;Group';
const encode = (text: string): Buffer => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
const parse = (text: string) => prepareCsv(filename, encode(text));
function rejects(text: string, code: string, line?: number, field?: string): void {
  try { parse(text); throw new Error('Expected rejection'); }
  catch (error) {
    expect(error).toBeInstanceOf(CsvAdapterError);
    expect(error).toMatchObject({ code, ...(line === undefined ? {} : { line }), ...(field ? { field } : {}) });
    expect(error).not.toHaveProperty('records');
  }
}

afterEach(() => jest.restoreAllMocks());

describe('POC source adapter', () => {
  it('reconciles the fictional UTF-16 fixture without altering evidence or collapsing tuples', () => {
    const bytes = readFileSync(join(__dirname, 'fixtures/csv', filename));
    const original = Buffer.from(bytes);
    const result = prepareCsv(filename, bytes);
    expect(bytes.equals(original)).toBe(true);
    expect(result).toMatchObject({ reportingDate: '2026-07-01', reportingWindowStatus: 'unknown',
      dataRecordCount: 3, physicalLineCount: 5, blankLineCount: 1, repeatedRecordCount: 2,
      totalReportedFrequency: 7, totalAccumulatedAlarmSeconds: 93964 });
    expect(result.records.map(record => record.sourceRecordNumber)).toEqual([2, 4, 5]);
    expect(result.records.map(record => record.repeatedTuple)).toEqual([true, true, false]);
    expect(result.records[0]).toMatchObject({ originalDuration: ' 0 0:01:30 ', sourceArea: 'Area A',
      sourceEquipmentReference: '=0007', sourceMessageText: 'Fault; check "A"', sourceMessageType: '01' });
    expect(result.records[2].accumulatedAlarmSeconds).toBe(93784);
    expect(result).not.toHaveProperty('organizationId');
    expect(result.records[2]).not.toHaveProperty('sectorKey');
  });

  it.each(['\n', '\r\n'])('handles blanks, optional final ending and quoted headers with %j', ending => {
    const quotedHeader = header.split(';').map(value => `"${value}"`).join(';');
    for (const suffix of ['', ending]) {
      const result = parse([' \t', quotedHeader, row].join(ending) + suffix);
      expect(result.physicalLineCount).toBe(3);
      expect(result.records[0].sourceRecordNumber).toBe(3);
    }
  });

  it('preserves zero measures, non-ASCII whitespace, accents and opaque text', () => {
    const result = parse(`${header}\n0;0 0:00:00;\u00a0Ärea\u00a0;=001;  A  B\t ;Unknown;00`);
    expect(result.totalReportedFrequency).toBe(0);
    expect(result.totalAccumulatedAlarmSeconds).toBe(0);
    expect(result.records[0]).toMatchObject({ sourceArea: '\u00a0Ärea\u00a0', sourceMessageText: 'A  B', sourceMessageGroup: '00' });
  });

  it('counts every member of repeated normalized tuples including a third record', () => {
    const result = parse(`${header}\n${row}\n${row.replace('Area A', ' Area A ')}\n${row}`);
    expect(result.repeatedRecordCount).toBe(3);
    expect(result.totalReportedFrequency).toBe(6);
    expect(result.records.every(record => record.repeatedTuple)).toBe(true);
  });

  it.each(['Hitliste-00010101.csv', 'Hitliste-20000229.csv', 'Hitliste-99991231.csv'])('accepts Gregorian dates: %s', name => {
    expect(parseCsvReportingDate(name)).toBe(`${name.slice(9, 13)}-${name.slice(13, 15)}-${name.slice(15, 17)}`);
  });
  it.each(['Hitliste-00000101.csv', 'Hitliste-19000229.csv', 'Hitliste-20260229.csv', 'Hitliste-20261301.csv',
    'Hitliste-20260431.csv', 'Hitliste-20260100.csv', '../Hitliste-20260701.csv', 'C:\\Hitliste-20260701.csv',
    'Hitliste-20260701.CSV', 'Hitliste-20260701.csv\n', 'other-20260701.csv'])('rejects filename %j', name => {
    expect(() => parseCsvReportingDate(name)).toThrow(CsvAdapterError);
  });

  it.each([Buffer.from('UTF8'), Buffer.from([0xfe, 0xff, 0, 65]), Buffer.from([0xff, 0xfe, 0]),
    Buffer.from([0xff, 0xfe, 0, 0xd8]), Buffer.from([0xff, 0xfe, 0, 0xdc]), encode(`${header}\n${row}\0`)])(
    'rejects malformed or unsupported encoding %#', bytes => {
      expect(() => prepareCsv(filename, bytes)).toThrow(expect.objectContaining({ code: 'invalid-encoding' }));
    });
  it('strips only the initial BOM', () => rejects(`\ufeff${header}\n${row}`, 'invalid-header', 1));
  it.each(['', ' \t\n', header, `${header}\n\n`])('rejects empty datasets %#', text => rejects(text, 'empty-input'));
  it.each([header.replace('Dauer', 'duration'), header.replace('Dauer', 'Häufigkeit'), ` ${header}`])(
    'rejects altered headers %#', value => rejects(`${value}\n${row}`, 'invalid-header', 1));
  it.each([`${row};extra`, row.slice(0, row.lastIndexOf(';')), row.replace('Fault', 'Fa"ult'),
    row.replace('Fault', '"Fault" '), row.replace('Fault', '"Fault'), row.replace('Fault', '"Fault\ntext"'),
    `${row}\r${row}`, `"${row}"`])('rejects invalid syntax %#', value => rejects(`${header}\n${value}`, 'invalid-record', 2));
  it('rejects repeated headers as values', () => rejects(`${header}\n${header}`, 'invalid-value', 2, 'frequency'));
  it.each(['-1', '+1', '1.5', '1e3', 'NaN', '1,000', '١', ''])('rejects invalid frequency %j', value => {
    rejects(`${header}\n${row.replace(/^2/, value)}`, 'invalid-value', 2, 'frequency');
  });
  it.each(['-1 0:00:00', '0 24:00:00', '0 0:60:00', '0 0:00:60', '0 0:00:00.1', '0  0:00:00', '1:30', ''])('rejects duration %j', value => {
    rejects(`${header}\n${row.replace('0 0:01:30', value)}`, 'invalid-value', 2, 'duration');
  });
  it.each([2, 3, 4, 5, 6])('requires dimension column %i', index => {
    const cells = row.split(';'); cells[index] = ' \t';
    rejects(`${header}\n${cells.join(';')}`, 'invalid-value', 2);
  });
  it('rejects one bad row without returning a valid prefix', () => rejects(`${header}\n${row}\n${row.replace('2;', '-2;')}`, 'invalid-value', 3));

  it('uses exact arithmetic for individual values and full sums', () => {
    const maximum = Number.MAX_SAFE_INTEGER;
    expect(parse(`${header}\n${row.replace(/^2/, `000${maximum}`)}`).totalReportedFrequency).toBe(maximum);
    rejects(`${header}\n${row.replace(/^2/, '9007199254740992')}`, 'numeric-overflow', 2, 'frequency');
    rejects(`${header}\n${row.replace(/^2/, String(maximum))}\n${row}`, 'numeric-overflow', 3, 'frequency');
    const maxSeconds = 9007199254740991n;
    const duration = (value: bigint): string => `${value / 86400n} ${value % 86400n / 3600n}:${String(value % 3600n / 60n).padStart(2, '0')}:${String(value % 60n).padStart(2, '0')}`;
    const maximumRow = row.replace('0 0:01:30', duration(maxSeconds));
    expect(parse(`${header}\n${maximumRow}`).totalAccumulatedAlarmSeconds).toBe(maximum);
    rejects(`${header}\n${row.replace('0 0:01:30', duration(maxSeconds + 1n))}`, 'numeric-overflow', 2, 'duration');
    rejects(`${header}\n${maximumRow}\n${row}`, 'numeric-overflow', 3, 'duration');
  });

  it('enforces decoded field limits before trimming, including escaped quotes and surrogate pairs', () => {
    expect(parse(`${header}\n${row.replace('Fault', '😀'.repeat(2048))}`).records[0].sourceMessageText.length).toBe(4096);
    rejects(`${header}\n${row.replace('Fault', ' '.repeat(4096) + 'A')}`, 'limit-exceeded', 2, 'message');
    const quoted = `"${'""'.repeat(4096)}"`;
    expect(parse(`${header}\n${row.replace('Fault', quoted)}`).records[0].sourceMessageText.length).toBe(4096);
    rejects(`${header}\n${row.replace('Fault', `"${'""'.repeat(4097)}"`)}`, 'limit-exceeded', 2, 'message');
  });
  it('accepts a record exactly at its syntax-length bound and rejects the next code unit', () => {
    const prefix = `0;0 0:00:00;${Array(3).fill(`"${'""'.repeat(4096)}"`).join(';')};"${'""'.repeat(4000)}";`;
    const full = prefix + 'G'.repeat(CSV_LIMITS.recordCodeUnits - prefix.length);
    expect(parse(`${header}\n${full}`).dataRecordCount).toBe(1);
    rejects(`${header}\n${full}G`, 'limit-exceeded', 2);
  });
  it('bounds data records independently from blank physical lines', () => {
    const full = `${header}\n${Array(CSV_LIMITS.records).fill(row).join('\n')}`;
    expect(parse(full).dataRecordCount).toBe(CSV_LIMITS.records);
    rejects(`${full}\n${row}`, 'limit-exceeded', 20002);
    const lines = `${header}\n${row}\n${'\n'.repeat(CSV_LIMITS.lines - 2)}`;
    expect(parse(lines).physicalLineCount).toBe(CSV_LIMITS.lines);
    rejects(`${lines}\n`, 'limit-exceeded', 25001);
  });
  it('accepts exactly the byte cap and refuses the next byte before decoding', () => {
    let full = `${header}\n${row}\n`;
    let remaining = (CSV_LIMITS.bytes - 2) / 2 - full.length;
    while (remaining > 0) {
      const length = Math.min(remaining, CSV_LIMITS.recordCodeUnits + 1);
      full += ' '.repeat(length - 1) + '\n'; remaining -= length;
    }
    const bytes = encode(full);
    expect(bytes.length).toBe(CSV_LIMITS.bytes);
    expect(prepareCsv(filename, bytes).dataRecordCount).toBe(1);
    expect(() => prepareCsv(filename, Buffer.concat([bytes, Buffer.from([0])]))).toThrow(expect.objectContaining({ code: 'limit-exceeded' }));
  });
  it('rejects at the processing deadline, including expiration during scanning', () => {
    const now = jest.spyOn(performance, 'now').mockReturnValue(30000);
    expect(() => prepareCsv(filename, encode(`${header}\n${row}`), 0)).toThrow(expect.objectContaining({ code: 'processing-timeout' }));
    now.mockReturnValue(29999);
    expect(prepareCsv(filename, encode(`${header}\n${row}`), 0).dataRecordCount).toBe(1);
    now.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(30000);
    expect(() => prepareCsv(filename, encode(`${header}\n${row}`), 0)).toThrow(expect.objectContaining({ code: 'processing-timeout' }));
  });
  it('never includes input values or paths in diagnostics', () => {
    const secret = 'PRIVATE-EQUIPMENT';
    try { parse(`${header}\n${row.replace(/^2/, secret)}`); }
    catch (error) {
      expect(String(error)).not.toContain(secret);
      expect(JSON.stringify(error)).toBe(JSON.stringify({ code: 'invalid-value', line: 2, field: 'frequency', name: 'CsvAdapterError' }));
    }
  });
});
