const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client, Pool } = require('pg');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { seedOrganization } = require('../dist/seed-organization.js');
const { seedSite } = require('../dist/seed-site.js');
const { seedUser } = require('../dist/seed-user.js');
const { seedMembership } = require('../dist/seed-membership.js');
const { runSiteOperation, SiteAccessDeniedError, AuthorizationUnavailableError } =
  require('../../../apps/api/dist/persistence/site-operation.js');
let container, configs, env, pool;
const request = (site = 'site-a', organizationId = 'org-a', permissions = ['analytics.read']) =>
  ({ userId: 'user', organizationId, siteId: site, permissions });
async function withClient(role, action) {
  const client = new Client(configs[role]);
  try { await client.connect(); return await action(client); }
  finally { await client.end(); }
}
const admin = (sql, values) => withClient('bootstrap', c => c.query(sql, values));
const lookup = (c, user = 'user', org = 'org-a', site = 'site-a') => c.query(`SELECT
  set_config('iop.lookup_user_id', $1, true), set_config('iop.lookup_organization_id', $2, true),
  set_config('iop.lookup_site_id', $3, true)`, [user, org, site]);
const readProbe = tx => tx.query('SELECT site_id FROM platform_core.authorization_probe ORDER BY site_id').then(r => r.rows);

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local')
    .withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  env = { IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
    IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password', IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password',
    IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password' };
  configs = provisioningConfiguration(env);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(20);
  await provision(configs);
  await seedUser({ ...env, IOP_SEED_USER_ID: 'user' });
  await seedUser({ ...env, IOP_SEED_USER_ID: 'no-membership' });
  for (const org of ['org-a', 'org-b']) {
    await seedOrganization({ ...env, IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_ORGANIZATION_NAME: 'Fictional Organization' });
  }
  for (const [org, site] of [['org-a', 'site-a'], ['org-a', 'site-a2'], ['org-b', 'site-b']]) {
    await seedSite({ ...env, IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_SITE_ID: site,
      IOP_SEED_SITE_NAME: 'Fictional Site', IOP_SEED_SITE_TIME_ZONE: 'UTC' });
  }
  for (const [org, site] of [['org-a', 'site-a'], ['org-b', 'site-b']]) {
    await seedMembership({ ...env, IOP_SEED_USER_ID: 'user', IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_SITE_ID: site });
  }
  // Disposable business data only: production migrations add no business table/grant.
  await admin(`CREATE TABLE platform_core.authorization_probe (organization_id text, site_id text, value int);
    ALTER TABLE platform_core.authorization_probe OWNER TO iop_migrator;
    INSERT INTO platform_core.authorization_probe VALUES ('org-a','site-a',0), ('org-a','site-a2',0), ('org-b','site-b',0);
    ALTER TABLE platform_core.authorization_probe ENABLE ROW LEVEL SECURITY;
    ALTER TABLE platform_core.authorization_probe FORCE ROW LEVEL SECURITY;
    GRANT SELECT, UPDATE ON platform_core.authorization_probe TO iop_runtime;
    CREATE POLICY scoped_probe ON platform_core.authorization_probe TO iop_runtime
      USING (organization_id = current_setting('iop.organization_id',true)
        AND site_id = current_setting('iop.site_id',true)
        AND current_setting('iop.user_id',true) = 'user')
      WITH CHECK (organization_id = current_setting('iop.organization_id',true)
        AND site_id = current_setting('iop.site_id',true));`);
  pool = new Pool({ ...configs.runtime, max: 1 });
});
afterAll(async () => { if (pool) await pool.end(); if (container) await container.stop(); });

test('direct internal operations authorize exact scope on a pinned runtime transaction', async () => {
  for (const permissions of [['analytics.read'], ['imports.submit', 'imports.review', 'site-configuration.manage'],
    ['analytics.read', 'imports.submit']]) {
    expect(await runSiteOperation(pool, request('site-a', 'org-a', permissions), readProbe)).toEqual([{ site_id: 'site-a' }]);
  }
  let handle;
  await runSiteOperation(pool, request(), async tx => {
    handle = tx;
    expect(Object.isFrozen(tx.context)).toBe(true);
    expect(tx.context).toEqual({ userId: 'user', organizationId: 'org-a', siteId: 'site-a' });
    const role = await tx.query('SELECT current_user AS name');
    expect(role.rows).toEqual([{ name: 'iop_runtime' }]);
  });
  await expect(handle.query('SELECT 1')).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  expect((await pool.query('SELECT * FROM platform_core.authorization_probe')).rows).toEqual([]);
});

