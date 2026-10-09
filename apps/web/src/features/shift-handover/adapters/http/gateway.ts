import type { Gateway } from "../../application/handover";
import type {
  EquipmentSelection,
  Selection,
  CreateEntry,
  ChangeEntry,
} from "../../domain/models";
import type { components } from "../../../../contracts/schema";
type Schema = components["schemas"];
const messages: Record<string, string> = {
  handover_completion_capacity: "This repair has too many pending reports. Narrow and review its scope in Maintenance before publishing Success.",
  handover_completion_conflict: "Review the linked reports in Maintenance and reload the work before publishing Success. No selected records were completed.",
  handover_today_only:
    "New entries must use today’s date at your site. Historical dates require a coordinator.",
  handover_equipment_unavailable:
    "Choose a Betriebsmittelkennzeichen from the imported equipment list for this department and area.",
  handover_denied: "You do not have permission for this handover operation.",
  handover_missing: "This entry is unavailable.",
  handover_conflict:
    "This entry or request has changed. Reload the entry before updating it; retry an unchanged publication to recover its saved result.",
  invalid_handover: "Check the entry fields, dates and location references.",
};
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch("/api/v1/handover/" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json", "X-IOP-Demo": "1" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      messages[data.code] ??
        (response.status === 401
          ? "Sign in again to use Shift Handover."
          : "Shift Handover is unavailable. Retry to recover the saved result if publication was interrupted."),
    );
  return data;
}
export class HttpHandoverGateway implements Gateway {
  defaultDepartment(date: string) { return request<Schema["HandoverDefaultLocationDto"]>("default-location", { date }); }
  targets(input: { source: "handover" | "maintenance"; search: string; cursor: string }) {
    return request<Schema["HandoverCompletionPageDto"]>("completion-targets", input);
  }
  equipment(selection: EquipmentSelection) {
    return request<Schema["HandoverEquipmentPageDto"]>("equipment", selection);
  }
  remove(id:string,expectedRevision:number) { return request<Schema["HandoverEntryDto"]>("remove",{id,expectedRevision}); }
  context() {
    return request<Schema["HandoverContextDto"]>("context");
  }
  list(selection: Selection) {
    return request<Schema["HandoverPageDto"]>("query", selection);
  }
  history(id: string, before: number) {
    return request<Schema["HandoverHistoryDto"]>("history", { id, before });
  }
  create(input: CreateEntry) {
    return request<Schema["HandoverEntryDto"]>("entries", input);
  }
  change(input: ChangeEntry) {
    return request<Schema["HandoverEntryDto"]>("change", input);
  }
}
