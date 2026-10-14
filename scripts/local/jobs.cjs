const fs=require('node:fs');
const {Pool}=require('pg');
const {configuration}=require('../../infra/database/dist/configuration');
const {composeJobs}=require('../../apps/api/dist/host/operating-composition');
async function main(){const[command,actor,arg,type,value,failUntil]=process.argv.slice(2);if(!['submit','get','tick'].includes(command)||!actor)throw new Error('Use submit ACTOR REQUEST_KEY TYPE VALUE [FAIL_UNTIL], get ACTOR JOB_ID, or tick ACTOR.');
  const config=JSON.parse(fs.readFileSync(process.env.IOP_CONFIG_FILE,'utf8')),scope=config.local??config;
  if(scope.site?.organizationId!==scope.organization?.id)throw new Error('Invalid explicit local job scope.');
  const pool=new Pool(configuration(process.env,'runtime'));try{const jobs=composeJobs(pool,{organizationId:scope.organization.id,siteId:scope.site.id});
    const result=command==='submit'?await jobs.submit(actor,{key:arg,type:type??'local-check',payload:type==='local-check'?{value:Number(value),...(failUntil===undefined?{}:{failUntil:Number(failUntil)})}:{}}):command==='get'?await jobs.get(actor,arg):await jobs.tick(actor);
    console.log(JSON.stringify(result));
  }finally{await pool.end();}
}
if(require.main===module)main().catch(()=>{console.error('Local job command failed; check explicit scope, current initiating-user grants, handler and private runtime configuration.');process.exitCode=1;});
