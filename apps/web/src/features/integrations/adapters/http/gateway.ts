import type { ConnectionGateway } from '../../application/connections';
import type { ConnectionConfiguration, IntegrationKind } from '../../domain/models';
import type { components } from '../../../../contracts/schema';
type Schemas = components['schemas'];
async function request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch('/api/v1/integrations/' + path, { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-IOP-Demo': '1' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.code === 'integration_conflict' ? 'Configuration changed. Reload before saving.' :
            data.code === 'integration_denied' ? 'You do not have integration configuration access.' : 'Integration readiness is unavailable.');
    return data;
}
export class HttpConnectionsGateway implements ConnectionGateway {
    query() { return request<Schemas['ConnectionsDto']>('query', {}); }
    save(expectedRevision: number, configuration: ConnectionConfiguration) { return request<Schemas['ConnectionReadinessDto']>('save', { expectedRevision, configuration }); }
    history(kind: IntegrationKind) { return request<Schemas['ConnectionHistoryDto']>('history', { kind }); }
}
