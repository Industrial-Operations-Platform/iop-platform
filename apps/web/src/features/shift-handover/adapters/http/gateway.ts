import type { Gateway } from "../../application/handover";
import type { Selection, CreateEntry, ChangeEntry } from "../../domain/models";
import type { components } from "../../../../contracts/schema";
type Schema = components["schemas"];
const messages: Record<string, string> = {
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
