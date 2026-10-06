import type { components } from "../../../../contracts/schema";
import type { Gateway } from "../../application/assets";
import type {
  SaveInput,
  Selection,
  TimelineSelection,
  EquipmentSelection,
} from "../../domain/models";
type Schemas = components["schemas"];
const messages: Record<string, string> = {
  invalid_asset:
    "Check the asset fields, validation note and exact source aliases.",
  asset_denied: "You do not have permission to manage this asset.",
  asset_missing: "The asset is unavailable.",
  asset_conflict:
    "This code is already registered or this asset changed. Search the directory or reload before saving.",
  asset_alias_conflict:
    "This exact source alias is already linked to another asset. Review the source identity.",
  asset_capacity:
    "The asset directory capacity has been reached. Review the registered assets.",
};
async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch("/api/v1/assets/" + path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-IOP-Demo": "1" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      messages[data.code] ?? "Assets are unavailable. Sign in again or retry.",
    );
  return data;
}
export class HttpAssetsGateway implements Gateway {
  context() {
    return request<Schemas["AssetsContextDto"]>("context", {});
  }
  query(selection: Selection) {
    return request<Schemas["AssetPageDto"]>("query", selection);
  }
  save(input: SaveInput) {
    return request<Schemas["AssetDto"]>("save", input);
  }
  detail(id: string) {
    return request<Schemas["AssetDto"]>("detail", { id });
  }
  history(id: string, before = 0) {
    return request<Schemas["AssetHistoryDto"]>("history", { id, before });
  }
  timeline(selection: TimelineSelection) {
    return request<Schemas["AssetTimelinePageDto"]>("timeline", selection);
  }
  equipmentCatalog(selection: EquipmentSelection) {
    return request<Schemas["AssetEquipmentPageDto"]>(
      "equipment-catalog",
      selection,
    );
  }
}
