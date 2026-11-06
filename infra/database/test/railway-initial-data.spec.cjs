const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { provisioningConfiguration } = require('../dist/configuration');
const { provision } = require('../dist/provision');
const { migrate } = require('../dist/migrate');
const { restoreGuard } = require('../../../scripts/railway/initial-data.cjs');
const containers=[];
afterAll(async()=>{await Promise.all(containers.map(c=>c.stop()));});
function connection(container, passwords) {
  return provisioningConfiguration({IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:container.getHost(),IOP_DATABASE_PORT:String(container.getPort()),IOP_DATABASE_NAME:'iop_local',...passwords});
}
async function query(config,sql) {const client=new Client(config);try{await client.connect();return await client.query(sql);}finally{await client.end();}}
test('initial snapshot preserves data, ownership and RLS with independent cloud credentials and refuses a second import',async()=>{
  const old={IOP_POSTGRES_PASSWORD:'synthetic-bootstrap-password',IOP_MIGRATOR_PASSWORD:'synthetic-migrator-password',IOP_RUNTIME_PASSWORD:'synthetic-runtime-password'};
  const fresh={IOP_POSTGRES_PASSWORD:'c'.repeat(43),IOP_MIGRATOR_PASSWORD:'a'.repeat(43),IOP_RUNTIME_PASSWORD:'b'.repeat(43)};
  const source=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword(old.IOP_POSTGRES_PASSWORD).start();containers.push(source);
  const sourceConfigs=connection(source,old);await provision(sourceConfigs);await migrate(sourceConfigs.migrator);await provision(sourceConfigs);
  const scope={IOP_DATABASE_MODE:'local',IOP_DATABASE_HOST:source.getHost(),IOP_DATABASE_PORT:String(source.getPort()),IOP_DATABASE_NAME:'iop_local',...old,IOP_SEED_ORGANIZATION_ID:'retained-org',IOP_SEED_ORGANIZATION_NAME:'Retained organization'};
  await require('../dist/seed-organization').seedOrganization(scope);
  const dump=spawnSync('docker',['exec',source.getId(),'pg_dump','-U','iop_bootstrap','-d','iop_local'],{encoding:'utf8',maxBuffer:16*1024*1024});
  expect(dump.status).toBe(0);
  const target=await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword(fresh.IOP_POSTGRES_PASSWORD).start();containers.push(target);
  const sql=restoreGuard(fresh)+dump.stdout+'\nUPDATE authentication.sessions SET revoked=true;\nCOMMIT;\n';
  const restore=()=>spawnSync('docker',['exec','-i',target.getId(),'psql','-X','-U','iop_bootstrap','-d','iop_local','--set','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',maxBuffer:1024*1024});
  expect(restore().status).toBe(0);
  const targetConfigs=connection(target,fresh);await provision(targetConfigs);expect(await migrate(targetConfigs.migrator)).toBe(0);
  expect((await query(targetConfigs.bootstrap,'SELECT organization_id FROM platform_core.organizations')).rows).toContainEqual({organization_id:'retained-org'});
  expect((await query(targetConfigs.runtime,'SELECT current_user AS name')).rows[0].name).toBe('iop_runtime');
  await expect(query(targetConfigs.runtime,'SELECT * FROM platform_core.organizations')).rejects.toThrow();
  expect(restore().status).not.toBe(0);
  expect((await query(targetConfigs.bootstrap,'SELECT organization_id FROM platform_core.organizations')).rows).toHaveLength(1);
},120000);
