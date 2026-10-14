import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
test('administrator can prepare metadata while readiness stays pending', async () => {
    const save = jest.fn(async () => ({ ...connection, revision: 1 }));
    const application = new ConnectionsApplication({ query: async () => ({ connections: [connection] }), save, history: async () => ({ revisions: [] }) });
    render(<ConnectionsWorkspace application={application} canManage/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit configuration' }));
    fireEvent.change(screen.getByLabelText('Authorized HTTPS endpoint'), { target: { value: 'https://example.invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(0, expect.objectContaining({ endpoint: 'https://example.invalid' })));
});
