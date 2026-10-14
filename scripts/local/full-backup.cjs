const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const archive = require('./operations/archive.cjs');
const database = require('./operations/docker-database.cjs');
const within = (file,directory) => file===directory || file.startsWith(directory+path.sep);
async function backup({ container, privateRoot, referenceRoots = [], keyPath, output }) {
  const root=path.resolve(privateRoot),keyFile=path.resolve(keyPath),target=path.resolve(output),key=await archive.keyFile(keyFile);
  const roots=[{root,prefix:'private',exclude:['backups']},...referenceRoots.map((value,index)=>({root:path.resolve(value),prefix:'references-'+(index+1),exclude:[]}))];
  for(const input of roots){if(within(keyFile,input.root)|| (within(target,input.root)&&!within(target,path.join(input.root,'backups'))))throw new archive.BackupError('Keep the encryption key separate and place archives outside source roots or in their backups directory.');}
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'iop-full-backup-'));await fs.chmod(temporary,0o700);
  let lease,created=false;
  try{
    lease=await database.lease(container);
    const fingerprint=await database.fingerprint(container,lease.snapshot),dump=path.join(temporary,'database.dump');
    await database.dump(container,lease.snapshot,dump);
    const entries=[{path:'database.dump',file:dump,bytes:(await fs.stat(dump)).size,sha256:await archive.digest(dump)}];
    const fileSets=[];for(const input of roots){const files=await archive.collect(input.root,input.prefix,input.exclude);fileSets.push(files);entries.push(...files);}
    const manifest=await archive.seal(target,key,entries,{database:fingerprint,postgresImage:database.IMAGE,consistency:'exported-snapshot-and-checked-private-files'});created=true;
    for(let index=0;index<roots.length;index++){const input=roots[index],after=await archive.collect(input.root,input.prefix,input.exclude);if(JSON.stringify(after)!==JSON.stringify(fileSets[index]))throw new archive.BackupError('Private backup inputs changed; retry after finishing configuration updates.');}
    return {format:'iop-full-backup-v1',files:manifest.files.length,tables:fingerprint.data.length,rows:fingerprint.data.reduce((sum,table)=>sum+table.rows,0),createdAt:manifest.createdAt,expiresAt:manifest.expiresAt};
  }catch(error){if(created)await fs.rm(target,{force:true});throw error;}
  finally{if(lease)await lease.release();await fs.rm(temporary,{recursive:true,force:true});}
}
async function restore({ input,keyPath,destination }) {
  const manifest=await archive.open(path.resolve(input),await archive.keyFile(path.resolve(keyPath)),path.resolve(destination));
  const result=await database.isolatedRestore(path.resolve(destination),manifest);
  const report={...result,restoredAt:new Date().toISOString(),requiresAuditExpiryReview:manifest.metadata.database.catalog.tables?.some(table=>table.schema==='audit')??false,
    activation:'pending-separate-operator-review'};
  await fs.writeFile(path.join(destination,'restore-verification.json'),JSON.stringify(report,null,2),{mode:0o600,flag:'wx'});
  return report;
}
/** Explicit operator retention: authenticate whole owned archives before bounded removal. */
async function prune({keyPath,archiveDirectory,limit=10},now=new Date()) {
  const root=path.resolve(archiveDirectory),key=await archive.keyFile(path.resolve(keyPath));
  if(!Number.isSafeInteger(limit)||limit<1||limit>10||within(path.resolve(keyPath),root)||(await fs.lstat(root)).isSymbolicLink())throw new archive.BackupError('Use a separate key and bounded regular backup directory.');
  const files=(await fs.readdir(root)).filter(name=>name.endsWith('.iopbk')).sort();let examined=0,removed=0;
  for(const name of files){if(examined>=limit)break;const input=path.join(root,name),before=await fs.lstat(input);if(!before.isFile()||before.isSymbolicLink())continue;examined++;
    const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'iop-backup-retention-'));await fs.chmod(temporary,0o700);
    try{const fingerprint=await archive.digest(input),manifest=await archive.open(input,key,path.join(temporary,'verified'));
      if(!Number.isFinite(Date.parse(manifest.expiresAt)))throw new archive.BackupError('Backup retention metadata is invalid.');
      if(Date.parse(manifest.expiresAt)<=now.getTime()){const after=await fs.lstat(input);if(after.dev!==before.dev||after.ino!==before.ino||after.size!==before.size||after.mtimeMs!==before.mtimeMs||await archive.digest(input)!==fingerprint)throw new archive.BackupError('Backup archive changed during retention; no archive was removed.');await fs.unlink(input);removed++;}
    }finally{await fs.rm(temporary,{recursive:true,force:true});}
  }
  return{examined,removed,lifetimeDays:30};
}
function options(args){const result={referenceRoots:[]};for(let index=0;index<args.length;index+=2){const key=args[index],value=args[index+1];if(!value)throw new archive.BackupError('Expected paired operating command options.');const names={'--key':'keyPath','--output':'output','--private':'privateRoot','--container':'container','--input':'input','--destination':'destination','--archives':'archiveDirectory','--limit':'limit'};if(key==='--references')result.referenceRoots.push(value);else if(names[key])result[names[key]]=key==='--limit'?Number(value):value;else throw new archive.BackupError('Unsupported operating command option.');}return result;}
async function main(){const [command,...args]=process.argv.slice(2),input=options(args);let result;
  if(command==='key'&&input.keyPath) {await archive.createKey(path.resolve(input.keyPath));result={keyCreated:true};}
  else if(command==='backup'&&input.keyPath&&input.output){input.privateRoot??=path.resolve(__dirname,'../../.local-platform');input.container??=database.docker(['compose','-f','compose.platform.yaml','ps','-q','database'],{encoding:'utf8',cwd:path.resolve(__dirname,'../..')}).trim();result=await backup(input);}
  else if(command==='restore'&&input.keyPath&&input.input&&input.destination)result=await restore(input);
  else if(command==='prune'&&input.keyPath&&input.archiveDirectory)result=await prune(input);
  else throw new archive.BackupError('Use key --key FILE, backup --key FILE --output FILE, restore --key FILE --input FILE --destination NEW_DIR, or prune --key FILE --archives BACKUP_DIR [--limit 1..10].');
  console.log(JSON.stringify(result));
}
module.exports={backup,restore,prune,options};
if(require.main===module)main().catch(error=>{console.error(error instanceof archive.BackupError?error.message:'Full-platform operating command failed; existing data was preserved.');process.exitCode=1;});