test('missing/foreign ownership, missing grants and unsupported actions never invoke work', async () => {
  const callback = jest.fn();
  for (const value of [request('site-a2'), request('site-b'), request('absent'),
    { ...request(), userId: 'absent' }, { ...request(), userId: 'no-membership' }, { ...request(), organizationId: 'absent' },
    { ...request(), userId: '' }, { ...request(), siteId: undefined },
    request('site-a', 'org-a', []), request('site-a', 'org-a', ['access.manage']),
    request('site-a', 'org-a', ['unknown'])]) {
    await expect(runSiteOperation(pool, value, callback)).rejects.toBeInstanceOf(SiteAccessDeniedError);
  }
  expect(callback).not.toHaveBeenCalled();
});

test('current roles do not inherit or combine across sites; revocation and disablement take effect', async () => {
  for (const [role, allowed, denied] of [
    ['site-operator', 'analytics.read', 'imports.submit'],
    ['analytics-reader', 'imports.review', 'analytics.read'],
  ]) {
    await admin('DELETE FROM users_rbac.site_role_assignments WHERE organization_id = $1 AND role_id = $2', ['org-a', role]);
    try {
      await expect(runSiteOperation(pool, request('site-a', 'org-a', [allowed]), readProbe)).resolves.toHaveLength(1);
      await expect(runSiteOperation(pool, request('site-a', 'org-a', [denied]), readProbe)).rejects.toBeInstanceOf(SiteAccessDeniedError);
      await expect(runSiteOperation(pool, request('site-a', 'org-a', [allowed, denied]), readProbe)).rejects.toBeInstanceOf(SiteAccessDeniedError);
    } finally {
      await admin("INSERT INTO users_rbac.site_role_assignments VALUES ('org-a','user','site-a',$1)", [role]);
    }
  }
  for (const table of ['users', 'organization_memberships']) {
    await admin(`UPDATE users_rbac.${table} SET is_active = false`);
    try { await expect(runSiteOperation(pool, request(), readProbe)).rejects.toBeInstanceOf(SiteAccessDeniedError); }
    finally { await admin(`UPDATE users_rbac.${table} SET is_active = true`); }
  }
  // Removing both roles leaves membership alone; reader on B cannot fill the gap at A.
  await admin("DELETE FROM users_rbac.site_role_assignments WHERE organization_id = 'org-a'");
  try { await expect(runSiteOperation(pool, request(), readProbe)).rejects.toBeInstanceOf(SiteAccessDeniedError); }
  finally {
    await admin("INSERT INTO users_rbac.site_role_assignments VALUES ('org-a','user','site-a','analytics-reader'), ('org-a','user','site-a','site-operator')");
  }
});

