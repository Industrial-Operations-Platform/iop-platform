const {PostgreSqlContainer}=require('@testcontainers/postgresql');
const {Client,Pool}=require('pg');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {provision}=require('../dist/provision');
const {migrate}=require('../dist/migrate');
const {provisioningConfiguration}=require('../dist/configuration');
const {seedOrganization}=require('../dist/seed-organization');
const {seedSite}=require('../dist/seed-site');
const {seedUser}=require('../dist/seed-user');
const {seedMembership}=require('../dist/seed-membership');
const {siteRoles}=require('../../../apps/api/dist/modules/users-rbac/domain/profiles');
const {composeConnections}=require('../../../apps/api/dist/host/connections-composition');
const {emptyConnection}=require('../../../apps/api/dist/modules/integrations/domain/connections');
const {runSiteOperation}=require('../../../apps/api/dist/persistence/site-operation');
let container,configs,pool,connections;
const scope={organizationId:'org-a',siteId:'site-a'};
async function db(role,work){const client=new Client(configs[role]);await client.connect();try{return await work(client);}finally{await client.end();}}
beforeAll(async()=>{
  container=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local')
    .withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  const env={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),
    IOP_DATABASE_NAME:'iop_local',IOP_POSTGRES_PASSWORD:'synthetic-bootstrap-password',IOP_MIGRATOR_PASSWORD:'synthetic-migrator-password',IOP_RUNTIME_PASSWORD:'synthetic-runtime-password'};
  configs=provisioningConfiguration(env);await provision(configs);await migrate(configs.migrator);await provision(configs);
  for(const [org,site,people] of [['org-a','site-a',[['admin','administrator'],['lead','team-leader'],['task','task-force'],['tech','technician']]],['org-b','site-b',[['foreign','administrator']]]]){
    const seed={...env,IOP_SEED_ORGANIZATION_ID:org,IOP_SEED_ORGANIZATION_NAME:org,IOP_SEED_SITE_ID:site,IOP_SEED_SITE_NAME:site,IOP_SEED_SITE_TIME_ZONE:'UTC'};
    await seedOrganization(seed);await seedSite(seed);
    for(const [id,profile] of people){
      await seedUser({...seed,IOP_SEED_USER_ID:id});await seedMembership({...seed,IOP_SEED_USER_ID:id});
      await db('bootstrap',async c=>{
        await c.query('INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,$2,$4)',[org,id,site,profile]);
        await c.query('DELETE FROM users_rbac.site_role_assignments WHERE organization_id=$1 AND site_id=$2 AND user_id=$3',[org,site,id]);
        for(const role of siteRoles(profile))await c.query('INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,$4,true)',[org,id,site,role]);
      });
    }
  }
  pool=new Pool({...configs.runtime,max:5});connections=composeConnections(pool,scope);
},90000);
afterAll(async()=>{if(pool)await pool.end();if(container)await container.stop();});
test('registry starts honestly unconfigured and only Administrator can inspect',async()=>{
  for(const actor of ['admin']){
    const result=await connections.query(actor);
    expect(result.connections).toHaveLength(3);
    expect(result.connections.every(c=>c.lastSuccessfulConnection===null)).toBe(true);
  }
  for(const actor of ['lead','task','tech']) await expect(connections.query(actor)).rejects.toThrow();
  await expect(connections.query('foreign')).rejects.toThrow();
});
test('concurrent saves retain one projection and one immutable revision',async()=>{
  const configuration={...emptyConnection('wincc').configuration,enabled:true,endpoint:'https://example.invalid',contractVersion:'v1',credentialReference:'WINCC'};
  const results=await Promise.allSettled([connections.save('admin',{expectedRevision:0,configuration}),connections.save('admin',{expectedRevision:0,configuration})]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
  const history=await connections.history('admin','wincc');expect(history.revisions).toHaveLength(1);
  expect((await connections.query('admin')).connections.find(c=>c.configuration.kind==='wincc').status).toBe('transport-pending');
  await expect(connections.save('task',{expectedRevision:1,configuration})).rejects.toThrow();
});
test('current profile rejects a stray Technician grant and revocation denies new reads',async()=>{
  await db('bootstrap',c=>c.query("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('org-a','tech','site-a','integration-reader',true)"));
  await expect(connections.query('tech')).rejects.toThrow('integration_denied');
  await db('bootstrap',c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id='org-a' AND user_id='lead' AND site_id='site-a' AND role_id='integration-reader'"));
  await expect(connections.query('lead')).rejects.toThrow();
});
test('non-administrator profiles cannot inspect the registry through stale integration grants',async()=>{
  for(const actor of ['lead','task']) {
    for(const role of ['integration-reader','integration-manager']) await db('bootstrap',c=>c.query(
      "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('org-a',$1,'site-a',$2,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true",[actor,role]));
    await expect(connections.query(actor)).rejects.toThrow('integration_denied');
    await expect(connections.history(actor,'wincc')).rejects.toThrow('integration_denied');
  }
});
test('runtime cannot mutate immutable revision evidence and RLS hides foreign registry',async()=>{
  await db('runtime',async c=>{
    await c.query('BEGIN');
    await c.query("SELECT set_config('iop.organization_id','org-b',true),set_config('iop.site_id','site-b',true)");
    expect((await c.query('SELECT kind FROM integrations.connections')).rows).toHaveLength(0);
    await c.query('ROLLBACK');
    await expect(c.query('UPDATE integrations.connection_revisions SET revision=99')).rejects.toMatchObject({code:'42501'});
    await expect(c.query('DELETE FROM integrations.connections')).rejects.toMatchObject({code:'42501'});
  });
  await expect(runSiteOperation(pool,{...scope,userId:'admin',permissions:['integrations.read']},async tx=>{
    await tx.query("UPDATE integrations.connections SET revision=999 WHERE kind='wincc' AND organization_id=$1 AND site_id=$2",[scope.organizationId,scope.siteId]);
    throw new Error('rollback requested');
  })).rejects.toThrow('rollback requested');
  expect((await connections.query('admin')).connections.find(c=>c.configuration.kind==='wincc').revision).toBe(1);
});
test('configuration migration revokes obsolete profile grants and preserves operational reads, administrators and profileless native operators',async()=>{
  const restricted=['assets-administrator','integration-reader','integration-manager','locator-manager','workforce-administrator','maintenance-administrator','site-operator','jobs-administrator'];
  await db('bootstrap',async c=>{
    await c.query("INSERT INTO users_rbac.users(user_id,is_active) VALUES('native-operator',true)");
    await c.query("INSERT INTO users_rbac.organization_memberships(organization_id,user_id,is_active) VALUES('org-a','native-operator',true)");
    await c.query("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('org-a','native-operator','site-a','site-operator',true)");
    for(const role of restricted) await c.query(
      "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('org-a','lead','site-a',$1,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true",[role]);
    await c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='admin' AND role_id='jobs-administrator'");
  });
  await db('migrator',c=>c.query(readFileSync(join(__dirname,'../migrations/20261020000000-administrator-configuration.sql'),'utf8')));
  const grants=await db('bootstrap',c=>c.query("SELECT user_id,role_id,is_active FROM users_rbac.site_role_assignments WHERE organization_id='org-a' AND site_id='site-a'"));
  expect(grants.rows.filter(row=>row.user_id==='lead'&&restricted.includes(row.role_id)).every(row=>!row.is_active)).toBe(true);
  expect(grants.rows.find(row=>row.user_id==='lead'&&row.role_id==='assets-reader').is_active).toBe(true);
  expect(grants.rows.find(row=>row.user_id==='admin'&&row.role_id==='assets-administrator').is_active).toBe(true);
  expect(grants.rows.find(row=>row.user_id==='admin'&&row.role_id==='jobs-administrator').is_active).toBe(false);
  expect(grants.rows.find(row=>row.user_id==='native-operator'&&row.role_id==='site-operator').is_active).toBe(true);
});
