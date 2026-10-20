import { LocatorError, exact, identifier, text, validContent, demonstration, componentCatalog, type Scene, type SceneContent, type Revision, type Reference, type Asset, type Problems, type SaveScene, type Component } from '../domain/locator';
import type { ClassificationEvidenceSource } from './classification-evidence';
import { modelState, type ModelCandidate, type ModelPreview } from '../domain/model-preparation';
export interface ModelSource { list(): Promise<ModelCandidate[]>; }
export interface Transaction {
  canManage: boolean;
  scenes(): Promise<Scene[]>;
  get(id: string): Promise<Scene | null>;
  save(scene: Scene, revision: Revision): Promise<void>;
  history(id: string, before: number): Promise<Revision[]>;
  asset(id: string): Promise<Asset | null>;
  assets(search: string): Promise<Asset[]>;
  problems(assetIds: string[]): Promise<Problems>;
}
export interface Store {
  run<T>(actor: string, permission: 'locator.read' | 'locator.manage', work: (tx: Transaction) => Promise<T>): Promise<T>;
}
export interface References {
  list(): Promise<Reference[]>;
  bytes(id: string): Promise<Uint8Array>;
  components(id: string): Promise<Component[]>;
}
export class Locator {
  constructor(private readonly store: Store, private readonly references: References, private readonly locations: readonly {
    id: string;
    label: string;
    parentId: string;
  }[], private readonly ids: () => string, private readonly now: () => string, private readonly models?: ModelSource, private readonly classificationEvidence?: ClassificationEvidenceSource) { }
  context(actor: string) {
    return this.store.run(actor, 'locator.read', async (tx) => {
      const references = await this.references.list();
      return {
        canManage: tx.canManage,
        references: tx.canManage ? references : [],
        referenceDimensions: references.filter(reference => reference.kind === 'schematic').map(({ id, width, height }) => ({ id, width, height })),
        locations: this.locations,
        componentCatalog,
        coordinateSystem: 'image-local normalized: origin top-left; x right; y down; elevation unknown until surveyed',
        globalCalibration: 'pending' as const,
      };
    });
  }
  query(actor: string, input: {
    search: string;
    group: string;
  }) {
    exact(input, ['search', 'group']);
    const search = text(input.search, 160).toLowerCase(), group = text(input.group, 160);
    return this.store.run(actor, 'locator.read', async (tx) => { const scenes = await tx.scenes(); return { scenes: scenes.filter(s => (!group || s.content.group === group) && (!search || [s.content.name, s.content.group, s.content.description].some(v => v.toLowerCase().includes(search)))), total: scenes.length }; });
  }
  detail(actor: string, id: string) {
    identifier(id, true);
    return this.store.run(actor, 'locator.read', async (tx) => { const scene = await this.existing(tx, id), assetIds = [...new Set(scene.content.components.map(c => c.assetId).filter(Boolean))]; const assets: Asset[] = []; for (const id of assetIds) {
      const asset = await tx.asset(id);
      if (asset)
        assets.push(asset);
    } return { scene, assets, problems: await tx.problems(assetIds) }; });
  }
  async save(actor: string, input: SaveScene) {
    exact(input, ['id', 'expectedRevision', 'note', 'content']);
    const id = identifier(input.id), note = text(input.note, 2000, true), content = validContent(input.content);
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0 || (!id && input.expectedRevision !== 0))
      throw new LocatorError('invalid_locator');
    if (content.locationId && !this.locations.some(l => l.id === content.locationId))
      throw new LocatorError('invalid_locator');
    return this.store.run(actor, 'locator.manage', async (tx) => {
      if (!tx.canManage)
        throw new LocatorError('locator_denied');
      const previous = id ? await this.existing(tx, id) : null;
      if (previous && previous.revision !== input.expectedRevision)
        throw new LocatorError('locator_conflict');
      if (previous && previous.content.referenceId !== content.referenceId && content.components.length)
        throw new LocatorError('invalid_locator');
      if (content.referenceId && !(await this.references.list()).some(r => r.id === content.referenceId && r.kind === 'schematic'))
        throw new LocatorError('invalid_locator');
      for (const assetId of new Set(content.components.map(c => c.assetId).filter(Boolean))) {
        const asset = await tx.asset(assetId);
        if (!asset || asset.status === 'retired')
          throw new LocatorError('invalid_locator');
      }
      const at = this.now();
      const scene: Scene = { id: id || this.ids(), revision: (previous?.revision ?? 0) + 1, authorId: previous?.authorId ?? actor, createdAt: previous?.createdAt ?? at, updatedAt: at, content };
      await tx.save(scene, { scene, actorId: actor, note, at });
      return scene;
    });
  }
  bootstrap(actor: string) {
    return this.store.run(actor, 'locator.manage', async (tx) => {
      if (!tx.canManage)
        throw new LocatorError('locator_denied');
      const existing = await tx.scenes(), refs = await this.references.list();
      let created = 0;
      const add = async (id: string, content: SceneContent) => { if (existing.some(s => s.id === id))
        return; const at = this.now(), scene: Scene = { id, revision: 1, authorId: actor, createdAt: at, updatedAt: at, content }; await tx.save(scene, { scene, actorId: actor, note: 'Created an explicitly provisional reference scene.', at }); created++; };
      await add('component-demonstration', demonstration());
      for (const ref of refs.filter(r => r.kind === 'schematic'))
        await add('reference-' + ref.id, { name: ref.name, group: ref.group, locationId: '', referenceId: ref.id, description: 'Imported source schematic. Trace conveyor components and explicitly link registered assets; physical scale, global alignment and sensor positions remain pending.', calibration: 'pending', surveyNote: '', components: await this.references.components(ref.id) });
      return { created, referenceCount: refs.length };
    });
  }
  history(actor: string, id: string, before = 2147483647) { identifier(id, true); if (!Number.isSafeInteger(before) || before < 1)
    throw new LocatorError('invalid_locator'); return this.store.run(actor, 'locator.read', async (tx) => { await this.existing(tx, id); const revisions = await tx.history(id, before); return { revisions: revisions.slice(0, 30), nextBefore: revisions.length > 30 ? revisions[29].scene.revision : 0 }; }); }
  search(actor: string, input: {
    search: string;
    unplacedOnly: boolean;
  }) {
    exact(input, ['search', 'unplacedOnly']);
    const search = text(input.search, 160);
    if (typeof input.unplacedOnly !== 'boolean')
      throw new LocatorError('invalid_locator');
    return this.store.run(actor, 'locator.read', async (tx) => { const scenes = await tx.scenes(), assets = await tx.assets(search); const results = assets.map(asset => ({ asset, placements: scenes.flatMap(s => s.content.components.filter(c => c.assetId === asset.id).map(c => ({ sceneId: s.id, sceneName: s.content.name, componentId: c.id, label: c.label, verification: c.verification }))) })).filter(r => !input.unplacedOnly || !r.placements.length); return { results, problems: await tx.problems(results.map(r => r.asset.id)), total: results.length, limit: 200 }; });
  }
  locate(actor: string, assetId: string) {
    identifier(assetId, true);
    return this.store.run(actor, 'locator.read', async tx => {
      const asset = await tx.asset(assetId);
      if (!asset) throw new LocatorError('locator_missing');
      const scenes = await tx.scenes();
      const placements = scenes.flatMap(scene => scene.content.components.filter(c => c.assetId === assetId).map(c => ({
        sceneId: scene.id, sceneName: scene.content.name, componentId: c.id, label: c.label, verification: c.verification,
      })));
      return { results: [{ asset, placements }], problems: await tx.problems([assetId]), total: 1, limit: 1 };
    });
  }
  async classification(actor: string, input: { assetId: string }) {
    exact(input, ['assetId']); const assetId = identifier(input.assetId, true);
    await this.store.run(actor, 'locator.manage', async tx => {
      if (!tx.canManage) throw new LocatorError('locator_denied');
      if (!await tx.asset(assetId)) throw new LocatorError('locator_missing');
    });
    // The contribution rechecks authorization on its own pinned transaction. Do not hold a pooled connection across it.
    return this.classificationEvidence ? this.classificationEvidence(actor, assetId) : {assetId, coverage: 'unmapped' as const, totalSources: 0, sources: []};
  }
  modelPreview(actor: string) {
    return this.store.run(actor, 'locator.manage', async tx => {
      if (!tx.canManage) throw new LocatorError('locator_denied');
      const candidates = await this.models?.list() ?? [], references = await this.references.list(), scenes = await tx.scenes();
      const models: ModelPreview[] = candidates.map(candidate => {
        const reference = references.find(r => r.id === candidate.referenceId && r.kind === 'schematic');
        if (!reference) throw new LocatorError('locator_reference_unavailable');
        const scene = scenes.find(s => s.id === 'reference-' + candidate.referenceId) ?? null;
        return { referenceId: candidate.referenceId, referenceName: reference.name, sceneId: scene?.id ?? '', expectedRevision: scene?.revision ?? 0,
          status: modelState(scene, candidate), componentCount: candidate.components.length,
          motors: candidate.components.filter(c => c.kind === 'motor').length,
          photoelectricSensors: candidate.components.filter(c => c.kind === 'photoelectric-sensor').length,
          conveyors: candidate.components.filter(c => c.kind === 'conveyor' || c.kind === 'curve' || c.kind === 's-curve').length };
      });
      return { models };
    });
  }
  applyModel(actor: string, input: { id: string; expectedRevision: number }) {
    exact(input, ['id', 'expectedRevision']); identifier(input.id, true);
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) throw new LocatorError('invalid_locator');
    return this.store.run(actor, 'locator.manage', async tx => {
      if (!tx.canManage) throw new LocatorError('locator_denied');
      const scene = await this.existing(tx, input.id);
      if (scene.revision !== input.expectedRevision) throw new LocatorError('locator_conflict');
      const candidate = (await this.models?.list())?.find(m => m.referenceId === scene.content.referenceId);
      if (!candidate) throw new LocatorError('locator_reference_unavailable');
      const status = modelState(scene, candidate);
      if (status !== 'ready') return { sceneId: scene.id, revision: scene.revision, status };
      // Revalidate original reference integrity before committing any derived geometry.
      await this.references.bytes(candidate.referenceId);
      const at = this.now(), updated: Scene = { ...scene, revision: scene.revision + 1, updatedAt: at,
        content: { ...scene.content, components: structuredClone(candidate.components) } };
      await tx.save(updated, { scene: updated, actorId: actor, note: 'Prepared provisional equipment geometry from the private schematic; labels, registered identity links and physical survey require review.', at });
      return { sceneId: updated.id, revision: updated.revision, status: 'applied' as const };
    });
  }
  reference(actor: string, id: string) {
    identifier(id, true);
    return this.store.run(actor, 'locator.manage', async (tx) => {
      if (!tx.canManage)
        throw new LocatorError('locator_denied');
      if (!(await this.references.list()).some(reference => reference.id === id))
        throw new LocatorError('locator_missing');
      return this.references.bytes(id);
    });
  }
  private async existing(tx: Transaction, id: string) { const scene = await tx.get(id); if (!scene)
    throw new LocatorError('locator_missing'); return scene; }
}
