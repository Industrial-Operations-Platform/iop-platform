import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionsWorkspace } from '../src/features/integrations/adapters/react/ConnectionsWorkspace';
import { ConnectionsApplication } from '../src/features/integrations/application/connections';
import type { ConnectionReadiness } from '../src/features/integrations/domain/models';
const connection: ConnectionReadiness = { configuration: { kind: 'wincc', label: 'WinCC', enabled: false, endpoint: '', contractVersion: '', credentialReference: '', tenantId: '', clientId: '' }, revision: 0, updatedAt: '', updatedBy: '', status: 'disabled', adapter: 'contract-ready', lastSuccessfulConnection: null, missingInputs: ['Authorized provider endpoint', 'Provider transport implementation'] };
test('readers see missing integration inputs without configuration mutation', async () => {
    const application = new ConnectionsApplication({ query: async () => ({ connections: [connection] }), save: jest.fn(), history: async () => ({ revisions: [] }) });
    render(<ConnectionsWorkspace application={application} canManage={false}/>);
    await screen.findByText('WinCC');
    expect(screen.getByText('No live provider is connected. Saved configuration does not enable a transport or replace local sign-in.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Edit configuration' })).not.toBeInTheDocument();
});

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
}
test('readiness failure has a retry and an empty response is explicit', async () => {
    const query = jest.fn().mockRejectedValueOnce(new Error('Readiness unavailable')).mockResolvedValue({ connections: [] });
    const application = new ConnectionsApplication({ query, save: jest.fn(), history: async () => ({ revisions: [] }) });
    render(<ConnectionsWorkspace application={application} canManage={false} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Readiness unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No integrations are configured.')).toBeVisible();
    expect(screen.queryByText('Loading integration readiness…')).not.toBeInTheDocument();
});
test('uncertain save retains draft metadata and the reviewed revision for retry', async () => {
    const saved = deferred<ConnectionReadiness>();
    const save = jest.fn().mockRejectedValueOnce(new Error('Save response unavailable')).mockImplementationOnce(() => saved.promise);
    const application = new ConnectionsApplication({ query: async () => ({ connections: [connection] }), save, history: async () => ({ revisions: [] }) });
    render(<ConnectionsWorkspace application={application} canManage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit configuration' }));
    fireEvent.change(screen.getByLabelText('Authorized HTTPS endpoint'), { target: { value: 'https://reviewed.invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save response unavailable');
    expect(screen.getByLabelText('Authorized HTTPS endpoint')).toHaveValue('https://reviewed.invalid');
    const retry = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(retry); fireEvent.click(retry);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0]).toEqual(save.mock.calls[1]);
    await act(async () => saved.resolve({ ...connection, revision: 1 }));
    await waitFor(() => expect(screen.queryByLabelText('Authorized HTTPS endpoint')).not.toBeInTheDocument());
});
test('history has explicit empty state and dates use the selected site time zone', async () => {
    const history = jest.fn().mockResolvedValueOnce({ revisions: [] }).mockResolvedValueOnce({ revisions: [{ ...connection, revision: 1, updatedAt: '2026-10-14T12:00:00.000Z' }] });
    const application = new ConnectionsApplication({ query: async () => ({ connections: [connection] }), save: jest.fn(), history });
    render(<ConnectionsWorkspace application={application} canManage={false} timeZone="America/Bogota" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Configuration history' }));
    expect(await screen.findByText('No configuration history recorded yet.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Configuration history' }));
    expect(await screen.findByRole('table', { name: 'Configuration revisions' })).toBeVisible();
    expect(screen.getByText(new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date('2026-10-14T12:00:00.000Z')))).toBeVisible();
});
test('late readiness and history from a previous application cannot replace current content', async () => {
    const lateHistory = deferred<{ revisions: typeof connection[] }>();
    const oldApplication = new ConnectionsApplication({ query: async () => ({ connections: [connection] }), save: jest.fn(), history: () => lateHistory.promise });
    const nextApplication = new ConnectionsApplication({ query: async () => ({ connections: [{ ...connection, configuration: { ...connection.configuration, label: 'Current source' } }] }), save: jest.fn(), history: async () => ({ revisions: [] }) });
    const view = render(<ConnectionsWorkspace application={oldApplication} canManage={false} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Configuration history' }));
    expect(screen.getByText('Loading configuration history…')).toBeVisible();
    view.rerender(<ConnectionsWorkspace application={nextApplication} canManage={false} />);
    await screen.findByText('Current source');
    await act(async () => lateHistory.resolve({ revisions: [{ ...connection, revision: 99 }] }));
    expect(screen.queryByRole('table', { name: 'Configuration revisions' })).not.toBeInTheDocument();
    expect(screen.getByText('Current source')).toBeVisible();
    const lateQuery = deferred<{ connections: ConnectionReadiness[] }>();
    const slowApplication = new ConnectionsApplication({ query: () => lateQuery.promise, save: jest.fn(), history: async () => ({ revisions: [] }) });
    view.rerender(<ConnectionsWorkspace application={slowApplication} canManage={false} />);
    view.rerender(<ConnectionsWorkspace application={nextApplication} canManage={false} />);
    await screen.findByText('Current source');
    await act(async () => lateQuery.resolve({ connections: [connection] }));
    expect(screen.queryByText('WinCC')).not.toBeInTheDocument();
    expect(screen.getByText('Current source')).toBeVisible();
});
test('administrator can prepare metadata while readiness stays pending', async () => {
    const save = jest.fn(async () => ({ ...connection, revision: 1 }));
    const application = new ConnectionsApplication({ query: async () => ({ connections: [connection] }), save, history: async () => ({ revisions: [] }) });
    render(<ConnectionsWorkspace application={application} canManage/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit configuration' }));
    fireEvent.change(screen.getByLabelText('Authorized HTTPS endpoint'), { target: { value: 'https://example.invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(0, expect.objectContaining({ endpoint: 'https://example.invalid' })));
});
