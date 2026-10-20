import type {components} from "../../../../contracts/schema";
import type { Gateway } from "../../application/domain";
import type { SourceTuple, DomainQuery, AssetType, SaveEnrichment, SaveMapping, ParetoSelection } from "../../domain/models";
type Schema = components["schemas"];
const errors: Record<string, string> = {
  invalid_asset_domain: "Check the asset model fields, reference capabilities and metadata types.",
  asset_domain_denied: "Asset management requires current Administrator access.",
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
    return request<Schema["AssetDomainCatalogDto"]>("catalog", {});
  }
  references(query: DomainQuery) {
    return request<Schema["AssetDomainReferencePageDto"]>("references", query);
  }
  configure(expectedRevision: number, types: AssetType[]) {
    return request<Schema["AssetTypeCatalogDto"]>("configure", {
      expectedRevision,
      types
    });
  }
  detail(assetId: string) {
    return request<Schema["AssetDomainDetailDto"]>("detail", {
      assetId
    });
  }
  save(input: SaveEnrichment) {
    return request<Schema["AssetEnrichmentDto"]>("save", input);
  }
  history(assetId: string, before = 0) {
    return request<Schema["AssetDomainHistoryDto"]>("history", {
      assetId,
      before
    });
  }
  async mappingForSource(source: SourceTuple) {
    return (await request<Schema["AssetMappingLookupDto"]>("mapping-source", source)).mapping;
  }
  mappingQuery(query: DomainQuery) {
    return request<Schema["AssetMappingPageDto"]>("mapping-query", query);
  }
  saveMapping(input: SaveMapping) {
    return request<Schema["AssetSourceMappingDto"]>("save-mapping", input);
  }
  mappingHistory(id: string, before = 0) {
    return request<Schema["AssetMappingHistoryDto"]>("mapping-history", {
      id,
      before
    });
  }
  candidates(search: string, cursor = "") {
    return request<Schema["AssetSourceCandidatePageDto"]>("candidates", {
      search,
      cursor
    });
  }
  pareto(selection: ParetoSelection) {
    return request<Schema["CanonicalAssetParetoDto"]>("pareto", selection);
  }
}
