import { Locator, type Store, type Transaction, type References } from '../src/modules/asset-locator/application/locator';
import { demonstration, LocatorError, validContent, type Scene, type Revision, type Asset, type Reference } from '../src/modules/asset-locator/domain/locator';
const reference: Reference = { id: 'a'.repeat(64), name: 'Area drawing', group: 'Area group', sourcePath: 'External/Area.png', sha256: 'a'.repeat(64), width: 1600, height: 900, bytes: 24, importedAt: '2026-10-14T12:00:00.000Z', kind: 'schematic' };
function harness() { let actor = 'manager', manage = true, at = 0, sequence = 0; const scenes = new Map<string, Scene>(), revisions: Revision[] = []; const assets: Asset[] = [{ id: 'asset-a', code: 'A', name: 'Sensor A', locationId: 'area', status: 'unverified' }, { id: 'asset-b', code: 'B', name: 'Sensor B', locationId: 'area', status: 'validated' }]; const tx: Transaction = { get: async (id) => scenes.get(id) ?? null, canManage: true, scenes: async () => [...scenes.values()], save: async (s, r) => { scenes.set(s.id, structuredClone(s)); revisions.push(structuredClone(r)); }, history: async (id, before) => revisions.filter(r => r.scene.id === id && r.scene.revision < before).reverse().slice(0, 31), asset: async (id) => assets.find(a => a.id === id) ?? null, assets: async (needle) => assets.filter(a => a.code.includes(needle) || a.name.includes(needle)), problems: async (ids) => ({ items: ids.includes('asset-a') ? [{ assetId: 'asset-a', kind: 'handover', id: 'problem-a', title: 'Reported blockage', status: 'open', recordedAt: '2026-10-14T10:00:00.000Z' }] : [], coverage: [{ kind: 'handover', status: 'available' }, { kind: 'maintenance', status: 'not-authorized' }] }) }; const store: Store = { run: async (_actor, permission, work) => { if (_actor !== actor || permission === 'locator.manage' && !manage)
    throw new LocatorError('locator_denied'); tx.canManage = manage; return work(tx); } }; const references: References = { list: async () => [reference], bytes: async () => new Uint8Array([1]), components: async () => [{ ...demonstration().components[0], id: 'private-trace', note: 'Traced from a private schematic.' }] }; const app = new Locator(store, references, [{ id: 'area', label: 'Area', parentId: '' }], () => `scene-${++sequence}`, () => new Date(Date.UTC(2026, 9, 14, 12, 0, at++)).toISOString()); return { app, scenes, revisions, assets, deny: () => { manage = false; }, references, store, tx }; }
