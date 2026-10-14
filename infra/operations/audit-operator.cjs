const { Client }=require('pg');
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const path=require('node:path');
const roles={inspect:'iop_audit_inspector',purge:'iop_audit_retention'};
const id=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);
const quote=value=>'"'+value.replaceAll('"','""')+'"';
const literal=value=>"'"+value.replaceAll("'","''")+"'";
async function operatorFile(file){const stat=await fs.lstat(file);if(!stat.isFile()||(stat.mode&0o077)!==0)throw new Error('Private operator configuration is required.');const value=JSON.parse(await fs.readFile(file,'utf8'));if(!['127.0.0.1','localhost','::1','database'].includes(value.host)||!Number.isInteger(value.port)||value.port<1||value.port>65535||!id(value.organizationId)||!id(value.siteId)||typeof value.password!=='string'||value.password.length<16||value.password.length>256)throw new Error('Invalid local operator configuration.');return value;}
async function provisionOperator(bootstrap,command,scope,output){
  const role=roles[command];if(!role||!id(scope.organizationId)||!id(scope.siteId))throw new Error('Invalid Audit operator target.');
  await fs.access(output).then(()=>{throw new Error('Operator credential output already exists.');},error=>{if(error.code!=='ENOENT')throw error;});
  const password=crypto.randomBytes(32).toString('base64url'),client=new Client({...bootstrap,database:'iop_local',options:'-c search_path=pg_catalog',application_name:'iop-audit-provision'});await client.connect();
  let outputCreated=false,commitStarted=false;
  try{await client.query('BEGIN');const existing=await client.query('SELECT rolname FROM pg_roles WHERE rolname=$1',[role]);if(existing.rows.length)throw new Error('Audit operator role already exists; credential rotation requires explicit review.');
    await client.query(`CREATE ROLE ${quote(role)} LOGIN NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOREPLICATION NOBYPASSRLS PASSWORD ${literal(password)}`);
    await client.query(`GRANT CONNECT ON DATABASE iop_local TO ${quote(role)}`);await client.query(`GRANT USAGE ON SCHEMA audit TO ${quote(role)}`);
    await client.query('INSERT INTO audit.operator_targets(operator_role,organization_id,site_id) VALUES($1,$2,$3)',[role,scope.organizationId,scope.siteId]);
    await client.query(`GRANT EXECUTE ON FUNCTION audit.${command==='inspect'?'inspect_events(text,timestamptz,text,integer)':'purge_expired(integer)'} TO ${quote(role)}`);
    await fs.writeFile(output,JSON.stringify({host:bootstrap.host,port:bootstrap.port,database:'iop_local',user:role,password,...scope},null,2),{mode:0o600,flag:'wx'});
    outputCreated=true;commitStarted=true;await client.query('COMMIT');return{role,scopeConfigured:true};
  }catch(error){await client.query('ROLLBACK');if(outputCreated&&!commitStarted)await fs.rm(output,{force:true});throw error;}finally{await client.end();}
}
async function operate(config,command,{purpose='investigation',beforeAt=null,beforeId='',limit=100}={}){
  if(config.user!==roles[command]||!id(config.organizationId)||!id(config.siteId))throw new Error('Audit command does not match operator authority.');
  const client=new Client({...config,database:'iop_local',ssl:false,options:'-c search_path=pg_catalog -c statement_timeout=30000',application_name:'iop-audit-operator'});await client.connect();
  try{await client.query('BEGIN');await client.query("SELECT set_config('iop.organization_id',$1,true),set_config('iop.site_id',$2,true)",[config.organizationId,config.siteId]);
    const result=command==='inspect'?await client.query('SELECT audit.inspect_events($1,$2,$3,$4) AS result',[purpose,beforeAt,beforeId,limit]):await client.query('SELECT audit.purge_expired($1) AS result',[limit]);
    await client.query('COMMIT');return result.rows[0].result;
  }catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}
}
async function main(){
 const[command,file,purpose]=process.argv.slice(2);
 if(command==='provision-inspect'||command==='provision-purge'){
  if(!file)throw new Error('A private output file is required.');
  const {configuration}=require('../database/dist/configuration');
  console.log(JSON.stringify(await provisionOperator(configuration(process.env,'bootstrap'),command==='provision-inspect'?'inspect':'purge',{
   organizationId:process.env.IOP_AUDIT_ORGANIZATION_ID,siteId:process.env.IOP_AUDIT_SITE_ID,
  },path.resolve(file))));return;
 }
 if(!roles[command]||!file)throw new Error('Use inspect or purge with an explicit private operator configuration file.');
 console.log(JSON.stringify(await operate(await operatorFile(path.resolve(file)),command,{purpose:purpose??'investigation'})));
}
module.exports={provisionOperator,operate,operatorFile};
if(require.main===module)main().catch(()=>{console.error('Audit operator command failed; check private configuration, explicit scope and operator authority.');process.exitCode=1;});
