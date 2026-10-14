import type {components} from "../../../../contracts/schema";
import { OperationalOverviewApplication, type Gateway } from '../../application/overview';
import type { SearchInput, AreaInput } from '../../domain/models';
type Schema = components["schemas"];
const messages: Record<string, string> = { invalid_overview: 'Check the selected location, date and search fields.', overview_denied: 'Your current site access does not allow operational search or overview.', overview_unavailable: 'Current site authorization is unavailable. Retry after restoring access.' };
async function request<T>(path: string, body: unknown): Promise<T> { const response = await fetch('/api/v1/overview/' + path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-IOP-Demo': '1' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok)
    throw new Error(messages[result.code] ?? 'Operational overview is unavailable. Sign in again or retry.'); return result; }
export class HttpOperationalOverviewGateway implements Gateway {
    context() { return request<Schema["OverviewContextDto"]>('context', {}); }
    search(input: SearchInput) { return request<Schema["OverviewSearchResultDto"]>('search', input); }
    area(input: AreaInput) { return request<Schema["OverviewAreaDto"]>('area', input); }
}
export function createOperationalOverviewApplication() { return new OperationalOverviewApplication(new HttpOperationalOverviewGateway()); }
