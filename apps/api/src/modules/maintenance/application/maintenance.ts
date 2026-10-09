import {
  assert,
  data as validateData,
  descendants,
  identifier,
  priorities,
  selection,
  text,
  transition,
  sameData,
  sameEquipment,
  normalized,
  equipment,
  instant,
  currentWeeks,
  type AssetReference,
  type Location,
  type MaintenanceRecord,
  type Page,
  type Person,
  type Priority,
  type RecordData,
  type RecordView,
  type Revision,
  type Selection,
  type Settings,
  type Team,
  type IssueScope,
  type EquipmentTarget,
  type RelatedPage,
  type RelatedEntry,
  type AssignmentEvent,
} from "../domain/maintenance";
export interface Transaction {
  canContribute: boolean;
  canCoordinate: boolean;
  canAdminister: boolean;
  people(): Promise<Person[]>;
  names(ids: string[]): Promise<Map<string, string>>;
  teams(): Promise<Team[]>;
  assets(): Promise<AssetReference[]>;
  asset(id: string): Promise<AssetReference | null>;
  settings(): Promise<Settings | null>;
  saveSettings(settings: Settings, actor: string, at: string): Promise<void>;
  priorityUsed(ids: string[]): Promise<boolean>;
  get(id: string): Promise<MaintenanceRecord | null>;
  creation(id: string): Promise<Revision | null>;
  save(record: MaintenanceRecord, revision: Revision): Promise<void>;
  query(selection: Selection, locationIds: string[]): Promise<Page>;
  history(
    id: string,
    before: number,
    limit: number,
  ): Promise<{ revisions: Revision[]; nextBefore: number }>;
  related(
    scope: IssueScope,
    selection: {
      search?: string;
      cursor?: string;
      ids?: string[];
      limit?: number;
    },
  ): Promise<RelatedPage>;
  pending(scope: IssueScope): Promise<RelatedEntry[]>;
  resolve(
    resolutions: { id: string; expectedRevision: number }[],
    evidence: { maintenanceId: string; outcome: string; at: string },
  ): Promise<void>;
  assignments(
    actor: string,
    after: string,
  ): Promise<{ records: MaintenanceRecord[]; events: AssignmentEvent[] }>;
}
export interface Store {
  run<T>(
    actor: string,
    permission:
      | "maintenance.read"
      | "maintenance.contribute"
      | "maintenance.administer",
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T>;
}
export interface SaveInput {
  id: string;
  expectedRevision: number;
  data: RecordData;
  reason: string;
}
export class Maintenance {
  constructor(
    private readonly store: Store,
    private readonly locations: Location[],
    private readonly defaults: Priority[],
    private readonly now: () => string,
    private readonly timeZone = "UTC",
  ) {
    priorities(defaults);
  }
  private async configuration(tx: Transaction): Promise<Settings> {
    return (await tx.settings()) ?? { revision: 0, priorities: this.defaults };
  }
  catalog(actor: string) {
    return this.store.run(actor, "maintenance.read", async (tx) => ({
      actorId: actor,
      canContribute: tx.canContribute,
      canCoordinate: tx.canCoordinate,
      canAdminister: tx.canAdminister,
      settings: await this.configuration(tx),
      people: await tx.people(),
      teams: await tx.teams(),
      locations: this.locations,
      assets: await tx.assets(),
    }));
  }
  configure(
    actor: string,
    input: { expectedRevision: number; priorities: Priority[] },
  ) {
    assert(
      input &&
        typeof input === "object" &&
        Object.keys(input).sort().join(",") === "expectedRevision,priorities",
    );
    priorities(input.priorities);
    assert(
      Number.isSafeInteger(input.expectedRevision) &&
        input.expectedRevision >= 0 &&
        input.expectedRevision < 2147483647,
    );
    const request = structuredClone(input);
    return this.store.run(actor, "maintenance.administer", async (tx) => {
      const previous = await this.configuration(tx);
      assert(
        previous.revision === request.expectedRevision,
        "maintenance_conflict",
      );
      const removed = previous.priorities
        .filter(
          (priority) =>
            !request.priorities.some((next) => next.id === priority.id),
        )
        .map((priority) => priority.id);
      assert(
        !removed.length || !(await tx.priorityUsed(removed)),
        "maintenance_conflict",
      );
      const result = {
        revision: previous.revision + 1,
        priorities: request.priorities.sort((a, b) => b.rank - a.rank),
      };
      await tx.saveSettings(result, actor, this.now());
      return result;
    });
  }
  private view(
    record: MaintenanceRecord,
    actor: string,
    tx: Transaction,
  ): RecordView {
    return {
      ...record,
      data: normalized(record.data),
      canEdit:
        tx.canContribute &&
        (tx.canCoordinate ||
          record.authorId === actor ||
          record.data.assigneeId === actor),
      canReassign: tx.canCoordinate,
    };
  }
  private async currentNames(tx: Transaction, records: MaintenanceRecord[]) {
    const names = await tx.names(
      records.flatMap((r) => [r.authorId, r.data.assigneeId]).filter(Boolean),
    );
    return records.map((record) => ({
      ...record,
      authorName: names.get(record.authorId) ?? record.authorName,
      assigneeName: names.get(record.data.assigneeId) ?? record.assigneeName,
    }));
  }
  query(actor: string, input: Selection) {
    selection(input);
    const request = structuredClone(input);
    if (!request.history && !request.doneFrom && !request.doneTo)
      Object.assign(request, currentWeeks(this.now(), this.timeZone));
    return this.store.run(actor, "maintenance.read", async (tx) => {
      const locationIds = request.locationId
        ? descendants(this.locations, request.locationId)
        : [];
      const result = await tx.query(request, locationIds);
      return {
        ...result,
        records: (await this.currentNames(tx, result.records)).map((record) =>
          this.view(record, actor, tx),
        ),
      };
    });
  }
  save(actor: string, input: SaveInput) {
    assert(
      input &&
        typeof input === "object" &&
        Object.keys(input).sort().join(",") ===
          "data,expectedRevision,id,reason",
    );
    identifier(input.id);
    validateData(input.data);
    text(input.reason, 2000);
    assert(
      Number.isSafeInteger(input.expectedRevision) &&
        input.expectedRevision >= 0 &&
        input.expectedRevision < 2147483647,
    );
    const request = structuredClone(input);
    request.data = normalized(request.data);
    return this.store.run(actor, "maintenance.contribute", (tx) => this.savePrepared(tx, actor, request));
  }
  private async savePrepared(tx: Transaction, actor: string, request: SaveInput) {
    const before = await tx.get(request.id);
    if (before && request.expectedRevision === 0) {
      const original = await tx.creation(request.id);
      assert(
        original &&
          original.record.authorId === actor &&
          sameData(original.record.data, request.data) &&
          original.reason === request.reason,
        "maintenance_conflict",
      );
      return this.view((await this.currentNames(tx, [before]))[0], actor, tx);
    }
    assert(
      (before?.revision ?? 0) === request.expectedRevision,
      "maintenance_conflict",
    );
    assert(
      !before ||
        tx.canCoordinate ||
        before.authorId === actor ||
        before.data.assigneeId === actor,
      "maintenance_denied",
    );
    if (before) {
      assert(!!request.reason.trim());
      assert(
        tx.canCoordinate ||
          (before.data.assigneeId === request.data.assigneeId &&
            before.data.teamId === request.data.teamId),
        "maintenance_denied",
      );
      if ((before.data.assigneeId || before.data.teamId) && !tx.canCoordinate)
        assert(
          before.data.locationId === request.data.locationId &&
            before.data.assetId === request.data.assetId &&
            sameEquipment(
              before.data.equipment ?? [],
              request.data.equipment ?? [],
            ),
          "maintenance_denied",
        );
      transition(before.data.status, request.data.status, request.reason);
    } else {
      assert(request.data.status === "open");
      assert(
        tx.canCoordinate ||
          (!request.data.assigneeId && !request.data.teamId),
        "maintenance_denied",
      );
    }
    const references = await this.references(tx, actor, request.data, before);
    const at = this.now();
    const scope = this.issueScope(
      request.data.locationId,
      request.data.equipment ?? [],
    );
    const completing =
      before &&
      before.data.status !== "done" &&
      request.data.status === "done";
    const closing = request.data.status === "done";
    const pending = closing ? await tx.pending(scope) : [];
    const decisions = request.data.linkedEntries ?? [];
    if (decisions.length) {
      const selected = await tx.related(scope, {
        ids: decisions.map((entry) => entry.id),
        limit: 100,
      });
      assert(selected.total === decisions.length, "maintenance_conflict");
      for (const decision of decisions) {
        const entry = selected.entries.find(
          (entry) => entry.id === decision.id,
        );
        assert(entry, "maintenance_conflict");
        if (
          closing &&
          decision.disposition === "include" &&
          (entry.issueState === "open" || entry.issueState === "in-progress")
        )
          assert(
            entry.revision === decision.expectedRevision,
            "maintenance_conflict",
          );
      }
    }
    if (closing) {
      assert(pending.length <= 100, "maintenance_capacity");
      for (const entry of pending)
        assert(
          decisions.some((decision) => decision.id === entry.id),
          "maintenance_conflict",
        );
      const included = pending.filter(
        (entry) =>
          decisions.find((decision) => decision.id === entry.id)
            ?.disposition === "include",
      );
      assert(
        !included.length ||
          tx.canCoordinate ||
          before?.data.assigneeId === actor,
        "maintenance_denied",
      );
      await tx.resolve(
        included.map((entry) => ({
          id: entry.id,
          expectedRevision: decisions.find(
            (decision) => decision.id === entry.id,
          )!.expectedRevision,
        })),
        { maintenanceId: request.id, outcome: request.data.outcome, at },
      );
    }
    const record: MaintenanceRecord = {
      id: request.id,
      revision: request.expectedRevision + 1,
      data: request.data,
      authorId: before?.authorId ?? actor,
      authorName: before?.authorName ?? references.actorName,
      createdAt: before?.createdAt ?? at,
      updatedAt: at,
      locationLabel: references.locationLabel,
      assetName: references.assetName,
      priorityLabel: references.priorityLabel,
      assigneeName: references.assigneeName,
      teamLabel: references.teamLabel,
      assignedAt:
        request.data.assigneeId &&
        request.data.assigneeId !== before?.data.assigneeId
          ? at
          : (before?.assignedAt ?? ""),
      completedAt: completing
        ? at
        : request.data.status === "done"
          ? (before?.completedAt ?? before?.updatedAt ?? at)
          : "",
    };
    await tx.save(record, {
      record,
      actorId: actor,
      actorName: references.actorName,
      at,
      action: !before
        ? "created"
        : before.data.status === record.data.status
          ? "updated"
          : "status-changed",
      reason: request.reason,
    });
    return this.view((await this.currentNames(tx, [record]))[0], actor, tx);
  }

