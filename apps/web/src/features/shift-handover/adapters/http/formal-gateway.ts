import type { components } from "../../../../contracts/schema";
import type { FormalGateway } from "../../application/formal-records";
import type { FormalContext, ShiftReference, RecordSelection, RecordPage, SaveRecord,
  TransitionRecord, FormalRecord, RecordHistory, PreviousShift, CandidatePage } from "../../domain/formal-models";
type Schema = components["schemas"];
// Root composition regenerates bindings after registering the new controller.
type Wire<K extends string, Fallback> = K extends keyof Schema ? Schema[K] : Fallback;
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
  context() { return request<Wire<"FormalHandoverContextDto", FormalContext>>("context"); }
  shifts(input: RecordSelection) { return request<Wire<"FormalHandoverShiftsDto", { shifts: ShiftReference[]; coverage: "planned-assignments" }>>("shifts", input); }
  query(input: RecordSelection) { return request<Wire<"FormalHandoverPageDto", RecordPage>>("query", input); }
  save(input: SaveRecord) { return request<Wire<"FormalHandoverRecordDto", FormalRecord>>("save", input); }
  transition(input: TransitionRecord) { return request<Wire<"FormalHandoverRecordDto", FormalRecord>>("transition", input); }
  history(id: string, before: number) { return request<Wire<"FormalHandoverHistoryDto", RecordHistory>>("history", { id, before }); }
  previous(id: string) { return request<Wire<"FormalHandoverPreviousDto", PreviousShift>>("previous", { id }); }
  candidates(departmentId: string, areaId: string, through: string) {
    return request<Wire<"FormalHandoverCandidatesDto", CandidatePage>>("candidates", { departmentId, areaId, through });
  }
}
