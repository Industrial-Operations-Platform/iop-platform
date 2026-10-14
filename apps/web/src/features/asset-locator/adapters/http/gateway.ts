import { LocatorApplication, type Gateway } from '../../application/locator';
import type { Context, Detail, Save, Scene, SearchResults, History } from '../../domain/models';
const messages: Record<string, string> = { invalid_locator: 'Check the scene fields, normalized coordinates and explicit asset links.', locator_denied: 'Your current profile or grants do not allow Asset Locator access.', locator_missing: 'This scene or private reference is unavailable.', locator_conflict: 'This scene changed. Reload it before saving your changes.', locator_capacity: 'The bounded scene capacity has been reached.', locator_reference_unavailable: 'The private reference files are unavailable or failed integrity validation.' };
async function request<T>(path: string, body: unknown): Promise<T> { const response = await fetch('/api/v1/locator/' + path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-IOP-Demo': '1' }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok)
  throw new Error(messages[data.code] ?? 'Asset Locator is unavailable. Sign in again or retry.'); return data; }
export class HttpLocatorGateway implements Gateway {
  context() { return request<Context>('context', {}); }
  query(input: {
    search: string;
    group: string;
  }) { return request<{
    scenes: Scene[];
    total: number;
  }>('query', input); }
  detail(id: string) { return request<Detail>('detail', { id }); }
  save(input: Save) { return request<Scene>('save', input); }
  history(id: string, before = 2147483647) { return request<History>('history', { id, before }); }
  search(input: {
    search: string;
    unplacedOnly: boolean;
  }) { return request<SearchResults>('search', input); }
  bootstrap() { return request<{
    created: number;
    referenceCount: number;
  }>('bootstrap', {}); }
}
export function createLocatorApplication() { return new LocatorApplication(new HttpLocatorGateway(), () => crypto.randomUUID()); }
export const referenceUrl = (id: string) => '/api/v1/locator/references/' + encodeURIComponent(id);