  async completionTargetsWithin(tx: Transaction, actor: string, search: string, cursor: string) {
    const input = { search, cursor, history: true, limit: 20 };
    selection(input);
    const page = await tx.query(input, []);
    return { total: page.total, nextCursor: page.nextCursor, targets: page.records.map((record) => ({
      id: record.id, expectedRevision: record.revision, title: record.data.title, location: record.locationLabel,
      canComplete: record.data.status !== "done" && this.view(record, actor, tx).canEdit,
    })) };
  }
  async completeWithin(tx: Transaction, actor: string, reference: { id: string; expectedRevision: number }, outcome: string, successId: string) {
    assert(tx.canContribute, "maintenance_denied");
    const record = await tx.get(reference.id);
    assert(record && record.revision === reference.expectedRevision && record.data.status !== "done", "maintenance_conflict");
    const request = { id: record.id, expectedRevision: record.revision,
      data: { ...record.data, status: "done" as const, outcome, blockedReason: "" },
      reason: `Completed through Success ${successId}.` };
    validateData(request.data);
    return this.savePrepared(tx, actor, request);
  }
  private issueScope(
    locationId: string,
    targets: EquipmentTarget[],
  ): IssueScope {
    const location = this.locations.find((entry) => entry.id === locationId);
    assert(location);
    const locationIds = descendants(this.locations, locationId);
    for (const target of targets) {
      const department = this.locations.find(
        (entry) => entry.id === target.departmentId,
      );
      assert(
        department && (!department.role || department.role === "department"),
      );
      const departmentIds = descendants(this.locations, target.departmentId);
      if (target.areaId) {
        const area = this.locations.find((entry) => entry.id === target.areaId);
        assert(
          area &&
            (!area.role || area.role === "area") &&
            departmentIds.includes(target.areaId),
        );
      }
      assert(
        locationIds.includes(target.areaId || target.departmentId) ||
          descendants(
            this.locations,
            target.areaId || target.departmentId,
          ).includes(locationId),
      );
    }
    return { locationIds, equipment: targets };
  }
  related(
    actor: string,
    input: {
      locationId: string;
      equipment: EquipmentTarget[];
      search?: string;
      cursor?: string;
    },
  ) {
    assert(
      input &&
        typeof input === "object" &&
        !Array.isArray(input) &&
        Object.keys(input).every((key) =>
          ["locationId", "equipment", "search", "cursor"].includes(key),
        ),
    );
    identifier(input.locationId);
    equipment(input.equipment);
    if (input.search !== undefined) text(input.search, 200);
    if (input.cursor !== undefined) text(input.cursor, 300);
    const request = structuredClone(input);
    const scope = this.issueScope(request.locationId, request.equipment);
    return this.store.run(actor, "maintenance.read", (tx) =>
      tx.related(scope, { search: request.search, cursor: request.cursor }),
    );
  }
  assignments(actor: string, input: { after?: string }) {
    assert(
      input &&
        typeof input === "object" &&
        !Array.isArray(input) &&
        Object.keys(input).every((key) => key === "after"),
    );
    if (input.after !== undefined) instant(input.after);
    const after = input.after ?? "1970-01-01T00:00:00.000Z";
    return this.store.run(actor, "maintenance.read", async (tx) => {
      const result = await tx.assignments(actor, after);
      return {
        ...result,
        records: (await this.currentNames(tx, result.records)).map((record) =>
          this.view(record, actor, tx),
        ),
      };
    });
  }
  private async references(
    tx: Transaction,
    actor: string,
    data: RecordData,
    before: MaintenanceRecord | null,
  ) {
    const [people, teams, settings] = await Promise.all([
      tx.people(),
      tx.teams(),
      this.configuration(tx),
    ]);
    const author = people.find((person) => person.id === actor);
    assert(author, "maintenance_denied");
    const assignee = people.find((person) => person.id === data.assigneeId);
    assert(
      !data.assigneeId ||
        assignee ||
        before?.data.assigneeId === data.assigneeId,
      "maintenance_denied",
    );
    const team = teams.find((team) => team.id === data.teamId);
    assert(!data.teamId || team || before?.data.teamId === data.teamId);
    const location = this.locations.find(
      (location) => location.id === data.locationId,
    );
    assert(location || before?.data.locationId === data.locationId);
    const priority = settings.priorities.find(
      (priority) => priority.id === data.priorityId,
    );
    assert(priority || before?.data.priorityId === data.priorityId);
    const asset = data.assetId ? await tx.asset(data.assetId) : null;
    if (data.assetId && before?.data.assetId !== data.assetId)
      assert(asset && asset.status !== "retired");
    return {
      actorName: author.name,
      locationLabel: location?.label ?? before?.locationLabel ?? "",
      assetName: data.assetId ? (asset?.name ?? before?.assetName ?? "") : "",
      priorityLabel: priority?.label ?? before?.priorityLabel ?? "",
      assigneeName: data.assigneeId
        ? (assignee?.name ?? before?.assigneeName ?? "")
        : "",
      teamLabel: data.teamId ? (team?.label ?? before?.teamLabel ?? "") : "",
    };
  }
  history(actor: string, id: string, before = 0, limit = 50) {
    identifier(id);
    assert(Number.isSafeInteger(before) && before >= 0 && before <= 2147483647);
    assert(Number.isSafeInteger(limit) && limit >= 1 && limit <= 100);
    return this.store.run(actor, "maintenance.read", async (tx) => {
      const record = await tx.get(id);
      assert(record, "maintenance_missing");
      return {
        record: this.view(
          (await this.currentNames(tx, [record]))[0],
          actor,
          tx,
        ),
        ...(await tx.history(id, before, limit)),
      };
    });
  }
}
