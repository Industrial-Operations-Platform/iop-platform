import { AssetDomain, type DomainStore, type DomainTransaction, type SaveEnrichment } from "../src/modules/assets/application/enrichment";
import { AssetDomainError, defaultTypes, emptyEnrichment, sourceKey, type Enrichment, type EnrichmentRevision, type Mapping, type MappingRevision, type TypeCatalog, type MappingDecision, type RegistryReference } from "../src/modules/assets/domain/enrichment";
export function domainFixture(authorizedActors = ["admin", "leader", "task"]) {
  const records = new Map<string, Enrichment>(),
    revisions: EnrichmentRevision[] = [],
    mappings = new Map<string, Mapping>(),
    mappingRevisions: MappingRevision[] = [];
  let catalog: TypeCatalog | null = null,
    fail = false;
  const assets: RegistryReference[] = [{
    id: "conveyor",
    code: "CONV-1",
    name: "CONV-1",
    status: "validated"
  }, {
    id: "second",
    code: "CONV-2",
    name: "CONV-2",
    status: "validated"
  }, {
    id: "sensor",
    code: "S-1",
    name: "S-1",
    status: "validated"
  }, {
    id: "controller",
    code: "PLC-1",
    name: "PLC-1",
    status: "validated"
  }, {
    id: "unverified",
    code: "UNKNOWN",
    name: "UNKNOWN",
    status: "unverified"
  }];
  const applied: MappingDecision[][] = [];
  const store: DomainStore = {
    run: async (actor, permission, work) => {
      if (!authorizedActors.includes(actor)) throw new AssetDomainError("asset_domain_denied");
      const staged = structuredClone(records),
        maps = structuredClone(mappings),
        history: EnrichmentRevision[] = [],
        mapHistory: MappingRevision[] = [];
      let nextCatalog = catalog;
      const tx: DomainTransaction = {
        canManage: true,
        assetNames: async ids => new Map(assets.filter(a => ids.includes(a.id)).map(a => [a.id, a.code])),
        name: async () => actor,
        asset: async id => assets.find(a => a.id === id) ?? null,
        references: async query => ({
          assets: assets.slice(0, query.limit ?? 30),
          enrichments: [],
          total: assets.length,
          nextCursor: ""
        }),
        mappingQuery: async () => ({
          mappings: [...maps.values()],
          total: maps.size,
          nextCursor: ""
        }),
        catalog: async () => nextCatalog,
        saveCatalog: async c => {
          nextCatalog = c;
        },
        enrichments: async () => [...staged.values()],
        get: async id => staged.get(id) ?? null,
        save: async (e, r) => {
          staged.set(e.assetId, structuredClone(e));
          history.push(structuredClone(r));
        },
        history: async id => ({
          revisions: revisions.filter(r => r.enrichment.assetId === id).reverse(),
          nextBefore: 0
        }),
        mapping: async id => maps.get(id) ?? null,
        mappings: async () => [...maps.values()],
        mappingBySource: async source => [...maps.values()].find(m => sourceKey(m.data.source) === sourceKey(source)) ?? null,
        saveMapping: async (m, r) => {
          maps.set(m.id, structuredClone(m));
          mapHistory.push(structuredClone(r));
        },
        mappingHistory: async id => ({
          revisions: mappingRevisions.filter(r => r.mapping.id === id).reverse(),
          nextBefore: 0
        }),
        materialize: async decisions => {
          if (fail) throw new Error("Synthetic projection failure");
          applied.push(structuredClone(decisions));
        },
        candidates: async () => ({
          candidates: [{
            sourceId: "source",
            namespace: "source-equipment",
            area: "A1",
            code: "SOURCE-1",
            records: 2
          }],
          nextCursor: ""
        }),
        pareto: async selection => ({
          selection,
          groups: [],
          groupCount: 0,
          totals: {
            frequency: 0,
            alarmSeconds: 0,
            records: 0
          },
          mapped: {
            frequency: 0,
            alarmSeconds: 0,
            records: 0
          },
          unresolved: {
            frequency: 0,
            alarmSeconds: 0,
            records: 0
          },
          states: {},
          missingDates: [selection.from],
          admittedDates: [],
          projectionRevision: "fixture",
          limitations: "Missing imports are not zero."
        })
      };
      const result = await work(tx);
      records.clear();
      staged.forEach((v, k) => records.set(k, v));
      mappings.clear();
      maps.forEach((v, k) => mappings.set(k, v));
      revisions.push(...history);
      mappingRevisions.push(...mapHistory);
      catalog = nextCatalog;
      return result;
    }
  };
  return {
    app: new AssetDomain(store, "source", () => "2026-10-14T12:00:00.000Z"),
    records,
    revisions,
    mappings,
    mappingRevisions,
    applied,
    setFailure: (v: boolean) => {
      fail = v;
    }
  };
}
export const enrichment = (assetId: string, typeId = "generic"): SaveEnrichment => ({
  assetId,
  expectedRevision: 0,
  reason: "Synthetic model configured.",
  data: {
    ...emptyEnrichment(),
    typeId
  }
});
export const mappingInput = {
  id: "mapping",
  expectedRevision: 0,
  reason: "Review source identity.",
  data: {
    source: {
      sourceId: "source",
      namespace: "source-equipment" as const,
      area: "A1",
      code: "SOURCE-1"
    },
    status: "pending" as const,
    candidateIds: ["sensor", "second"],
    note: "Two explicit candidates require review."
  }
};
export const types = () => structuredClone(defaultTypes);
