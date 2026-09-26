import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SourceMappings, SourceMappingError, prepareCsv, CSV_LIMITS, type ImportSource } from '../src/modules/integrations';

const source: ImportSource = { organizationId: 'demo', siteId: 'site-a', sourceId: 'csv',
  mappingRevision: 'r1', profileRevision: 'p1', adapterRevision: 'hitliste-poc-v1', siteTimeZone: 'Europe/Zurich' };
const config = () => ({ organizationId: source.organizationId, siteId: source.siteId, sourceId: source.sourceId,
  mappingRevision: 'r1', sectors: [{ sectorKey: 'sector-a', label: 'Sector A' }],
  areas: [{ sourceArea: ' \tArea A\t ', sectorKey: 'sector-a' }] });
const fixture = () => prepareCsv('Hitliste-20260701.csv', readFileSync(join(__dirname, 'fixtures/csv/Hitliste-20260701.csv')));
const parseAreas = (areas: string[]) => prepareCsv('Hitliste-20260701.csv', Buffer.concat([Buffer.from([0xff, 0xfe]),
  Buffer.from(['Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe',
    ...areas.map(area => `1;0 0:00:02;${area};=001;Fault;01;Group`)].join('\n'), 'utf16le')]));

it('reconciles actual byte-fixture records, including repeats and the unclassified group', () => {
  const prepared = fixture();
  const result = new SourceMappings(config()).classify(source, prepared);
  expect(result).toMatchObject({ totalReportedFrequency: 7, totalAccumulatedAlarmSeconds: 93964,
    dataRecordCount: 3, unclassifiedCount: 1, repeatedRecordCount: 2, reportingWindowStatus: 'unknown' });
  expect(result.records.map(row => [row.sourceRecordNumber, row.classificationStatus, row.sectorKey]))
    .toEqual([[2, 'mapped', 'sector-a'], [4, 'mapped', 'sector-a'], [5, 'unclassified', null]]);
  result.records.forEach((row, index) => expect(row).toMatchObject(prepared.records[index]));
  const mapped = result.records.filter(row => row.classificationStatus === 'mapped');
  expect(mapped.reduce((sum, row) => sum + row.reportedFrequency, 0)).toBe(4);
  expect(mapped.reduce((sum, row) => sum + row.accumulatedAlarmSeconds, 0)).toBe(180);
  expect(result.records[2]).toMatchObject({ reportedFrequency: 3, accumulatedAlarmSeconds: 93784 });
  expect(prepared.records[0]).not.toHaveProperty('sectorKey');
});

it('supports five configured fictional sectors without encoding their number in the implementation', () => {
  const sectors = Array.from({ length: 5 }, (_, i) => ({ sectorKey: `s${i}`, label: `Sector ${i}` }));
  const areas = sectors.map(({ sectorKey }, i) => ({ sourceArea: `Area ${i}`, sectorKey }));
  const result = new SourceMappings({ ...config(), sectors, areas }).classify(source, parseAreas(areas.map(a => a.sourceArea)));
  expect(result.records.map(row => row.sectorKey)).toEqual(sectors.map(s => s.sectorKey));
  expect(result.unclassifiedCount).toBe(0);
});

it('uses ASCII outer trim only and exact comparison for case, punctuation, accents and internal whitespace', () => {
  const labels = ['Area A', ' Area A\t', 'area a', 'Area  A', 'Area-A', 'Área A', '\u00a0Area A\u00a0', 'Area A2'];
  const result = new SourceMappings(config()).classify(source, parseAreas(labels));
  expect(result.records.map(row => row.classificationStatus)).toEqual(['mapped', 'mapped', ...Array(6).fill('unclassified')]);
  expect(result.totalReportedFrequency).toBe(8);
  expect(result.unclassifiedCount).toBe(6);
});

it.each(['organizationId', 'siteId', 'sourceId'] as const)('rejects absent/foreign %s even if the area matches', key => {
  const mappings = new SourceMappings(config());
  for (const value of ['elsewhere', '', undefined]) {
    expect(() => mappings.classify({ ...source, [key]: value } as ImportSource, fixture()))
      .toThrow(expect.objectContaining({ code: 'scope-mismatch' }));
  }
  const independent = new SourceMappings({ ...config(), [key]: 'elsewhere',
    sectors: [{ sectorKey: 'other', label: 'Other' }], areas: [{ sourceArea: 'Area A', sectorKey: 'other' }] });
  expect(independent.classify({ ...source, [key]: 'elsewhere' }, fixture()).records[0].sectorKey).toBe('other');
});

it.each(['r2', '', undefined])('requires the exact receipt mapping revision %s', mappingRevision => {
  expect(() => new SourceMappings(config()).classify({ ...source, mappingRevision } as ImportSource, fixture()))
    .toThrow(expect.objectContaining({ code: 'revision-mismatch' }));
});

