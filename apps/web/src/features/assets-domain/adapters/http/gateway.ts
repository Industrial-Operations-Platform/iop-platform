import type { Gateway } from "../../application/domain";
import type { SourceTuple, Context, Detail, DomainQuery, ReferencePage, MappingPage, AssetType, TypeCatalog, SaveEnrichment, Enrichment, ModelHistory, SaveMapping, Mapping, MappingHistory, SourceCandidate, ParetoSelection, CanonicalPareto } from "../../domain/models";
const errors: Record<string, string> = {
  invalid_asset_domain: "Check the asset model fields, reference capabilities and metadata types.",
  asset_domain_denied: "Asset management requires current Administrator, Team Leader or Task Force access.",
  asset_domain_missing: "The scoped asset or mapping is unavailable.",
  asset_domain_conflict: "The asset model or mapping changed. Reload before saving.",
  asset_domain_cycle: "This composition would create an asset cycle.",
  asset_domain_capacity: "The configured operation limit was exceeded. Refine the selection.",
  asset_domain_projection_unavailable: "Canonical analytical evidence is unavailable. Check source preparation and retry."
};
async function request<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch("/api/v1/asset-domain/" + path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-IOP-Demo": "1"
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(errors[data.code] ?? "Asset management is unavailable. Sign in again or retry.");
  return data;
}
export class HttpAssetDomainGateway implements Gateway {
  catalog() {
    return request<Context>("catalog", {});
  }
  references(query: DomainQuery) {
    return request<ReferencePage>("references", query);
  }
  configure(expectedRevision: number, types: AssetType[]) {
    return request<TypeCatalog>("configure", {
      expectedRevision,
      types
    });
  }
  detail(assetId: string) {
    return request<Detail>("detail", {
      assetId
    });
  }
  save(input: SaveEnrichment) {
    return request<Enrichment>("save", input);
  }
  history(assetId: string, before = 0) {
    return request<ModelHistory>("history", {
      assetId,
      before
    });
  }
  async mappingForSource(source: SourceTuple) {
    return (await request<{
      mapping: Mapping | null;
    }>("mapping-source", source)).mapping;
  }
  mappingQuery(query: DomainQuery) {
    return request<MappingPage>("mapping-query", query);
  }
  saveMapping(input: SaveMapping) {
    return request<Mapping>("save-mapping", input);
  }
  mappingHistory(id: string, before = 0) {
    return request<MappingHistory>("mapping-history", {
      id,
      before
    });
  }
  candidates(search: string, cursor = "") {
    return request<{
      candidates: SourceCandidate[];
      nextCursor: string;
    }>("candidates", {
      search,
      cursor
    });
  }
  pareto(selection: ParetoSelection) {
    return request<CanonicalPareto>("pareto", selection);
  }
}
