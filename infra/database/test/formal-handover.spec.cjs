const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client, Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const { provision } = require('../dist/provision');
const { migrate } = require('../dist/migrate');
const { provisioningConfiguration } = require('../dist/configuration');
const { seedOrganization } = require('../dist/seed-organization');
const { seedSite } = require('../dist/seed-site');
const { seedUser } = require('../dist/seed-user');
const { seedMembership } = require('../dist/seed-membership');
const { FormalHandover } = require('../../../apps/api/dist/modules/shift-handover/application/formal-records');
const { PgFormalHandover } = require('../../../apps/api/dist/modules/shift-handover/adapters/postgres/formal-records');
const { Handover } = require('../../../apps/api/dist/modules/shift-handover/application/handover');
const { PgHandover } = require('../../../apps/api/dist/modules/shift-handover/adapters/postgres/store');
const { handoverAssetTimeline } = require('../../../apps/api/dist/modules/shift-handover/adapters/postgres/asset-history');
const { Workforce } = require('../../../apps/api/dist/modules/workforce/application/workforce');
const { PgWorkforce } = require('../../../apps/api/dist/modules/workforce/adapters/postgres/store');
const { workforceShiftReferences } = require('../../../apps/api/dist/modules/workforce/adapters/postgres/shift-reference');
const { IntlSiteClock } = require('../../../apps/api/dist/modules/workforce/adapters/time/site-clock');
const { Assets } = require('../../../apps/api/dist/modules/assets/application/assets');
const { PgAssets, assetReference, assetReferences } = require('../../../apps/api/dist/modules/assets/adapters/postgres/store');
const { siteRoles } = require('../../../apps/api/dist/modules/users-rbac/domain/profiles');
const { sitePeople, workforcePeople, sitePersonNames, sitePersonProfile } = require('../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people');
const { evaluateSiteAccess } = require('../../../apps/api/dist/modules/users-rbac');
const { runSiteOperation, SiteAccessDeniedError } = require('../../../apps/api/dist/persistence/site-operation');
const scope = { organizationId: 'formal-org', siteId: 'formal-site' };
const locations = [{ id: 'department', label: 'Department', parentId: '', role: 'department', sectorKey: '' },
  { id: 'area', label: 'Area', parentId: 'department', role: 'area', sectorKey: '' },
  { id: 'large-area', label: 'Large area', parentId: 'department', role: 'area', sectorKey: '' }];
const settings = { shifts: [{ id: 'early', label: 'Early', start: '05:00', end: '14:15', days: [0,1,2,3,4,5,6] },
  { id: 'late', label: 'Late', start: '13:45', end: '23:00', days: [0,1,2,3,4,5,6] }], targets: [{ id: 'department', label: 'Department', phone: '' }], teams: [] };
const at = () => '2026-10-31T23:00:00.000Z';
let container, configs, pool, formal, journal, workforce, assets;
async function db(role, work) { const client = new Client(configs[role]); await client.connect(); try { return await work(client); } finally { await client.end(); } }
const allowed = async (tx, actor, permission) => (await evaluateSiteAccess(tx, { ...scope, userId: actor, permissions: [permission] })).allowed;
const names = (tx, ids) => sitePersonNames(tx, scope.organizationId, scope.siteId, ids);
function formalService(target = scope, name = async (tx, actor) => (await names(tx, [actor])).get(actor) ?? actor) {
  return new FormalHandover(new PgFormalHandover(pool, target, { allowed: async (tx, actor, permission) => (await evaluateSiteAccess(tx, { ...target, userId: actor, permissions: [permission] })).allowed,
    profile: (tx, actor) => sitePersonProfile(tx, target.organizationId, target.siteId, actor), name,
    shifts: workforceShiftReferences }), locations, 'UTC', randomUUID, at);
}
function entryContent(day, summary = 'Guard inspection') { return { date: day, categoryId: 'problems', summary, details: 'Inspection is pending', departmentId: 'department', areaId: 'area', equipmentCode: '', equipmentNamespace: 'site-equipment',
  condition: 'inspection-needed', externalReference: '', challenge: '', cause: '', measure: '', dueDate: '', feedbackDueDate: '', discuss: true }; }
