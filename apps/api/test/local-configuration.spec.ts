import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfiguration, MAX_CONFIG_BYTES, parseConfiguration, readStartupConfiguration } from '../src/configuration';

const example = () => ({
  organization: { id: 'org-demo' },
  site: { id: 'site-demo', organizationId: 'org-demo', timeZone: 'Europe/Zurich' },
  source: { id: 'source-demo', organizationId: 'org-demo', siteId: 'site-demo' },
});

describe('local configuration admission', () => {
  let directory: string;
  let path: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'iop-config-'));
    path = join(directory, 'config.json');
    writeFileSync(path, JSON.stringify(example()));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));

  it('loads explicit scope and uses only non-sensitive host defaults', () => {
    expect(readStartupConfiguration({ IOP_CONFIG_FILE: path })).toEqual({
      host: '127.0.0.1', port: 3000, local: example(),
    });
  });
  it('requires explicit container transport for wildcard binding', () => {
    expect(() => readStartupConfiguration({ IOP_CONFIG_FILE: path, HOST: '0.0.0.0' })).toThrow('HOST');
    expect(readStartupConfiguration({ IOP_CONFIG_FILE: path, HOST: '0.0.0.0', IOP_TRANSPORT: 'container' }).host).toBe('0.0.0.0');
    expect(() => readStartupConfiguration({ IOP_CONFIG_FILE: path, IOP_TRANSPORT: 'production' })).toThrow('IOP_TRANSPORT');
  });
  it.each([undefined, '', ' ', '/private-secret/missing'])('rejects absent/unreadable config without echoing input', value => {
    expect(() => loadConfiguration(value)).toThrow('Invalid configuration: IOP_CONFIG_FILE');
    try { loadConfiguration(value); } catch (error) { expect(String(error)).not.toContain('private-secret'); }
  });
  it('rejects directories, malformed JSON and invalid UTF-8', () => {
    expect(() => loadConfiguration(directory)).toThrow('IOP_CONFIG_FILE');
    for (const value of ['{"password":"private-secret"', Buffer.from([0xff])]) {
      writeFileSync(path, value);
      expect(() => loadConfiguration(path)).toThrow('IOP_CONFIG_FILE');
    }
  });
  it('accepts the byte limit and rejects one byte above it', () => {
    const json = JSON.stringify(example());
    writeFileSync(path, json.padEnd(MAX_CONFIG_BYTES, ' '));
    expect(loadConfiguration(path)).toEqual(example());
    writeFileSync(path, json.padEnd(MAX_CONFIG_BYTES + 1, ' '));
    expect(() => loadConfiguration(path)).toThrow('IOP_CONFIG_FILE');
  });
  it.each([null, [], {}, { ...example(), password: 'private-secret' }, { ...example(), source: undefined }])('rejects invalid shapes and unsupported fields', value => {
    expect(() => parseConfiguration(value)).toThrow('Invalid configuration:');
  });
  it.each(['', '*', 'a'.repeat(65), 'contains space', 'private/secret'])('rejects invalid identifiers', value => {
    const config = example(); config.source.id = value;
    expect(() => parseConfiguration(config)).toThrow('source.id');
  });
  it('accepts identifiers at both length boundaries', () => {
    for (const value of ['a', 'a'.repeat(64)]) {
      const config = example(); config.source.id = value;
      expect(parseConfiguration(config).source.id).toBe(value);
    }
  });
  it.each(['', 'Unknown/Zone', '+01:00', ' Europe/Zurich', 'PST'])('rejects unsupported time zones', value => {
    const config = example(); config.site.timeZone = value;
    expect(() => parseConfiguration(config)).toThrow('site.timeZone');
  });
  it('accepts explicit UTC without inferring a reporting window', () => {
    const config = example(); config.site.timeZone = 'UTC';
    expect(parseConfiguration(config).site.timeZone).toBe('UTC');
  });
  it('rejects cross-organization and cross-site references', () => {
    const a = example(); a.site.organizationId = 'org-foreign';
    const b = example(); b.source.organizationId = 'org-foreign';
    const c = example(); c.source.siteId = 'site-other';
    for (const config of [a, b, c]) expect(() => parseConfiguration(config)).toThrow('Invalid configuration:');
  });
  it('rejects mapping configuration before any adapter contract is delivered', () => {
    const config = example();
    expect(() => parseConfiguration({ ...config, source: { ...config.source, mappings: [] } })).toThrow('source');
  });
});
