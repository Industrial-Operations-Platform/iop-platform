import type { components } from "../../../../contracts/schema";
import type { Gateway } from "../../application/maintenance";
import type {
  Priority,
  SaveInput,
  Selection,
  RelatedSelection,
} from "../../domain/models";
type Schemas = components["schemas"];
const messages: Record<string, string> = {
  invalid_maintenance:
    "Check the maintenance fields and workflow requirements.",
  maintenance_denied:
    "You do not have permission to change this maintenance record.",
  maintenance_conflict:
    "This maintenance record changed. Reload before saving.",
  maintenance_missing: "The maintenance record is unavailable.",
  maintenance_capacity:
    "Too many matching maintenance records. Refine the filters and retry.",
};
async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch("/api/v1/maintenance/" + path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-IOP-Demo": "1" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      messages[data.code] ??
        "Maintenance is unavailable. Sign in again or retry.",
    );
  return data;
}
export class HttpMaintenanceGateway implements Gateway {
  catalog() {
    return request<Schemas["MaintenanceCatalogDto"]>("catalog", {});
  }
  query(selection: Selection) {
    return request<Schemas["MaintenancePageDto"]>("query", selection);
  }
  save(input: SaveInput) {
    return request<Schemas["MaintenanceViewDto"]>("save", input);
  }
  history(id: string, before?: number) {
    return request<Schemas["MaintenanceHistoryDto"]>("history", { id, before });
  }
  settings(expectedRevision: number, priorities: Priority[]) {
    return request<Schemas["MaintenanceSettingsDto"]>("settings", {
      expectedRevision,
      priorities,
    });
  }
  related(selection: RelatedSelection) {
    return request<Schemas["MaintenanceRelatedPageDto"]>("related", selection);
  }
  assignments(after?: string) {
    return request<Schemas["MaintenanceAssignmentsDto"]>("assignments", {
      after,
    });
  }
}