const query = (day) => ({ from: day, to: day, departmentId: 'department', areaId: 'area', cursor: '' });
async function shiftOn(day, type = 'early') {
  const person = type === 'early' ? 'tech-a' : 'tech-2';
  await workforce.save('admin-a', { kind: 'schedule', id: `${person}_${day}`, expectedRevision: 0, deleted: false,
    data: { userId: person, date: day, status: 'work', start: '05:00', end: '23:00' } });
  await workforce.save('lead-a', { kind: 'assignment', id: randomUUID(), expectedRevision: 0, deleted: false,
    data: { userId: person, date: day, shiftId: type, targetId: 'department', duty: 'zone', phone: '', start: '', end: '' } });
  return (await formal.shifts('task-a', query(day))).shifts.find((s) => s.shiftTypeId === type);
}
async function create(day, actor = 'lead-a', selected = []) {
  const source = await shiftOn(day);
  return formal.save(actor, { key: randomUUID(), id: '', expectedRevision: 0, note: '', content: {
    shiftId: source.id, shiftDate: source.date, departmentId: 'department', areaId: 'area', title: `Transfer ${day}`, summary: 'Guard inspection carries forward', entryIds: selected } });
}
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  const env = { IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(), IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
    IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password', IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password', IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password' };
  configs = provisioningConfiguration(env); await provision(configs); await migrate(configs.migrator); await provision(configs);
  for (const [organizationId, siteId, users] of [[scope.organizationId, scope.siteId, [['admin-a','administrator'],['lead-a','team-leader'],['task-a','task-force'],['tech-a','technician'],['tech-2','technician']]],
    ['foreign-org','foreign-site',[['foreign-admin','administrator']]]]) {
    const seed = { ...env, IOP_SEED_ORGANIZATION_ID: organizationId, IOP_SEED_ORGANIZATION_NAME: organizationId, IOP_SEED_SITE_ID: siteId, IOP_SEED_SITE_NAME: siteId, IOP_SEED_SITE_TIME_ZONE: 'UTC' };
    await seedOrganization(seed); await seedSite(seed);
    for (const [id, profile] of users) {
      await seedUser({ ...seed, IOP_SEED_USER_ID: id }); await seedMembership({ ...seed, IOP_SEED_USER_ID: id });
      await db('bootstrap', async (client) => {
        await client.query('INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,$2,$4)', [organizationId,id,siteId,profile]);
        await client.query('DELETE FROM users_rbac.site_role_assignments WHERE organization_id=$1 AND site_id=$2 AND user_id=$3', [organizationId,siteId,id]);
        for (const role of siteRoles(profile)) await client.query('INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,$4,true)', [organizationId,id,siteId,role]);
      });
    }
  }
  pool = new Pool({ ...configs.runtime, max: 5 }); formal = formalService();
  const directory = { allowed, names, people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId), profile: (tx, actor) => sitePersonProfile(tx, scope.organizationId, scope.siteId, actor) };
  workforce = new Workforce(new PgWorkforce(pool, scope, { ...directory, people: (tx) => workforcePeople(tx, scope.organizationId, scope.siteId) }), { decode: () => [] }, new IntlSiteClock(), settings, 'UTC', at);
  journal = new Handover(new PgHandover(pool, scope, { ...directory, equipment: async () => ({ codes: [], nextCursor: '' }),
    assetReference: async (tx, actor, id) => { if (!await allowed(tx, actor, 'assets.read')) throw new SiteAccessDeniedError(); return assetReference(tx,scope,id); },
    assetReferences: async (tx, actor, search) => { if (!await allowed(tx, actor, 'assets.read')) throw new SiteAccessDeniedError(); return assetReferences(tx,scope,search); } }),
    { locations, categories: [{ id: 'problems', label: 'Problems', carryForward: true, workflow: 'technical-problem' }], externalSystemLabel: 'Work reference', timeZone: 'UTC' }, randomUUID, at);
  assets = new Assets(new PgAssets(pool, scope, { allowed, names, sources: [], equipment: async () => [] }), locations, 'UTC', randomUUID, at);
}, 90000);
afterAll(async () => { if (pool) await pool.end(); if (container) await container.stop(); });

