const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client, Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { seedOrganization } = require('../dist/seed-organization.js');
const { seedSite } = require('../dist/seed-site.js');
const { seedUser } = require('../dist/seed-user.js');
const { seedMembership } = require('../dist/seed-membership.js');
const { ImportBatches, ImportOutcomeUnknownError } = require('../../../apps/api/dist/modules/integrations');
const { runSiteOperation } = require('../../../apps/api/dist/persistence/site-operation');
let container, configs, pool, service;
const source = { organizationId: 'org-a', siteId: 'site-a', sourceId: 'source', siteTimeZone: 'UTC',
  adapterRevision: 'adapter-1', profileRevision: 'profile-1', mappingRevision: 'mapping-1' };
const bytes = Buffer.from('\uFEFFheader\r\noriginal bytes\r\n', 'utf16le');
const inspection = (n = 2) => ({ dataRecordCount: n, inspectedValidCount: n, inspectedInvalidCount: 0,
  inspectionComplete: true, unclassifiedCount: 1, repeatedCount: 1, diagnostics: [], diagnosticsTruncated: false });
const deadline = () => Date.now() + 29000;
const request = (permission = 'imports.submit', siteId = 'site-a', organizationId = 'org-a') =>
  ({ userId: 'user', siteId, organizationId, permissions: [permission] });
async function admin(sql, values) {
  const c = new Client(configs.bootstrap);
  try { await c.connect(); return await c.query(sql, values); }
  finally { await c.end(); }
}
// Disposable OIP receiver probe: verifies transaction handoff, not production analytics.
const receiver = {
  async publish(tx, batch, input) {
    for (let line = 1; line <= input.count; line++) {
      await tx.query(`INSERT INTO batch_receiver_probe.records VALUES ($1,$2,$3,$4,$5)`,
        [tx.context.organizationId, tx.context.siteId, batch.sourceId, batch.importId, line + 1]);
      if (input.failAfterFirst) throw new Error('Synthetic receiver failure');
    }
    return input.count;
  },
  async inspect(tx, batch) {
    const result = await tx.query(`SELECT count(*)::integer AS count FROM batch_receiver_probe.records
      WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=$4`,
      [tx.context.organizationId, tx.context.siteId, batch.sourceId, batch.importId]);
    return result.rows[0].count || null;
  },
};
function loseNextAcknowledgement() {
  let pending = true;
  return { connect: async () => {
    const client = await pool.connect();
    return new Proxy(client, { get(target, name) {
      if (name === 'query') return async (...args) => {
        const result = await target.query(...args);
        if (args[0] === 'COMMIT' && pending) { pending = false; throw new Error('Synthetic lost acknowledgement'); }
        return result;
      };
      const value = target[name];
      return typeof value === 'function' ? value.bind(target) : value;
    } });
  } };
}
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local')
    .withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  const env = { IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
    IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password', IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password',
    IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password' };
  configs = provisioningConfiguration(env);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(7);
  await provision(configs);
  await seedUser({ ...env, IOP_SEED_USER_ID: 'user' });
  for (const org of ['org-a', 'org-b']) {
    await seedOrganization({ ...env, IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_ORGANIZATION_NAME: 'Fictional Organization' });
  }
  for (const [org, site] of [['org-a','site-a'], ['org-a','site-a2'], ['org-b','site-b']]) {
    await seedSite({ ...env, IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_SITE_ID: site,
      IOP_SEED_SITE_NAME: 'Fictional Site', IOP_SEED_SITE_TIME_ZONE: 'UTC' });
    if (site !== 'site-a2') await seedMembership({ ...env, IOP_SEED_USER_ID: 'user', IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_SITE_ID: site });
    else await admin("INSERT INTO users_rbac.site_role_assignments VALUES ('org-a','user','site-a2','analytics-reader'), ('org-a','user','site-a2','site-operator')");
  }
  await admin(`CREATE SCHEMA batch_receiver_probe AUTHORIZATION iop_migrator;
    CREATE TABLE batch_receiver_probe.records (organization_id text, site_id text, source_id text, import_id uuid,
      source_record_number integer, PRIMARY KEY (organization_id,site_id,source_id,import_id,source_record_number),
      FOREIGN KEY (organization_id,site_id,source_id,import_id)
        REFERENCES integrations.import_batches (organization_id,site_id,source_id,import_id));
    ALTER TABLE batch_receiver_probe.records OWNER TO iop_migrator;
    ALTER TABLE batch_receiver_probe.records ENABLE ROW LEVEL SECURITY;
    ALTER TABLE batch_receiver_probe.records FORCE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA batch_receiver_probe TO iop_runtime;
    GRANT SELECT,INSERT ON batch_receiver_probe.records TO iop_runtime;
    CREATE POLICY scope ON batch_receiver_probe.records TO iop_runtime
      USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true))
      WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true));`);
  pool = new Pool({ ...configs.runtime, max: 4 });
  service = new ImportBatches(pool, source);
});
afterAll(async () => { if (pool) await pool.end(); if (container) await container.stop(); });

