import { calendarDay, initialSelection, preview, validate } from '../src/fixture-filters';

it('uses Gregorian labels and inclusive dates without local-zone arithmetic', () => {
  expect(Number.isFinite(calendarDay('2024-02-29'))).toBe(true);
  for (const date of ['2026-02-29', '2026-04-31', '2026-1-01', '2026-01-01T00:00:00Z', '0000-01-01']) expect(calendarDay(date)).toBeNaN();
  for (const [from, through, end] of [['2024-02-29', '2024-02-29', '2024-03-01'], ['2026-12-31', '2026-12-31', '2027-01-01'], ['2026-03-29', '2026-03-29', '2026-03-30']]) {
    expect(preview({ ...initialSelection(), from, through }).toExclusive).toBe(end);
  }
  expect(validate({ ...initialSelection(), from: '2026-06-29' })).not.toBeNull();
  expect(validate({ ...initialSelection(), from: '2024-01-01', through: '2024-12-31' })).toBeNull();
  expect(validate({ ...initialSelection(), from: '2024-01-01', through: '2025-01-01' })).not.toBeNull();
});

it('retains repeated and unclassified rows, intersects groups and removes exclusions', () => {
  expect(preview(initialSelection())).toMatchObject({ frequency: 8, seconds: 90140, matching: expect.any(Array) });
  expect(preview(initialSelection()).matching).toHaveLength(4);
  expect(preview({ ...initialSelection(), sectors: ['north', 'unmapped'], areas: ['a'] })).toMatchObject({ frequency: 4, seconds: 140 });
  expect(preview({ ...initialSelection(), excludedMessages: ['stop'] })).toMatchObject({ frequency: 4, seconds: 90000 });
  expect(preview({ ...initialSelection(), sectors: ['named'] })).toMatchObject({ frequency: 0, seconds: 0, matching: [expect.objectContaining({ id: 'line-4' })] });
  expect(preview({ ...initialSelection(), sectors: ['unmapped'] })).toMatchObject({ frequency: 4, seconds: 90000 });
  expect(preview({ ...initialSelection(), equipment: ['a-pump'] })).toMatchObject({ frequency: 4, seconds: 140 });
  expect(preview({ ...initialSelection(), equipment: ['b-pump'] })).toMatchObject({ frequency: 4, seconds: 90000 });
  expect(validate({ ...initialSelection(), messages: ['stop'], excludedMessages: ['stop'] })).toMatch(/both included and excluded/);
  expect(() => preview({ ...initialSelection(), areas: ['foreign'] })).toThrow(/available/);
});

it('measures date availability before filtering and keeps missing dates explicit', () => {
  const range = { ...initialSelection(), from: '2026-06-26' };
  expect(preview(range)).toMatchObject({ frequency: 10, seconds: 90200, admitted: ['2026-06-26', '2026-06-28'], missing: ['2026-06-27'] });
  expect(preview({ ...range, sectors: ['north'], areas: ['b'] })).toMatchObject({ frequency: 0, matching: [], admitted: ['2026-06-26', '2026-06-28'], missing: ['2026-06-27'] });
  expect(preview({ ...initialSelection(), from: '2026-06-27', through: '2026-06-27' })).toMatchObject({ admitted: [], missing: ['2026-06-27'] });
});
