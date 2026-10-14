const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { BackupError, LIMIT } = require('./archive.cjs');
const IMAGE = 'postgres:17.6-bookworm';
const fail = () => { throw new BackupError('Isolated database operation failed; the active installation was preserved.'); };
function docker(args, options = {}) {
  const result = spawnSync('docker', args, { stdio: ['pipe','pipe','pipe'], maxBuffer: 16*1024*1024, timeout: 120000, ...options });
  if (result.status !== 0) fail();
  return result.stdout;
}
function containerId(container) {
  if (typeof container !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(container)) fail();
  return container;
}
const psql = (container) => ['exec','-i',containerId(container),'psql','--no-psqlrc','--quiet','--tuples-only','--no-align','--set','ON_ERROR_STOP=1','-U','iop_bootstrap','-d','iop_local'];
function sql(container, statement) { return docker(psql(container), { input: statement, encoding:'utf8' }).trim(); }
const quote = (value) => '"'+String(value).replaceAll('"','""')+'"';
const literal = (value) => "'"+String(value).replaceAll("'","''")+"'";
function snapshotSql(snapshot) {
  if (!snapshot) return '';
  if (!/^[A-Fa-f0-9-]{1,80}$/.test(snapshot)) fail();
  return `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;SET TRANSACTION SNAPSHOT ${literal(snapshot)};`;
}
function childDone(child) { return new Promise((resolve,reject)=>{child.once('error',()=>reject(new BackupError('Local Docker transport is unavailable.')));child.once('close',code=>code===0?resolve():reject(new BackupError('Database stream failed; no complete backup was produced.')));}); }
async function lease(container) {
  const child=spawn('docker',psql(container),{stdio:['pipe','pipe','pipe']});
  const done=childDone(child);done.catch(()=>{});
  const snapshot=await new Promise((resolve,reject)=>{
    const unavailable=()=>new BackupError('Backup maintenance lease is unavailable. Stop API, web and job workers, keep the database running, then retry; restart services after backup.');
    let text='';const timer=setTimeout(()=>{child.kill();reject(unavailable());},40000);
    child.stdout.on('data',chunk=>{text+=chunk.toString();const match=text.match(/snapshot:([A-Fa-f0-9-]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
    done.catch(()=>{clearTimeout(timer);reject(unavailable());});
    child.stdin.write("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;SET LOCAL lock_timeout='30s';SELECT pg_advisory_xact_lock(190147);SELECT 'snapshot:'||pg_export_snapshot();\n");
  });
  const timer=setTimeout(()=>child.kill(),15*60000);
  return { snapshot, release:async()=>{clearTimeout(timer);child.stdin.end('ROLLBACK;\n');await done;} };
}
async function dump(container,snapshot,target) {
  if (!/^[A-Fa-f0-9-]{1,80}$/.test(snapshot)) fail();
  const child=spawn('docker',['exec',containerId(container),'pg_dump','-U','iop_bootstrap','-d','iop_local','--format=custom','--snapshot='+snapshot],{stdio:['ignore','pipe','pipe']});
  const done=childDone(child);done.catch(()=>{});
  try { await pipeline(child.stdout,fs.createWriteStream(target,{flags:'wx',mode:0o600}));await done; } catch(error) {child.kill();throw error;}
}
const catalogSql = `SELECT jsonb_build_object(
 'roles',(SELECT jsonb_agg(jsonb_build_object('name',rolname,'superuser',rolsuper,'inherit',rolinherit,'createRole',rolcreaterole,'createDb',rolcreatedb,'login',rolcanlogin,'replication',rolreplication,'bypassRls',rolbypassrls,'limit',rolconnlimit,'validUntil',rolvaliduntil,'password',rolpassword) ORDER BY rolname) FROM pg_authid WHERE rolname LIKE 'iop_%'),
 'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('role',pg_get_userbyid(m.roleid),'member',pg_get_userbyid(m.member),'admin',m.admin_option) ORDER BY pg_get_userbyid(m.roleid),pg_get_userbyid(m.member)),'[]'::jsonb) FROM pg_auth_members m WHERE pg_get_userbyid(m.roleid) LIKE 'iop_%' OR pg_get_userbyid(m.member) LIKE 'iop_%'),
 'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',p.polname,'command',p.polcmd,'permissive',p.polpermissive,'roles',(SELECT jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_get_userbyid(r) END ORDER BY CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_get_userbyid(r) END) FROM unnest(p.polroles) r),'using',pg_get_expr(p.polqual,p.polrelid),'check',pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY n.nspname,c.relname,p.polname),'[]'::jsonb) FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'schemas',(SELECT jsonb_agg(jsonb_build_object('name',n.nspname,'owner',pg_get_userbyid(n.nspowner),'acl',(SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(x.grantor),'grantee',CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,'privilege',x.privilege_type,'grantable',x.is_grantable) ORDER BY pg_get_userbyid(x.grantor),CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,x.privilege_type),'[]'::jsonb) FROM aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x)) ORDER BY n.nspname) FROM pg_namespace n WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'tables',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'forced',c.relforcerowsecurity,'acl',(SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(x.grantor),'grantee',CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,'privilege',x.privilege_type,'grantable',x.is_grantable) ORDER BY pg_get_userbyid(x.grantor),CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,x.privilege_type),'[]'::jsonb) FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x)) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'columns',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'column',a.attname,'acl',(SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(x.grantor),'grantee',CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,'privilege',x.privilege_type,'grantable',x.is_grantable) ORDER BY pg_get_userbyid(x.grantor),CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,x.privilege_type),'[]'::jsonb) FROM aclexplode(a.attacl) x)) ORDER BY n.nspname,c.relname,a.attname) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'functions',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'owner',pg_get_userbyid(p.proowner),'securityDefiner',p.prosecdef,'acl',(SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(x.grantor),'grantee',CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,'privilege',x.privilege_type,'grantable',x.is_grantable) ORDER BY pg_get_userbyid(x.grantor),CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,x.privilege_type),'[]'::jsonb) FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x)) ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema')
)::text;`;
async function fingerprint(container,snapshot='') {
  const catalog=JSON.parse(sql(container,snapshotSql(snapshot)+catalogSql+(snapshot?'COMMIT;':'')));
  const tables=catalog.tables??[];if(tables.length>5000)fail();
  if(catalog.memberships.length)throw new BackupError('Custom application role memberships are outside the local backup contract; no backup was completed.');
  const data=[];
  for(const table of tables){
    const reference=quote(table.schema)+'.'+quote(table.table);
    const child=spawn('docker',psql(container),{stdio:['pipe','pipe','pipe']});const done=childDone(child);done.catch(()=>{});
    child.stdin.end(snapshotSql(snapshot)+`COPY (SELECT row_to_json(t)::text AS row FROM ${reference} t ORDER BY row_to_json(t)::text COLLATE "C") TO STDOUT;`+(snapshot?'COMMIT;':''));
    const hash=crypto.createHash('sha256');let count=0,bytes=0;
    try{for await(const chunk of child.stdout){bytes+=chunk.length;if(bytes>LIMIT){child.kill();fail();}hash.update(chunk);for(const byte of chunk)if(byte===10)count++;}await done;}catch(error){child.kill();throw error;}
    data.push({schema:table.schema,table:table.table,rows:count,sha256:hash.digest('hex')});
  }
  return {catalog,data};
}
function restoreRoles(container,roles) {
  if(!Array.isArray(roles)||roles.length>50)fail();
  for(const role of roles){
    if(!/^iop_[a-z_]{1,48}$/.test(role.name)||!Number.isInteger(role.limit)||role.limit< -1||role.limit>1000||
      (role.password!==null&&typeof role.password!=='string')||(role.validUntil!==null&&typeof role.validUntil!=='string'))fail();
    const flags=[role.superuser?'SUPERUSER':'NOSUPERUSER',role.inherit?'INHERIT':'NOINHERIT',role.createRole?'CREATEROLE':'NOCREATEROLE',role.createDb?'CREATEDB':'NOCREATEDB',role.login?'LOGIN':'NOLOGIN',role.replication?'REPLICATION':'NOREPLICATION',role.bypassRls?'BYPASSRLS':'NOBYPASSRLS'];
    const create=role.name==='iop_bootstrap'?'ALTER ROLE':'CREATE ROLE';
    sql(container,`${create} ${quote(role.name)} WITH ${flags.join(' ')} CONNECTION LIMIT ${role.limit} PASSWORD ${role.password===null?'NULL':literal(role.password)}${role.validUntil ? ' VALID UNTIL '+literal(role.validUntil) : ''};`);
  }
}
function differentPath(a,b,path='database') {
  if(typeof a!==typeof b||a===null||b===null)return a===b?'':path;
  if(typeof a!=='object')return a===b?'':path;
  if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b)))return path+'.keys';
  for(const key of Object.keys(a)){const result=differentPath(a[key],b[key],path+'.'+key);if(result)return result;}
  return '';
}
async function isolatedRestore(directory,manifest) {
  const name='iop-restore-'+crypto.randomUUID();let created=false;
  try {
    docker(['run','--detach','--name',name,'--network','none','--label','iop.restore='+name,'--env-file',directory+'/private/postgres.env',IMAGE]);created=true;
    let ready=false;
    for(let attempt=0;attempt<60;attempt++){const logs=spawnSync('docker',['logs',name],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:5000});const result=spawnSync('docker',psql(name),{input:'SELECT 1;',encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:5000});if((logs.stdout??'').includes('PostgreSQL init process complete; ready for start up.')&&result.status===0&&result.stdout.trim()==='1'){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,500));}
    if(!ready)fail();
    restoreRoles(name,manifest.metadata.database.catalog.roles);
    docker(['cp',directory+'/database.dump',name+':/tmp/database.dump']);
    docker(['exec',name,'pg_restore','-U','iop_bootstrap','-d','iop_local','--exit-on-error','/tmp/database.dump']);
    const verified=await fingerprint(name);
    if(JSON.stringify(verified)!==JSON.stringify(manifest.metadata.database))throw new BackupError('Restored data, role, grant or RLS metadata did not reconcile at '+differentPath(manifest.metadata.database,verified)+'.');
    docker(['stop',name]);
    return {container:name,verified:true,network:'none',state:'stopped',tables:verified.data.length,rows:verified.data.reduce((sum,table)=>sum+table.rows,0)};
  }catch(error){if(created)docker(['rm','--force','--volumes',name]);throw error;}
}
function cleanupRestore(name){const info=JSON.parse(docker(['inspect',containerId(name)],{encoding:'utf8'}))[0];if(!name.startsWith('iop-restore-')||info.Config.Labels?.['iop.restore']!==name)fail();docker(['rm','--force','--volumes',name]);}
module.exports={IMAGE,docker,sql,lease,dump,fingerprint,isolatedRestore,cleanupRestore};