it.each(['sector-a', 'sector-b'])('rejects duplicate normalized areas regardless of assignment %s', sectorKey => {
  const input = config();
  input.sectors.push({ sectorKey: 'sector-b', label: 'Sector B' });
  input.areas.push({ sourceArea: 'Area A', sectorKey });
  expect(() => new SourceMappings(input)).toThrow(expect.objectContaining({ code: 'duplicate-area' }));
});

it.each([null, {}, { ...config(), organizationId: '' }, { ...config(), mappingRevision: ' ' },
  { ...config(), sectors: [{ sectorKey: 'x', label: '' }] },
  { ...config(), sectors: [...config().sectors, ...config().sectors] },
  { ...config(), areas: [{ sourceArea: 'A', sectorKey: 'unknown' }] },
  { ...config(), areas: [{ sourceArea: '\t ', sectorKey: 'sector-a' }] },
  { ...config(), areas: [{ sourceArea: 'A\nB', sectorKey: 'sector-a' }] },
  { ...config(), areas: [{ sourceArea: 'a'.repeat(CSV_LIMITS.fieldCodeUnits + 1), sectorKey: 'sector-a' }] },
])('rejects invalid configuration with a value-free error (case %#)', input => {
  expect(() => new SourceMappings(input)).toThrow(new SourceMappingError('invalid-configuration'));
});

it('accepts empty mappings as explicitly all-unclassified', () => {
  const result = new SourceMappings({ ...config(), sectors: [], areas: [] }).classify(source, fixture());
  expect(result.unclassifiedCount).toBe(3);
  expect(result.records.every(row => row.sectorKey === null)).toBe(true);
  expect(result.totalReportedFrequency).toBe(7);
});

it('preserves prototype-like area labels as ordinary data', () => {
  const input = { ...config(), areas: [{ sourceArea: '__proto__', sectorKey: 'sector-a' }] };
  expect(new SourceMappings(input).classify(source, parseAreas(['__proto__', 'constructor'])).unclassifiedCount).toBe(1);
});

it('bounds configuration counts and field lengths at and above their ceilings', () => {
  const sectors = Array.from({ length: CSV_LIMITS.records }, (_, i) => ({ sectorKey: `s${i}`, label: 'S' }));
  const areas = sectors.map(({ sectorKey }, i) => ({ sourceArea: `A${i}`, sectorKey }));
  expect(() => new SourceMappings({ ...config(), sectors, areas })).not.toThrow();
  expect(() => new SourceMappings({ ...config(), sectors: [...sectors, { sectorKey: 'extra', label: 'S' }], areas }))
    .toThrow(SourceMappingError);
  expect(() => new SourceMappings({ ...config(), sectors, areas: [...areas, { sourceArea: 'extra', sectorKey: 's0' }] }))
    .toThrow(SourceMappingError);
  expect(() => new SourceMappings({ ...config(), areas: [{ sourceArea: 'a'.repeat(CSV_LIMITS.fieldCodeUnits), sectorKey: 'sector-a' }] }))
    .not.toThrow();
});

it('freezes copied configuration and records across later revisions and display renames', () => {
  const input = config(), prepared = fixture();
  const old = new SourceMappings(input);
  const first = old.classify(source, prepared);
  input.mappingRevision = 'r2';
  input.sectors[0].label = 'Renamed sector';
  input.areas = [{ sourceArea: 'Area B', sectorKey: 'sector-a' }];
  const second = new SourceMappings(input).classify({ ...source, mappingRevision: 'r2' }, fixture());
  expect(first.mapping.mappingRevision).toBe('r1');
  expect(first.mapping.sectors[0].label).toBe('Sector A');
  expect(first.records[0].sectorKey).toBe('sector-a');
  expect(second.records[0].sectorKey).toBeNull();
  expect(second.mapping.sectors[0]).toEqual({ sectorKey: 'sector-a', label: 'Renamed sector' });
  for (const value of [old, old.configuration, old.configuration.sectors, old.configuration.sectors[0],
    old.configuration.areas, old.configuration.areas[0], first, first.records, first.records[0]]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
  (prepared.records[0] as { sourceArea: string }).sourceArea = 'Changed';
  expect(first.records[0].sourceArea).toBe('Area A');
});

it('rejects invalid areas instead of treating a missing value as unclassified', () => {
  const prepared = fixture();
  expect(() => new SourceMappings(config()).classify(source, { ...prepared,
    records: [{ ...prepared.records[0], sourceArea: ' \t' }] }))
    .toThrow(expect.objectContaining({ code: 'invalid-area' }));
});
