import { assert, exact, id, text, rev, validateTypes, validateData, metadataSchema, validateMapping, emptyEnrichment, defaultTypes, decision, sourceKey, stable, paretoSelection, validateSource, domainQuery, type DomainQuery, type ReferencePage, type MappingPage, type AssetType, type TypeCatalog, type RegistryReference, type Enrichment, type EnrichmentData, type EnrichmentRevision, type Mapping, type MappingData, type MappingRevision, type SourceCandidate, type ParetoSelection, type CanonicalPareto, type MappingDecision } from "../domain/enrichment";
export interface DomainTransaction {
  canManage: boolean;
  name(actor: string): Promise<string>;
  assetNames(ids: string[]): Promise<Map<string, string>>;
  references(query: DomainQuery): Promise<ReferencePage>;
  mappingQuery(query: DomainQuery): Promise<MappingPage>;
  asset(id: string): Promise<RegistryReference | null>;
  catalog(): Promise<TypeCatalog | null>;
  saveCatalog(catalog: TypeCatalog, actor: string, name: string, at: string): Promise<void>;
  enrichments(): Promise<Enrichment[]>;
  get(assetId: string): Promise<Enrichment | null>;
  save(record: Enrichment, revision: EnrichmentRevision): Promise<void>;
  history(assetId: string, before: number): Promise<{
    revisions: EnrichmentRevision[];
    nextBefore: number;
  }>;
  mapping(id: string): Promise<Mapping | null>;
  mappings(): Promise<Mapping[]>;
  mappingBySource(source: MappingData["source"]): Promise<Mapping | null>;
  saveMapping(mapping: Mapping, revision: MappingRevision): Promise<void>;
  mappingHistory(id: string, before: number): Promise<{
    revisions: MappingRevision[];
    nextBefore: number;
  }>;
  materialize(decisions: MappingDecision[]): Promise<void>;
  candidates(search: string, cursor: string): Promise<{
    candidates: SourceCandidate[];
    nextCursor: string;
  }>;
  pareto(selection: ParetoSelection): Promise<CanonicalPareto>;
}
export interface DomainStore {
  run<T>(actor: string, permission: "assets.read" | "assets.manage", work: (tx: DomainTransaction) => Promise<T>): Promise<T>;
}
export interface SaveEnrichment {
  assetId: string;
  expectedRevision: number;
  reason: string;
  data: EnrichmentData;
}
export interface SaveMapping {
  id: string;
  expectedRevision: number;
  reason: string;
  data: MappingData;
}
export class AssetDomain {
  constructor(private readonly store: DomainStore, private readonly sourceId: string, private readonly now: () => string) {}
  private async configuration(tx: DomainTransaction) {
    return (await tx.catalog()) ?? {
      revision: 0,
      types: structuredClone(defaultTypes)
    };
  }
  catalog(actor: string) {
    return this.store.run(actor, "assets.read", async tx => ({
      canManage: tx.canManage,
      sourceId: this.sourceId,
      catalog: await this.configuration(tx)
    }));
  }
  configure(actor: string, input: {
    expectedRevision: number;
    types: AssetType[];
  }) {
    exact(input, ["expectedRevision", "types"]);
    rev(input.expectedRevision);
    validateTypes(input.types);
    const request = structuredClone(input);
    return this.store.run(actor, "assets.manage", async tx => {
      const previous = await this.configuration(tx);
      assert(previous.revision === request.expectedRevision, "asset_domain_conflict");
      const current = await tx.enrichments();
      for (const record of current) {
        const type = request.types.find(t => t.id === record.data.typeId);
        assert(type, "asset_domain_conflict");
        metadataSchema(record.data, type);
        if (record.data.parentId) {
          const parent = current.find(e => e.assetId === record.data.parentId);
          assert(parent && request.types.find(t => t.id === parent.data.typeId)?.canContain, "asset_domain_conflict");
        }
        if (record.data.controllers.length) {
          const targets = current;
          for (const relation of record.data.controllers) {
            const target = targets.find(t => t.assetId === relation.targetId);
            assert(target && request.types.find(t => t.id === target.data.typeId)?.isController, "asset_domain_conflict");
          }
        }
      }
      const result = {
        revision: previous.revision + 1,
        types: request.types
      };
      await tx.saveCatalog(result, actor, await tx.name(actor), this.now());
      return result;
    });
  }
  detail(actor: string, assetId: string) {
    id(assetId);
    return this.store.run(actor, "assets.read", async tx => {
      const asset = await tx.asset(assetId);
      assert(asset, "asset_domain_missing");
      const enrichment = await tx.get(assetId),
        related: RegistryReference[] = [];
      if (enrichment) {
        for (const target of [enrichment.data.parentId, ...enrichment.data.controllers.map(r => r.targetId)].filter(Boolean)) {
          const reference = await tx.asset(target);
          if (reference && !related.some(r => r.id === target)) related.push(reference);
        }
      }
      return {
        asset,
        enrichment,
        related,
        canManage: tx.canManage
      };
    });
  }
  save(actor: string, input: SaveEnrichment) {
    exact(input, ["assetId", "expectedRevision", "reason", "data"]);
    id(input.assetId);
    rev(input.expectedRevision);
    text(input.reason, 2000, true);
    validateData(input.data);
    const request = structuredClone(input);
    return this.store.run(actor, "assets.manage", async tx => {
      const asset = await tx.asset(request.assetId);
      assert(asset && asset.status !== "retired", "asset_domain_missing");
      const before = await tx.get(request.assetId);
      assert((before?.revision ?? 0) === request.expectedRevision, "asset_domain_conflict");
      const catalog = await this.configuration(tx),
        type = catalog.types.find(t => t.id === request.data.typeId);
      assert(type && (type.active || before?.data.typeId === type.id));
      metadataSchema(request.data, type);
      if (!type.canContain || !type.isController) {
        const dependents = await tx.enrichments();
        assert(type.canContain || !dependents.some(e => e.data.parentId === request.assetId), "asset_domain_conflict");
        assert(type.isController || !dependents.some(e => e.data.controllers.some(r => r.targetId === request.assetId)), "asset_domain_conflict");
      }
      await this.validateReferences(tx, catalog, request.assetId, request.data);
      const at = this.now(),
        name = await tx.name(actor),
        surveyChanged = !before || stable(before.data.survey) !== stable(request.data.survey);
      const record: Enrichment = {
        assetId: request.assetId,
        revision: request.expectedRevision + 1,
        data: request.data,
        actorId: actor,
        actorName: name,
        updatedAt: at,
        surveyReviewerId: surveyChanged ? request.data.survey.status === "pending" ? "" : actor : before.surveyReviewerId,
        surveyReviewerName: surveyChanged ? request.data.survey.status === "pending" ? "" : name : before.surveyReviewerName,
        surveyReviewedAt: surveyChanged ? request.data.survey.status === "pending" ? "" : at : before.surveyReviewedAt
      };
      await tx.save(record, {
        enrichment: record,
        reason: request.reason,
        actorId: actor,
        actorName: name,
        at
      });
      return record;
    });
  }
  private async validateReferences(tx: DomainTransaction, catalog: TypeCatalog, assetId: string, data: EnrichmentData) {
    if (data.parentId) {
      assert(data.parentId !== assetId, "asset_domain_cycle");
      const parent = await tx.asset(data.parentId),
        parentRecord = await tx.get(data.parentId);
      assert(parent && parent.status !== "retired" && parentRecord && catalog.types.find(t => t.id === parentRecord.data.typeId)?.canContain);
      let next = data.parentId;
      const seen = new Set([assetId]);
      while (next) {
        assert(!seen.has(next), "asset_domain_cycle");
        seen.add(next);
        assert(seen.size <= 10000, "asset_domain_capacity");
        next = (await tx.get(next))?.data.parentId ?? "";
      }
    }
    for (const relation of data.controllers) {
      assert(relation.targetId !== assetId);
      const target = await tx.asset(relation.targetId),
        record = await tx.get(relation.targetId);
      assert(target && target.status !== "retired" && record && catalog.types.find(t => t.id === record.data.typeId)?.isController);
    }
  }
  history(actor: string, assetId: string, before = 0) {
    id(assetId);
    rev(before);
    return this.store.run(actor, "assets.read", async tx => {
      assert(await tx.asset(assetId), "asset_domain_missing");
      return tx.history(assetId, before);
    });
  }
  references(actor: string, input: DomainQuery) {
    domainQuery(input);
    const request = structuredClone(input);
    return this.store.run(actor, "assets.read", tx => tx.references(request));
  }
  mappingForSource(actor: string, source: MappingData["source"]) {
    validateSource(source);
    assert(source.sourceId === this.sourceId);
    const request = structuredClone(source);
    return this.store.run(actor, "assets.read", tx => tx.mappingBySource(request));
  }
  mappingQuery(actor: string, input: DomainQuery) {
    domainQuery(input);
    const request = structuredClone(input);
    return this.store.run(actor, "assets.read", tx => tx.mappingQuery(request));
  }
  saveMapping(actor: string, input: SaveMapping) {
    exact(input, ["id", "expectedRevision", "reason", "data"]);
    id(input.id);
    rev(input.expectedRevision);
    text(input.reason, 2000, true);
    validateMapping(input.data);
    const request = structuredClone(input);
    assert(request.data.source.sourceId === this.sourceId);
    return this.store.run(actor, "assets.manage", async tx => {
      const previous = await tx.mapping(request.id);
      assert((previous?.revision ?? 0) === request.expectedRevision, "asset_domain_conflict");
      assert(!previous || sourceKey(previous.data.source) === sourceKey(request.data.source));
      const duplicate = await tx.mappingBySource(request.data.source);
      assert(!duplicate || duplicate.id === request.id, "asset_domain_conflict");
      for (const target of request.data.candidateIds) {
        const asset = await tx.asset(target);
        assert(asset && asset.status !== "retired", "asset_domain_missing");
        assert(request.data.status !== "approved" || asset.status === "validated");
      }
      const at = this.now(),
        name = await tx.name(actor),
        record: Mapping = {
          id: request.id,
          revision: request.expectedRevision + 1,
          data: request.data,
          actorId: actor,
          actorName: name,
          updatedAt: at
        };
      await tx.saveMapping(record, {
        mapping: record,
        reason: request.reason,
        actorId: actor,
        actorName: name,
        at
      });
      await tx.materialize([decision(record)]);
      return record;
    });
  }
  mappingHistory(actor: string, mappingId: string, before = 0) {
    id(mappingId);
    rev(before);
    return this.store.run(actor, "assets.read", async tx => {
      assert(await tx.mapping(mappingId), "asset_domain_missing");
      return tx.mappingHistory(mappingId, before);
    });
  }
  candidates(actor: string, input: {
    search?: string;
    cursor?: string;
  }) {
    assert(input && typeof input === "object" && !Array.isArray(input) && Object.keys(input).every(k => ["search", "cursor"].includes(k)));
    text(input.search ?? "", 200);
    text(input.cursor ?? "", 65536);
    return this.store.run(actor, "assets.read", tx => tx.candidates(input.search ?? "", input.cursor ?? ""));
  }
  pareto(actor: string, input: ParetoSelection) {
    paretoSelection(input);
    const request = structuredClone(input);
    return this.store.run(actor, "assets.read", async tx => {
      const result = await tx.pareto(request),
        names = await tx.assetNames(result.groups.map(g => g.assetId));
      return {
        ...result,
        groups: result.groups.map(g => ({
          ...g,
          assetCode: names.get(g.assetId) ?? ""
        }))
      };
    });
  }
}
