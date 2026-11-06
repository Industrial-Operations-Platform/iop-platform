const fs = require('node:fs');
const {join} = require('node:path');
const {tmpdir} = require('node:os');
const {copyInput} = require('./railway/deploy.cjs');
const {runtimeEnvironment} = require('./railway/configuration.cjs');
const {restoreGuard} = require('./railway/initial-data.cjs');
const {smoke} = require('./railway/smoke.cjs');
let directory;
beforeEach(()=>{directory=fs.mkdtempSync(join(tmpdir(),'iop-deployment-test-'));});
afterEach(()=>{fs.rmSync(directory,{recursive:true,force:true});jest.restoreAllMocks();});
test('source staging refuses credential files, credential URLs and private keys before upload',()=>{
  const source=join(directory,'source'),target=join(directory,'stage');fs.mkdirSync(source);
  fs.writeFileSync(join(source,'.env'),'PASSWORD=private');
  expect(()=>copyInput('.env',target,source)).toThrow('secret hygiene');
  fs.writeFileSync(join(source,'source.js'),'const key="'+'-----BEGIN '+'PRIVATE KEY-----'+'";');
  expect(()=>copyInput('source.js',target,source)).toThrow('secret hygiene');
  fs.writeFileSync(join(source,'source.js'),'module.exports = true;');
  copyInput('source.js',target,source);expect(fs.readFileSync(join(target,'source.js'),'utf8')).toContain('true');
});
test('the API subprocess only receives its non-owner credential, never deployment or provisioning secrets',()=>{
  const env=runtimeEnvironment({IOP_POSTGRES_PASSWORD:'owner',IOP_MIGRATOR_PASSWORD:'migrate',IOP_RUNTIME_PASSWORD:'runtime',RAILWAY_TOKEN:'token',PGPASSWORD:'owner',PGOPTIONS:'unsafe',DATABASE_URL:'ambient'});
  expect(env).toEqual({IOP_RUNTIME_PASSWORD:'runtime'});
});
test('initial import has an empty-database guard, separate fixed roles and one transaction',()=>{
  const sql=restoreGuard({IOP_MIGRATOR_PASSWORD:'a'.repeat(43),IOP_RUNTIME_PASSWORD:'b'.repeat(43)});
  expect(sql).toContain('BEGIN;');expect(sql).toContain("current_database()<>'iop_local'");expect(sql).toContain("rolname IN ('iop_migrator','iop_runtime')");
  expect(sql).toContain('NOBYPASSRLS');expect(sql).not.toContain('DROP ');
  expect(()=>restoreGuard({IOP_MIGRATOR_PASSWORD:"bad'",IOP_RUNTIME_PASSWORD:'b'.repeat(43)})).toThrow();
});
test('live verification waits for the requested revision and rejects anonymous business access',async()=>{
  jest.spyOn(console,'log').mockImplementation(()=>{});let revision='old';
  jest.spyOn(global,'fetch').mockImplementation(async url=>{
    if(url.endsWith('/health'))return new Response(JSON.stringify({status:'ok'}));
    if(url.endsWith('/demo/context'))return new Response(JSON.stringify({enabled:true,authentication:'password',user:null,scope:null}));
    if(url.endsWith('/users'))return new Response('{}',{status:401});
    if(url.endsWith('/build-revision.json'))return new Response(JSON.stringify({revision}));
    return new Response('<html/>',{headers:{'Content-Type':'text/html'}});
  });
  await expect(smoke('https://example.com',1,0,'new')).rejects.toThrow('verification');
  revision='new';await expect(smoke('https://example.com',1,0,'new')).resolves.toBeUndefined();
});