test('lookup is exact, requires all selectors, and does not install business authority', async () => {
  await withClient('runtime', async c => {
    for (const [user, org, site, counts] of [
      ['', '', '', [0,0,0,0]], ['user', '', 'site-a', [0,0,0,0]],
      ['user', 'org-a', '', [0,0,0,0]], ['', 'org-a', 'site-a', [0,0,0,0]],
      ['user', 'org-a', 'site-a', [1,1,2,1]],
      ['user', 'org-a', 'site-a2', [1,1,0,1]],
      ['user', 'org-a', 'site-b', [1,1,0,0]],
      ['other', 'org-a', 'site-a', [0,0,0,1]],
    ]) {
      await c.query('BEGIN');
      await lookup(c, user, org, site);
      for (const [i, sql] of ['SELECT user_id FROM users_rbac.users',
        'SELECT user_id FROM users_rbac.organization_memberships',
        'SELECT role_id FROM users_rbac.site_role_assignments',
        'SELECT site_id FROM platform_core.sites'].entries()) {
        expect((await c.query(sql)).rowCount).toBe(counts[i]);
      }
      expect((await c.query('SELECT * FROM platform_core.authorization_probe')).rows).toEqual([]);
      await c.query('COMMIT');
      expect((await c.query('SELECT user_id FROM users_rbac.users')).rows).toEqual([]);
    }
    for (const sql of ['SELECT display_name FROM platform_core.sites', 'SELECT * FROM platform_core.organizations',
      "UPDATE users_rbac.users SET is_active = false", "DELETE FROM users_rbac.site_role_assignments",
      "INSERT INTO users_rbac.users VALUES ('forged',true)", 'TRUNCATE users_rbac.users',
      'ALTER TABLE users_rbac.users DISABLE ROW LEVEL SECURITY', 'SET ROLE iop_migrator', 'SET ROLE iop_bootstrap']) {
      await expect(c.query(sql)).rejects.toMatchObject({ code: '42501' });
    }
  });
});

test('commit, rollback, savepoints, retries and pool reuse never retain scope', async () => {
  const failure = new Error('Synthetic domain failure');
  await expect(runSiteOperation(pool, request(), async tx => {
    await tx.query('UPDATE platform_core.authorization_probe SET value = 5');
    throw failure;
  })).rejects.toBe(failure);
  expect((await admin('SELECT value FROM platform_core.authorization_probe')).rows.every(r => r.value === 0)).toBe(true);
  await runSiteOperation(pool, request(), async tx => {
    await tx.query('SAVEPOINT test_scope');
    await tx.query('UPDATE platform_core.authorization_probe SET value = 7');
    await tx.query('ROLLBACK TO SAVEPOINT test_scope');
    expect(await readProbe(tx)).toEqual([{ site_id: 'site-a' }]);
  });
  expect(await runSiteOperation(pool, request('site-b', 'org-b'), readProbe)).toEqual([{ site_id: 'site-b' }]);
  expect(await runSiteOperation(pool, request(), readProbe)).toEqual([{ site_id: 'site-a' }]);
  expect((await pool.query('SELECT * FROM platform_core.authorization_probe')).rows).toEqual([]);
});

test('parallel operations keep independent scope and already-authorized work may finish', async () => {
  const concurrent = new Pool({ ...configs.runtime, max: 2 });
  try {
    const results = await Promise.all([request(), request('site-b', 'org-b')].map(input =>
      runSiteOperation(concurrent, input, async tx => {
        await tx.query('SELECT pg_sleep(0.03)');
        return readProbe(tx);
      })));
    expect(results).toEqual([[{ site_id: 'site-a' }], [{ site_id: 'site-b' }]]);
    await runSiteOperation(concurrent, request(), async tx => {
      await admin("UPDATE users_rbac.users SET is_active = false WHERE user_id = 'user'");
      expect(await readProbe(tx)).toEqual([{ site_id: 'site-a' }]);
      await expect(runSiteOperation(concurrent, request(), readProbe)).rejects.toBeInstanceOf(SiteAccessDeniedError);
    });
  } finally {
    await admin('UPDATE users_rbac.users SET is_active = true');
    await concurrent.end();
  }
});