test('advanced profiles have real scoped formal access; Technician and current revoked grants are denied', async () => {
  for (const actor of ['admin-a','lead-a','task-a']) expect((await formal.context(actor)).canManageRecords).toBe(true);
  await expect(formal.context('tech-a')).rejects.toThrow('Site operation is not permitted.');
  await db('bootstrap', (client) => client.query("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,'tech-a',$2,'handover-record-manager',true)", [scope.organizationId,scope.siteId]));
  await expect(formal.context('tech-a')).rejects.toThrow('Site operation is not permitted.');
  await db('bootstrap', (client) => client.query("DELETE FROM users_rbac.site_role_assignments WHERE user_id='tech-a' AND role_id='handover-record-manager'"));
  await db('bootstrap', (client) => client.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='task-a' AND role_id='handover-record-manager'"));
  await expect(formal.context('task-a')).rejects.toThrow('Site operation is not permitted.');
  await db('bootstrap', (client) => client.query("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='task-a' AND role_id='handover-record-manager'"));
  await expect(formalService({ organizationId:'foreign-org', siteId:'foreign-site' }).context('admin-a')).rejects.toThrow('Site operation is not permitted.');
});
test('real storage closes and acknowledges atomic evidence without resolving live journal issues', async () => {
  const day = '2026-10-14', report = await journal.create('lead-a', { key: randomUUID(), issue: true, responsibleId: 'tech-a', content: entryContent(day) });
  const draft = await create(day, 'task-a', [report.id]);
  const open = await formal.transition('task-a', { id: draft.id, expectedRevision: 1, action: 'publish', note: 'Reviewed' });
  const closed = await formal.transition('task-a', { id: draft.id, expectedRevision: open.revision, action: 'close', note: 'Carry the guard forward' });
  expect(closed.entries[0].revision).toBe(1); expect(closed.pending.map((e) => e.id)).toContain(report.id);
  expect((await journal.history('tech-a', report.id)).entry.issueState).toBe('open');
  await journal.change('lead-a', { id: report.id, expectedRevision: 1, action:'state', state:'resolved', note:'Guard repaired later' });
  const ack = await formal.transition('lead-a', { id: draft.id, expectedRevision: closed.revision, action:'acknowledge', note:'Incoming leader reviewed' });
  expect(ack.pending.find((e) => e.id === report.id).issueState).toBe('open'); expect(ack.acknowledgements[0].actorId).toBe('lead-a');
  expect((await formal.history('admin-a', draft.id)).revisions).toHaveLength(4);
});
test('concurrent closes use optimistic conflict and preserve one close revision', async () => {
  const draft = await create('2026-10-15'); await formal.transition('lead-a', { id:draft.id, expectedRevision:1, action:'publish', note:'Reviewed' });
  const results = await Promise.allSettled(['lead-a','task-a'].map((actor) => formal.transition(actor, { id:draft.id, expectedRevision:2, action:'close', note:'Closed once' })));
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1); expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  expect((await formal.history('admin-a', draft.id)).revisions.filter((r) => r.action === 'closed')).toHaveLength(1);
});
test('changed selected entry revisions block closure until review; previous source shifts expose overlap and missing formal records', async () => {
  const day='2026-10-16', report=await journal.create('lead-a',{key:randomUUID(),issue:true,responsibleId:'',content:entryContent(day,'Changed review')});
  const draft=await create(day,'lead-a',[report.id]); await formal.transition('lead-a',{id:draft.id,expectedRevision:1,action:'publish',note:'Reviewed'});
  await journal.change('lead-a',{id:report.id,expectedRevision:1,action:'follow-up',note:'New inspection evidence'});
  await expect(formal.transition('lead-a',{id:draft.id,expectedRevision:2,action:'close',note:'Close stale review'})).rejects.toMatchObject({code:'handover_conflict'});
  expect((await formal.history('admin-a',draft.id)).revisions).toHaveLength(2);
  const late = await shiftOn(day,'late');
  const next = await formal.save('task-a',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{...draft.content,shiftId:late.id,title:'Late transfer',entryIds:[]}});
  const previous=await formal.previous('task-a',{id:next.id}); expect(previous.shift.shiftTypeId).toBe('early'); expect(previous.overlaps).toBe(true); expect(previous.record.id).toBe(draft.id);
});
test('projection/revision rollback is atomic on an invalid actor FK and runtime has forced RLS with no delete authority', async () => {
  const draft=await create('2026-10-17');
  const before=(await formal.history('admin-a',draft.id)).revisions.length;
  // Narrow test adapter deliberately returns an unregistered actor only in the event projection.
  const broken = new PgFormalHandover(pool,scope,{allowed,profile:(tx,actor)=>sitePersonProfile(tx,scope.organizationId,scope.siteId,actor),name:async()=> 'Administrator',shifts:workforceShiftReferences});
  await expect(broken.run('admin-a',true,async(tx)=> { const record=await tx.get(draft.id); record.revision++; record.content.summary='Must roll back';
    await tx.save(record,{record,actorId:'foreign-admin',actorName:'Foreign',at:at(),action:'corrected',note:'Invalid actor'}); })).rejects.toThrow('Site authorization is unavailable.');
  expect((await formal.history('admin-a',draft.id)).record.content.summary).toBe('Guard inspection carries forward'); expect((await formal.history('admin-a',draft.id)).revisions).toHaveLength(before);
  await db('runtime',async(client)=> {
    expect((await client.query('SELECT id FROM shift_handover.records')).rows).toHaveLength(0);
    expect((await client.query("SELECT has_table_privilege(current_user,'shift_handover.records','DELETE') AS can_delete")).rows[0].can_delete).toBe(false);
    await client.query('BEGIN'); await client.query("SELECT set_config('iop.organization_id','foreign-org',true),set_config('iop.site_id','foreign-site',true)");
    expect((await client.query('SELECT id FROM shift_handover.records')).rows).toHaveLength(0); await client.query('ROLLBACK');
  });
});
test('explicit canonical asset history works without aliases and original equipment evidence remains independent', async () => {
  const asset=await assets.save('task-a',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{code:'GUARD-SENSOR',name:'Guard sensor',type:'sensor',locationId:'area',status:'unverified',validationNote:'',description:'',aliases:[]}});
  const report=await journal.create('lead-a',{key:randomUUID(),issue:true,responsibleId:'',content:{...entryContent('2026-10-14','Explicit canonical reference'),assetId:asset.id}});
  const timeline=await runSiteOperation(pool,{...scope,userId:'task-a',permissions:['assets.read']},(tx)=>handoverAssetTimeline(tx,scope,{id:asset.id,aliases:[]},{from:'2026-10-01',to:'2026-10-31',cursor:null,limit:50,timeZone:'UTC'}));
  expect(timeline.total).toBe(1); expect(timeline.records[0].sourceRecordId).toBe(report.id); expect(timeline.unmapped).not.toBe(true);
  expect(report.content.equipmentCode).toBe(''); expect(report.assetReference.id).toBe(asset.id);
  await expect(journal.create('tech-a',{key:randomUUID(),issue:true,responsibleId:'',content:{...entryContent('2026-10-31'),assetId:asset.id}})).rejects.toThrow('Site operation is not permitted.');
});

