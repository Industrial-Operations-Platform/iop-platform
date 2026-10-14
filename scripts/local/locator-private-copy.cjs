// Finite local setup adapter: private host references become node-owned volume files.
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
function copyReferences(source, destination, ownership = {uid:1000,gid:1000}) {
  let count = 0, total = 0;
  const files = [];
  function inspect(directory, relative = '', depth = 0) {
    if (depth > 5) throw new Error('Locator reference directory is too deep.');
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const local = path.join(relative,entry.name), file = path.join(directory,entry.name);
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error('Locator references cannot contain symbolic links.');
      if (stat.isDirectory()) inspect(file,local,depth+1);
      else {
        if (!stat.isFile() || !/\.(?:png|json)$/.test(entry.name) || ++count > 1500 || stat.size > 16*1024*1024)
          throw new Error('Locator reference file is unsupported or exceeds its budget.');
        total += stat.size;
        if (total > 256*1024*1024) throw new Error('Locator reference collection exceeds its budget.');
        files.push({source:file,relative:local});
      }
    }
  }
  inspect(source);
  function directory(relative) {
    const parts = relative.split(path.sep).filter(Boolean);
    let current = destination;
    for (const part of ['',...parts]) {
      if(part)current=path.join(current,part);
      fs.mkdirSync(current,{recursive:true,mode:0o700});
      if(fs.lstatSync(current).isSymbolicLink())throw new Error('Locator destination cannot contain symbolic links.');
      fs.chmodSync(current,0o700);fs.chownSync(current,ownership.uid,ownership.gid);
    }
  }
  directory('');
  for(const file of files){
    directory(path.dirname(file.relative)==='.'?'':path.dirname(file.relative));
    const target=path.join(destination,file.relative), temporary=target+'.pending-'+randomUUID();
    try {
      fs.copyFileSync(file.source,temporary,fs.constants.COPYFILE_EXCL);
      fs.chmodSync(temporary,0o600);fs.chownSync(temporary,ownership.uid,ownership.gid);
      fs.renameSync(temporary,target);
    } finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
  }
  return {files:count,bytes:total};
}
if(require.main===module){
  try {const result=copyReferences('/source','/destination');console.log(`Installed ${result.files} private locator files.`);}
  catch {console.error('Private locator reference setup failed. Retry setup before starting the API.');process.exitCode=1;}
}
module.exports={copyReferences};
