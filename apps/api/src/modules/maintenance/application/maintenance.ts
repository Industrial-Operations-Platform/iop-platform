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
    return this.store.run(actor, "maintenance.contribute", async (tx) => {
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
        transition(before.data.status, request.data.status, request.reason);
      } else assert(request.data.status === "open");
      const references = await this.references(tx, actor, request.data, before);
      const at = this.now();
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