test('closure rejects more than 100 pending reports atomically instead of retaining incomplete evidence', async () => {
  const day='2026-10-18', source=await shiftOn(day);
  for(let i=0;i<101;i++) await journal.create('lead-a',{key:randomUUID(),issue:true,responsibleId:'',content:{...entryContent(day,`Capacity report ${i}`),areaId:'large-area'}});
  const draft=await formal.save('lead-a',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{shiftId:source.id,shiftDate:day,departmentId:'department',areaId:'large-area',title:'Capacity transfer',summary:'Review pending scope',entryIds:[]}});
  await formal.transition('lead-a',{id:draft.id,expectedRevision:1,action:'publish',note:'Published'});
  await expect(formal.transition('lead-a',{id:draft.id,expectedRevision:2,action:'close',note:'Must not truncate'})).rejects.toMatchObject({code:'handover_capacity'});
  const history=await formal.history('admin-a',draft.id);expect(history.record.state).toBe('open');expect(history.revisions).toHaveLength(2);
  const pending=await formal.candidates('task-a',{departmentId:'department',areaId:'large-area',through:day});expect(pending.total).toBe(101);expect(pending.entries).toHaveLength(100);
});
test('record pages preserve exact totals, stable cursor order and idempotent concurrent creation', async () => {
  const records=[];
  for(let i=1;i<=21;i++) records.push(await create(`2026-09-${String(i).padStart(2,'0')}`));
  const selection={from:'2026-09-01',to:'2026-09-21',departmentId:'department',areaId:'area',cursor:''};
  const first=await formal.query('task-a',selection);expect(first.total).toBe(21);expect(first.records).toHaveLength(20);
  const second=await formal.query('task-a',{...selection,cursor:first.nextCursor});expect(second.total).toBe(21);expect(second.records).toHaveLength(1);expect(second.nextCursor).toBe('');
  expect([...first.records,...second.records].map((r)=>r.id)).toEqual(records.reverse().map((r)=>r.id));
  const source=await shiftOn('2026-10-19'),input={key:randomUUID(),id:'',expectedRevision:0,note:'',content:{shiftId:source.id,shiftDate:source.date,departmentId:'department',areaId:'area',title:'Concurrent transfer',summary:'',entryIds:[]}};
  const results=await Promise.all([formal.save('lead-a',input),formal.save('lead-a',input)]);expect(results[0].id).toBe(results[1].id);expect((await formal.history('task-a',results[0].id)).revisions).toHaveLength(1);
});
