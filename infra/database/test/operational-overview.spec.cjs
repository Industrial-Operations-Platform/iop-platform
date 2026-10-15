const {PostgreSqlContainer}=require('@testcontainers/postgresql');
const {Client,Pool}=require('pg');
const {randomUUID}=require('node:crypto');
const {provision}=require('../dist/provision');const {migrate}=require('../dist/migrate');const {provisioningConfiguration}=require('../dist/configuration');
const {seedOrganization}=require('../dist/seed-organization');const {seedSite}=require('../dist/seed-site');const {seedUser}=require('../dist/seed-user');const {seedMembership}=require('../dist/seed-membership');
const {siteRoles}=require('../../../apps/api/dist/modules/users-rbac/domain/profiles');const {evaluateSiteAccess}=require('../../../apps/api/dist/modules/users-rbac');const {sitePersonProfile}=require('../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people');
const {runSiteOperation,SiteAccessDeniedError}=require('../../../apps/api/dist/persistence/site-operation');
const {Assets}=require('../../../apps/api/dist/modules/assets/application/assets');const {PgAssets}=require('../../../apps/api/dist/modules/assets/adapters/postgres/store');
const {Handover}=require('../../../apps/api/dist/modules/shift-handover/application/handover');const {PgHandover}=require('../../../apps/api/dist/modules/shift-handover/adapters/postgres/store');
const {Maintenance}=require('../../../apps/api/dist/modules/maintenance/application/maintenance');const {PgMaintenance}=require('../../../apps/api/dist/modules/maintenance/adapters/postgres/store');
const {composePlatformOverview}=require('../../../apps/api/dist/host/overview-composition');
let container,configs,pool,app,services;
const scope={organizationId:'overview-org',siteId:'overview-site'},locations=[{id:'dept',label:'Fixture department',parentId:'',role:'department',sectorKey:''},{id:'area',label:'Fixture area',parentId:'dept',role:'area',sectorKey:''}];
const now=()=> '2026-10-14T12:00:00.000Z';
async function admin(work){const c=new Client(configs.bootstrap);await c.connect();try{return await work(c);}finally{await c.end();}}
const allowed=(tx,actor,p,target=scope)=>evaluateSiteAccess(tx,{...target,userId:actor,permissions:[p]}).then(r=>r.allowed);
async function can(actor,permission,target=scope){try{await runSiteOperation(pool,{...target,userId:actor,permissions:[permission]},async()=>{});return true;}catch(error){if(error instanceof SiteAccessDeniedError)return false;throw error;}}
function sourceServices(target=scope){const names=async(_tx,ids)=>new Map(ids.map(id=>[id,id]));const assets=new Assets(new PgAssets(pool,target,{allowed:(tx,a,p)=>allowed(tx,a,p,target),names,sources:[]}),locations,'UTC',randomUUID,now);
 const people=async tx=>{const result=await tx.query('SELECT user_id AS id,display_name AS name FROM users_rbac.profiles WHERE organization_id=$1 AND site_id=$2',[target.organizationId,target.siteId]);return result.rows;};
 const handover=new Handover(new PgHandover(pool,target,{allowed:(tx,a,p)=>allowed(tx,a,p,target),people,names,equipment:async()=>({codes:[],nextCursor:''})}),{locations,categories:[{id:'note',label:'Note'}],timeZone:'UTC',externalSystemLabel:'External reference'},randomUUID,now);
 const maintenance=new Maintenance(new PgMaintenance(pool,target,{allowed:(tx,a,p)=>allowed(tx,a,p,target),people,names,teams:async()=>[],assets:async()=>[],asset:async()=>null}),locations,[{id:'normal',label:'Normal',rank:1}],now,'UTC');
 return {assets,handover,maintenance};}
