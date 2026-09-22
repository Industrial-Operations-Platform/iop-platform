import type { operations } from './schema';

type HealthResponse = operations['getProcessHealth']['responses'][200]['content']['application/json'];

export async function getHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/health', { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('Health request failed');
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null || !('status' in body) || body.status !== 'ok') {
    throw new Error('Invalid health response');
  }
  return { status: body.status };
}
