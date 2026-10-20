const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createHash}=require('node:crypto');
const {analyze,image,motors,diagonalConveyors}=require('./local/locator-models/analyze.cjs');
const {prepareModels}=require('./local/locator-schematic-models.cjs');
function fixture() {
  const width=240,height=160,rgba=Buffer.alloc(width*height*4,212);
  const put=(x,y,color)=>{for(let c=0;c<3;c++)rgba[(y*width+x)*4+c]=color[c];rgba[(y*width+x)*4+3]=255;};
  for(let x=25;x<=215;x++){put(x,80,[110,110,110]);put(x,100,[110,110,110]);}
  for(const [cx,cy,colored] of [[55,90,true],[135,90,false]])for(let y=cy-8;y<=cy+8;y++)for(let x=cx-8;x<=cx+8;x++) {
    const r=Math.hypot(x-cx,y-cy);if(r>7.5)continue;
    put(x,y,r>6.2||x-cx+y-cy>0?[0,0,0]:colored?[0,220,0]:[205,205,205]);
  }
  for(let y=80;y<=100;y++){put(95,y,[120,120,120]);put(96,y,[120,120,120]);}
  // Green UI/status squares and out-of-belt dark modules are not motors/sensors.
  for(let y=40;y<48;y++)for(let x=180;x<188;x++)put(x,y,[0,220,0]);
  for(let y=120;y<127;y++)for(let x=165;x<183;x++)put(x,y,[20,20,20]);
  // Hollow emergency-stop circles in square frames are a different legend symbol.
  for(let y=115;y<=131;y++)for(let x=45;x<=61;x++)if(x===45||x===61||y===115||y===131||Math.abs(Math.hypot(x-53,y-123)-5.5)<0.7)put(x,y,[0,0,0]);
  // A diagonally hatched initiator circle is not the solid half-filled motor symbol.
  for(let y=122;y<=138;y++)for(let x=197;x<=213;x++) {
    const radius=Math.hypot(x-205,y-130);
    if(radius<=7.5 && (radius>6.2 || (x+y)%4<2))put(x,y,[0,0,0]);
  }
  // A long white HMI button also has paired edges, without conveyor evidence.
  for(let y=38;y<=58;y++)for(let x=30;x<=155;x++)put(x,y,y===38||y===58?[110,110,110]:[245,245,245]);
  // A neutral title-bar button must not become a passive conveyor.
  for(let x=30;x<=155;x++){put(x,5,[110,110,110]);put(x,25,[110,110,110]);}
  return {width,height,rgba};
}
const reference=(width,height)=>({id:'a'.repeat(64),sha256:'a'.repeat(64),width,height});
test('distinguishes circle motors from status squares and thin cross-belt sensor bars from external modules',()=>{
  const f=fixture(),result=analyze(reference(f.width,f.height),f.rgba);
  expect(result.components.filter(c=>c.kind==='motor')).toHaveLength(2);
  expect(result.components.filter(c=>c.kind==='photoelectric-sensor')).toHaveLength(1);
  expect(result.components.filter(c=>c.kind==='conveyor')).toHaveLength(1);
  expect(result.components.every(c=>c.elevation===null && c.assetId==='' && c.verification==='provisional')).toBe(true);
  expect(result.components.find(c=>c.kind==='photoelectric-sensor').x).toBeCloseTo(96/240,2);
  expect(result.components.find(c=>c.kind==='photoelectric-sensor').rotation).toBe(90);
  expect(result.components.every(c=>c.note.includes('pixel box') && c.note.includes('not live health'))).toBe(true);
});
test('paired diagonal rails produce image-local rotated conveyors rather than an invented axis-aligned bridge',()=>{
  const width=240,height=240,rgba=Buffer.alloc(width*height*4,212);
  for(let x=30;x<=180;x++)for(const offset of [5,33])for(let c=0;c<3;c++)rgba[((x+offset)*width+x)*4+c]=110;
  const boxes=diagonalConveyors(image(width,height,rgba),[]);
  expect(boxes).toHaveLength(1);expect(boxes[0]).toMatchObject({rotation:45,method:'paired-diagonal-rails'});
  expect(boxes[0].depthPixels).toBeCloseTo(28/Math.SQRT2);
  const result=analyze(reference(width,height),rgba);
  expect(result.components).toHaveLength(1);expect(result.components[0].rotation).toBe(45);
});
test('stable image-local identities preserve explicit old topology/scanner evidence and record a full upgrade baseline',()=>{
  const f=fixture(),ref=reference(f.width,f.height),old=[{id:'reference-scanner-1',kind:'scanner',label:'Observed original label',assetId:'',verification:'provisional',elevation:null,note:'Original manually observed reference.'}];
  const first=analyze(ref,f.rgba,old),second=analyze(ref,f.rgba,old);
  expect(second).toEqual(first);expect(first.previousComponents).toEqual(old);
  expect(first.components[0]).toEqual(old[0]);
  expect(first.components.some(c=>c.kind==='conveyor')).toBe(false);
  expect(new Set(first.components.map(c=>c.id)).size).toBe(first.components.length);
  expect(analyze({...ref,id:'b'.repeat(64),sha256:'b'.repeat(64)},f.rgba,old).components[1].id).not.toBe(first.components[1].id);
});
test('empty or unsupported views stay explicitly manual and invalid pixel budgets are denied',()=>{
  const rgba=Buffer.alloc(100*100*4,212),result=analyze(reference(100,100),rgba);
  expect(result.components).toEqual([]);expect(result.evidence.status).toBe('manual-trace-required');
  expect(()=>image(17000000,1,Buffer.alloc(0))).toThrow('finite');
  expect(motors(image(100,100,rgba))).toEqual([]);
});
let root;
beforeEach(()=>{root=fs.mkdtempSync(path.join(os.tmpdir(),'iop-schematic-test-'));});
afterEach(()=>fs.rmSync(root,{recursive:true,force:true}));
function inputs() {
  const f=fixture(),png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.writeUInt32BE(f.width,16);png.writeUInt32BE(f.height,20);
  const id=createHash('sha256').update(png).digest('hex'),ref={id,sha256:id,name:'Synthetic area',group:'Synthetic family',width:f.width,height:f.height,bytes:png.length,kind:'schematic'};
  fs.writeFileSync(path.join(root,id+'.png'),png);
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({version:1,organizationId:'org',siteId:'site',references:[ref]}));
  return {f,ref,png};
}
test('private candidate generation preserves original images/baselines and is byte-idempotent without scene/database writes',()=>{
  const {f,ref,png}=inputs(),output=path.join(root,'output','models.json');
  const adapter={decode:()=>f.rgba};
  const first=prepareModels({directory:root,output,adapter}),again=prepareModels({directory:root,output,adapter});
  expect(again).toEqual(first);expect(first).toMatchObject({scenes:1,motors:2,photoelectricSensors:1});
  const candidate=JSON.parse(fs.readFileSync(output,'utf8'));
  expect(candidate.scenes[0].previousComponents).toEqual([]);expect(candidate.scenes[0].evidence.sourceSha256).toBe(ref.id);
  expect(fs.readFileSync(path.join(root,ref.id+'.png'))).toEqual(png);
  expect(fs.statSync(output).mode&0o777).toBe(0o600);expect(fs.statSync(path.dirname(output)).mode&0o777).toBe(0o700);
});
test('modified source bytes, symlinks and linked/surveyed trace baselines are refused before output',()=>{
  const {f,ref}=inputs(),output=path.join(root,'models.json'),source=path.join(root,ref.id+'.png'),args={directory:root,output,adapter:{decode:()=>f.rgba}};
  const original=fs.readFileSync(source);fs.appendFileSync(source,'changed');
  expect(()=>prepareModels(args)).toThrow('Original schematic');expect(fs.existsSync(output)).toBe(false);
  fs.writeFileSync(source,original);fs.renameSync(source,source+'.original');fs.symlinkSync(source+'.original',source);
  expect(()=>prepareModels(args)).toThrow('Unsafe');fs.unlinkSync(source);fs.renameSync(source+'.original',source);
  fs.writeFileSync(path.join(root,'traces.json'),JSON.stringify({version:1,organizationId:'org',siteId:'site',scenes:[{referenceId:ref.id,components:[{assetId:'explicit-linked-asset',verification:'surveyed',elevation:0.2}]}]}));
  expect(()=>prepareModels(args)).toThrow('linked or surveyed');expect(fs.existsSync(output)).toBe(false);
});
test('a concurrently changed catalog cannot publish candidates and existing output is never replaced',()=>{
  const {f}=inputs(),output=path.join(root,'models.json'),before=Buffer.from('operator review');fs.writeFileSync(output,before);
  expect(()=>prepareModels({directory:root,output,adapter:{decode:()=>f.rgba}})).toThrow('differs');
  expect(fs.readFileSync(output)).toEqual(before);
  fs.unlinkSync(output);
  expect(()=>prepareModels({directory:root,output,adapter:{decode:()=>{fs.appendFileSync(path.join(root,'manifest.json'),' ');return f.rgba;}}})).toThrow('changed during analysis');
  expect(fs.existsSync(output)).toBe(false);
});