function service(target=scope){return composePlatformOverview(pool,{...target,siteTimeZone:'UTC'},locations,sourceServices(target));}
beforeAll(async()=>{container=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();const env={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),IOP_DATABASE_NAME:'iop_local',IOP_POSTGRES_PASSWORD:'synthetic-bootstrap-password',IOP_MIGRATOR_PASSWORD:'synthetic-migrator-password',IOP_RUNTIME_PASSWORD:'synthetic-runtime-password'};configs=provisioningConfiguration(env);await provision(configs);await migrate(configs.migrator);await provision(configs);
 for(const [org,site,users] of [['overview-org','overview-site',[['view-admin','administrator'],['view-lead','team-leader'],['view-task','task-force'],['view-tech','technician']]],['other-org','other-site',[['other-admin','administrator']]]]){const seed={...env,IOP_SEED_ORGANIZATION_ID:org,IOP_SEED_ORGANIZATION_NAME:'Fictional organization',IOP_SEED_SITE_ID:site,IOP_SEED_SITE_NAME:'Fictional site',IOP_SEED_SITE_TIME_ZONE:'UTC'};await seedOrganization(seed);await seedSite(seed);for(const [id,profile] of users){await seedUser({...seed,IOP_SEED_USER_ID:id});await seedMembership({...seed,IOP_SEED_USER_ID:id});await admin(async c=>{await c.query('INSERT INTO users_rbac.profiles(organization_id,site_id,user_id,display_name,profile) VALUES($1,$2,$3,$3,$4)',[org,site,id,profile]);for(const role of siteRoles(profile))await c.query('INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES($1,$2,$3,$4,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true',[org,site,id,role]);});}}
 pool=new Pool({...configs.runtime,max:10});services=sourceServices();app=service();
 const asset=await services.assets.save('view-admin',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{code:'shared-sensor',name:'Local fixture sensor',type:'Sensor',locationId:'area',status:'unverified',validationNote:'',description:'Local source record',aliases:[]}});
 const foreign=sourceServices({organizationId:'other-org',siteId:'other-site'});await foreign.assets.save('other-admin',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{code:'shared-sensor',name:'Foreign fixture sensor',type:'Sensor',locationId:'area',status:'unverified',validationNote:'',description:'Foreign source record',aliases:[]}});
 await services.handover.create('view-tech',{key:randomUUID(),issue:true,responsibleId:'',content:{date:'2026-10-14',categoryId:'note',summary:'shared-sensor reported issue',details:'Source-owned journal fixture',departmentId:'dept',areaId:'area',equipmentCode:'',equipmentNamespace:'site-equipment',condition:'',externalReference:'',challenge:'',cause:'',measure:'',dueDate:'',feedbackDueDate:'',discuss:false}});
 await services.maintenance.save('view-admin',{id:randomUUID(),expectedRevision:0,reason:'',data:{title:'shared-sensor inspection',details:'Source-owned maintenance fixture',locationId:'area',assetId:'',priorityId:'normal',assigneeId:'',teamId:'',status:'open',dueDate:'',outcome:'',blockedReason:'',externalReference:''}});
});
afterAll(async()=>{if(pool)await pool.end();if(container)await container.stop();});
const query={query:'shared-sensor',locationId:'area',cursors:{assets:'',handover:'',maintenance:''}};
test.each(['view-admin','view-lead','view-task'])('real %s source reads return only their configured scope',async actor=>{const result=await app.search(actor,query);expect(result.groups.find(g=>g.source==='assets').items[0]).toMatchObject({title:'shared-sensor',summary:'shared-sensor',date:''});expect(JSON.stringify(result.groups.find(g=>g.source==='assets'))).not.toContain('Local source record');expect(JSON.stringify(result)).not.toContain('Foreign source record');expect(result.groups.find(g=>g.source==='handover').total).toBe(1);expect(result.groups.find(g=>g.source==='maintenance').total).toBe(1);});
test('technician gets journal sources while broader stale grants cannot override its current profile',async()=>{await admin(c=>c.query("INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES('overview-org','overview-site','view-tech','assets-reader',true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true"));const result=await app.search('view-tech',query);expect(result.groups.find(g=>g.source==='assets')).toMatchObject({coverage:'not-authorized',items:[]});expect(result.groups.find(g=>g.source==='maintenance')).toMatchObject({coverage:'not-authorized',items:[]});expect(result.groups.find(g=>g.source==='handover').items).toHaveLength(1);});
test('current grant revocation and foreign membership stop new results',async()=>{await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id='overview-org' AND site_id='overview-site' AND user_id='view-task' AND role_id='assets-reader'"));expect((await app.search('view-task',query)).groups.find(g=>g.source==='assets')).toMatchObject({coverage:'not-authorized',items:[]});await expect(app.context('other-admin')).rejects.toMatchObject({code:'overview_denied'});});
test('area context uses actual authorized source totals and explicit unconfigured optional sources',async()=>{const result=await app.area('view-admin',{locationId:'area',date:'2026-10-14',recordId:''});expect(result.groups.find(g=>g.view==='pending').total).toBe(1);expect(result.groups.find(g=>g.view==='daily').total).toBe(1);expect(result.groups.find(g=>g.source==='maintenance'&&g.view==='open').total).toBe(1);expect(result.groups.find(g=>g.source==='maintenance'&&g.view==='blocked').total).toBe(0);expect(result.analytics).toMatchObject({coverage:'not-configured',frequency:null});expect(result.shifts.previous).toBeNull();});

test('revoking only Workforce access leaves independently authorized source reads available',async()=>{
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id='overview-org' AND site_id='overview-site' AND user_id='view-lead' AND role_id IN ('workforce-reader','workforce-planner','workforce-administrator')"));
 expect(await can('view-lead','workforce.read')).toBe(false);
 const result=await app.search('view-lead',query);
 for(const source of ['assets','handover','maintenance'])expect(result.groups.find(g=>g.source===source)).toMatchObject({coverage:'available',total:1});
 const area=await app.area('view-lead',{locationId:'area',date:'2026-10-14',recordId:''});
 expect(area.groups.find(g=>g.view==='pending')).toMatchObject({coverage:'available',total:1});
 expect(area.groups.find(g=>g.view==='registry')).toMatchObject({coverage:'available',total:1});
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id='overview-org' AND site_id='overview-site' AND user_id='view-lead'"));
 await expect(app.context('view-lead')).rejects.toMatchObject({code:'overview_denied'});
});

test('compact operational identity pages retain full totals without opening standalone registry content',async()=>{
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='view-task' AND role_id IN ('assets-reader','locator-reader')"));
 for(let index=0;index<28;index++)await services.assets.save('view-admin',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{code:`operational-bound-${String(index).padStart(2,'0')}`,name:'Owner source name',type:'Private model',locationId:'area',status:'unverified',validationNote:'',description:'Private registry details',aliases:[]}});
 const selection={query:'operational-bound-',locationId:'dept',cursors:{assets:'',handover:'',maintenance:''}};
 const first=(await app.search('view-task',selection)).groups.find(group=>group.source==='assets');
 const second=(await app.search('view-task',{...selection,cursors:{...selection.cursors,assets:first.nextCursor}})).groups.find(group=>group.source==='assets');
 expect(first).toMatchObject({coverage:'available',total:28});expect(first.items).toHaveLength(25);
 expect(second).toMatchObject({coverage:'available',total:28,nextCursor:''});expect(second.items).toHaveLength(3);
 expect(new Set([...first.items,...second.items].map(item=>item.assetId)).size).toBe(28);
 expect(JSON.stringify([first,second])).not.toContain('Private');
 await expect(services.assets.context('view-task')).rejects.toBeInstanceOf(SiteAccessDeniedError);
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='view-task' AND role_id='locator-reader'"));
 expect((await app.search('view-task',selection)).groups.find(group=>group.source==='assets')).toMatchObject({coverage:'not-authorized',items:[],total:0});
});
