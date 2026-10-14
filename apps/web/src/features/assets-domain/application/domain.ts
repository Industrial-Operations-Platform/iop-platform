import type { SourceTuple, Context, Detail, DomainQuery, ReferencePage, MappingPage, AssetType, TypeCatalog, SaveEnrichment, Enrichment, ModelHistory, SaveMapping, Mapping, MappingHistory, SourceCandidate, ParetoSelection, CanonicalPareto } from "../domain/models";
export interface Gateway {
  catalog(): Promise<Context>;
  references(query: DomainQuery): Promise<ReferencePage>;
  configure(expectedRevision: number, types: AssetType[]): Promise<TypeCatalog>;
  detail(assetId: string): Promise<Detail>;
  save(input: SaveEnrichment): Promise<Enrichment>;
  history(assetId: string, before?: number): Promise<ModelHistory>;
  mappingForSource(source: SourceTuple): Promise<Mapping | null>;
  mappingQuery(query: DomainQuery): Promise<MappingPage>;
  saveMapping(input: SaveMapping): Promise<Mapping>;
  mappingHistory(id: string, before?: number): Promise<MappingHistory>;
  candidates(search: string, cursor?: string): Promise<{
    candidates: SourceCandidate[];
    nextCursor: string;
  }>;
  pareto(selection: ParetoSelection): Promise<CanonicalPareto>;
}
export class AssetDomainApplication {
  constructor(private readonly gateway: Gateway, private readonly ids: () => string) {}
  newId() {
    return this.ids();
  }
  catalog() {
    return this.gateway.catalog();
  }
  references(query: DomainQuery) {
    return this.gateway.references(query);
  }
  configure(revision: number, types: AssetType[]) {
    return this.gateway.configure(revision, types);
  }
  detail(id: string) {
    return this.gateway.detail(id);
  }
  save(input: SaveEnrichment) {
    return this.gateway.save(input);
  }
  history(id: string, before?: number) {
    return this.gateway.history(id, before);
  }
  mappingForSource(source: SourceTuple) {
    return this.gateway.mappingForSource(source);
  }
  mappingQuery(query: DomainQuery) {
    return this.gateway.mappingQuery(query);
  }
  saveMapping(input: SaveMapping) {
    return this.gateway.saveMapping(input);
  }
  mappingHistory(id: string, before?: number) {
    return this.gateway.mappingHistory(id, before);
  }
  candidates(search: string, cursor?: string) {
    return this.gateway.candidates(search, cursor);
  }
  pareto(selection: ParetoSelection) {
    return this.gateway.pareto(selection);
  }
}