test('timeout, cancellation and swallowed SQL errors roll back and permit clean reuse', async () => {
  await expect(runSiteOperation(pool, request(), async tx => {
    await tx.query("SET LOCAL statement_timeout = '10ms'");
    await tx.query('SELECT pg_sleep(1)');
  })).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  await expect(runSiteOperation(pool, request(), async tx => {
    const { rows } = await tx.query('SELECT pg_backend_pid() AS pid');
    const sleeping = tx.query('SELECT pg_sleep(10)');
    const rejected = expect(sleeping).rejects.toBeInstanceOf(AuthorizationUnavailableError);
    // Wait for the query to enter execution instead of racing cancellation with submission.
    for (let i = 0; i < 100; i++) {
      const active = await admin("SELECT 1 FROM pg_stat_activity WHERE pid = $1 AND wait_event = 'PgSleep'", [rows[0].pid]);
      if (active.rowCount) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await admin('SELECT pg_cancel_backend($1)', [rows[0].pid]);
    await rejected;
    throw new AuthorizationUnavailableError();
  })).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  await expect(runSiteOperation(pool, request(), async tx => {
    try { await tx.query('SELECT 1 / 0'); } catch { /* Deliberately faulty caller. */ }
    return 'must not commit';
  })).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  expect(await runSiteOperation(pool, request('site-b', 'org-b'), readProbe)).toEqual([{ site_id: 'site-b' }]);
  expect((await pool.query('SELECT * FROM platform_core.authorization_probe')).rows).toEqual([]);
});

test('contaminated pool sessions are rejected and destroyed; database errors never run callbacks', async () => {
  await pool.query("SELECT set_config('iop.site_id','site-a',false)");
  const work = jest.fn();
  await expect(runSiteOperation(pool, request(), work)).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  expect(work).not.toHaveBeenCalled();
  expect(pool.totalCount).toBe(0);
  await admin('REVOKE SELECT (role_id) ON users_rbac.site_role_assignments FROM iop_runtime');
  try { await expect(runSiteOperation(pool, request(), work)).rejects.toBeInstanceOf(AuthorizationUnavailableError); }
  finally { await admin('GRANT SELECT (role_id) ON users_rbac.site_role_assignments TO iop_runtime'); }
  expect(work).not.toHaveBeenCalled();
  await expect(runSiteOperation(pool, request(), async tx => {
    const { rows } = await tx.query('SELECT pg_backend_pid() AS pid');
    await admin('SELECT pg_terminate_backend($1)', [rows[0].pid]);
    await tx.query('SELECT 1');
  })).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  expect(pool.totalCount).toBe(0);
  expect(await runSiteOperation(pool, request(), readProbe)).toEqual([{ site_id: 'site-a' }]);
});

test('provisioning permits only installed lookup column grants and rejects privilege drift', async () => {
  // Remove the test-only business fixture before auditing the production privilege surface.
  await admin('DROP TABLE platform_core.authorization_probe');
  await provision(configs);
  for (const [grant, restore] of [
    ['GRANT SELECT ON users_rbac.users TO iop_runtime', 'REVOKE SELECT ON users_rbac.users FROM iop_runtime; GRANT SELECT (user_id, is_active) ON users_rbac.users TO iop_runtime'],
    ['GRANT SELECT (display_name) ON platform_core.sites TO iop_runtime', 'REVOKE SELECT (display_name) ON platform_core.sites FROM iop_runtime'],
    ['GRANT SELECT (user_id) ON users_rbac.users TO PUBLIC', 'REVOKE SELECT (user_id) ON users_rbac.users FROM PUBLIC'],
    ['GRANT SELECT (user_id) ON users_rbac.users TO iop_runtime WITH GRANT OPTION', 'REVOKE GRANT OPTION FOR SELECT (user_id) ON users_rbac.users FROM iop_runtime'],
    ['GRANT USAGE ON SCHEMA users_rbac TO PUBLIC', 'REVOKE USAGE ON SCHEMA users_rbac FROM PUBLIC'],
    ['GRANT CREATE ON SCHEMA users_rbac TO iop_runtime', 'REVOKE CREATE ON SCHEMA users_rbac FROM iop_runtime'],
    ['ALTER TABLE users_rbac.users NO FORCE ROW LEVEL SECURITY', 'ALTER TABLE users_rbac.users FORCE ROW LEVEL SECURITY'],
  ]) {
    await admin(grant);
    try { await expect(provision(configs)).rejects.toThrow('privileges'); }
    finally { await admin(restore); }
    await provision(configs);
  }
  const metadata = await admin(`SELECT relrowsecurity, relforcerowsecurity FROM pg_class
    WHERE oid IN ('users_rbac.users'::regclass, 'users_rbac.organization_memberships'::regclass,
      'users_rbac.site_role_assignments'::regclass, 'platform_core.sites'::regclass)`);
  expect(metadata.rows).toHaveLength(4);
  expect(metadata.rows.every(r => r.relrowsecurity && r.relforcerowsecurity)).toBe(true);
});
