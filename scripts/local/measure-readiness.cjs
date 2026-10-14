const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {performance}=require('node:perf_hooks');
const commands={typecheck:['run','typecheck'],unit:['test'],database:['run','test:database'],browser:['run','test:e2e'],build:['run','build']};
function distribution(values){const sorted=[...values].sort((a,b)=>a-b);const quantile=p=>sorted[Math.min(sorted.length-1,Math.ceil(p*sorted.length)-1)];return{min:sorted[0],p50:quantile(.5),p95:quantile(.95),max:sorted.at(-1)};}
function measure(name,samples=1,cwd=path.resolve(__dirname,'../..')){
 if(!commands[name]||!Number.isInteger(samples)||samples<1||samples>10)throw new Error('Use an established check name and one to ten samples.');
 const results=[];
 for(let i=0;i<samples;i++){const start=performance.now(),result=spawnSync('npm',commands[name],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024,timeout:45*60000});results.push({sample:i+1,durationMs:Math.round(performance.now()-start),exitCode:result.status??-1});if(result.status!==0)break;}
 return{version:1,recordedAt:new Date().toISOString(),workload:'repository-synthetic-validation',command:name,node:process.version,platform:os.platform(),architecture:os.arch(),cpus:os.cpus().length,memoryBytes:os.totalmem(),samples:results,distributionMs:distribution(results.map(r=>r.durationMs)),passed:results.every(r=>r.exitCode===0)&&results.length===samples,target:'unagreed',releaseAcceptance:'pending'};
}
if(require.main===module){try{const[name,samples='1',output]=process.argv.slice(2),result=measure(name,Number(samples));if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(result,null,2),{mode:0o600,flag:'wx'});console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;}catch{console.error('Measurement failed; use NAME [SAMPLES] [NEW_PRIVATE_REPORT], with typecheck, unit, database, browser or build.');process.exitCode=1;}}
module.exports={measure,distribution};
