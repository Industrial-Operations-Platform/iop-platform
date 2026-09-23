import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs';
import { readHost, readPort } from './application';

export const MAX_CONFIG_BYTES = 16 * 1024;

export class ConfigurationError extends Error {
  constructor(field: string) {
    super(`Invalid configuration: ${field}.`);
  }
}

export interface LocalConfiguration {
  organization: { id: string };
  site: { id: string; organizationId: string; timeZone: string };
  source: { id: string; organizationId: string; siteId: string };
}

function object(value: unknown, keys: string[], field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ConfigurationError(field);
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || keys.some(key => !Object.hasOwn(record, key))) {
    throw new ConfigurationError(field);
  }
  return record;
}

function id(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)) {
    throw new ConfigurationError(field);
  }
  return value;
}

export function parseConfiguration(value: unknown): LocalConfiguration {
  const root = object(value, ['organization', 'site', 'source'], 'document');
  const organization = object(root.organization, ['id'], 'organization');
  const site = object(root.site, ['id', 'organizationId', 'timeZone'], 'site');
  const source = object(root.source, ['id', 'organizationId', 'siteId'], 'source');
  const organizationId = id(organization.id, 'organization.id');
  const siteId = id(site.id, 'site.id');
  const sourceId = id(source.id, 'source.id');
  if (site.organizationId !== organizationId) throw new ConfigurationError('site.organizationId');
  if (source.organizationId !== organizationId) throw new ConfigurationError('source.organizationId');
  if (source.siteId !== siteId) throw new ConfigurationError('source.siteId');
  const timeZone = site.timeZone;
  if (typeof timeZone !== 'string' || timeZone.length > 100 ||
      !/^(UTC|[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+)$/.test(timeZone)) {
    throw new ConfigurationError('site.timeZone');
  }
  try { new Intl.DateTimeFormat('en', { timeZone }); }
  catch { throw new ConfigurationError('site.timeZone'); }
  return {
    organization: { id: organizationId },
    site: { id: siteId, organizationId, timeZone },
    source: { id: sourceId, organizationId, siteId },
  };
}

export function loadConfiguration(path: string | undefined): LocalConfiguration {
  if (!path || !path.trim()) throw new ConfigurationError('IOP_CONFIG_FILE');
  let descriptor: number | undefined;
  let value: unknown;
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK);
    if (!fstatSync(descriptor).isFile()) throw new Error();
    const buffer = Buffer.alloc(MAX_CONFIG_BYTES + 1);
    let size = 0;
    while (size < buffer.length) {
      const count = readSync(descriptor, buffer, size, buffer.length - size, null);
      if (count === 0) break;
      size += count;
    }
    if (size > MAX_CONFIG_BYTES) throw new Error();
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, size)));
  } catch {
    throw new ConfigurationError('IOP_CONFIG_FILE (readable UTF-8 JSON, maximum 16384 bytes)');
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
  return parseConfiguration(value);
}

export function readStartupConfiguration(env: NodeJS.ProcessEnv) {
  // This is a transport choice only, never an execution identity or permission.
  const transport = env.IOP_TRANSPORT ?? 'native';
  if (transport !== 'native' && transport !== 'container') throw new ConfigurationError('IOP_TRANSPORT');
  let host: string;
  let port: number;
  try { host = readHost(env.HOST); } catch { throw new ConfigurationError('HOST'); }
  try { port = readPort(env.PORT); } catch { throw new ConfigurationError('PORT'); }
  if (host === '0.0.0.0' && transport !== 'container') throw new ConfigurationError('HOST');
  return { host, port, local: loadConfiguration(env.IOP_CONFIG_FILE) };
}
