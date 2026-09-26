const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client, Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join, basename } = require('node:path');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { seedOrganization } = require('../dist/seed-organization.js');
const { seedSite } = require('../dist/seed-site.js');
const { seedUser } = require('../dist/seed-user.js');
const { seedMembership } = require('../dist/seed-membership.js');
const { ImportBatches, ImportOutcomeUnknownError, validateCsv, SourceMappings, CSV_ADAPTER_REVISION } = require('../../../apps/api/dist/modules/integrations');
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
      await tx.query(`INSERT INTO batch_receiver_probe.records
        (organization_id,site_id,source_id,import_id,source_record_number) VALUES ($1,$2,$3,$4,$5)`,
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
      source_record_number integer, reported_frequency bigint, accumulated_alarm_seconds bigint, record_snapshot jsonb,
      PRIMARY KEY (organization_id,site_id,source_id,import_id,source_record_number),
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

// IOP-047: compose real CSV validation and batch contracts, with disposable storage.
// This probe is not the production OIP receiver or scoped classification stage.
const csvBytes = (frequency = 2) => Buffer.from('\uFEFF' +
  'Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe\r\n' +
  `\r\n${frequency};0 0:01:30;Area;Equipment;Fault;Type;Group\r\n` +
  `${frequency};0 0:01:30;Area;Equipment;Fault;Type;Group\r\n`, 'utf16le');
const csvReceiver = {
  async publish(tx, batch, prepared) {
    expect(prepared.reportingDate).toBe(batch.reportingDate);
    for (const record of prepared.records) {
      await tx.query(`INSERT INTO batch_receiver_probe.records
        (organization_id,site_id,source_id,import_id,source_record_number,reported_frequency,accumulated_alarm_seconds)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [tx.context.organizationId, tx.context.siteId, batch.sourceId, batch.importId,
          record.sourceRecordNumber, record.reportedFrequency, record.accumulatedAlarmSeconds]);
    }
    return prepared.records.length;
  },
  inspect: receiver.inspect,
};
async function receiveCsv(batchService, filename, content = csvBytes()) {
  const id = await batchService.receive('user', filename, content);
  const retained = await batchService.original('user', id);
  const report = validateCsv(filename, retained);
  expect(report.status).toBe('valid');
  return { id, prepared: report.prepared,
    // The probe intentionally treats every row as unclassified; it supplies no mapping.
    inspection: { ...report.inspection, unclassifiedCount: report.prepared.dataRecordCount } };
}
const publishCsv = (batchService, input, target = csvReceiver) =>
  batchService.publish('user', input.id, input.inspection, target, input.prepared, deadline());
async function csvFacts(ids) {
  return (await admin(`SELECT import_id,source_record_number,reported_frequency::text,
    accumulated_alarm_seconds::text FROM batch_receiver_probe.records
    WHERE import_id=ANY($1::uuid[]) ORDER BY import_id,source_record_number`, [ids])).rows;
}

test('IOP-047 identical and changed-byte reimports preserve the winner and repeated source rows', async () => {
  const filename = 'Hitliste-20260801.csv';
  const first = await receiveCsv(service, filename);
  expect(await publishCsv(service, first)).toBe('succeeded');
  const original = await csvFacts([first.id]);
  expect(original).toEqual([3,4].map(line => ({ import_id:first.id, source_record_number:line,
    reported_frequency:'2', accumulated_alarm_seconds:'90' })));
  expect(await service.review('user', first.id)).toMatchObject({ repeatedCount:2,
    admittedRecordCount:2, unclassifiedCount:2 });
  for (const content of [csvBytes(), csvBytes(99)]) {
    const duplicate = await receiveCsv(service, filename, content);
    const forbiddenReceiver = { ...csvReceiver, publish: jest.fn() };
    expect(await publishCsv(service, duplicate, forbiddenReceiver)).toBe('duplicate-date');
    expect(forbiddenReceiver.publish).not.toHaveBeenCalled();
    expect(await service.review('user', duplicate.id)).toMatchObject({ outcome:'rejected',
      reasonCode:'duplicate-date', admittedRecordCount:0, rejectedRecordCount:2 });
    expect(await service.original('user', duplicate.id)).toEqual(content);
    expect(await csvFacts([first.id, duplicate.id])).toEqual(original);
    expect(await service.reconcile('user', duplicate.id, csvReceiver)).toBe('rejected');
  }
  await expect(publishCsv(service, first)).rejects.toMatchObject({ code:'terminal' });
  expect(await csvFacts([first.id])).toEqual(original);
});

test('IOP-047 concurrent CSV publications admit exactly one complete set of measures', async () => {
  const inputs = await Promise.all([2,99].map(n => receiveCsv(service, 'Hitliste-20260802.csv', csvBytes(n))));
  const results = await Promise.all(inputs.map(input => publishCsv(service, input)));
  expect([...results].sort()).toEqual(['duplicate-date','succeeded']);
  const winner = inputs[results.indexOf('succeeded')];
  const rows = await csvFacts(inputs.map(input => input.id));
  expect(rows).toHaveLength(2);
  expect(rows.every(row => row.import_id === winner.id)).toBe(true);
  expect(rows.reduce((sum, row) => sum + Number(row.reported_frequency), 0))
    .toBe(winner.prepared.totalReportedFrequency);
  expect(rows.reduce((sum, row) => sum + Number(row.accumulated_alarm_seconds), 0)).toBe(180);
  expect((await admin('SELECT import_id FROM integrations.import_date_claims WHERE import_id=ANY($1::uuid[])',
    [inputs.map(input => input.id)])).rows).toEqual([{ import_id:winner.id }]);
});

test('IOP-047 the date namespace includes source and site, while a new date is not a content hash conflict', async () => {
  const filename = 'Hitliste-20260803.csv';
  const first = await receiveCsv(service, filename);
  expect(await publishCsv(service, first)).toBe('succeeded');
  for (const scope of [{sourceId:'csv-other'}, {siteId:'site-a2'}, {organizationId:'org-b',siteId:'site-b'}]) {
    const other = new ImportBatches(pool, { ...source, ...scope });
    const independent = await receiveCsv(other, filename);
    expect(await publishCsv(other, independent)).toBe('succeeded');
    expect(await csvFacts([independent.id])).toHaveLength(2);
    await expect(service.review('user', independent.id)).rejects.toMatchObject({ code:'not-found' });
  }
  // The supported basename has one representation per date. Renaming to a NEW
  // valid date changes the label; identical content cannot establish a false date.
  const renamed = await receiveCsv(service, 'Hitliste-20260804.csv');
  expect(await publishCsv(service, renamed)).toBe('succeeded');
  expect((await service.review('user', renamed.id)).sha256).toBe((await service.review('user', first.id)).sha256);
  // Renaming that payload onto an occupied date is still a conflict.
  const occupied = await receiveCsv(service, filename, await service.original('user', renamed.id));
  expect(await publishCsv(service, occupied)).toBe('duplicate-date');
  expect(await csvFacts([first.id, renamed.id, occupied.id])).toHaveLength(4);
});

test('IOP-047 invalid CSV reserves no date and a corrected explicit submission can succeed', async () => {
  const filename = 'Hitliste-20260805.csv';
  const invalid = csvBytes(-1);
  const id = await service.receive('user', filename, invalid);
  const report = validateCsv(filename, await service.original('user', id));
  expect(report.status).toBe('invalid');
  await service.reject('user', id, { ...report.inspection, unclassifiedCount:0 });
  expect(await service.review('user', id)).toMatchObject({ outcome:'rejected', admittedRecordCount:0,
    rejectedRecordCount:2, inspectedInvalidCount:2 });
  const corrected = await receiveCsv(service, filename);
  expect(await publishCsv(service, corrected)).toBe('succeeded');
  expect(await service.reconcile('user', id, csvReceiver)).toBe('rejected');
  expect(await csvFacts([id, corrected.id])).toHaveLength(2);
});

test('IOP-047 lost publication acknowledgement returns existing success and never republishes CSV facts', async () => {
  const input = await receiveCsv(service, 'Hitliste-20260806.csv');
  const uncertain = new ImportBatches(loseNextAcknowledgement(), source);
  await expect(publishCsv(uncertain, input)).rejects.toMatchObject({ importId:input.id });
  const original = await csvFacts([input.id]);
  expect(original).toHaveLength(2);
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(await service.reconcile('user', input.id, csvReceiver)).toBe('succeeded');
  }
  await expect(publishCsv(service, input)).rejects.toMatchObject({ code:'terminal' });
  const retry = await receiveCsv(service, 'Hitliste-20260806.csv');
  expect(await publishCsv(service, retry)).toBe('duplicate-date');
  expect(await csvFacts([input.id, retry.id])).toEqual(original);
});

// IOP-048: independent literal oracle, never generated by the parser under test.
const fixtureRoot = join(__dirname, '../../../fixtures/analytical-poc');
const oracle = require('../../../fixtures/analytical-poc/expected.json');
const fixtureScope = require('../../../fixtures/analytical-poc/scope.json');
const fixtureBytes = path => readFileSync(join(fixtureRoot, path));
const reconciliationSource = { ...source, sourceId:'reconciliation',
  adapterRevision:CSV_ADAPTER_REVISION, mappingRevision:fixtureScope.mappingRevision };
const mappings = new SourceMappings({ ...reconciliationSource,
  sectors:Object.entries(fixtureScope.sectorLabels).map(([sectorKey,label]) => ({sectorKey,label})),
  areas:Object.entries(fixtureScope.sectorBySourceArea).map(([sourceArea,sectorKey]) => ({sourceArea,sectorKey})) });
// This snapshot exists only in the disposable test schema, not an OIP storage design.
const reconciliationReceiver = {
  async publish(tx, batch, prepared) {
    expect(prepared.reportingDate).toBe(batch.reportingDate);
    for (const record of prepared.records) {
      await tx.query(`INSERT INTO batch_receiver_probe.records VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [tx.context.organizationId,tx.context.siteId,batch.sourceId,batch.importId,
          record.sourceRecordNumber,record.reportedFrequency,record.accumulatedAlarmSeconds,record]);
    }
    return prepared.records.length;
  },
  inspect:receiver.inspect,
};
async function reconciliationFacts(ids, access = request('analytics.read')) {
  return runSiteOperation(pool, access, async tx => (await tx.query(
    `SELECT import_id,source_record_number,reported_frequency::text,accumulated_alarm_seconds::text,
      record_snapshot FROM batch_receiver_probe.records
      WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=ANY($4::uuid[])
      ORDER BY import_id,source_record_number`,
    [tx.context.organizationId,tx.context.siteId,reconciliationSource.sourceId,ids])).rows);
}
function expectMeasures(rows, expected) {
  expect(rows).toHaveLength(expected.dataRecordCount);
  expect(rows.reduce((sum,row) => sum + BigInt(row.reported_frequency),0n)).toBe(BigInt(expected.reportedFrequency));
  expect(rows.reduce((sum,row) => sum + BigInt(row.accumulated_alarm_seconds),0n)).toBe(BigInt(expected.accumulatedAlarmSeconds));
}

test('IOP-048 retained RAW, normalized lines and classified stored measures reconcile to the independent oracle', async () => {
  const batches = new ImportBatches(pool,reconciliationSource);
  const ids = [];
  for (const expected of oracle.validFiles) {
    const bytes = fixtureBytes(expected.path);
    const input = await receiveCsv(batches,basename(expected.path),bytes);
    ids.push(input.id);
    const classified = mappings.classify(reconciliationSource,input.prepared);
    expect(classified.reportingWindowStatus).toBe(oracle.reportingWindowStatus);
    expect(classified.blankLineCount).toBe(expected.blankLineCount);
    expect(classified.records.map(row => [row.sourceRecordNumber,row.reportedFrequency,
      row.accumulatedAlarmSeconds,row.sourceArea,row.sourceEquipmentReference,row.sourceMessageText,
      row.sourceMessageType,row.sourceMessageGroup,row.sectorKey])).toEqual(expected.rows);
    expect(classified.records.filter(row => row.classificationStatus === 'unclassified')
      .map(row => row.sourceRecordNumber)).toEqual(expected.unclassifiedRecordNumbers);
    expect(classified.records.filter(row => row.repeatedTuple).map(row => row.sourceRecordNumber))
      .toEqual(expected.repeatedTupleGroups.flat().sort((a,b) => a-b));
    expect(await publishCsv(batches,{ ...input,prepared:classified,
      inspection:{ ...input.inspection,unclassifiedCount:classified.unclassifiedCount } },reconciliationReceiver)).toBe('succeeded');
    expect(await batches.original('user',input.id)).toEqual(bytes);
    const status = await batches.review('user',input.id);
    expect(status).toMatchObject({ outcome:'succeeded',reportingDate:expected.reportingDate,
      dataRecordCount:expected.dataRecordCount,admittedRecordCount:expected.dataRecordCount,
      rejectedRecordCount:0,unclassifiedCount:expected.unclassifiedRecordNumbers.length,
      repeatedCount:expected.repeatedTupleGroups.flat().length });
    expect(status.dataRecordCount).toBe(status.admittedRecordCount + status.rejectedRecordCount);
    const rows = await reconciliationFacts([input.id]);
    expectMeasures(rows,expected);
    // Includes original duration spelling, opaque dimensions and zero-valued rows.
    expect(rows.map(row => row.record_snapshot)).toEqual(classified.records);
    expect(rows.map(row => [row.source_record_number,row.reported_frequency,row.accumulated_alarm_seconds]))
      .toEqual(expected.rows.map(row => [row[0],String(row[1]),String(row[2])]));
    expect(classified.totalReportedFrequency).toBe(expected.reportedFrequency);
    expect(classified.totalAccumulatedAlarmSeconds).toBe(expected.accumulatedAlarmSeconds);
  }
  const rows = await reconciliationFacts(ids);
  expectMeasures(rows,oracle.combined);
  for (const sector of oracle.bySector) {
    expectMeasures(rows.filter(row => row.record_snapshot.sectorKey === sector.sectorKey),sector);
  }
  const duplicate = await receiveCsv(batches,'Hitliste-20260701.csv',fixtureBytes('duplicate-changed/Hitliste-20260701.csv'));
  expect(await publishCsv(batches,duplicate,reconciliationReceiver)).toBe('duplicate-date');
  expect(await reconciliationFacts([...ids,duplicate.id])).toEqual(rows);
  expect(await reconciliationFacts(ids,request('analytics.read','site-b','org-b'))).toEqual([]);
  await expect(reconciliationFacts(ids,{ ...request('analytics.read'),userId:'missing' })).rejects.toThrow('not permitted');
  await expect(batches.original('missing',ids[0])).rejects.toThrow('not permitted');
});

test.each([
  ['negative-frequency',3,2,1,true],
  ['extra-cell',null,1,0,false],
  ['wrong-encoding',null,0,0,false],
  ['header-only',0,0,0,true],
])('IOP-048 %s rejection reconciles known counts without inventing an unknown remainder', async (kind,total,valid,invalid,complete) => {
  const batches = new ImportBatches(pool,reconciliationSource);
  const bytes = fixtureBytes(`invalid/${kind}/Hitliste-20260702.csv`);
  const id = await batches.receive('user','Hitliste-20260702.csv',bytes);
  const report = validateCsv('Hitliste-20260702.csv',await batches.original('user',id));
  expect(report.status).toBe('invalid');
  expect(report).not.toHaveProperty('prepared');
  await batches.reject('user',id,{ ...report.inspection,unclassifiedCount:0 });
  const status = await batches.review('user',id);
  expect(status).toMatchObject({ outcome:'rejected',dataRecordCount:total,
    admittedRecordCount:0,rejectedRecordCount:total,inspectedValidCount:valid,
    inspectedInvalidCount:invalid,inspectionComplete:complete });
  if (complete) expect(status.dataRecordCount).toBe(status.admittedRecordCount + status.rejectedRecordCount);
  expect(await reconciliationFacts([id])).toEqual([]);
  expect(await batches.original('user',id)).toEqual(bytes);
});

test('IOP-048 partial receiver rollback contributes no measures and preserves the full rejected count', async () => {
  const batches = new ImportBatches(pool,reconciliationSource);
  // Synthetic relabeling onto an unused date; it establishes no source coverage.
  const input = await receiveCsv(batches,'Hitliste-20260702.csv',fixtureBytes(oracle.validFiles[0].path));
  const failing = { ...reconciliationReceiver,publish:async (tx,batch,prepared) => {
    await reconciliationReceiver.publish(tx,batch,{ ...prepared,records:prepared.records.slice(0,1) });
    throw new Error('Synthetic partial publication failure');
  } };
  await expect(publishCsv(batches,input,failing)).rejects.toBeInstanceOf(ImportOutcomeUnknownError);
  expect(await reconciliationFacts([input.id])).toEqual([]);
  await batches.failProcessing('user',input.id,input.inspection);
  expect(await batches.review('user',input.id)).toMatchObject({ outcome:'failed',
    dataRecordCount:6,admittedRecordCount:0,rejectedRecordCount:6 });
  expect(await batches.reconcile('user',input.id,reconciliationReceiver)).toBe('failed');
});

// Run after receiver scenarios: provisioning requires removing disposable grants.
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
