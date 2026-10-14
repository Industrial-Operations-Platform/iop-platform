import { formalOverviewReader, type OverviewFormalPort, type OverviewFormalRecord } from '../src/host/overview-composition';
const locations = [{ id: 'dept', label: 'Department', parentId: '', role: 'department' }, { id: 'area', label: 'Area', parentId: 'dept', role: 'area' }];
const record: OverviewFormalRecord = { id: 'current', state: 'open', departmentLabel: 'Department', areaLabel: 'Area', content: { title: 'Actual shift report', summary: 'Saved summary', departmentId: 'dept', areaId: 'area' }, shift: { id: 'shift-current', date: '2026-10-14', label: 'Early', targetId: 'area', targetLabel: 'Area', startsAt: '2026-10-14T06:00:00Z', endsAt: '2026-10-14T14:00:00Z' } };
function port(): OverviewFormalPort { return { query: jest.fn(async () => ({ records: [record], total: 51, nextCursor: 'source-cursor' })), previous: jest.fn(async () => ({ shift: { ...record.shift, id: 'shift-previous', startsAt: '2026-10-14T00:00:00Z', endsAt: '2026-10-14T08:00:00Z' }, record: null, overlaps: true, pendingTotal: 2 })) }; }
test('formal context forwards producer pagination and resolves actual previous interval only for explicit selection', async () => {
    const formal = port(), read = formalOverviewReader(formal, locations);
    const first = await read('actor', { locationId: 'area', date: '2026-10-14', recordId: '', recordCursor: 'previous-page' });
    expect(formal.query).toHaveBeenCalledWith('actor', { departmentId: 'dept', areaId: 'area', from: '2026-10-14', to: '2026-10-14', cursor: 'previous-page' });
    expect(first).toMatchObject({ total: 51, nextCursor: 'source-cursor', current: null, previous: null });
    expect(formal.previous).not.toHaveBeenCalled();
    const selected = await read('actor', { locationId: 'area', date: '2026-10-14', recordId: 'current' });
    expect(formal.previous).toHaveBeenCalledWith('actor', { id: 'current' });
    expect(selected.previous).toMatchObject({ id: '', date: '2026-10-14', summary: '2026-10-14T00:00:00Z / 2026-10-14T08:00:00Z', status: 'unrecorded' });
    expect(selected.note).toContain('overlaps');
});
test('formal context rejects fabricated record identities and producer pages beyond the bounded contract', async () => {
    const formal = port(), read = formalOverviewReader(formal, locations);
    await expect(read('actor', { locationId: 'area', date: '2026-10-14', recordId: 'foreign' })).rejects.toMatchObject({ code: 'invalid_overview' });
    expect(formal.previous).not.toHaveBeenCalled();
    (formal.query as jest.Mock).mockResolvedValue({ records: Array(51).fill(record), total: 51, nextCursor: '' });
    await expect(read('actor', { locationId: 'area', date: '2026-10-14', recordId: '' })).rejects.toMatchObject({ code: 'overview_unavailable' });
});
test('specific sublocation has no assumed Workforce target mapping', async () => {
    const formal = port(), read = formalOverviewReader(formal, [...locations, { id: 'bay', label: 'Bay', parentId: 'area', role: 'location' }]);
    expect(await read('actor', { locationId: 'bay', date: '2026-10-14', recordId: '' })).toMatchObject({ coverage: 'unmapped', options: [], previous: null });
    expect(formal.query).not.toHaveBeenCalled();
});
test('analytical adapter forwards explicit sector identity and full totals while unmapped areas do not call the source', async () => {
    const { departmentAnalyticsReader } = await import('../src/host/overview-composition');
    const query = jest.fn(async () => ({ totals: { frequency: 123, seconds: 456, records: 9 }, dates: ['2026-10-13', '2026-10-14', '2026-10-15'] }));
    const reports = { query } as unknown as import('../src/modules/oip/application/reporting').OipReports;
    const read = departmentAnalyticsReader(reports, locations.map(location => ({ ...location, sectorKey: location.id === 'dept' ? 'explicit-source-sector' : '' })));
    expect(await read('actor', { locationId: 'area', date: '2026-10-14', recordId: '' })).toMatchObject({ coverage: 'unmapped', frequency: null });
    expect(query).not.toHaveBeenCalled();
    expect(await read('actor', { locationId: 'dept', date: '2026-10-14', recordId: '' })).toMatchObject({ coverage: 'available', frequency: 123, seconds: 456, records: 9, importDates: ['2026-10-14'] });
    expect(query).toHaveBeenCalledWith('actor', expect.objectContaining({ filters: { sector: ['explicit-source-sector'] }, from: '2026-10-14', toExclusive: '2026-10-15' }));
});