test('receipt retains exact original, fixed provenance and unknown counts without publishing', async () => {
  const input = Buffer.from(bytes);
  const pending = service.receive('user', 'Hitliste-20260701.csv', input);
  input.fill(0); // receipt freezes caller-owned bytes before asynchronous database work
  const id = await pending;
  expect(await service.original('user', id)).toEqual(bytes);
  const status = await service.review('user', id);
  expect(status).toMatchObject({ importId: id, outcome: 'received', reportingDate: '2026-07-01',
    admittedRecordCount: null, rejectedRecordCount: null, dataRecordCount: null });
  expect(status).not.toHaveProperty('original_bytes');
  const provenance = (await admin('SELECT submitted_by,adapter_revision,mapping_revision,reporting_window_status FROM integrations.import_batches WHERE import_id=$1', [id])).rows[0];
  expect(provenance).toEqual({ submitted_by: 'user', adapter_revision: 'adapter-1', mapping_revision: 'mapping-1', reporting_window_status: 'unknown' });
  await service.publish('user', id, inspection(), receiver, { count: 2 }, deadline());
  expect(await service.review('user', id)).toMatchObject({ outcome: 'succeeded', admittedRecordCount: 2, rejectedRecordCount: 0, unclassifiedCount: 1, repeatedCount: 1 });
  expect(await service.reconcile('user', id, receiver)).toBe('succeeded');
});

test('invalid receipt and permissions do not consume quota; malformed complete input can be rejected', async () => {
  const before = (await admin('SELECT * FROM integrations.import_quota')).rows;
  for (const filename of ['../Hitliste-20260701.csv','Hitliste-20260230.csv','Hitliste-00000101.csv','Hitliste-20260101.csv.exe']) {
    await expect(service.receive('user', filename, bytes)).rejects.toMatchObject({ code: 'invalid-input' });
  }
  await expect(service.receive('user', 'Hitliste-20260702.csv', Buffer.alloc(5242881))).rejects.toMatchObject({ code: 'invalid-input' });
  await expect(service.receive('missing', 'Hitliste-20260702.csv', bytes)).rejects.toThrow('not permitted');
  expect((await admin('SELECT * FROM integrations.import_quota')).rows).toEqual(before);
  const id = await service.receive('user','Hitliste-20260702.csv',bytes);
  await service.reject('user', id, { ...inspection(3), inspectedValidCount: 2, inspectedInvalidCount: 1,
    diagnostics: [{ code: 'invalid-value', line: 3, field: 'frequency', reason: 'must not be retained' }] });
  expect(await service.review('user', id)).toMatchObject({ outcome: 'rejected', admittedRecordCount: 0,
    rejectedRecordCount: 3, inspectedValidCount: 2, inspectedInvalidCount: 1,
    diagnostics: [{ code: 'invalid-value', line: 3, field: 'frequency', reason: 'A source value is invalid.' }] });
  const retry = await service.receive('user','Hitliste-20260702.csv',bytes);
  await service.publish('user',retry,inspection(),receiver,{count:2},deadline());
  expect(await service.reconcile('user',id,receiver)).toBe('rejected');
  const failure = await service.receive('user','Hitliste-20260703.csv',bytes);
  await service.failProcessing('user',failure,inspection());
  expect(await service.review('user',failure)).toMatchObject({outcome:'failed',reasonCode:'processing-failed',
    admittedRecordCount:0,rejectedRecordCount:2,inspectedValidCount:2});
  const early = await service.receive('user','Hitliste-20260703.csv',bytes);
  await service.reject('user',early,{ ...inspection(), dataRecordCount:null, inspectedValidCount:0,
    inspectionComplete:false, unclassifiedCount:0, repeatedCount:0 });
  expect(await service.review('user',early)).toMatchObject({ admittedRecordCount:0, rejectedRecordCount:null, dataRecordCount:null });
});