test('bootstrap creates idempotent provisional private scenes and preserves later edits', async () => { const h = harness(); expect((await h.app.bootstrap('manager')).created).toBe(2); expect((await h.app.bootstrap('manager')).created).toBe(0); const privateScene = await h.app.detail('manager', 'reference-' + reference.id); expect(privateScene.scene.content.components[0]).toMatchObject({ id: 'private-trace', elevation: null, assetId: '', verification: 'provisional' }); const changed = await h.app.save('manager', { id: privateScene.scene.id, expectedRevision: 1, note: 'Added review note', content: { ...privateScene.scene.content, description: 'Reviewed draft' } }); await h.app.bootstrap('manager'); expect((await h.app.detail('manager', changed.id)).scene.content.description).toBe('Reviewed draft'); expect(h.revisions).toHaveLength(3); });
test('scene edits retain immutable revisions and reject optimistic conflicts', async () => { const h = harness(); const content = demonstration(); const scene = await h.app.save('manager', { id: '', expectedRevision: 0, note: 'Create synthetic example', content }); const changed = await h.app.save('manager', { id: scene.id, expectedRevision: 1, note: 'Move a component', content: { ...content, components: content.components.map(c => ({ ...c, x: 0.4 })) } }); expect(changed.revision).toBe(2); expect(h.revisions[0].scene.content.components[0].x).toBe(0.35); await expect(h.app.save('manager', { id: scene.id, expectedRevision: 1, note: 'Stale change', content })).rejects.toMatchObject({ code: 'locator_conflict' }); expect(h.revisions).toHaveLength(2); });
test('exact asset links drive placement search; unplaced and authorized evidence are explicit', async () => { const h = harness(), content = demonstration(); content.components[0].assetId = 'asset-a'; const scene = await h.app.save('manager', { id: '', expectedRevision: 0, note: 'Explicit link', content }); const results = await h.app.search('manager', { search: '', unplacedOnly: true }); expect(results.results.map(r => r.asset.id)).toEqual(['asset-b']); const found = await h.app.search('manager', { search: 'A', unplacedOnly: false }); expect(found.results[0].placements[0].sceneId).toBe(scene.id); const detail = await h.app.detail('manager', scene.id); expect(detail.problems.items[0].title).toBe('Reported blockage'); expect(detail.problems.coverage[1].status).toBe('not-authorized'); });
test('unknown/retired asset references, unknown locations and private reference ids are rejected', async () => { const h = harness(), content = demonstration(); content.components[0].assetId = 'foreign-asset'; await expect(h.app.save('manager', { id: '', expectedRevision: 0, note: 'Invalid link', content })).rejects.toMatchObject({ code: 'invalid_locator' }); content.components[0].assetId = 'asset-a'; h.assets[0].status = 'retired'; await expect(h.app.save('manager', { id: '', expectedRevision: 0, note: 'Retired link', content })).rejects.toMatchObject({ code: 'invalid_locator' }); content.components[0].assetId = ''; content.locationId = 'foreign-area'; await expect(h.app.save('manager', { id: '', expectedRevision: 0, note: 'Invalid location', content })).rejects.toMatchObject({ code: 'invalid_locator' }); content.locationId = ''; content.referenceId = 'foreign-reference'; await expect(h.app.save('manager', { id: '', expectedRevision: 0, note: 'Invalid reference', content })).rejects.toMatchObject({ code: 'invalid_locator' }); expect(h.scenes.size).toBe(0); });
test('revoked management permits reads but denies saves/bootstrap', async () => { const h = harness(); await h.app.bootstrap('manager'); h.deny(); expect((await h.app.context('manager')).canManage).toBe(false); await expect(h.app.bootstrap('manager')).rejects.toMatchObject({ code: 'locator_denied' }); await expect(h.app.save('manager', { id: '', expectedRevision: 0, note: 'Denied', content: demonstration() })).rejects.toMatchObject({ code: 'locator_denied' }); });
test('finite coordinates, unique components, survey evidence and exact input shape are enforced', () => { const content = demonstration(); for (const invalid of [NaN, Infinity, -.1, 1.1])
  expect(() => validContent({ ...content, components: [{ ...content.components[0], x: invalid }] })).toThrow(LocatorError); expect(() => validContent({ ...content, components: [content.components[0], content.components[0]] })).toThrow(LocatorError); expect(() => validContent({ ...content, calibration: 'surveyed', surveyNote: '' })).toThrow(LocatorError); expect(() => validContent({ ...content, components: [{ ...content.components[0], verification: 'surveyed' }] })).toThrow(LocatorError); expect(() => validContent({ ...content, hidden: true })).toThrow(LocatorError); });

test('viewer context exposes schematic dimensions without private reference provenance', async () => {
  const h = harness();
  const legend = { ...reference, id: 'b'.repeat(64), name: 'Private legend', kind: 'legend' as const };
  jest.spyOn(h.references, 'list').mockResolvedValue([reference, legend]);
  expect((await h.app.context('manager')).references).toEqual([reference, legend]);
  h.deny();
  const context = await h.app.context('manager');
  expect(context.canManage).toBe(false);
  expect(context.references).toEqual([]);
  expect(context.referenceDimensions).toEqual([{ id: reference.id, width: 1600, height: 900 }]);
});
test('private image delivery requires the management operation and current management capability', async () => {
  const h = harness();
  const run = jest.spyOn(h.store, 'run');
  const list = jest.spyOn(h.references, 'list');
  const bytes = jest.spyOn(h.references, 'bytes');
  await expect(h.app.reference('manager', reference.id)).resolves.toEqual(new Uint8Array([1]));
  expect(run).toHaveBeenLastCalledWith('manager', 'locator.manage', expect.any(Function));
  list.mockClear();
  bytes.mockClear();
  h.deny();
  await expect(h.app.reference('manager', reference.id)).rejects.toMatchObject({ code: 'locator_denied' });
  expect(list).not.toHaveBeenCalled();
  expect(bytes).not.toHaveBeenCalled();
  run.mockImplementation(async (_actor, _permission, work) => work({ ...h.tx, canManage: false }));
  await expect(h.app.reference('manager', reference.id)).rejects.toMatchObject({ code: 'locator_denied' });
  expect(list).not.toHaveBeenCalled();
  expect(bytes).not.toHaveBeenCalled();
});

test('S-curve templates save and return with stable component identity and provisional evidence', async () => {
  const h = harness(), content = demonstration();
  const template = (await h.app.context('manager')).componentCatalog.find(component => component.kind === 's-curve');
  expect(template).toBeDefined();
  const component = { ...content.components[0], ...template!, id: 'opposing-bends', kind: 's-curve' as const };
  const saved = await h.app.save('manager', { id: '', expectedRevision: 0, note: 'Represent opposing bends from a schematic', content: { ...content, components: [component] } });
  const detail = await h.app.detail('manager', saved.id);
  expect(detail.scene.content.components).toEqual([component]);
  expect(h.revisions[0].scene.content.components[0]).toMatchObject({ kind: 's-curve', assetId: '', elevation: null, verification: 'provisional' });
});
