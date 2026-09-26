import { performance } from 'node:perf_hooks';
import { validateCsv, prepareCsv, CSV_LIMITS, type CsvValidationResult,
  type Inspection } from '../src/modules/integrations';

const filename = 'Hitliste-20260701.csv';
const header = 'Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe';
const row = '2;0 0:01:30;Unknown area;=0007;Fault;01;Group';
const bad = row.replace(/^2/, '-1');
const encode = (text: string) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
const review = (...rows: string[]) => validateCsv(filename, encode([header, ...rows].join('\n')));
function rejected(result: CsvValidationResult): void {
  expect(result.status).toBe('invalid');
  expect(result).not.toHaveProperty('prepared');
  expect(result).not.toHaveProperty('records');
}

afterEach(() => jest.restoreAllMocks());

describe('POC validation report', () => {
  it('reports two valid and one invalid row without partial admission or field values', () => {
    const result = review('', row, bad, row);
    rejected(result);
    expect(result.inspection).toEqual({ dataRecordCount: 3, inspectedValidCount: 2,
      inspectedInvalidCount: 1, inspectionComplete: true, repeatedCount: 2,
      diagnostics: [{ code: 'invalid-value', line: 4, field: 'frequency' }], diagnosticsTruncated: false });
    expect(JSON.stringify(result)).not.toContain('Unknown area');
    expect(result.inspection).not.toHaveProperty('admittedRecordCount');
    expect(result.inspection).not.toHaveProperty('unclassifiedCount');
    // The scoped mapping stage must supply classification before the batch handoff.
    const handoff: Inspection = { ...result.inspection, unclassifiedCount: 2 };
    expect(handoff.inspectedValidCount).toBe(2);
  });

  it('preserves successful preparation, zeros, repeated tuples and unknown source labels', () => {
    const bytes = encode(`${header}\n${row}\n${row}\n${row.replace(/^2/, '0')}`);
    const result = validateCsv(filename, bytes);
    expect(result.status).toBe('valid');
    if (result.status !== 'valid') throw new Error('Expected valid preparation');
    expect(result.prepared).toEqual(prepareCsv(filename, bytes));
    expect(result.inspection).toEqual({ dataRecordCount: 3, inspectedValidCount: 3,
      inspectedInvalidCount: 0, inspectionComplete: true, repeatedCount: 3,
      diagnostics: [], diagnosticsTruncated: false });
    expect(result.prepared.totalReportedFrequency).toBe(4);
    expect(result.prepared.totalAccumulatedAlarmSeconds).toBe(270);
    expect(result.prepared.records[0]).not.toHaveProperty('assetId');
  });

  it.each([100, 101, CSV_LIMITS.records])('counts all %i invalid rows independently of retained diagnostics', count => {
    const result = review(...Array(count).fill(bad));
    rejected(result);
    expect(result.inspection).toMatchObject({ dataRecordCount: count, inspectedValidCount: 0,
      inspectedInvalidCount: count, inspectionComplete: true, diagnosticsTruncated: count > 100 });
    expect(result.inspection.diagnostics).toHaveLength(Math.min(count, 100));
    expect(result.inspection.diagnostics.at(-1)?.line).toBe(Math.min(count, 100) + 1);
  });

  it('counts an invalid row once even when it has several invalid cells', () => {
    const result = review(bad.replace('0 0:01:30', 'invalid'), row.replace('Fault', ' '));
    expect(result.inspection).toMatchObject({ dataRecordCount: 2, inspectedInvalidCount: 2,
      inspectedValidCount: 0, inspectionComplete: true });
    expect(result.inspection.diagnostics).toEqual([
      { code: 'invalid-value', line: 2, field: 'frequency' },
      { code: 'invalid-value', line: 3, field: 'message' },
    ]);
  });

  it.each([row + ';extra', row.replace('Fault', '"Unclosed'), row + '\r' + row])(
    'stops at structural failure without guessing remaining counts %#', malformed => {
      const result = review(row, bad, malformed, row);
      rejected(result);
      expect(result.inspection).toMatchObject({ dataRecordCount: null, inspectedValidCount: 1,
        inspectedInvalidCount: 1, inspectionComplete: false });
      expect(result.inspection.diagnostics.at(-1)).toEqual({ code: 'invalid-record', line: 4 });
    });

  it('continues after individual numeric overflow but stops after aggregate overflow', () => {
    const result = review(row.replace(/^2/, '9007199254740992'), row);
    rejected(result);
    expect(result).toMatchObject({ reason: 'numeric-overflow', inspection: { dataRecordCount: 2,
      inspectedInvalidCount: 1, inspectedValidCount: 1, inspectionComplete: true,
      diagnostics: [{ code: 'limit-exceeded', line: 2, field: 'frequency' }] } });
    const sum = review(row.replace(/^2/, String(Number.MAX_SAFE_INTEGER)), row, row);
    rejected(sum);
    expect(sum.inspection).toMatchObject({ dataRecordCount: null, inspectedValidCount: 2,
      inspectedInvalidCount: 0, inspectionComplete: false });
  });

  it.each([
    ['invalid-encoding', filename, Buffer.from('private raw content')],
    ['invalid-filename', '/private/path.csv', encode(`${header}\n${row}`)],
    ['invalid-header', filename, encode(`${header.replace('Dauer', 'private header')}\n${row}`)],
    ['limit-exceeded', filename, Buffer.alloc(CSV_LIMITS.bytes + 1)],
  ] as const)('reports safe pre-inspection failure %s', (reason, name, bytes) => {
    const result = validateCsv(name, bytes);
    rejected(result);
    expect(result).toMatchObject({ reason, inspection: { dataRecordCount: null,
      inspectedValidCount: 0, inspectedInvalidCount: 0, inspectionComplete: false } });
    expect(JSON.stringify(result)).not.toContain('private');
  });

  it('reports empty/header-only input as fully inspected zero records, never success', () => {
    for (const text of ['', header, `${header}\n\n`]) {
      const result = validateCsv(filename, encode(text));
      rejected(result);
      expect(result).toMatchObject({ reason: 'empty-input', inspection: { dataRecordCount: 0,
        inspectedValidCount: 0, inspectedInvalidCount: 0, inspectionComplete: true } });
    }
  });

  it('stops after the row and physical-line budgets, with batch-compatible line metadata', () => {
    const result = review(...Array(CSV_LIMITS.records + 1).fill(bad));
    rejected(result);
    expect(result).toHaveProperty('reason', 'limit-exceeded');
    expect(result.inspection).toMatchObject({ dataRecordCount: null, inspectedInvalidCount: 20000,
      inspectionComplete: false, diagnosticsTruncated: true });
    const lines = review(row, '\n'.repeat(CSV_LIMITS.lines));
    rejected(lines);
    expect(lines.inspection.diagnostics).toEqual([{ code: 'limit-exceeded' }]);
    expect(lines.inspection.dataRecordCount).toBeNull();
  });

  it('stops at field limits without counting the interrupted row as inspected', () => {
    const result = review(row, row.replace('Fault', 'X'.repeat(CSV_LIMITS.fieldCodeUnits + 1)));
    rejected(result);
    expect(result.inspection).toMatchObject({ dataRecordCount: null, inspectedValidCount: 1,
      inspectedInvalidCount: 0, inspectionComplete: false,
      diagnostics: [{ code: 'limit-exceeded', line: 3, field: 'message' }] });
  });

  it('preserves the shared deadline and does not turn unfinished work into complete counts', () => {
    const now = jest.spyOn(performance, 'now').mockReturnValue(30000);
    const bytes = encode(`${header}\n${row}`);
    const expired = validateCsv(filename, bytes, 0);
    rejected(expired);
    expect(expired).toMatchObject({ reason: 'processing-timeout', inspection: {
      dataRecordCount: null, inspectionComplete: false, diagnostics: [{ code: 'limit-exceeded' }] } });
    now.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0)
      .mockReturnValueOnce(0).mockReturnValue(30000);
    const interrupted = validateCsv(filename, bytes, 0);
    rejected(interrupted);
    expect(interrupted.inspection).toMatchObject({ inspectedValidCount: 1,
      dataRecordCount: null, inspectionComplete: false });
  });
});