test('same-date concurrent publications have one winner; scope/source namespaces are independent', async () => {
  const ids = await Promise.all([0,1].map(() => service.receive('user','Hitliste-20260704.csv',bytes)));
  const outcomes = await Promise.all(ids.map(id => service.publish('user',id,inspection(),receiver,{count:2},deadline())));
  expect(outcomes.sort()).toEqual(['duplicate-date','succeeded']);
  const statuses = await Promise.all(ids.map(id => service.review('user',id)));
  expect(statuses.map(s => s.outcome).sort()).toEqual(['rejected','succeeded']);
  expect(statuses.find(s => s.outcome === 'rejected')).toMatchObject({ reasonCode:'duplicate-date', admittedRecordCount:0, rejectedRecordCount:2 });
  expect((await admin('SELECT count(*)::integer AS n FROM batch_receiver_probe.records WHERE import_id=ANY($1::uuid[])',[ids])).rows[0].n).toBe(2);
  for (const changed of [{ sourceId:'other' },{siteId:'site-a2'},{organizationId:'org-b',siteId:'site-b'}]) {
    const other = new ImportBatches(pool,{ ...source,...changed });
    const id = await other.receive('user','Hitliste-20260704.csv',bytes);
    await other.publish('user',id,inspection(),receiver,{count:2},deadline());
    await expect(service.review('user',id)).rejects.toMatchObject({code:'not-found'});
  }
});

test('receiver failures and count mismatch roll back all facts and date claims; explicit recovery permits retry', async () => {
  const id = await service.receive('user','Hitliste-20260705.csv',bytes);
  await expect(service.publish('user',id,inspection(),receiver,{count:2,failAfterFirst:true},deadline())).rejects.toBeInstanceOf(ImportOutcomeUnknownError);
  expect((await admin('SELECT * FROM batch_receiver_probe.records WHERE import_id=$1',[id])).rows).toHaveLength(0);
  expect((await admin('SELECT * FROM integrations.import_date_claims WHERE import_id=$1',[id])).rows).toHaveLength(0);
  expect(await service.reconcile('user',id,receiver)).toBe('failed');
  expect(await service.reconcile('user',id,receiver)).toBe('failed');
  await expect(service.publish('user',id,inspection(),receiver,{count:2},deadline())).rejects.toMatchObject({code:'terminal'});
  const retry = await service.receive('user','Hitliste-20260705.csv',bytes);
  await expect(service.publish('user',retry,inspection(),receiver,{count:1},deadline())).rejects.toMatchObject({code:'inconsistent'});
  expect(await service.reconcile('user',retry,receiver)).toBe('failed');
  const good = await service.receive('user','Hitliste-20260705.csv',bytes);
  await service.publish('user',good,inspection(),receiver,{count:2},deadline());
});

test('lost receipt and publication acknowledgements reconcile the original identity without replay', async () => {
  const lostReceipt = new ImportBatches(loseNextAcknowledgement(),source);
  let id;
  try { await lostReceipt.receive('user','Hitliste-20260706.csv',bytes); throw new Error('Expected uncertain acknowledgement'); }
  catch (error) { expect(error).toBeInstanceOf(ImportOutcomeUnknownError); id=error.importId; }
  expect(await service.original('user',id)).toEqual(bytes);
  expect(await service.reconcile('user',id,receiver)).toBe('failed');
  const next = await service.receive('user','Hitliste-20260706.csv',bytes);
  const lostPublication = new ImportBatches(loseNextAcknowledgement(),source);
  await expect(lostPublication.publish('user',next,inspection(),receiver,{count:2},deadline())).rejects.toMatchObject({importId:next});
  expect(await service.reconcile('user',next,receiver)).toBe('succeeded');
  expect(await service.reconcile('user',next,receiver)).toBe('succeeded');
  expect((await admin('SELECT count(*)::integer AS n FROM batch_receiver_probe.records WHERE import_id=$1',[next])).rows[0].n).toBe(2);
  expect(await service.reconcile('user',randomUUID(),receiver)).toBe('absent');
});

