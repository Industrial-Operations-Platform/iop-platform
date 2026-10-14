const {PostgreSqlContainer}=require('@testcontainers/postgresql');
const {Client,Pool}=require('pg');const {randomUUID,createHash}=require('node:crypto');
const {provision}=require('../dist/provision');const {migrate}=require('../dist/migrate');const {provisioningConfiguration}=require('../dist/configuration');
const {seedOrganization}=require('../dist/seed-organization');const {seedSite}=require('../dist/seed-site');const {seedUser}=require('../dist/seed-user');const {seedMembership}=require('../dist/seed-membership');
const api='../../../apps/api/dist/modules/';
const {siteRoles}=require(api+'users-rbac/domain/profiles');const {evaluateSiteAccess}=require(api+'users-rbac');
const {sitePeople,workforcePeople,sitePersonNames,sitePersonProfile}=require(api+'users-rbac/adapters/postgres/site-people');
const {siteMaterialAudit}=require(api+'audit/adapters/postgres/site-material');
const {Handover}=require(api+'shift-handover/application/handover');const {PgHandover}=require(api+'shift-handover/adapters/postgres/store');
const {Assets}=require(api+'assets/application/assets');const {PgAssets}=require(api+'assets/adapters/postgres/store');
const {AssetDomain}=require(api+'assets/application/enrichment');const {PgAssetDomain}=require(api+'assets/adapters/postgres/enrichment');
const {PgMaintenance}=require(api+'maintenance/adapters/postgres/store');
const {Workforce}=require(api+'workforce/application/workforce');const {PgWorkforce}=require(api+'workforce/adapters/postgres/store');const {IntlSiteClock}=require(api+'workforce/adapters/time/site-clock');
const {FormalHandover}=require(api+'shift-handover/application/formal-records');const {PgFormalHandover}=require(api+'shift-handover/adapters/postgres/formal-records');const {workforceShiftReferences}=require(api+'workforce/adapters/postgres/shift-reference');
const {Improvements}=require(api+'improvement-tracking/application/improvement');const {PgImprovements}=require(api+'improvement-tracking/adapters/postgres/store');
const {Locator}=require(api+'asset-locator/application/locator');const {PgLocator}=require(api+'asset-locator/adapters/postgres/store');const {demonstration}=require(api+'asset-locator/domain/locator');
const {Connections}=require(api+'integrations/application/connections');const {PgConnections}=require(api+'integrations/adapters/postgres/connections');
const {PgReportingProfiles}=require(api+'oip/adapters/postgres/reporting-profiles');
const {compileProfile}=require(api+'oip/domain/reporting-profile');
const {resolveHandoverMaintenanceIssues}=require(api+'shift-handover/adapters/postgres/maintenance-issues');
const {ImportBatches}=require(api+'integrations/adapters/postgres/import-batches');const {OipReceiver}=require(api+'oip/adapters/postgres/receiver');
const scope={organizationId:'audit-org',siteId:'audit-site'},at=()=> '2026-10-31T23:00:00.000Z';
const locations=[{id:'department',label:'Department',parentId:'',role:'department',sectorKey:''},{id:'area',label:'Area',parentId:'department',role:'area',sectorKey:''}];
let container,configs,pool,asset;
async function db(work){const c=new Client(configs.bootstrap);await c.connect();try{return await work(c);}finally{await c.end();}}
const allowed=async(tx,actor,permission)=>(await evaluateSiteAccess(tx,{...scope,userId:actor,permissions:[permission]})).allowed;
const names=(tx,ids)=>sitePersonNames(tx,scope.organizationId,scope.siteId,ids);
const directory={allowed,names,people:(tx)=>sitePeople(tx,scope.organizationId,scope.siteId),profile:(tx,actor)=>sitePersonProfile(tx,scope.organizationId,scope.siteId,actor),audit:siteMaterialAudit};
const content={date:'2026-10-31',categoryId:'problems',summary:'PRIVATE_SOURCE_CONTENT',details:'PRIVATE_SOURCE_CONTENT',departmentId:'department',areaId:'area',equipmentCode:'',equipmentNamespace:'site-equipment',condition:'',externalReference:'',challenge:'',cause:'',measure:'',dueDate:'',feedbackDueDate:'',discuss:true};
const assetContent={code:'SENSOR-1',name:'PRIVATE_SOURCE_CONTENT',type:'Sensor',locationId:'area',status:'unverified',validationNote:'',description:'PRIVATE_SOURCE_CONTENT',aliases:[]};
function journal(audit=siteMaterialAudit){return new Handover(new PgHandover(pool,scope,{...directory,audit,equipment:async()=>({codes:[],nextCursor:''})}),{locations,categories:[{id:'problems',label:'Problems'}],externalSystemLabel:'Reference',timeZone:'UTC'},randomUUID,at);}
function assets(audit=siteMaterialAudit){return new Assets(new PgAssets(pool,scope,{...directory,audit,sources:[]}),locations,'UTC',randomUUID,at);}
async function events(subject,id){return db(async c=>(await c.query('SELECT * FROM audit.site_events WHERE subject_type=$1 AND subject_id=$2 ORDER BY revision,event_type',[subject,id])).rows);}
beforeAll(async()=>{
 container=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-audit-bootstrap').start();
 const env={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),IOP_DATABASE_NAME:'iop_local',IOP_POSTGRES_PASSWORD:'synthetic-audit-bootstrap',IOP_MIGRATOR_PASSWORD:'synthetic-audit-migrator',IOP_RUNTIME_PASSWORD:'synthetic-audit-runtime'};
 configs=provisioningConfiguration(env);await provision(configs);await migrate(configs.migrator);await provision(configs);
 const seed={...env,IOP_SEED_ORGANIZATION_ID:scope.organizationId,IOP_SEED_ORGANIZATION_NAME:'Synthetic',IOP_SEED_SITE_ID:scope.siteId,IOP_SEED_SITE_NAME:'Synthetic',IOP_SEED_SITE_TIME_ZONE:'UTC'};await seedOrganization(seed);await seedSite(seed);
 for(const [id,profile]of [['admin','administrator'],['lead','team-leader'],['tech','technician']]){await seedUser({...seed,IOP_SEED_USER_ID:id});await seedMembership({...seed,IOP_SEED_USER_ID:id});await db(async c=>{await c.query('INSERT INTO users_rbac.profiles(organization_id,site_id,user_id,display_name,profile) VALUES($1,$2,$3,$4,$5)',[scope.organizationId,scope.siteId,id,'PRIVATE_PERSON_NAME',profile]);for(const role of siteRoles(profile))await c.query('INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES($1,$2,$3,$4,true) ON CONFLICT DO NOTHING',[scope.organizationId,scope.siteId,id,role]);});}
 pool=new Pool({...configs.runtime,max:5});
},90000);
afterAll(async()=>{if(pool)await pool.end();if(container)await container.stop();});
test('Technician journal and canonical asset idempotent recovery retain one safe event per committed revision',async()=>{
 const input={key:'journal-request',issue:false,responsibleId:'',content};const app=journal(),entry=await app.create('tech',input);expect((await app.create('tech',input)).id).toBe(entry.id);expect(await events('handover-entry',entry.id)).toHaveLength(1);
 await app.change('tech',{id:entry.id,expectedRevision:1,action:'follow-up',note:'PRIVATE_SOURCE_CONTENT'});expect((await events('handover-entry',entry.id)).map(e=>[e.event_type,e.revision,e.before_revision])).toEqual([['shift-handover.created',1,0],['shift-handover.changed',2,1]]);
 const request={key:'asset-request',id:'',expectedRevision:0,note:'',content:assetContent};asset=await assets().save('admin',request);expect((await assets().save('admin',request)).id).toBe(asset.id);expect(await events('asset',asset.id)).toHaveLength(1);
});
test('Handover and Assets audit failure rolls back projection, revisions and already-appended evidence',async()=>{
 const fail=async(tx,event)=>{await siteMaterialAudit(tx,event);throw new Error('Synthetic audit outage');};
 const app=journal(),entry=await app.create('tech',{key:'rollback-journal',issue:false,responsibleId:'',content});await expect(journal(fail).change('tech',{id:entry.id,expectedRevision:1,action:'follow-up',note:'PRIVATE_SOURCE_CONTENT'})).rejects.toThrow('Synthetic audit outage');expect((await app.history('tech',entry.id)).revisions).toHaveLength(1);expect(await events('handover-entry',entry.id)).toHaveLength(1);
 await expect(assets(fail).save('admin',{key:'',id:asset.id,expectedRevision:1,note:'PRIVATE_SOURCE_CONTENT',content:{...assetContent,description:'Uncommitted'}})).rejects.toThrow('Synthetic audit outage');expect((await assets().history('admin',asset.id,0)).revisions).toHaveLength(1);expect(await events('asset',asset.id)).toHaveLength(1);
});
test('actual Audit INSERT denial rolls back Handover and Assets business writes',async()=>{
 const entry=await journal().create('tech',{key:'storage-failure-journal',issue:false,responsibleId:'',content});
 await db(c=>c.query('REVOKE INSERT(event_id) ON audit.site_events FROM iop_runtime'));
 try{
  await expect(journal().change('tech',{id:entry.id,expectedRevision:1,action:'follow-up',note:'Storage unavailable'})).rejects.toThrow('Site authorization is unavailable.');
  await expect(assets().save('admin',{key:'',id:asset.id,expectedRevision:1,note:'Storage unavailable',content:{...assetContent,description:'Not committed'}})).rejects.toThrow('Site authorization is unavailable.');
 }finally{await db(c=>c.query('GRANT INSERT(event_id) ON audit.site_events TO iop_runtime'));}
 expect((await journal().history('tech',entry.id)).revisions).toHaveLength(1);expect(await events('handover-entry',entry.id)).toHaveLength(1);
 expect((await assets().history('admin',asset.id,0)).revisions).toHaveLength(1);expect(await events('asset',asset.id)).toHaveLength(1);
});
test('Workforce and formal transfer publication closure acknowledgement emit safe versioned states',async()=>{
 const settings={shifts:[{id:'early',label:'Early',start:'05:00',end:'14:15',days:[0,1,2,3,4,5,6]}],targets:[{id:'department',label:'Department',phone:''}],teams:[]};
 const workforce=new Workforce(new PgWorkforce(pool,scope,{...directory,people:(tx)=>workforcePeople(tx,scope.organizationId,scope.siteId)}),{decode:()=>[]},new IntlSiteClock(),settings,'UTC',at);
 await workforce.save('admin',{kind:'schedule',id:'tech_2026-10-14',expectedRevision:0,deleted:false,data:{userId:'tech',date:'2026-10-14',status:'work',start:'05:00',end:'23:00'}});
 await workforce.save('lead',{kind:'assignment',id:'assignment',expectedRevision:0,deleted:false,data:{userId:'tech',date:'2026-10-14',shiftId:'early',targetId:'department',duty:'zone',phone:'',start:'',end:''}});
 const formal=new FormalHandover(new PgFormalHandover(pool,scope,{...directory,name:async(tx,actor)=>(await names(tx,[actor])).get(actor),shifts:workforceShiftReferences}),locations,'UTC',randomUUID,at);
 const shift=(await formal.shifts('admin',{from:'2026-10-14',to:'2026-10-14',departmentId:'department',areaId:'area',cursor:''})).shifts[0];
 const request={key:'formal-request',id:'',expectedRevision:0,note:'',content:{shiftId:shift.id,shiftDate:shift.date,departmentId:'department',areaId:'area',title:'PRIVATE_SOURCE_CONTENT',summary:'PRIVATE_SOURCE_CONTENT',entryIds:[]}};
 const draft=await formal.save('admin',request);expect((await formal.save('admin',request)).id).toBe(draft.id);
 await formal.transition('admin',{id:draft.id,expectedRevision:1,action:'publish',note:'PRIVATE_SOURCE_CONTENT'});await formal.transition('admin',{id:draft.id,expectedRevision:2,action:'close',note:'PRIVATE_SOURCE_CONTENT'});await formal.transition('lead',{id:draft.id,expectedRevision:3,action:'acknowledge',note:'PRIVATE_SOURCE_CONTENT'});
 expect((await events('handover-record',draft.id)).map(e=>e.event_type)).toEqual(['shift-handover.created','shift-handover.published','shift-handover.closed','shift-handover.acknowledged']);
 expect((await events('workforce-schedule','tech_2026-10-14'))[0]).toMatchObject({state:'active',before_state:''});
});
test('Maintenance configuration and records retain owner revision references and completion',async()=>{
 const store=new PgMaintenance(pool,scope,{...directory,teams:async()=>[],assets:async()=>[],asset:async()=>null});
 const id=randomUUID(),record={id,revision:1,authorId:'admin',createdAt:at(),updatedAt:at(),completedAt:'',data:{status:'open',priorityId:'normal',locationId:'area',assetId:'',assigneeId:'',teamId:'',dueDate:''}};
 await store.run('admin','maintenance.contribute',async tx=>{await tx.save(record,{record,actorId:'admin',at:at()});});
 const completed={...record,revision:2,completedAt:at(),data:{...record.data,status:'done'}};await store.run('admin','maintenance.contribute',tx=>tx.save(completed,{record:completed,actorId:'admin',at:at()}));
 await store.run('admin','maintenance.administer',tx=>tx.saveSettings({revision:1,priorities:[]},'admin',at()));
 expect((await events('maintenance-record',id)).map(e=>e.event_type)).toEqual(['maintenance.created','maintenance.completed']);expect(await events('maintenance-settings','settings')).toHaveLength(1);
});
test('Asset sidecar catalog enrichment and mapping are audited without metadata source tuples or reviewer names',async()=>{
 const app=new AssetDomain(new PgAssetDomain(pool,scope,{audit:siteMaterialAudit,materialize:async()=>{},candidates:async()=>({candidates:[],nextCursor:''}),pareto:async()=>null}),'source',at);
 await app.configure('admin',{expectedRevision:0,types:[{id:'sensor',label:'PRIVATE_SOURCE_CONTENT',active:true,canContain:false,isController:false,fields:[]}]});
 await app.save('admin',{assetId:asset.id,expectedRevision:0,reason:'PRIVATE_SOURCE_CONTENT',data:{typeId:'sensor',parentId:'',controllers:[],manufacturer:'PRIVATE_SOURCE_CONTENT',model:'PRIVATE_SOURCE_CONTENT',serial:'PRIVATE_SOURCE_CONTENT',metadata:{},survey:{status:'pending',note:'',evidenceReference:''}}});
 const mapping=await app.saveMapping('admin',{id:'mapping',expectedRevision:0,reason:'PRIVATE_SOURCE_CONTENT',data:{source:{sourceId:'source',namespace:'source-equipment',area:'PRIVATE_SOURCE_CONTENT',code:'PRIVATE_SOURCE_CONTENT'},status:'pending',candidateIds:[],note:'PRIVATE_SOURCE_CONTENT'}});
 expect(await events('asset-model-catalog','catalog')).toHaveLength(1);expect(await events('asset-enrichment',asset.id)).toHaveLength(1);expect(await events('asset-source-mapping',mapping.id)).toHaveLength(1);
});
test('Improvement action evidence and comparison plus Locator scene and integration registry emit explicit owner events',async()=>{
 const store=new PgImprovements(pool,scope,{...directory,assets:async()=>[],asset:async()=>null,issues:async()=>({issues:[],nextCursor:''}),issue:async()=>null,measure:async()=>null});const app=new Improvements(store,locations,at);
 const action=await app.save('admin',{id:'improvement',expectedRevision:0,reason:'',data:{title:'PRIVATE_SOURCE_CONTENT',hypothesis:'PRIVATE_SOURCE_CONTENT',locationId:'area',assetId:'',issueId:'',ownerId:'',dueDate:'',status:'planned',implementedDate:'',target:{objective:'PRIVATE_SOURCE_CONTENT',metric:'frequency',reductionPercent:null},result:'',blockedReason:'',cancellationReason:''}});
 await app.addEvidence('admin',{id:'evidence',actionId:action.id,expectedRevision:1,kind:'note',note:'PRIVATE_SOURCE_CONTENT',externalReference:'',supersedesId:''});
 await store.run('admin','improvement.contribute',tx=>tx.addComparison({id:'comparison',actionId:action.id,actionRevision:2,actorId:'admin',at:at(),note:'PRIVATE_SOURCE_CONTENT'}));
 expect((await events('improvement-action',action.id)).map(e=>e.event_type)).toEqual(['improvement-tracking.created','improvement-tracking.evidence-added']);expect(await events('improvement-evidence','evidence')).toHaveLength(1);expect(await events('improvement-comparison','comparison')).toHaveLength(1);
 const locator=new Locator(new PgLocator(pool,scope,{...directory,asset:async()=>null,assets:async()=>[],problems:async()=>({items:[],coverage:[]})}),{list:async()=>[],bytes:async()=>new Uint8Array(),components:async()=>[]},locations,randomUUID,at);
 const scene=await locator.save('admin',{id:'',expectedRevision:0,note:'PRIVATE_SOURCE_CONTENT',content:demonstration()});expect(await events('locator-scene',scene.id)).toHaveLength(1);
 const connections=new Connections(new PgConnections(pool,scope,directory),at);await connections.save('admin',{expectedRevision:0,configuration:{kind:'wincc',label:'PRIVATE_SOURCE_CONTENT',enabled:false,endpoint:'',contractVersion:'',credentialReference:'',tenantId:'',clientId:''}});expect(await events('integration-connection','wincc')).toHaveLength(1);
});
test('Import receipt OIP publication completion and recovery retain one event per material unit',async()=>{
 const source={...scope,sourceId:'source',siteTimeZone:'UTC',adapterRevision:'adapter-1',profileRevision:'profile-1',mappingRevision:'mapping-1'},batches=new ImportBatches(pool,source,siteMaterialAudit),receiver=new OipReceiver(source,undefined,siteMaterialAudit);
 const bytes=Buffer.from('PRIVATE_SOURCE_CONTENT'),id=await batches.receive('admin','Hitliste-20261014.csv',bytes),record={sourceRecordNumber:2,sourceArea:'A',sourceEquipmentReference:'S',sourceMessageText:'PRIVATE_SOURCE_CONTENT',sourceMessageType:'T',sourceMessageGroup:'G',reportedFrequency:1,accumulatedAlarmSeconds:2,originalDuration:'00:00:02'};
 const prepared={reportingDate:'2026-10-14',records:[record]},classified={...prepared,records:[{...record,classificationStatus:'mapped',sectorKey:'sector'}],dataRecordCount:1,adapterRevision:'adapter-1',reportingWindowStatus:'unknown',mapping:{...scope,sourceId:'source',mappingRevision:'mapping-1',sectors:[{sectorKey:'sector',label:'Sector'}],areas:[{sourceArea:'A',sectorKey:'sector'}]}};
 const inspection={dataRecordCount:1,inspectedValidCount:1,inspectedInvalidCount:0,inspectionComplete:true,unclassifiedCount:0,repeatedCount:0,diagnostics:[],diagnosticsTruncated:false};
 await batches.publish('admin',id,inspection,receiver,{prepared,classified,inputSha256:createHash('sha256').update(bytes).digest('hex')},Date.now()+29000);expect(await batches.reconcile('admin',id,receiver)).toBe('succeeded');expect(await batches.reconcile('admin',id,receiver)).toBe('succeeded');
 expect((await events('import-batch',id)).map(e=>e.event_type)).toEqual(['integrations.received','integrations.completed']);expect(await events('oip-publication',id)).toHaveLength(1);
});
test('delegated maintenance journal resolution and reporting configuration keep their own atomic Audit seams',async()=>{
 const entry=await journal().create('admin',{key:'delegated-resolution',issue:true,responsibleId:'',content});
 const {runSiteOperation}=require('../../../apps/api/dist/persistence/site-operation');
 await runSiteOperation(pool,{...scope,userId:'admin',permissions:['maintenance.contribute']},tx=>resolveHandoverMaintenanceIssues(tx,scope,[{id:entry.id,expectedRevision:1}],{maintenanceId:'maintenance-reference',outcome:'PRIVATE_SOURCE_CONTENT',at:at()},siteMaterialAudit));
 expect((await events('handover-entry',entry.id)).map(e=>[e.event_type,e.state,e.before_state])).toEqual([['shift-handover.created','open',''],['shift-handover.resolved','resolved','open']]);
 const source={...scope,sourceId:'source',siteTimeZone:'UTC',adapterRevision:'adapter-1',profileRevision:'profile-1',mappingRevision:'mapping-1'},profile={normalization:{trim:true,unicodeNfc:true,collapseWhitespace:true},unclassifiedLabel:'Unknown',areaSectors:[{area:'A',sector:'Sector'}],aliases:[],executiveKpis:[]};
 const repository=new PgReportingProfiles(pool,source,profile,siteMaterialAudit),first=await repository.save('admin',repository.initialVersion,compileProfile(profile));
 const second=await repository.save('admin',first.version,compileProfile({...profile,unclassifiedLabel:'PRIVATE_SOURCE_CONTENT'}));
 expect((await events('reporting-profile','source:'+first.version))[0].event_type).toBe('configuration.created');expect((await events('reporting-profile','source:'+second.version))[0].event_type).toBe('configuration.changed');
});
test('every captured event is scoped and safe; unregistered event pairs fail at database boundary',async()=>{
 const captured=await db(async c=>(await c.query('SELECT * FROM audit.site_events')).rows);expect(captured.length).toBeGreaterThan(20);expect(captured.every(e=>e.organization_id===scope.organizationId&&e.site_id===scope.siteId)).toBe(true);const text=JSON.stringify(captured);expect(text).not.toContain('PRIVATE_SOURCE_CONTENT');expect(text).not.toContain('PRIVATE_PERSON_NAME');expect(text).not.toContain('original_bytes');expect(text).not.toContain('credentialReference');
 await expect(db(c=>c.query("UPDATE audit.site_events SET event_type='assets.arbitrary' WHERE event_type='assets.created'"))).rejects.toMatchObject({code:'23514'});
});
