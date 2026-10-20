import { mkdtemp, mkdir, writeFile, rm, symlink, truncate } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Locator, type Transaction, type References } from '../src/modules/asset-locator/application/locator';
import { demonstration, LocatorError, type Scene, type Revision, type Reference } from '../src/modules/asset-locator/domain/locator';
import { modelState, validModelCandidate, type ModelCandidate } from '../src/modules/asset-locator/domain/model-preparation';
import { PrivateModelCandidates } from '../src/modules/asset-locator/adapters/files/model-candidates';

const reference: Reference = { id: 'a'.repeat(64), sha256: 'a'.repeat(64), name: 'Source drawing', group: 'Fixture', sourcePath: 'fixture.png', width: 10, height: 10, bytes: 24, kind: 'schematic', importedAt: '2026-10-14T12:00:00Z' };
const old = { ...demonstration().components[0], id: 'old-conveyor' };
const motor = { ...old, id: 'source-motor', kind: 'motor' as const, label: 'Motor 001' };
const photoeye = { ...old, id: 'source-photoeye', kind: 'photoelectric-sensor' as const, label: 'Photoelectric sensor 001' };
const candidate: ModelCandidate = { referenceId: reference.id, previousComponents: [old], components: [old, motor, photoeye, { ...old, id: 'source-opposing-bends', kind: 's-curve' }] };
const scene = (): Scene => ({ id: 'reference-' + reference.id, revision: 1, authorId: 'owner', createdAt: '2026-10-14T12:00:00Z', updatedAt: '2026-10-14T12:00:00Z', content: { ...demonstration(), referenceId: reference.id, components: [old] } });

test('model upgrade preserves manual labels, positions, notes, links, survey and deliberate clearing', () => {
  expect(modelState(scene(), candidate)).toBe('ready');
  for (const change of [{label:'Operator label'}, {x:.123}, {note:'Operator note'}, {assetId:'asset'}, {elevation:.1}]) {
    const current = scene(); current.content.components = [{...old,...change}];
    expect(modelState(current, candidate)).toBe('manual-edits-preserved');
  }
  const surveyed = scene(); surveyed.content.surveyNote = 'Survey in progress';
  expect(modelState(surveyed, candidate)).toBe('manual-edits-preserved');
  const cleared = scene(); cleared.content.components = []; cleared.revision = 2;
  expect(modelState(cleared, candidate)).toBe('manual-edits-preserved');
  cleared.revision = 1; expect(modelState(cleared, candidate)).toBe('ready');
  expect(modelState(null, candidate)).toBe('not-initialized');
  expect(modelState(scene(), {...candidate, components:[]})).toBe('manual-review-required');
  const oversized = validModelCandidate({...candidate, components:Array.from({length:1000},(_,i)=>({...motor,id:'motor-'+i,note:'Evidence '.repeat(220)}))});
  expect(modelState(scene(),oversized)).toBe('manual-review-required');
});

test('per-scene apply is attributed, idempotent and rejects stale revisions without partial updates', async () => {
  let current = scene(), manage = true; const revisions: Revision[] = [];
  const tx: Transaction = { canManage:true, scenes:async()=>[current], get:async()=>current,
    save:async(s,r)=>{current=structuredClone(s);revisions.push(structuredClone(r));}, history:async()=>[],
    asset:async(id)=>({id,code:'Exact',name:'Exact identity',locationId:'',status:'unverified'}),
    assets:async()=>[], problems:async()=>({items:[],coverage:[]}) };
  const references: References = { list:async()=>[reference], bytes:jest.fn(async()=>new Uint8Array([1])), components:async()=>[old] };
  const app = new Locator({run:async(_a,p,work)=>{if(p==='locator.manage'&&!manage)throw new LocatorError('locator_denied');return work(tx);}}, references, [], ()=>'new', ()=>'2026-10-14T13:00:00Z', {list:async()=>[candidate]});
  expect((await app.modelPreview('admin')).models[0]).toMatchObject({status:'ready',motors:1,photoelectricSensors:1,conveyors:2});
  expect(await app.applyModel('admin',{id:current.id,expectedRevision:1})).toMatchObject({status:'applied',revision:2});
  expect(revisions).toHaveLength(1); expect(revisions[0].actorId).toBe('admin'); expect(current.content.components).toEqual(candidate.components);
  await expect(app.applyModel('admin',{id:current.id,expectedRevision:1})).rejects.toMatchObject({code:'locator_conflict'});
  expect(await app.applyModel('admin',{id:current.id,expectedRevision:2})).toMatchObject({status:'current',revision:2});
  expect(revisions).toHaveLength(1);
  // Exact navigation must not use the bounded fuzzy-search port at all.
  const found = await app.locate('reader','unplaced-after-page-200');
  expect(found.results[0]).toMatchObject({asset:{id:'unplaced-after-page-200'},placements:[]});
  current = scene(); (references.bytes as jest.Mock).mockRejectedValue(new LocatorError('locator_reference_unavailable'));
  await expect(app.applyModel('admin',{id:current.id,expectedRevision:1})).rejects.toMatchObject({code:'locator_reference_unavailable'});
  expect(current.revision).toBe(1); expect(revisions).toHaveLength(1);
  current.content.components = [{...old,label:'Manual'}];
  expect(await app.applyModel('admin',{id:current.id,expectedRevision:1})).toMatchObject({status:'manual-edits-preserved'});
  manage = false;
  await expect(app.modelPreview('reader')).rejects.toMatchObject({code:'locator_denied'});
  await expect(app.applyModel('reader',{id:current.id,expectedRevision:1})).rejects.toMatchObject({code:'locator_denied'});
});

test('candidate input cannot carry invented links, surveyed geometry or duplicate identities', () => {
  expect(validModelCandidate(candidate)).toEqual(candidate);
  for (const change of [{assetId:'invented'}, {elevation:.2}, {verification:'surveyed',assetId:'invented',elevation:.2,note:'fake'}, {x:NaN}])
    expect(()=>validModelCandidate({...candidate,components:[{...motor,...change}]})).toThrow(LocatorError);
  expect(()=>validModelCandidate({...candidate,components:[motor,motor]})).toThrow(LocatorError);
});

test('private candidates validate scope, replacement, symlink and size without stale cached results', async () => {
  const root = await mkdtemp(join(tmpdir(),'locator-model-test-')), directory=join(root,'org','site'), file=join(directory,'model-candidates.json');
  try {
    await mkdir(directory,{recursive:true});
    const source = new PrivateModelCandidates(root,{organizationId:'org',siteId:'site'});
    expect(await source.list()).toEqual([]);
    const write = async (extra={})=>writeFile(file,JSON.stringify({version:1,organizationId:'org',siteId:'site',scenes:[candidate],...extra}));
    await write(); const copy = await source.list(); copy[0].components[0].label='Mutated';
    expect((await source.list())[0].components[0].label).toBe(old.label);
    await write({organizationId:'foreign'}); await expect(source.list()).rejects.toMatchObject({code:'locator_reference_unavailable'});
    await write({scenes:[candidate,candidate]}); await expect(source.list()).rejects.toMatchObject({code:'locator_reference_unavailable'});
    await rm(file); await writeFile(join(root,'outside.json'),'{}'); await symlink(join(root,'outside.json'),file);
    await expect(source.list()).rejects.toMatchObject({code:'locator_reference_unavailable'});
    await rm(file); await write(); await truncate(file,32*1024*1024+1);
    await expect(source.list()).rejects.toMatchObject({code:'locator_reference_unavailable'});
  } finally { await rm(root,{recursive:true,force:true}); }
});