test('quota serializes concurrent admission at both ceilings; failed receipts retain quota', async () => {
  for (const quota of [{attempts:999, bytes:0},{attempts:0, bytes:268435456-bytes.length}]) {
    await admin('UPDATE integrations.import_quota SET retained_attempts=$1,retained_bytes=$2',[quota.attempts,quota.bytes]);
    try {
      const results = await Promise.allSettled([0,1].map(() => service.receive('user','Hitliste-20260707.csv',bytes)));
      expect(results.filter(r => r.status==='fulfilled')).toHaveLength(1);
      expect(results.find(r => r.status==='rejected').reason.code).toBe('capacity');
    } finally {
      await admin(`UPDATE integrations.import_quota SET retained_attempts=(SELECT count(*) FROM integrations.import_batches),
        retained_bytes=(SELECT coalesce(sum(byte_length),0) FROM integrations.import_batches)`);
    }
  }
  // Force a receipt insert failure after quota UPDATE: both changes must roll back.
  const before=(await admin('SELECT * FROM integrations.import_quota')).rows;
  await admin(`ALTER TABLE integrations.import_batches ADD CONSTRAINT receipt_probe CHECK (original_filename <> 'Hitliste-20260708.csv')`);
  try { await expect(service.receive('user','Hitliste-20260708.csv',bytes)).rejects.toBeInstanceOf(ImportOutcomeUnknownError); }
  finally { await admin('ALTER TABLE integrations.import_batches DROP CONSTRAINT receipt_probe'); }
  expect((await admin('SELECT * FROM integrations.import_quota')).rows).toEqual(before);
});

test('recovery refuses live phases, expired publication, inconsistent facts and terminal mutation', async () => {
  const id=await service.receive('user','Hitliste-20260709.csv',bytes);
  let resume, entered;
  const started=new Promise(resolve => {entered=resolve;});
  const wait=new Promise(resolve => {resume=resolve;});
  const delayed={ ...receiver, publish:async (...args) => {entered(); await wait; return receiver.publish(...args);} };
  const pending=service.publish('user',id,inspection(),delayed,{count:2},deadline());
  await started;
  await expect(service.reconcile('user',id,receiver)).rejects.toMatchObject({code:'incomplete'});
  resume(); await pending;
  await expect(service.reject('user',id,inspection())).rejects.toMatchObject({code:'terminal'});
  await expect(service.publish('user',id,inspection(),receiver,{count:2},Date.now()-1)).rejects.toMatchObject({code:'incomplete'});
  await admin('DELETE FROM batch_receiver_probe.records WHERE import_id=$1',[id]);
  await expect(service.reconcile('user',id,receiver)).rejects.toMatchObject({code:'inconsistent'});
});

test('current permission, immutable receipts, real-role scope and connection reuse hold', async () => {
  const id=await service.receive('user','Hitliste-20260710.csv',bytes);
  await admin("DELETE FROM users_rbac.site_role_assignments WHERE organization_id='org-a' AND site_id='site-a' AND role_id='site-operator'");
  try {
    await expect(service.review('user',id)).rejects.toThrow('not permitted');
    await expect(service.original('user',id)).rejects.toThrow('not permitted');
    await expect(service.publish('user',id,inspection(),receiver,{count:2},deadline())).rejects.toThrow('not permitted');
    await expect(service.reconcile('user',id,receiver)).rejects.toThrow('not permitted');
  } finally { await admin("INSERT INTO users_rbac.site_role_assignments VALUES ('org-a','user','site-a','site-operator')"); }
  // Importing does not require the separate analytics.read grant.
  await admin("DELETE FROM users_rbac.site_role_assignments WHERE organization_id='org-a' AND site_id='site-a' AND role_id='analytics-reader'");
  try { await service.publish('user',id,inspection(),receiver,{count:2},deadline()); }
  finally { await admin("INSERT INTO users_rbac.site_role_assignments VALUES ('org-a','user','site-a','analytics-reader')"); }
  expect((await pool.query('SELECT import_id FROM integrations.import_batches')).rows).toEqual([]);
  expect((await pool.query('SELECT retained_bytes FROM integrations.import_quota')).rows).toEqual([]);
  await runSiteOperation(pool,request(),async tx => {
    const rows=(await tx.query('SELECT organization_id,site_id FROM integrations.import_batches')).rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.organization_id==='org-a' && r.site_id==='site-a')).toBe(true);
  });
  for (const sql of ["UPDATE integrations.import_batches SET source_id='other'", "UPDATE integrations.import_batches SET original_bytes='x'",
    'DELETE FROM integrations.import_batches','TRUNCATE integrations.import_batches',
    'UPDATE integrations.import_quota SET singleton=false','DELETE FROM integrations.import_date_claims']) {
    await expect(pool.query(sql)).rejects.toMatchObject({code:'42501'});
  }
  await expect(runSiteOperation(pool,request(),tx => tx.query(`INSERT INTO integrations.import_date_claims VALUES ('org-a','site-a','source','2026-12-01',$1)`,[id]))).rejects.toThrow();
  await expect(runSiteOperation(pool,request(),tx => tx.query('UPDATE integrations.import_quota SET retained_attempts=0,retained_bytes=0'))).rejects.toThrow();
  expect((await pool.query('SELECT import_id FROM integrations.import_batches')).rows).toEqual([]);
});

