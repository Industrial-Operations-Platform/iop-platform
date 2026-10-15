import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GlobalSearch } from '../src/features/operational-overview/adapters/react/GlobalSearch';
import { AreaOverview } from '../src/features/operational-overview/adapters/react/AreaOverview';
import { OperationalOverviewApplication, type Gateway } from '../src/features/operational-overview/application/overview';
import { IdentityRoot } from '../src/design/components';
import type { Card, Context, AreaResult } from '../src/features/operational-overview/domain/models';
const card: Card = { source: 'assets', id: 'asset-a', title: 'Exact sensor A', summary: 'Unverified registered asset', locationId: 'area', locationLabel: 'Test area', status: 'unverified', date: '2026-10-14', assetId: 'asset-a' };
const context: Context = { locations: [{ id: 'department', label: 'Test department', parentId: '', role: 'department' }, { id: 'area', label: 'Test area', parentId: 'department', role: 'area' }], timeZone: 'Europe/Zurich', today: '2026-10-14', sources: [] };
function harness() { const gateway: Gateway = { context: jest.fn(async () => context), search: jest.fn(async (input) => ({ query: input.query, locationId: input.locationId, groups: [{ source: 'assets' as const, view: 'search', coverage: 'available' as const, items: [card], total: 50, nextCursor: 'next-assets', limit: 25 }, { source: 'maintenance' as const, view: 'search', coverage: 'not-authorized' as const, items: [], total: 0, nextCursor: '', limit: 50 }] })), area: jest.fn(async (input) => ({ selection: input, location: context.locations[1], groups: [{ source: 'assets' as const, view: 'registry', coverage: 'available' as const, items: [card], total: 1, nextCursor: '', limit: 25 }], analytics: { coverage: 'not-configured' as const, from: input.date, toExclusive: '2026-10-15', frequency: null, seconds: null, records: null, importDates: [], note: 'No analytical data is supplied for this source coverage.' }, shifts: { coverage: 'not-configured' as const, options: [], current: null, previous: null, note: 'Calendar-day journal context is separate from actual Workforce shift intervals.' }, timeZone: 'Europe/Zurich' })) }; return { gateway, app: new OperationalOverviewApplication(gateway) }; }
test('global search uses accessible disclosure, bounded source cursor and exact record navigation', async () => { const h = harness(), navigate = jest.fn(); render(<IdentityRoot><GlobalSearch application={h.app} onNavigate={navigate}/></IdentityRoot>); fireEvent.click(screen.getByRole('button', { name: 'Global search' })); const input = screen.getByRole('searchbox', { name: 'Global search' }); expect(input).toHaveFocus(); fireEvent.change(input, { target: { value: 'sensor' } }); await screen.findByRole('button', { name: 'Exact sensor A' }); expect(screen.getByText('Not authorized')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Load more from this source' })); await waitFor(() => expect(h.gateway.search).toHaveBeenLastCalledWith(expect.objectContaining({ cursors: { assets: 'next-assets', handover: '', maintenance: '' } }))); fireEvent.click(screen.getByRole('button', { name: 'Exact sensor A' })); expect(navigate).toHaveBeenCalledWith({ source: 'assets', id: 'asset-a', locationId: 'area' }); expect(screen.queryByRole('region', { name: 'Global search results' })).not.toBeInTheDocument(); });
test('Escape clears results and restores the shared search trigger', async () => { const h = harness(); render(<IdentityRoot><GlobalSearch application={h.app} onNavigate={() => { }}/></IdentityRoot>); fireEvent.click(screen.getByRole('button', { name: 'Global search' })); const input = screen.getByRole('searchbox'); fireEvent.change(input, { target: { value: 'sensor' } }); await screen.findByRole('button', { name: 'Exact sensor A' }); fireEvent.keyDown(input, { key: 'Escape' }); expect(screen.queryByRole('region', { name: 'Global search results' })).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Global search' })).toHaveFocus(); });
test('area overview retains selected location/date and distinguishes journal/current/formal/analytical coverage', async () => { const h = harness(), navigate = jest.fn(); render(<IdentityRoot><AreaOverview application={h.app} initialLocationId="area" onNavigate={navigate}/></IdentityRoot>); await screen.findByRole('button', { name: 'Exact sensor A' }); expect(h.gateway.area).toHaveBeenCalledWith({ locationId: 'area', date: '2026-10-14', recordId: '', recordCursor: '' }); expect(screen.getByText(/Calendar-day journal context is separate/)).toBeInTheDocument(); expect(screen.getByText(/Pending issues and work show their current state/)).toBeInTheDocument(); const date = screen.getByLabelText('Journal date'); fireEvent.change(date, { target: { value: '2026-10-13' } }); await waitFor(() => expect(h.gateway.area).toHaveBeenLastCalledWith({ locationId: 'area', date: '2026-10-13', recordId: '', recordCursor: '' })); fireEvent.click(screen.getByRole('button', { name: 'Exact sensor A' })); expect(navigate).toHaveBeenCalledWith({ source: 'assets', id: 'asset-a', locationId: 'area' }); expect(screen.queryByText('0')).not.toBeInTheDocument(); });
test('formal pages use only source-owned cursors and selected actual record identity', async () => {
    const h = harness();
    const shift = { ...card, source: 'shift' as const, id: 'actual-record', title: 'Saved actual shift', assetId: '' };
    const base = await h.gateway.area({ locationId: 'area', date: '2026-10-14', recordId: '' });
    (h.gateway.area as jest.Mock).mockImplementation(async (input) => ({ ...base, selection: input, shifts: { coverage: 'available', options: [shift], total: 60, nextCursor: 'formal-page-two', current: input.recordId ? shift : null, previous: null, note: 'Select an actual formal record to resolve its previous shift.' } }));
    render(<IdentityRoot><AreaOverview application={h.app} initialLocationId="area" onNavigate={() => { }}/></IdentityRoot>);
    fireEvent.click(await screen.findByRole('button', { name: 'Next formal record page' }));
    await waitFor(() => expect(h.gateway.area).toHaveBeenLastCalledWith(expect.objectContaining({ recordCursor: 'formal-page-two', recordId: '' })));
    fireEvent.change(await screen.findByRole('combobox', { name: 'Explicit shift record' }), { target: { value: 'actual-record' } });
    await waitFor(() => expect(h.gateway.area).toHaveBeenLastCalledWith(expect.objectContaining({ recordCursor: 'formal-page-two', recordId: 'actual-record' })));
    expect(await screen.findByText('Selected actual shift')).toBeInTheDocument();
});

test('Area/location reuses the department compact control and retains native hierarchical selection', async () => {
    const h = harness();
    render(<IdentityRoot><AreaOverview application={h.app} initialLocationId="area" onNavigate={() => { }}/></IdentityRoot>);
    const area = await screen.findByRole('combobox', { name: 'Selected area' });
    const department = screen.getByRole('combobox', { name: 'Selected department' });
    expect(area.closest('label')).toHaveClass('iop-context-field', 'iop-department-scope');
    expect(department.closest('label')).toHaveClass('iop-context-field', 'iop-department-scope');
    expect(area).toHaveValue('area');
    expect(area).toHaveAccessibleName('Selected area');
    fireEvent.change(area, { target: { value: '' } });
    await waitFor(() => expect(h.gateway.area).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: 'department' })));
    fireEvent.change(area, { target: { value: 'area' } });
    await waitFor(() => expect(h.gateway.area).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: 'area' })));
});
