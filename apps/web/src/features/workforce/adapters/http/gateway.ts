import type { WeeklyScheduleInput } from "../../domain/weekly-schedule";
import type { Gateway } from "../../application/workforce";
import type {
  Board,
  PersonalSummary,
  ImportInput,
  Kind,
  Preview,
  RecordEntry,
  Revision,
  SaveInput,
} from "../../domain/models";
const messages: Record<string, string> = {
  workforce_invalid: "Check the plan fields and dates.",
  workforce_denied: "You do not have permission to change this plan.",
  workforce_conflict:
    "The plan changed or has dependent assignments. Reload before saving.",
  workforce_missing: "The plan entry is unavailable.",
  workforce_schedule_required:
    "Enter or import a compatible working schedule for this person first.",
  workforce_overlap:
    "This person or phone is already assigned during this interval.",
  workforce_time_ambiguous:
    "This local time is missing or repeated due to a clock change. Use an unambiguous interval.",
  workforce_import_invalid:
    "The file contains unsupported or invalid rows. Use the CSV template or the supported schedule email.",
};
async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch("/api/v1/workforce/" + path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-IOP-Demo": "1" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      messages[data.code] ??
        "Workforce is unavailable. Sign in again or retry.",
    );
  return data;
}
export class HttpWorkforceGateway implements Gateway {
  summary() { return request<PersonalSummary>("summary", {}); }
  board(from: string, to: string) {
    return request<Board>("board", { from, to });
  }
  saveWeek(input: WeeklyScheduleInput) {
    return request<{ changed: number; unchanged: number }>(
      "schedules/week",
      input,
    );
  }
  save(input: SaveInput) {
    return request<RecordEntry>("save", input);
  }
  preview(input: ImportInput) {
    return request<Preview[]>("preview", input);
  }
  commit(
    input: ImportInput,
    revisions: { id: string; expectedRevision: number }[],
  ) {
    return request<{ changed: number; unchanged: number }>("import", {
      input,
      revisions,
    });
  }
  history(kind: Kind, id: string) {
    return request<Revision[]>("history", { kind, id });
  }
}
