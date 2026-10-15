// Explicit local source adapter; prepares private candidates, never database writes.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {analyze,VERSION}=require('./locator-models/analyze.cjs');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

function regular(file,limit) {
  const stat=fs.lstatSync(file);
  if(!stat.isFile() || stat.isSymbolicLink() || stat.size>limit)throw new Error('Unsafe or oversized private model input.');
  return fs.readFileSync(file);
}
function json(file,limit) {return JSON.parse(regular(file,limit).toString('utf8'));}
function privateDirectory(directory) {
  if(fs.existsSync(directory)) {
    const stat=fs.lstatSync(directory);
    if(!stat.isDirectory() || stat.isSymbolicLink())throw new Error('Private model output cannot be a symbolic link.');
  } else {
    privateDirectory(path.dirname(directory));fs.mkdirSync(directory,{mode:0o700});
  }
}
function createPrivate(file,bytes) {
  privateDirectory(path.dirname(file));
  if(fs.existsSync(file)) {
    if(!regular(file,32*1024*1024).equals(bytes))throw new Error('Existing model output differs; choose a new review output.');
    return;
  }
  fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
}
function readInputs(directory) {
  const stat=fs.lstatSync(directory);
  if(!stat.isDirectory() || stat.isSymbolicLink())throw new Error('Unsafe private reference directory.');
  const manifest=json(path.join(directory,'manifest.json'),1024*1024);
  if(manifest.version!==1 || ![manifest.organizationId,manifest.siteId].every(v=>typeof v==='string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(v)) || !Array.isArray(manifest.references) || manifest.references.length>250)
    throw new Error('Invalid bounded reference manifest.');
  const seen=new Set();let total=0;
  for(const ref of manifest.references) {
    if(!ref || !/^[a-f0-9]{64}$/.test(ref.id) || ref.id!==ref.sha256 || seen.has(ref.id) || !['schematic','legend'].includes(ref.kind) || !Number.isSafeInteger(ref.width) || !Number.isSafeInteger(ref.height) || ref.width<1 || ref.height<1 || ref.width*ref.height>16777216 || !Number.isSafeInteger(ref.bytes) || ref.bytes<24 || ref.bytes>4194304 || typeof ref.name!=='string' || ref.name.length>160 || typeof ref.group!=='string' || ref.group.length>160)
      throw new Error('Invalid bounded reference metadata.');
    seen.add(ref.id);total+=ref.bytes;
    if(total>64*1024*1024)throw new Error('Reference collection exceeds the finite analysis budget.');
  }
  const file=path.join(directory,'traces.json');
  const traces=fs.existsSync(file)?json(file,4*1024*1024):{version:1,organizationId:manifest.organizationId,siteId:manifest.siteId,scenes:[]};
  if(traces.version!==1 || traces.organizationId!==manifest.organizationId || traces.siteId!==manifest.siteId || !Array.isArray(traces.scenes) || traces.scenes.length>250 || new Set(traces.scenes.map(s=>s.referenceId)).size!==traces.scenes.length)
    throw new Error('Invalid previous trace scope or baseline.');
  for(const scene of traces.scenes)
    if(!seen.has(scene.referenceId) || !Array.isArray(scene.components) || scene.components.length>1000 || scene.components.some(c=>!c || c.assetId!=='' || c.verification!=='provisional' || c.elevation!==null))
      throw new Error('Previous traces contain unsupported linked or surveyed data.');
  return {manifest,traces};
}
function referenceBytes(directory,ref) {
  const bytes=regular(path.join(directory,ref.id+'.png'),4*1024*1024);
  if(bytes.length!==ref.bytes || digest(bytes)!==ref.sha256 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || bytes.length<24 || bytes.readUInt32BE(16)!==ref.width || bytes.readUInt32BE(20)!==ref.height)
    throw new Error('Original schematic bytes or dimensions changed.');
  return bytes;
}
function nativeAdapter(temporary) {
  if(process.platform!=='darwin')throw new Error('This explicit source adapter requires installed macOS AppKit/Swift.');
  const executable=path.join(temporary,'native-image'),source=path.join(__dirname,'locator-models/native-image.swift');
  const cache=path.join(os.tmpdir(),'iop-locator-model-swift-cache-'+process.getuid());
  privateDirectory(cache);
  if(fs.statSync(cache).mode&0o077)throw new Error('Native model cache requires private directory permissions.');
  execFileSync('/usr/bin/swiftc',['-O','-module-cache-path',cache,source,'-o',executable],{stdio:['ignore','pipe','pipe'],timeout:120000,maxBuffer:1024*1024});
  return {
    decode(file,ref) {
      const output=path.join(temporary,ref.id+'.rgba');
      execFileSync(executable,['decode',file,output],{stdio:['ignore','pipe','pipe'],timeout:20000,maxBuffer:1024*1024});
      const bytes=regular(output,8+16777216*4);fs.unlinkSync(output);
      if(bytes.readUInt32BE(0)!==ref.width || bytes.readUInt32BE(4)!==ref.height)throw new Error('Decoded reference dimensions differ.');
      return bytes.subarray(8);
    },
    overlay(file,boxes,output) {
      const annotations=path.join(temporary,'overlay.json');
      fs.writeFileSync(annotations,JSON.stringify(boxes),{mode:0o600});
      execFileSync(executable,['overlay',file,annotations,output],{stdio:['ignore','pipe','pipe'],timeout:20000,maxBuffer:1024*1024});
      fs.chmodSync(output,0o600);
    },
  };
}
function prepareModels({directory,output,inspection,adapter}) {
  const {manifest,traces}=readInputs(directory),originalManifest=regular(path.join(directory,'manifest.json'),1024*1024),originalTraces=fs.existsSync(path.join(directory,'traces.json'))?regular(path.join(directory,'traces.json'),4*1024*1024):null;
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'iop-locator-model-'));
  fs.chmodSync(temporary,0o700);
  try {
    const native=adapter??nativeAdapter(temporary),scenes=[],summary={scenes:0,components:0,conveyors:0,motors:0,photoelectricSensors:0,manualTraceRequired:0};
    if(inspection)privateDirectory(inspection);
    // Original integrity is checked before analysis and again before publishing candidates.
    for(const ref of manifest.references)referenceBytes(directory,ref);
    for(const ref of manifest.references.filter(r=>r.kind==='schematic')) {
      const file=path.join(directory,ref.id+'.png'),previous=traces.scenes.find(s=>s.referenceId===ref.id)?.components??[];
      const scene=analyze(ref,native.decode(file,ref),previous);
      if(inspection) {
        const overlay=path.join(inspection,ref.id+'.png');
        if(fs.existsSync(overlay))throw new Error('Inspection output already exists; choose a new review directory.');
        native.overlay(file,scene.overlay,overlay);
      }
      delete scene.overlay;scenes.push(scene);summary.scenes++;summary.components+=scene.components.length;
      summary.conveyors+=scene.components.filter(c=>c.kind==='conveyor'||c.kind==='curve').length;
      summary.motors+=scene.evidence.detected.motors;summary.photoelectricSensors+=scene.evidence.detected.photoelectricSensors;
      if(!scene.components.length)summary.manualTraceRequired++;
    }
    for(const ref of manifest.references)referenceBytes(directory,ref);
    if(!regular(path.join(directory,'manifest.json'),1024*1024).equals(originalManifest) || (originalTraces && !regular(path.join(directory,'traces.json'),4*1024*1024).equals(originalTraces)) || (!originalTraces && fs.existsSync(path.join(directory,'traces.json'))))
      throw new Error('Reference catalog or previous baseline changed during analysis.');
    const candidates={version:1,organizationId:manifest.organizationId,siteId:manifest.siteId,algorithm:VERSION,scenes};
    const bytes=Buffer.from(JSON.stringify(candidates,null,2)+'\n');
    if(bytes.length>32*1024*1024 || scenes.some(scene=>Buffer.byteLength(JSON.stringify(scene))>1024*1024))throw new Error('Candidate data exceeds its finite review budget.');
    createPrivate(output,bytes);
    if(inspection)createPrivate(path.join(inspection,'review-summary.json'),Buffer.from(JSON.stringify({algorithm:VERSION,...summary,bytes:bytes.length,scenes:scenes.map(s=>({referenceId:s.referenceId,...s.evidence}))},null,2)+'\n'));
    return {...summary,bytes:bytes.length};
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
}
function main() {
  const args=process.argv.slice(2),options={};
  while(args.length) {const key=args.shift();if(!['--directory','--output','--inspection'].includes(key)||!args.length||options[key])throw new Error('Use --directory SCOPE --output NEW_PRIVATE_JSON [--inspection NEW_PRIVATE_DIRECTORY].');options[key]=path.resolve(args.shift());}
  if(!options['--directory']||!options['--output'])throw new Error('An explicit scoped directory and private candidate output are required.');
  const result=prepareModels({directory:options['--directory'],output:options['--output'],inspection:options['--inspection']});
  console.log(`Prepared ${result.scenes} provisional scenes: ${result.conveyors} conveyor/curve components, ${result.motors} motors, ${result.photoelectricSensors} photoelectric-sensor candidates; ${result.bytes} bytes. Manual-only views: ${result.manualTraceRequired}.`);
  console.log('No scene/database changes. Review private overlays before the authorized Administrator model upgrade.');
}
if(require.main===module) {try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={readInputs,referenceBytes,prepareModels};
