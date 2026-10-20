const { PostgreSqlContainer }=require('@testcontainers/postgresql');
const { Client,Pool }=require('pg');
const { randomUUID, createHash }=require('node:crypto');
const { readFileSync, mkdtempSync, rmSync }=require('node:fs');
const { join }=require('node:path');
const { tmpdir }=require('node:os');
const { provision }=require('../dist/provision');
const { migrate }=require('../dist/migrate');
const { provisioningConfiguration }=require('../dist/configuration');
const { seedOrganization }=require('../dist/seed-organization');
const { seedSite }=require('../dist/seed-site');
const { seedUser }=require('../dist/seed-user');
const { seedMembership }=require('../dist/seed-membership');
const { siteRoles }=require('../../../apps/api/dist/modules/users-rbac/domain/profiles');
const { evaluateSiteAccess }=require('../../../apps/api/dist/modules/users-rbac');
const { sitePersonProfile }=require('../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people');
const { Locator }=require('../../../apps/api/dist/modules/asset-locator/application/locator');
const { PgLocator }=require('../../../apps/api/dist/modules/asset-locator/adapters/postgres/store');
const { demonstration, locatorLimits }=require('../../../apps/api/dist/modules/asset-locator/domain/locator');
const { locatorAsset,locatorAssets }=require('../../../apps/api/dist/modules/assets/adapters/postgres/locator-read');
const { Assets }=require('../../../apps/api/dist/modules/assets/application/assets');
const { PgAssets }=require('../../../apps/api/dist/modules/assets/adapters/postgres/store');
const { runSiteOperation }=require('../../../apps/api/dist/persistence/site-operation');
const { composePlatformLocator }=require('../../../apps/api/dist/host/locator-composition');
const { composeAccess }=require('../../../apps/api/dist/host/access-composition');
let container,configs,pool,asset,referenceRoot;
const scope={organizationId:'locator-org',siteId:'locator-site'},locations=[{id:'area',label:'Fixture area',parentId:'',role:'area',sectorKey:''}];
async function admin(work){const client=new Client(configs.bootstrap);await client.connect();try{return await work(client);}finally{await client.end();}}
const allowed=(tx,actor,permission,target=scope)=>evaluateSiteAccess(tx,{...target,userId:actor,permissions:[permission]}).then(r=>r.allowed);
function service(target=scope){return new Locator(new PgLocator(pool,target,{allowed:(tx,actor,p)=>allowed(tx,actor,p,target),profile:(tx,actor)=>sitePersonProfile(tx,target.organizationId,target.siteId,actor),asset:async(tx,id)=>(await allowed(tx,tx.context.userId,'assets.read',target))?locatorAsset(tx,id):null,assets:async(tx,search)=>(await allowed(tx,tx.context.userId,'assets.read',target))?locatorAssets(tx,search):[],problems:async()=>({items:[],coverage:[{kind:'handover',status:'not-authorized'},{kind:'maintenance',status:'not-authorized'}]})}),{list:async()=>[],bytes:async()=>new Uint8Array(),components:async()=>[]},locations,randomUUID,()=>new Date().toISOString());}
beforeAll(async()=>{container=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();const env={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),IOP_DATABASE_NAME:'iop_local',IOP_POSTGRES_PASSWORD:'synthetic-bootstrap-password',IOP_MIGRATOR_PASSWORD:'synthetic-migrator-password',IOP_RUNTIME_PASSWORD:'synthetic-runtime-password'};configs=provisioningConfiguration(env);await provision(configs);await migrate(configs.migrator);await provision(configs);
 for(const [org,site,users] of [['locator-org','locator-site',[['locator-admin','administrator'],['locator-lead','team-leader'],['locator-task','task-force'],['locator-tech','technician']]],['locator-other','locator-foreign',[['locator-foreign-user','administrator']]]]){const seed={...env,IOP_SEED_ORGANIZATION_ID:org,IOP_SEED_ORGANIZATION_NAME:'Fictional organization',IOP_SEED_SITE_ID:site,IOP_SEED_SITE_NAME:'Fictional site',IOP_SEED_SITE_TIME_ZONE:'UTC'};await seedOrganization(seed);await seedSite(seed);for(const [id,profile] of users){await seedUser({...seed,IOP_SEED_USER_ID:id});await seedMembership({...seed,IOP_SEED_USER_ID:id});await admin(async c=>{await c.query('INSERT INTO users_rbac.profiles(organization_id,site_id,user_id,display_name,profile) VALUES($1,$2,$3,$3,$4)',[org,site,id,profile]);for(const role of siteRoles(profile))await c.query('INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES($1,$2,$3,$4,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true',[org,site,id,role]);});}}
 pool=new Pool({...configs.runtime,max:4});const assets=new Assets(new PgAssets(pool,scope,{allowed:(tx,actor,p)=>allowed(tx,actor,p),names:async(_tx,ids)=>new Map(ids.map(id=>[id,id])),sources:[]}),locations,'UTC',randomUUID,()=>new Date().toISOString());asset=await assets.save('locator-admin',{key:randomUUID(),id:'',expectedRevision:0,note:'',content:{code:'fixture-sensor',name:'Fixture sensor',type:'Sensor',locationId:'area',status:'unverified',validationNote:'',description:'Synthetic locator test asset',aliases:[]}});
});
afterAll(async()=>{if(pool)await pool.end();if(container)await container.stop();if(referenceRoot)rmSync(referenceRoot,{recursive:true,force:true});});
test('real scoped runtime persists placements and immutable revisions; concurrent stale save loses cleanly',async()=>{const app=service(),content=demonstration();content.components[0].assetId=asset.id;const created=await app.save('locator-admin',{id:'',expectedRevision:0,note:'Explicit fixture link',content});const updates=await Promise.allSettled([app.save('locator-admin',{id:created.id,expectedRevision:1,note:'First revision',content:{...content,name:'First revision'}}),app.save('locator-admin',{id:created.id,expectedRevision:1,note:'Second revision',content:{...content,name:'Second revision'}})]);expect(updates.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(updates.find(r=>r.status==='rejected').reason.code).toBe('locator_conflict');const history=await app.history('locator-admin',created.id);expect(history.revisions.map(r=>r.scene.revision)).toEqual([2,1]);expect(history.revisions[1].scene.content.name).toBe('Component demonstration');const placements=await runSiteOperation(pool,{...scope,userId:'locator-admin',permissions:['locator.read']},tx=>tx.query('SELECT current,revision FROM asset_locator.placements WHERE organization_id=$1 AND site_id=$2 AND scene_id=$3 ORDER BY revision',[scope.organizationId,scope.siteId,created.id]));expect(placements.rows).toEqual([{current:false,revision:1},{current:true,revision:2}]);});
test('forced RLS hides direct unscoped rows and cross-organization locators stay denied',async()=>{expect((await pool.query('SELECT id FROM asset_locator.scenes')).rows).toEqual([]);await expect(service({organizationId:'locator-other',siteId:'locator-foreign'}).context('locator-admin')).rejects.toBeInstanceOf(Error);const result=await service().search('locator-admin',{search:'fixture-sensor',unplacedOnly:false});expect(result.results[0].placements.length).toBeGreaterThan(0);});
test('Team Leader and Task Force retain viewing but cannot configure with obsolete manager grants',async()=>{const app=service();for(const actor of ['locator-lead','locator-task']){await admin(c=>c.query("INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES($1,$2,$3,'locator-manager',true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true",[scope.organizationId,scope.siteId,actor]));expect((await app.context(actor)).canManage).toBe(false);expect((await app.query(actor,{search:'',group:''})).total).toBeGreaterThan(0);await expect(app.bootstrap(actor)).rejects.toBeInstanceOf(Error);await expect(app.save(actor,{id:'',expectedRevision:0,note:'Obsolete grant does not authorize configuration',content:demonstration()})).rejects.toBeInstanceOf(Error);}});
test('technician is denied even with stale grants, and current revocation takes effect',async()=>{await admin(c=>c.query("INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES('locator-org','locator-site','locator-tech','locator-reader',true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true"));await expect(service().context('locator-tech')).rejects.toBeInstanceOf(Error);await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id='locator-org' AND site_id='locator-site' AND user_id='locator-task' AND role_id='locator-reader'"));await expect(service().context('locator-task')).rejects.toBeInstanceOf(Error);});
test('revision tables cannot be updated and a foreign asset link cannot leave partial scene state',async()=>{await expect(pool.query("UPDATE asset_locator.revisions SET snapshot='{}'::jsonb")).rejects.toMatchObject({code:'42501'});const app=service(),before=await app.query('locator-admin',{search:'',group:''}),content=demonstration();content.components[0].assetId='foreign-asset';await expect(app.save('locator-admin',{id:'',expectedRevision:0,note:'Rejected foreign link',content})).rejects.toMatchObject({code:'invalid_locator'});expect((await app.query('locator-admin',{search:'',group:''})).total).toBe(before.total);});

test('actual host grants readers compact identity and independent source coverage while stale writers stay denied',async()=>{
 referenceRoot=mkdtempSync(join(tmpdir(),'iop-211-locator-'));
 const app=composePlatformLocator(pool,scope,locations,referenceRoot),content=demonstration();content.components[0].assetId=asset.id;
 const scene=await app.save('locator-admin',{id:'',expectedRevision:0,note:'Reader authorization fixture',content});
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='locator-task' AND role_id='locator-reader'"));
 for(const actor of ['locator-lead','locator-task']){
  await admin(c=>c.query("INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES($1,$2,$3,'locator-manager',true),($1,$2,$3,'assets-administrator',true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true",[scope.organizationId,scope.siteId,actor]));
  expect((await app.context(actor)).canManage).toBe(false);
  const detail=await app.detail(actor,scene.id);expect(detail.assets[0]).toEqual({id:asset.id,code:asset.content.code,name:asset.content.name,locationId:'area',status:'unverified'});
  expect(detail.problems.coverage).toEqual([{kind:'handover',status:'available'},{kind:'maintenance',status:'available'}]);
  await expect(app.save(actor,{id:scene.id,expectedRevision:1,note:'Stale grant write',content})).rejects.toBeInstanceOf(Error);
  await expect(app.bootstrap(actor)).rejects.toBeInstanceOf(Error);
  const result=await app.search(actor,{search:asset.content.code,unplacedOnly:false});expect(result.results[0].asset.id).toBe(asset.id);
 }
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='locator-task' AND role_id='handover-contributor'"));
 expect((await app.detail('locator-task',scene.id)).problems.coverage).toEqual([{kind:'handover',status:'not-authorized'},{kind:'maintenance',status:'available'}]);
 await admin(c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='locator-task' AND role_id='handover-contributor'"));
});

test('permission migration preserves compact readers and unrelated grants; profile transitions never restore removed writers',async()=>{
 const before=await admin(c=>c.query("SELECT user_id,role_id,is_active FROM users_rbac.site_role_assignments ORDER BY user_id,role_id"));
 const client=new Client(configs.migrator);await client.connect();
 try{await client.query('BEGIN');await client.query(readFileSync(join(__dirname,'../migrations/20261014090000-administrator-assets-locator.sql'),'utf8'));await client.query('COMMIT');}finally{await client.end();}
 const after=await admin(c=>c.query("SELECT user_id,role_id,is_active FROM users_rbac.site_role_assignments ORDER BY user_id,role_id"));
 expect(after.rows).toEqual(before.rows.map(row=>['locator-lead','locator-task','locator-tech'].includes(row.user_id)&&['assets-administrator','locator-manager'].includes(row.role_id)?{...row,is_active:false}:row));
 await admin(c=>c.query("INSERT INTO users_rbac.organization_role_assignments(organization_id,user_id,role_id,is_active) VALUES($1,'locator-admin','organization-access-admin',true)",[scope.organizationId]));
 const access=composeAccess(pool,scope),created=await access.users.create('locator-admin',{name:'Transition fixture',username:'transition-fixture',profile:'administrator'});
 await access.users.change('locator-admin',created.user.id,'team-leader',true);
 let roles=(await admin(c=>c.query("SELECT role_id,is_active FROM users_rbac.site_role_assignments WHERE user_id=$1",[created.user.id]))).rows;
 for(const role of ['assets-administrator','locator-manager'])expect(roles.find(row=>row.role_id===role).is_active).toBe(false);
 for(const role of ['assets-reader','locator-reader'])expect(roles.find(row=>row.role_id===role).is_active).toBe(true);
 await access.users.change('locator-admin',created.user.id,'technician',true);
 await access.users.change('locator-admin',created.user.id,'task-force',true);
 roles=(await admin(c=>c.query("SELECT role_id,is_active FROM users_rbac.site_role_assignments WHERE user_id=$1",[created.user.id]))).rows;
 for(const role of ['assets-administrator','locator-manager'])expect(roles.find(row=>row.role_id===role).is_active).toBe(false);
 expect((await service().context(created.user.id)).canManage).toBe(false);
});

test('projected site byte capacity rejects creates and replacements before scene/history/placement/Audit writes',async()=>{
 if(!referenceRoot)referenceRoot=mkdtempSync(join(tmpdir(),'iop-211-locator-capacity-'));
 const app=composePlatformLocator(pool,scope,locations,referenceRoot),bytes=scene=>Buffer.byteLength(JSON.stringify(scene));
 const target=await app.save('locator-admin',{id:'',expectedRevision:0,note:'Small replacement target',content:demonstration()});
 const largeContent=(name,noteLength)=>{const content=demonstration(),template=content.components[0];return {...content,name,components:Array.from({length:1000},(_,index)=>({...template,id:`capacity-${index}`,label:`Capacity component ${index}`,x:0.5,y:0.5,assetId:index===0?asset.id:'',note:'x'.repeat(noteLength)}))};};
 const probe=(content,original)=>({id:original?.id??randomUUID(),revision:(original?.revision??0)+1,authorId:'locator-admin',createdAt:original?.createdAt??'2026-10-14T12:00:00.000Z',updatedAt:'2026-10-14T12:00:00.000Z',content});
 let current=await app.query('locator-admin',{search:'',group:''}),total=current.scenes.reduce((value,scene)=>value+bytes(scene),0),first;
 for(let index=0;index<locatorLimits.scenes;index++){
  const content=largeContent(`Capacity filler ${String(index).padStart(3,'0')}`,600),estimated=bytes(probe(content));
  expect(estimated).toBeLessThan(locatorLimits.sceneBytes);
  if(total+estimated>locatorLimits.siteSceneBytes)break;
  const created=await app.save('locator-admin',{id:'',expectedRevision:0,note:'Scoped capacity fixture',content});
  first??=created;total+=bytes(created);
 }
 expect(first).toBeDefined();expect(total).toBeGreaterThan(locatorLimits.siteSceneBytes-locatorLimits.sceneBytes);
 // A near-limit replacement must subtract its existing snapshot, rather than charge it twice.
 const changed=await app.save('locator-admin',{id:first.id,expectedRevision:1,note:'Same-size replacement remains valid',content:{...first.content,name:first.content.name.replace('filler','update')}});
 total+=bytes(changed)-bytes(first);
 const content=largeContent('Rejected capacity candidate',700);
 expect(bytes(probe(content))).toBeLessThan(locatorLimits.sceneBytes);
 expect(total+bytes(probe(content))).toBeGreaterThan(locatorLimits.siteSceneBytes);
 expect(total-bytes(target)+bytes(probe(content,target))).toBeGreaterThan(locatorLimits.siteSceneBytes);
 const state=async()=>admin(async client=>{const result={};for(const [table,order] of [['asset_locator.scenes','id'],['asset_locator.revisions','scene_id,revision'],['asset_locator.placements','scene_id,revision,component_id'],['audit.site_events','event_id']]){
  const rows=(await client.query(`SELECT to_jsonb(record) AS data FROM ${table} record WHERE organization_id=$1 AND site_id=$2 ORDER BY ${order}`,[scope.organizationId,scope.siteId])).rows;
  result[table]={count:rows.length,digest:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
 }return result;});
 const before=await state();expect(before['audit.site_events'].count).toBeGreaterThan(0);expect(before['asset_locator.placements'].count).toBeGreaterThan(0);
 await expect(app.save('locator-admin',{id:'',expectedRevision:0,note:'Rejected over-budget creation',content})).rejects.toMatchObject({code:'locator_capacity'});
 expect(await state()).toEqual(before);
 await expect(app.save('locator-admin',{id:target.id,expectedRevision:target.revision,note:'Rejected over-budget replacement',content})).rejects.toMatchObject({code:'locator_capacity'});
 expect(await state()).toEqual(before);
 current=await app.query('locator-admin',{search:'',group:''});
 expect(current.scenes.reduce((value,scene)=>value+bytes(scene),0)).toBe(total);
 expect(total).toBeLessThanOrEqual(locatorLimits.siteSceneBytes);
 expect(current.scenes.find(scene=>scene.id===target.id)).toEqual(target);
});
