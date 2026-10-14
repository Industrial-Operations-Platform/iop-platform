const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const fs = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { provision } = require('../dist/provision');
const { migrate } = require('../dist/migrate');
const { provisioningConfiguration } = require('../dist/configuration');
const { seedOrganization } = require('../dist/seed-organization');
const { seedSite } = require('../dist/seed-site');
const { seedUser } = require('../dist/seed-user');
const { seedMembership } = require('../dist/seed-membership');
const { Client, Pool } = require('pg');
const { siteRoles } = require('../../../apps/api/dist/modules/users-rbac/domain/profiles');
const { evaluateSiteAccess } = require('../../../apps/api/dist/modules/users-rbac');
const { sitePeople, sitePersonNames } = require('../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people');
const { Handover } = require('../../../apps/api/dist/modules/shift-handover/application/handover');
const { PgHandover } = require('../../../apps/api/dist/modules/shift-handover/adapters/postgres/store');
const { composeJobs } = require('../../../apps/api/dist/host/operating-composition');
const { backup,restore } = require('../../../scripts/local/full-backup.cjs');
const archive = require('../../../scripts/local/operations/archive.cjs');
const database = require('../../../scripts/local/operations/docker-database.cjs');
let container,directory,restored,configs;
beforeAll(async()=>{
  container=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-backup-bootstrap').start();
  const env={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),IOP_DATABASE_NAME:'iop_local',IOP_POSTGRES_PASSWORD:'synthetic-backup-bootstrap',IOP_MIGRATOR_PASSWORD:'synthetic-backup-migrator',IOP_RUNTIME_PASSWORD:'synthetic-backup-runtime'};
  configs=provisioningConfiguration(env);await provision(configs);await migrate(configs.migrator);await provision(configs);
  const seed={...env,IOP_SEED_ORGANIZATION_ID:'backup-org',IOP_SEED_ORGANIZATION_NAME:'Synthetic',IOP_SEED_SITE_ID:'backup-site',IOP_SEED_SITE_NAME:'Synthetic',IOP_SEED_SITE_TIME_ZONE:'UTC',IOP_SEED_USER_ID:'backup-admin'};
  await seedOrganization(seed);await seedSite(seed);await seedUser(seed);await seedMembership(seed);
  const client=new Client(configs.bootstrap);await client.connect();try{await client.query("INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES('backup-org','backup-admin','backup-site','Synthetic','administrator')");for(const role of siteRoles('administrator'))await client.query("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('backup-org','backup-admin','backup-site',$1,true) ON CONFLICT DO NOTHING",[role]);}finally{await client.end();}
  const scope={organizationId:'backup-org',siteId:'backup-site'},pool=new Pool(configs.runtime);
  try {
    const allowed=async(tx,actor,permission)=>(await evaluateSiteAccess(tx,{...scope,userId:actor,permissions:[permission]})).allowed;
    const journal=new Handover(new PgHandover(pool,scope,{allowed,people:(tx)=>sitePeople(tx,scope.organizationId,scope.siteId),names:(tx,ids)=>sitePersonNames(tx,scope.organizationId,scope.siteId,ids),equipment:async()=>({codes:[],nextCursor:''})}),
      {locations:[{id:'department',label:'Synthetic department',parentId:'',role:'department',sectorKey:''}],categories:[{id:'problems',label:'Problems'}],externalSystemLabel:'Work reference',timeZone:'UTC'},require('node:crypto').randomUUID,()=> '2026-10-14T10:00:00.000Z');
    const entry=await journal.create('backup-admin',{key:'backup-journal',issue:true,responsibleId:'backup-admin',content:{date:'2026-10-14',categoryId:'problems',summary:'Retained operational history',details:'Synthetic recovery evidence',departmentId:'department',areaId:'',equipmentCode:'',equipmentNamespace:'site-equipment',condition:'',externalReference:'',challenge:'',cause:'',measure:'',dueDate:'',feedbackDueDate:'',discuss:true}});
    await journal.change('backup-admin',{id:entry.id,expectedRevision:1,action:'follow-up',note:'Retained second revision'});
    const jobs=composeJobs(pool,scope);await jobs.submit('backup-admin',{key:'backup-job',type:'local-check',payload:{value:42}});await jobs.tick('backup-admin');
  } finally { await pool.end(); }
  directory=await fs.mkdtemp(join(tmpdir(),'iop-full-restore-test-'));const input=join(directory,'private');await fs.mkdir(join(input,'locator','references'),{recursive:true});await fs.mkdir(join(input,'locator','traces'));
  await fs.writeFile(join(input,'postgres.env'),'POSTGRES_DB=iop_local\nPOSTGRES_USER=iop_bootstrap\nPOSTGRES_PASSWORD=synthetic-backup-bootstrap\n',{mode:0o600});
  await fs.writeFile(join(input,'setup.env'),'IOP_MIGRATOR_PASSWORD=synthetic-backup-migrator\nIOP_RUNTIME_PASSWORD=synthetic-backup-runtime\n',{mode:0o600});
  await fs.writeFile(join(input,'locator','references','area.png'),Buffer.from([137,80,78,71,13,10,26,10]));await fs.writeFile(join(input,'locator','traces','scene.json'),'{"provisional":true}');
  await archive.createKey(join(directory,'separate.key'));
},90000);
afterAll(async()=>{if(restored)database.cleanupRestore(restored.container);if(container)await container.stop();if(directory)await fs.rm(directory,{recursive:true,force:true});});
test('full database, credentials/grants, private configuration and PNG/trace references restore into a fresh isolated stopped installation with exact verification',async()=>{
  const input=join(directory,'private'),output=join(directory,'platform.iopbk'),keyPath=join(directory,'separate.key');
  const result=await backup({container:container.getId(),privateRoot:input,keyPath,output});expect(result.tables).toBeGreaterThan(10);expect(result.rows).toBeGreaterThan(0);
  const destination=join(directory,'isolated');restored=await restore({input:output,keyPath,destination});expect(restored).toMatchObject({verified:true,network:'none',state:'stopped'});expect(restored.tables).toBe(result.tables);expect(restored.rows).toBe(result.rows);
  expect(await fs.readFile(join(destination,'private','locator','traces','scene.json'),'utf8')).toBe('{"provisional":true}');
  expect(await archive.digest(join(destination,'private','locator','references','area.png'))).toBe(await archive.digest(join(input,'locator','references','area.png')));
  const source=new Client(configs.bootstrap);await source.connect();try{expect((await source.query("SELECT count(*)::integer AS total FROM users_rbac.profiles WHERE organization_id='backup-org'")).rows[0].total).toBe(1);}finally{await source.end();}
  await expect(restore({input:output,keyPath,destination})).rejects.toThrow();
},120000);
