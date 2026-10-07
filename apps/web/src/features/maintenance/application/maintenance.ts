import type {
  Catalog,
  Status,
  LinkedEntry,
  History,
  MaintenanceRecord,
  Page,
  SaveInput,
  Selection,
  Settings,
  Priority,
  RelatedSelection,
  RelatedPage,
  Assignments,
} from "../domain/models";
import { emptyRecord } from "../domain/models";

/** Date-only personal browsing retains overdue and undated unfinished work. */
export function assignmentsForPeriod(
  records: MaintenanceRecord[],
  period: { from: string; to: string; today: string },
): MaintenanceRecord[] {
  return records.filter(
    ({ data }) =>
      !data.dueDate ||
      data.dueDate < period.today ||
      (data.dueDate >= period.from && data.dueDate <= period.to),
  );
}

export interface Gateway {
  catalog(): Promise<Catalog>;
  query(selection: Selection): Promise<Page>;
  save(input: SaveInput): Promise<MaintenanceRecord>;
  history(id: string, before?: number): Promise<History>;
  settings(expectedRevision: number, priorities: Priority[]): Promise<Settings>;
  related(selection: RelatedSelection): Promise<RelatedPage>;
  assignments(after?: string): Promise<Assignments>;
}

export interface ReportDraftSource {
  id: string;
  revision: number;
  issueState: string;
  content: {
    summary: string;
    details: string;
    departmentId: string;
    areaId: string;
    equipmentCode: string;
    equipmentNamespace: string;
  };
}
/** Starting a repair copies explicit report context without assigning a worker. */
export function maintenanceDraftFromReport(
  report: ReportDraftSource,
): SaveInput["data"] {
  return {
    ...emptyRecord(),
    title: report.content.summary.slice(0, 160),
    details: "",
    repairTarget: report.content.summary.slice(0, 200),
    locationId: report.content.areaId || report.content.departmentId,
    equipment:
      report.content.equipmentCode &&
      report.content.equipmentNamespace === "site-equipment"
        ? [
            {
              namespace: "site-equipment",
              code: report.content.equipmentCode,
              departmentId: report.content.departmentId,
              areaId: report.content.areaId,
            },
          ]
        : [],
    linkedEntries:
      report.issueState === "open" || report.issueState === "in-progress"
        ? [
            {
              id: report.id,
              expectedRevision: report.revision,
              disposition: "include",
              reason: "",
            },
          ]
        : [],
  };
}
/** Focused status changes retain the current content and optimistic revision. */
export function statusChange(
  record: MaintenanceRecord,
  status: Status,
  input: {
    outcome?: string;
    reason?: string;
    linkedEntries?: LinkedEntry[];
  } = {},
): SaveInput {
  const reason =
    input.reason?.trim() ||
    (status === "done"
      ? "Maintenance completion confirmed."
      : `Status changed to ${status}.`);
  return {
    id: record.id,
    expectedRevision: record.revision,
    reason,
    data: {
      ...record.data,
      status,
      ...(status === "done"
        ? {
            outcome: input.outcome?.trim() ?? record.data.outcome,
            linkedEntries: input.linkedEntries ?? record.data.linkedEntries,
          }
        : {}),
      blockedReason: status === "blocked" ? (input.reason?.trim() ?? "") : "",
    },
  };
}
/** Browser use cases keep transport and React outside the application boundary. */
export class MaintenanceApplication {
  constructor(
    private readonly gateway: Gateway,
    private readonly ids: () => string,
  ) {}
  newId() {
    return this.ids();
  }
  catalog() {
    return this.gateway.catalog();
  }
  query(selection: Selection) {
    return this.gateway.query(selection);
  }
  save(input: SaveInput) {
    return this.gateway.save(input);
  }
  history(id: string, before?: number) {
    return this.gateway.history(id, before);
  }
  settings(expectedRevision: number, priorities: Priority[]) {
    return this.gateway.settings(expectedRevision, priorities);
  }
  async related(selection: RelatedSelection, displayedCount = 0) {
    let page = await this.gateway.related(selection);
    const cursors = new Set<string>();
    while (page.nextCursor && page.entries.length < displayedCount) {
      if (cursors.has(page.nextCursor))
        throw new Error(
          "Related reports are unavailable. Reload reports and retry.",
        );
      cursors.add(page.nextCursor);
      const next = await this.gateway.related({
        ...selection,
        cursor: page.nextCursor,
      });
      page = { ...next, entries: [...page.entries, ...next.entries] };
    }
    return page;
  }
  assignments(after?: string) {
    return this.gateway.assignments(after);
  }
}
