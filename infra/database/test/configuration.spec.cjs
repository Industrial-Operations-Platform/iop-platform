const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { configuration, provisioningConfiguration } = require('../dist/configuration.js');

const env = {
  IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: '127.0.0.1',
  IOP_DATABASE_PORT: '5432', IOP_DATABASE_NAME: 'iop_local',
  IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password',
  IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password',
  IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password',
};

test('explicit connection uses fixed role and ignores ambient PG settings', () => {
  expect(configuration({ ...env, PGUSER: 'postgres', PGDATABASE: 'production',
    PGOPTIONS: '-c role=postgres', DATABASE_URL: 'invalid' }, 'runtime')).toMatchObject({
    database: 'iop_local', user: 'iop_runtime', ssl: false,
    options: '-c search_path=pg_catalog -c lock_timeout=5000',
  });
  expect(provisioningConfiguration(env).migrator.user).toBe('iop_migrator');
});

test.each([
  ['IOP_DATABASE_MODE', undefined], ['IOP_DATABASE_MODE', 'production'],
  ['IOP_DATABASE_HOST', undefined], ['IOP_DATABASE_HOST', 'remote.example'],
  ['IOP_DATABASE_PORT', undefined], ['IOP_DATABASE_PORT', '0'],
  ['IOP_DATABASE_PORT', '65536'], ['IOP_DATABASE_PORT', '5432x'],
  ['IOP_DATABASE_NAME', undefined], ['IOP_DATABASE_NAME', 'production'],
  ['IOP_MIGRATOR_PASSWORD', undefined], ['IOP_MIGRATOR_PASSWORD', 'short'],
  ['IOP_MIGRATOR_PASSWORD', 'x'.repeat(257)], ['IOP_MIGRATOR_PASSWORD', 'x'.repeat(20) + '\0'],
])('rejects invalid %s without echoing values', (key, value) => {
  expect(() => configuration({ ...env, [key]: value }, 'migrator')).toThrow();
});

test('provisioning requires separate passwords; migration needs only its own', () => {
  expect(() => provisioningConfiguration({ ...env, IOP_RUNTIME_PASSWORD: env.IOP_MIGRATOR_PASSWORD })).toThrow('separate');
  expect(configuration({ ...env, IOP_POSTGRES_PASSWORD: undefined, IOP_RUNTIME_PASSWORD: undefined }, 'migrator').user).toBe('iop_migrator');
});

test.each(['provision', 'migrate', 'seed-organization', 'seed-site', 'unknown'])('CLI rejects incomplete input safely: %s', (command) => {
  const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), command], {
    env: { PATH: process.env.PATH, IOP_DATABASE_NAME: 'do-not-print-this-value' }, encoding: 'utf8',
  });
  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).not.toContain('do-not-print');
  expect(result.stderr).not.toContain(' at ');
});

test('CLI rejects extra arguments and unavailable database without diagnostics', () => {
  for (const args of [['migrate', 'extra'], ['migrate']]) {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), ...args], {
      env: { PATH: process.env.PATH, ...env, IOP_DATABASE_PORT: '1' }, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).not.toMatch(/synthetic|ECONNREFUSED| at /);
  }
});

const { organizationConfiguration } = require('../dist/seed-organization.js');
const seed = { IOP_SEED_ORGANIZATION_ID: 'org-test', IOP_SEED_ORGANIZATION_NAME: 'Fictional Organization' };
test.each([undefined, '', ' ', '-org', 'a/b', 'a'.repeat(65), 'org\n'])('invalid seed ID fails safely: %p', value => {
  expect(() => organizationConfiguration({ ...seed, IOP_SEED_ORGANIZATION_ID: value })).toThrow('organization ID');
});
test.each([undefined, '', ' ', ' leading', 'trailing ', '\u00a0name', 'name\uFEFF', 'a\nname', 'a\u0085name', 'a'.repeat(201), '\ud800'])('invalid name fails safely: %p', value => {
  expect(() => organizationConfiguration({ ...seed, IOP_SEED_ORGANIZATION_NAME: value })).toThrow('display name');
});
test('seed names preserve Unicode and SQL punctuation as data', () => {
  for (const name of ["O'Brien; SELECT 1", 'Fictional Zürich', '🏭'.repeat(200)]) {
    expect(organizationConfiguration({ ...seed, IOP_SEED_ORGANIZATION_NAME: name })).toEqual({ id: 'org-test', name });
  }
});

const { siteConfiguration } = require('../dist/seed-site.js');
const site = { IOP_SEED_ORGANIZATION_ID: 'org-test', IOP_SEED_SITE_ID: 'site-test',
  IOP_SEED_SITE_NAME: 'Fictional Site', IOP_SEED_SITE_TIME_ZONE: 'Europe/Zurich' };
test.each(['IOP_SEED_ORGANIZATION_ID', 'IOP_SEED_SITE_ID'])('site rejects invalid %s', key => {
  for (const value of [undefined, '', ' ', '-id', 'a/b', 'x'.repeat(65), 'id\n']) {
    expect(() => siteConfiguration({ ...site, [key]: value })).toThrow('IDs');
  }
});
test.each([undefined, '', ' ', ' leading', 'trailing\u00a0', 'a\nb', 'a\u0085b', '\ud800', 'x'.repeat(201)])('site rejects invalid name: %p', value => {
  expect(() => siteConfiguration({ ...site, IOP_SEED_SITE_NAME: value })).toThrow('display name');
});
test.each([undefined, '', ' UTC', 'UTC\n', '+01:00', 'CET', 'Europe//Zurich', 'Unknown/Zone', 'x'.repeat(101)])('site rejects invalid zone: %p', value => {
  expect(() => siteConfiguration({ ...site, IOP_SEED_SITE_TIME_ZONE: value })).toThrow('time zone');
});
test('site preserves explicit named zones, UTC, aliases and Unicode names', () => {
  for (const timeZone of ['UTC', 'Europe/Zurich', 'US/Eastern']) {
    expect(siteConfiguration({ ...site, IOP_SEED_SITE_NAME: '🏭'.repeat(200), IOP_SEED_SITE_TIME_ZONE: timeZone }))
      .toEqual({ organizationId: 'org-test', id: 'site-test', name: '🏭'.repeat(200), timeZone });
  }
});
