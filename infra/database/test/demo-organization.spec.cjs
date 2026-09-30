const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { parseConfiguration } = require('../../../apps/api/dist/host/configuration.js');

const fixture = resolve(__dirname, '../../../fixtures/analytical-poc');
const seedFile = resolve(fixture, 'seed.env.example');
const scope = JSON.parse(readFileSync(resolve(fixture, 'scope.json'), 'utf8'));
const references = JSON.parse(readFileSync(resolve(fixture, 'poc.example.json'), 'utf8'));
const seed = parseEnv(readFileSync(seedFile, 'utf8'));

// Real CLI inputs, not a second implementation of seed behavior.
test('demo seed inputs and validated application references match the analytical fixture', () => {
  expect(seed).toEqual({
    IOP_SEED_ORGANIZATION_ID: scope.organizationId,
    IOP_SEED_ORGANIZATION_NAME: scope.organizationName,
    IOP_SEED_SITE_ID: scope.siteId,
    IOP_SEED_SITE_NAME: scope.siteName,
    IOP_SEED_SITE_TIME_ZONE: scope.siteTimeZone,
  });
  expect(parseConfiguration(references)).toEqual({
    organization: { id: scope.organizationId },
    site: { id: scope.siteId, organizationId: scope.organizationId, timeZone: scope.siteTimeZone },
    source: { id: scope.sourceId, organizationId: scope.organizationId, siteId: scope.siteId },
  });
});

test.each([1, 2])('fictional scope is reproducible on empty database %i without runtime authority', async () => {
  const container = await new PostgreSqlContainer('postgres:17.6-bookworm')
    .withDatabase('iop_local').withUsername('iop_bootstrap')
    .withPassword('synthetic-bootstrap-password').start();
  try {
    const env = {
      PATH: process.env.PATH,
      IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(),
      IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
      IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password',
      IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password',
      IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password',
    };
    const configs = provisioningConfiguration(env);
    const cli = (command, overrides = {}) => spawnSync(process.execPath,
      [`--env-file=${seedFile}`, resolve(__dirname, '../dist/cli.js'), command],
      { env: { ...env, ...overrides }, encoding: 'utf8' });
    const success = (command, result) => {
      const output = cli(command);
      expect(output.status).toBe(0);
      expect(output.stderr).toBe('');
      expect(output.stdout).toContain(result);
    };
    const query = async (role, sql) => {
      const client = new Client(configs[role]);
      try { await client.connect(); return await client.query(sql); }
      finally { await client.end(); }
    };
    success('provision', 'provisioned');
    success('migrate', '16 applied');
    // A site cannot implicitly create its owner.
    expect(cli('seed-site').status).toBe(1);
    success('seed-organization', 'created');
    // A failed second step leaves a recoverable, unchanged organization.
    expect(cli('seed-site', { IOP_SEED_SITE_TIME_ZONE: 'Unknown/Zone' }).status).toBe(1);
    expect((await query('bootstrap', 'SELECT * FROM platform_core.sites')).rows).toEqual([]);
    success('seed-organization', 'unchanged');
    success('seed-site', 'created');
    success('seed-organization', 'unchanged');
    success('seed-site', 'unchanged');
    for (const [command, overrides] of [
      ['seed-organization', { IOP_SEED_ORGANIZATION_NAME: 'Conflicting label' }],
      ['seed-site', { IOP_SEED_SITE_NAME: 'Conflicting label' }],
      ['seed-site', { IOP_SEED_SITE_TIME_ZONE: 'UTC' }],
      ['seed-site', { IOP_SEED_ORGANIZATION_ID: 'foreign-org' }],
    ]) {
      const output = cli(command, overrides);
      expect(output.status).toBe(1);
      expect(output.stdout).toBe('');
      expect(output.stderr).not.toMatch(/Conflicting label|foreign-org|synthetic|SELECT|INSERT/);
    }
    expect((await query('bootstrap', 'SELECT * FROM platform_core.organizations')).rows)
      .toEqual([{ organization_id: scope.organizationId, display_name: scope.organizationName }]);
    expect((await query('bootstrap', 'SELECT * FROM platform_core.sites')).rows)
      .toEqual([{ site_id: scope.siteId, organization_id: scope.organizationId,
        display_name: scope.siteName, time_zone: scope.siteTimeZone }]);
    for (const table of ['users', 'organization_memberships', 'site_role_assignments']) {
      expect((await query('bootstrap', `SELECT * FROM users_rbac.${table}`)).rows).toEqual([]);
    }
    for (const table of ['organizations', 'sites']) {
      expect((await query('migrator', `SELECT * FROM platform_core.${table}`)).rows).toEqual([]);
      await expect(query('runtime', `SELECT * FROM platform_core.${table}`))
        .rejects.toMatchObject({ code: '42501' });
    }
    success('provision', 'provisioned');
    success('migrate', '0 applied');
    success('seed-organization', 'unchanged');
    success('seed-site', 'unchanged');
  } finally { await container.stop(); }
});
