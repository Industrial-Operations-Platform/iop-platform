import type { components } from "../../../../contracts/schema";
import type { FormalGateway } from "../../application/formal-records";
import type { RecordSelection, SaveRecord, TransitionRecord } from "../../domain/formal-models";
type Schema = components["schemas"];
const messages: Record<string, string> = {
  handover_denied: "Formal shift records require Administrator, Team Leader or Task Force access.",
  handover_missing: "This shift record is unavailable.",
  handover_conflict: "This record or its selected entries changed. Reload before continuing.",
  handover_shift_unavailable: "The selected Workforce shift is no longer planned. Review its assignment before continuing.",
  handover_capacity: "This record exceeds the supported evidence limit. Narrow the selected area or entries.",
  invalid_handover: "Check the shift, location and record fields.",
};
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch("/api/v1/handover/records/" + path, { method: body === undefined ? "GET" : "POST",
    credentials: "same-origin", headers: body === undefined ? {} : { "Content-Type": "application/json", "X-IOP-Demo": "1" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(messages[data.code] ?? (response.status === 401 ? "Sign in again to use formal Handover." :
    "Formal Handover is unavailable. Retry an unchanged save to recover its result."));
  return data;
}
export class HttpFormalHandoverGateway implements FormalGateway {
  context() { return request<Schema["FormalHandoverContextDto"]>("context"); }
  shifts(input: RecordSelection) { return request<Schema["FormalHandoverShiftsDto"]>("shifts", input); }
  query(input: RecordSelection) { return request<Schema["FormalHandoverPageDto"]>("query", input); }
  save(input: SaveRecord) { return request<Schema["FormalHandoverRecordDto"]>("save", input); }
  transition(input: TransitionRecord) { return request<Schema["FormalHandoverRecordDto"]>("transition", input); }
  history(id: string, before: number) { return request<Schema["FormalHandoverHistoryDto"]>("history", { id, before }); }
  previous(id: string) { return request<Schema["FormalHandoverPreviousDto"]>("previous", { id }); }
  candidates(departmentId: string, areaId: string, through: string) {
    return request<Schema["FormalHandoverCandidatesDto"]>("candidates", { departmentId, areaId, through });
  }
}
