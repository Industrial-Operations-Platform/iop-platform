const {mkdtempSync,mkdirSync,writeFileSync,readFileSync,statSync,symlinkSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const {copyReferences}=require('./local/locator-private-copy.cjs');
let root;
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'iop-private-copy-'));mkdirSync(join(root,'source'));});
afterEach(()=>rmSync(root,{recursive:true,force:true}));
const ownership=()=>({uid:process.getuid(),gid:process.getgid()});
test('installs reference metadata privately and preserves source bytes',()=>{
  mkdirSync(join(root,'source','org','site'),{recursive:true});
  writeFileSync(join(root,'source','org','site','manifest.json'),'{}');
  expect(copyReferences(join(root,'source'),join(root,'destination'),ownership())).toEqual({files:1,bytes:2});
  const output=join(root,'destination','org','site','manifest.json');
  expect(readFileSync(output,'utf8')).toBe('{}');expect(statSync(output).mode&0o777).toBe(0o600);
  expect(statSync(join(root,'destination')).mode&0o777).toBe(0o700);
});
test('rejects symlinks and unsupported sources before changing existing destination',()=>{
  mkdirSync(join(root,'destination'));writeFileSync(join(root,'destination','manifest.json'),'original');
  writeFileSync(join(root,'source','secrets.env'),'unrelated');
  expect(()=>copyReferences(join(root,'source'),join(root,'destination'),ownership())).toThrow('unsupported');
  expect(readFileSync(join(root,'destination','manifest.json'),'utf8')).toBe('original');
  rmSync(join(root,'source','secrets.env'));symlinkSync(join(root,'destination','manifest.json'),join(root,'source','manifest.json'));
  expect(()=>copyReferences(join(root,'source'),join(root,'destination'),ownership())).toThrow('symbolic');
});