test('byte, diagnostic and count boundaries remain bounded; mid-publication expiry leaves no facts', async () => {
  const max=await service.receive('user','Hitliste-20260711.csv',Buffer.alloc(5242880,1));
  expect((await service.original('user',max)).length).toBe(5242880);
  for (const invalid of [
    { ...inspection(), dataRecordCount:20001 },
    { ...inspection(), inspectedValidCount:1 },
    { ...inspection(), diagnostics:Array.from({length:101},() => ({code:'invalid-value'})) },
    { ...inspection(), diagnostics:[{code:'invalid-value',line:25001}] },
    { ...inspection(), diagnostics:[{code:'raw-source-secret'}] },
  ]) await expect(service.reject('user',max,invalid)).rejects.toMatchObject({code:'invalid-input'});
  await service.reject('user',max,{...inspection(),diagnostics:Array.from({length:100},() => ({code:'invalid-value',line:25000})),diagnosticsTruncated:true});
  expect((await service.review('user',max)).diagnostics).toHaveLength(100);
  const expiry=await service.receive('user','Hitliste-20260712.csv',bytes);
  const slow={...receiver,publish:async (...args) => {
    await receiver.publish(...args);
    await new Promise(resolve => setTimeout(resolve,600));
    return 2;
  }};
  await expect(service.publish('user',expiry,inspection(),slow,{count:2},Date.now()+500)).rejects.toMatchObject({code:'incomplete'});
  expect((await admin('SELECT * FROM batch_receiver_probe.records WHERE import_id=$1',[expiry])).rows).toHaveLength(0);
  expect(await service.reconcile('user',expiry,receiver)).toBe('failed');
});

test('provisioning accepts only exact batch grants and detects quota drift', async () => {
  await admin('DROP SCHEMA batch_receiver_probe CASCADE');
  await provision(configs);
  const batchColumns = (await admin("SELECT column_name FROM information_schema.columns WHERE table_schema='integrations' AND table_name='import_batches' ORDER BY ordinal_position")).rows.map(r => r.column_name).join(',');
  for (const [change,restore] of [
    ['GRANT UPDATE (original_bytes) ON integrations.import_batches TO iop_runtime','REVOKE UPDATE (original_bytes) ON integrations.import_batches FROM iop_runtime'],
    ['GRANT SELECT ON integrations.import_batches TO iop_runtime',`REVOKE SELECT ON integrations.import_batches FROM iop_runtime; GRANT SELECT (${batchColumns}) ON integrations.import_batches TO iop_runtime`],
    ['ALTER TABLE integrations.import_batches NO FORCE ROW LEVEL SECURITY','ALTER TABLE integrations.import_batches FORCE ROW LEVEL SECURITY'],
  ]) {
    await admin(change);
    try { await expect(provision(configs)).rejects.toThrow('privileges'); }
    finally { await admin(restore); }
    await provision(configs);
  }
  await admin('UPDATE integrations.import_quota SET retained_attempts=retained_attempts+1');
  await expect(provision(configs)).rejects.toThrow('quota');
  await admin('UPDATE integrations.import_quota SET retained_attempts=retained_attempts-1');
  await provision(configs);
});
