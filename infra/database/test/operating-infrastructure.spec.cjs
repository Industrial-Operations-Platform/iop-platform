const {PostgreSqlContainer}=require('@testcontainers/postgresql');
const {Client,Pool}=require('pg');
const {mkdtempSync,readFileSync,rmSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {provision}=require('../dist/provision');
const {migrate}=require('../dist/migrate');
const {provisioningConfiguration}=require('../dist/configuration');
const {seedOrganization}=require('../dist/seed-organization');
const {seedSite}=require('../dist/seed-site');
const {seedUser}=require('../dist/seed-user');
const {seedMembership}=require('../dist/seed-membership');
const {siteRoles}=require('../../../apps/api/dist/modules/users-rbac/domain/profiles');
const {composeJobs,localCheckHandler}=require('../../../apps/api/dist/host/operating-composition');
const {PgJobs}=require('../../../apps/api/dist/modules/jobs/adapters/postgres/store');
const {JobConfigurationPending}=require('../../../apps/api/dist/modules/jobs/domain/jobs');
const {evaluateSiteAccess}=require('../../../apps/api/dist/modules/users-rbac');
const {sitePersonProfile}=require('../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people');
const {appendAudit}=require('../../../apps/api/dist/modules/audit/adapters/postgres/append');
const {runSiteOperation}=require('../../../apps/api/dist/persistence/site-operation');
const {provisionOperator,operate}=require('../../operations/audit-operator.cjs');
const scope={organizationId:'operating-org',siteId:'operating-site'};
let container,configs,pool,jobs,directory,inspector,retention;let now='2026-10-14T00:00:00.000Z';
async function db(role,work){const client=new Client(configs[role]);await client.connect();try{return await work(client);}finally{await client.end();}}
const allowed=async(tx,actor,permission)=>(await evaluateSiteAccess(tx,{...scope,userId:actor,permissions:[permission]})).allowed;
beforeAll(async()=>{
 container=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-operating-bootstrap').start();
 const env={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),IOP_DATABASE_NAME:'iop_local',IOP_POSTGRES_PASSWORD:'synthetic-operating-bootstrap',IOP_MIGRATOR_PASSWORD:'synthetic-operating-migrator',IOP_RUNTIME_PASSWORD:'synthetic-operating-runtime'};
 configs=provisioningConfiguration(env);await provision(configs);await migrate(configs.migrator);await provision(configs);
 for(const [organizationId,siteId,users] of [[scope.organizationId,scope.siteId,[['admin','administrator'],['other-admin','administrator'],['tech','technician'],['lead','team-leader']]],['foreign-org','foreign-site',[['foreign-admin','administrator']]]]){
  const seed={...env,IOP_SEED_ORGANIZATION_ID:organizationId,IOP_SEED_ORGANIZATION_NAME:'Synthetic',IOP_SEED_SITE_ID:siteId,IOP_SEED_SITE_NAME:'Synthetic',IOP_SEED_SITE_TIME_ZONE:'UTC'};await seedOrganization(seed);await seedSite(seed);
  for(const[userId,profile]of users){await seedUser({...seed,IOP_SEED_USER_ID:userId});await seedMembership({...seed,IOP_SEED_USER_ID:userId});await db('bootstrap',async(client)=>{
    await client.query('INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,$2,$4)',[organizationId,userId,siteId,profile]);await client.query('DELETE FROM users_rbac.site_role_assignments WHERE organization_id=$1 AND site_id=$2 AND user_id=$3',[organizationId,siteId,userId]);
    for(const role of siteRoles(profile))await client.query('INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,$4,true)',[organizationId,userId,siteId,role]);
  });}
 }
 pool=new Pool({...configs.runtime,max:5});jobs=composeJobs(pool,scope,undefined,()=>now);
 directory=mkdtempSync(join(tmpdir(),'iop-audit-operator-test-'));const inspectFile=join(directory,'inspector.json'),retentionFile=join(directory,'retention.json');
 await provisionOperator(configs.bootstrap,'inspect',scope,inspectFile);await provisionOperator(configs.bootstrap,'purge',scope,retentionFile);
 inspector=JSON.parse(readFileSync(inspectFile,'utf8'));retention=JSON.parse(readFileSync(retentionFile,'utf8'));
},90000);
afterAll(async()=>{if(pool)await pool.end();if(container)await container.stop();if(directory)rmSync(directory,{recursive:true,force:true});});
test('durable job retry rolls back effects then completes once; all lifecycle changes append safe Audit',async()=>{
 const input={key:'retry-request',type:'local-check',payload:{value:23,failUntil:1}},job=await jobs.submit('admin',input);expect((await jobs.submit('admin',input)).id).toBe(job.id);
 await expect(jobs.submit('admin',{...input,payload:{value:24}})).rejects.toMatchObject({code:'job_conflict'});
 const retry=await jobs.tick('admin');expect(retry.job).toMatchObject({id:job.id,state:'retry',attempts:1,reason:'transient'});
 expect(await db('bootstrap',async(c)=>(await c.query('SELECT count(*)::integer AS total FROM jobs.local_effects WHERE job_id=$1',[job.id])).rows[0].total)).toBe(0);
 now='2026-10-14T00:00:02.000Z';const completed=await jobs.tick('admin');expect(completed.job).toMatchObject({id:job.id,state:'completed',attempts:2,result:{value:23,verified:true}});
 expect((await jobs.tick('admin')).processed).toBe(false);
 expect(await db('bootstrap',async(c)=>(await c.query('SELECT count(*)::integer AS total FROM jobs.local_effects WHERE job_id=$1',[job.id])).rows[0].total)).toBe(1);
 const evidence=await operate(inspector,'inspect');expect(evidence.events.filter(e=>e.subject_id===job.id).map(e=>e.event_type)).toContain('jobs.completed');
 expect(evidence.events.every(e=>!Object.hasOwn(e,'payload')&&!Object.hasOwn(e,'author_name'))).toBe(true);
 const event=evidence.events.find(e=>e.event_type==='jobs.completed'&&e.subject_id===job.id);expect(new Date(event.occurred_at).toISOString()).toBe(now);expect(event.retention_class).toBe('change');expect(new Date(event.expires_at)-new Date(event.recorded_at)).toBe(365*24*60*60*1000);
});
test('current initiating-user profile/grants and own-job scope deny revoked, nonadmin and unrelated retrieval/execution',async()=>{
 const job=await jobs.submit('admin',{key:'revocation-request',type:'local-check',payload:{value:1}});
 await expect(jobs.get('other-admin',job.id)).rejects.toMatchObject({code:'job_missing'});await expect(jobs.tick('tech')).rejects.toThrow('Site operation is not permitted.');await expect(jobs.tick('lead')).rejects.toThrow('Site operation is not permitted.');
 await db('bootstrap',c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='admin' AND role_id='jobs-administrator'"));await expect(jobs.get('admin',job.id)).rejects.toThrow('Site operation is not permitted.');await expect(jobs.tick('admin')).rejects.toThrow('Site operation is not permitted.');
 await db('bootstrap',c=>c.query("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='admin' AND role_id='jobs-administrator'"));expect((await jobs.tick('admin')).job.id).toBe(job.id);
});
test('missing handler remains pending without consuming execution attempts and expired leases recover with a single effect',async()=>{
 const pending=await jobs.submit('admin',{key:'missing-handler',type:'unconfigured-adapter',payload:{}});expect((await jobs.tick('admin')).job).toMatchObject({id:pending.id,state:'waiting-handler',attempts:0,reason:'missing-handler'});
 const job=await jobs.submit('admin',{key:'expired-lease',type:'local-check',payload:{value:9}});
 const store=new PgJobs(pool,scope,{allowed,profile:(tx,actor)=>sitePersonProfile(tx,scope.organizationId,scope.siteId,actor),handlers:{'local-check':localCheckHandler},audit:(tx,current,before,action)=>appendAudit(tx,{operationId:current.id+':'+current.revision,module:'jobs',action,subjectType:'job',subjectId:current.id,revision:current.revision,beforeRevision:before?.revision??0,state:current.state,beforeState:before?.state??'',reason:current.reason})});
 expect((await store.run('admin',tx=>tx.claim(now,'lease-token'))).id).toBe(job.id);
 now='2026-10-14T00:02:00.000Z';
 const recovered=await jobs.tick('admin');expect(recovered.job).toMatchObject({id:job.id,state:'completed',attempts:2});
 expect((await jobs.tick('admin')).job).toMatchObject({id:pending.id,state:'waiting-handler',attempts:0});
});
test('Audit appends deduplicate safely and Audit failure rolls back the associated material mutation',async()=>{
 const event={operationId:'dedupe-event',module:'configuration',action:'changed',subjectType:'source-config',subjectId:'config',revision:1,beforeRevision:0,state:'active',beforeState:'',reason:'none'};
 await runSiteOperation(pool,{...scope,userId:'admin',permissions:['jobs.manage']},async(tx)=>{await appendAudit(tx,event);await appendAudit(tx,event);});
 const count=await db('bootstrap',async(c)=>(await c.query("SELECT count(*)::integer AS total FROM audit.site_events WHERE operation_id='dedupe-event'")).rows[0].total);expect(count).toBe(1);
 await expect(runSiteOperation(pool,{...scope,userId:'admin',permissions:['jobs.manage']},async(tx)=>{await tx.query("UPDATE jobs.records SET state='failed' WHERE organization_id=$1 AND site_id=$2",[scope.organizationId,scope.siteId]);await appendAudit(tx,{...event,state:'deleted'});})).rejects.toThrow('identity conflicts');
 expect(await db('bootstrap',async(c)=>(await c.query("SELECT count(*)::integer AS total FROM jobs.records WHERE state='failed'")).rows[0].total)).toBe(0);
});
test('unconfigured handlers preserve attempts and exhausted expired leases fail without executing effects',async()=>{
 const configured=composeJobs(pool,scope,{'configuration-required':{permission:'jobs.manage',keys:[],execute:async()=>{throw new JobConfigurationPending();}},'local-check':localCheckHandler},()=>now);
 const pending=await configured.submit('admin',{key:'configuration-request',type:'configuration-required',payload:{}});
 expect((await configured.tick('admin')).job).toMatchObject({id:pending.id,state:'waiting-configuration',attempts:0});
 const exhausted=await jobs.submit('admin',{key:'exhausted-request',type:'local-check',payload:{value:45}});
 await db('bootstrap',async(c)=>{const snapshot={...exhausted,state:'running',attempts:5,leaseToken:'expired-token',leaseUntil:'2026-10-14T00:01:00.000Z'};await c.query("UPDATE jobs.records SET state='running',lease_until=$2,snapshot=$3 WHERE id=$1",[exhausted.id,snapshot.leaseUntil,JSON.stringify(snapshot)]);});
 expect((await jobs.tick('admin')).job).toMatchObject({id:exhausted.id,state:'failed',attempts:5,reason:'exhausted'});
 expect(await db('bootstrap',async(c)=>(await c.query('SELECT count(*)::integer AS total FROM jobs.local_effects WHERE job_id=$1',[exhausted.id])).rows[0].total)).toBe(0);
});
test('operator functions enforce exact target/role, append inspection, hide expired evidence and atomically purge bounded rows',async()=>{
 const before=await db('bootstrap',async(c)=>(await c.query("SELECT count(*)::integer AS total FROM audit.site_events WHERE event_type='audit.inspected'")).rows[0].total);
 const inspection=await operate(inspector,'inspect',{purpose:'recovery',limit:10});expect(inspection.events.length).toBeLessThanOrEqual(10);
 expect(await db('bootstrap',async(c)=>(await c.query("SELECT count(*)::integer AS total FROM audit.site_events WHERE event_type='audit.inspected'")).rows[0].total)).toBe(before+1);
 await expect(operate({...inspector,organizationId:'foreign-org',siteId:'foreign-site'},'inspect')).rejects.toThrow('not permitted');
 await expect(operate(inspector,'purge')).rejects.toThrow('does not match');
 await db('bootstrap',c=>c.query("UPDATE audit.site_events SET recorded_at=clock_timestamp()-interval '366 days',expires_at=clock_timestamp()-interval '1 day' WHERE operation_id='dedupe-event'"));
 expect((await operate(inspector,'inspect')).events.some(e=>e.operation_id==='dedupe-event')).toBe(false);
 expect((await operate(retention,'purge',{limit:1})).removed).toBe(1);expect((await operate(retention,'purge',{limit:1})).removed).toBe(0);
 const client=new Client(inspector);await client.connect();try{expect((await client.query("SELECT has_table_privilege(current_user,'audit.site_events','SELECT,INSERT,DELETE,UPDATE') AS broad")).rows[0].broad).toBe(false);}finally{await client.end();}
 await db('runtime',async(c)=>{expect((await c.query("SELECT has_table_privilege(current_user,'audit.site_events','DELETE,UPDATE') AS mutation")).rows[0].mutation).toBe(false);await expect(c.query('SELECT module FROM audit.site_events')).rejects.toThrow();});
});
