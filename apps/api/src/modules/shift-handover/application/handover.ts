import {
  HandoverError,
  siteDate,
  withinLocation,
  exact,
  text,
  validContent,
  validSelection,
  requireEditor,
  requireRevision,
  changeIssue,
  type Catalog,
  type Entry,
  type Content,
  type Person,
  type Revision,
  type Page,
  type History,
  type Selection,
  type IssueState,
} from "../domain/handover";
export interface MatrixScope {
  date: string;
  timeZone: string;
  ongoingCategoryIds: string[];
  dailyCategoryIds: string[];
}
export interface Transaction {
  coordinator: boolean;
  canDelete?: boolean;
  equipment: EquipmentLookup["search"];
  people(): Promise<Person[]>;
  names(userIds: string[]): Promise<Map<string, string>>;
  latestUpdateActors(entryIds: string[]): Promise<Map<string, string>>;
  get(id: string): Promise<Entry | null>;
  prior(key: string): Promise<{ fingerprint: string; entry: Entry } | null>;
  reference(content: Content): Promise<string>;
  save(
    entry: Entry,
    revision: Revision,
    request?: { key: string; fingerprint: string },
  ): Promise<void>;
  list(selection: Selection, matrix?: MatrixScope): Promise<Page>;
  history(entry: Entry, before: number): Promise<History>;
}
export interface Store {
  run<T>(
    actor: string,
    permission: "handover.read" | "handover.contribute",
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T>;
}
export interface CreateEntry {
  key: string;
  content: Content;
  issue: boolean;
  responsibleId: string;
}
export interface ChangeEntry {
  id: string;
  expectedRevision: number;
  action: "correct" | "follow-up" | "state" | "assign" | "highlight";
  note: string;
  content?: Content;
  state?: IssueState;
  responsibleId?: string;
  highlighted?: boolean;
}
export interface EquipmentLookup {
  search(
    actor: string,
    departmentId: string,
    areaId: string,
    search: string,
    after: string,
    exact?: boolean,
  ): Promise<{ codes: string[]; nextCursor: string }>;
}
export class Handover {
  constructor(
    private readonly store: Store,
    private readonly catalog: Catalog,
    private readonly ids: () => string,
    private readonly now: () => string,
  ) {}
  context(actor: string) {
    return this.store.run(actor, "handover.read", async (tx) => ({
      ...this.catalog,
      people: await tx.people(),
      canCoordinate: tx.coordinator,
      canDelete: !!tx.canDelete,
      actorId: actor,
    }));
  }
  async equipmentChoices(
    actor: string,
    input: {
      departmentId: string;
      areaId: string;
      search: string;
      after: string;
    },
  ) {
    exact(input, ["departmentId", "areaId", "search", "after"]);
    const departmentId = text(input.departmentId, 64, true),
      areaId = text(input.areaId, 64, true);
    const search = text(input.search, 160),
      after = text(input.after, 160);
    if (
      !this.catalog.locations.some(
        (l) => l.id === departmentId && l.role === "department",
      ) ||
      !this.catalog.locations.some(
        (l) =>
          l.id === areaId &&
          l.role === "area" &&
          withinLocation(l.id, departmentId, this.catalog.locations),
      )
    )
      throw new HandoverError("invalid_handover");
    return this.store.run(actor, "handover.read", (tx) =>
      tx.equipment(actor, departmentId, areaId, search, after),
    );
  }
  private async requireEquipment(
    tx: Transaction,
    actor: string,
    content: Content,
    prior?: Content,
  ) {
    if (!content.equipmentCode) return;
    if (
      prior &&
      ["equipmentCode", "equipmentNamespace", "departmentId", "areaId"].every(
        (key) => content[key as keyof Content] === prior[key as keyof Content],
      )
    )
      return;
    if (!content.areaId || content.equipmentNamespace !== "site-equipment")
      throw new HandoverError("handover_equipment_unavailable");
    const result = await tx.equipment(
      actor,
      content.departmentId,
      content.areaId,
      content.equipmentCode,
      "",
      true,
    );
    if (!result.codes.includes(content.equipmentCode))
      throw new HandoverError("handover_equipment_unavailable");
  }
  async list(actor: string, input: Selection) {
    const selection = validSelection(input);
    return this.store.run(actor, "handover.read", async (tx) => {
      const matrix = selection.departmentMatrix
        ? {
            date: siteDate(this.now(), this.catalog.timeZone),
            timeZone: this.catalog.timeZone,
            ongoingCategoryIds: this.catalog.categories
              .filter((c) => c.carryForward)
              .map((c) => c.id),
            dailyCategoryIds: this.catalog.categories
              .filter((c) => !c.carryForward)
              .map((c) => c.id),
          }
        : undefined;
      const page = await tx.list(selection, matrix);
      return { ...page, entries: await this.currentNames(tx, page.entries) };
    });
  }
  async history(actor: string, id: string, before = 0) {
    text(id, 64, true);
    if (!Number.isSafeInteger(before) || before < 0)
      throw new HandoverError("invalid_handover");
    return this.store.run(actor, "handover.read", async (tx) => {
      const history = await tx.history(await this.existing(tx, id), before);
      return {
        ...history,
        entry: (await this.currentNames(tx, [history.entry]))[0],
      };
    });
  }
  private async currentNames(
    tx: Transaction,
    entries: Entry[],
  ): Promise<Entry[]> {
    const actors = await tx.latestUpdateActors(
      entries.filter((entry) => entry.latestUpdate).map((entry) => entry.id),
    );
    const names = await tx.names(
      entries
        .flatMap((entry) => [
          entry.authorId,
          entry.responsibleId,
          actors.get(entry.id) ?? "",
        ])
        .filter(Boolean),
    );
    return entries.map((entry) => ({
      ...entry,
      authorName: names.get(entry.authorId) ?? entry.authorName,
      responsibleName: names.get(entry.responsibleId) ?? entry.responsibleName,
      ...(entry.latestUpdate
        ? {
            latestUpdate: {
              ...entry.latestUpdate,
              actorName:
                names.get(actors.get(entry.id) ?? "") ??
                entry.latestUpdate.actorName,
            },
          }
        : {}),
    }));
  }
  private requireContentPermission(
    tx: Transaction,
    content: Content,
    prior?: Content,
    checkImages = true,
  ) {
    if (
      !tx.coordinator &&
      (this.catalog.categories.some(
        (c) =>
          c.coordinatorOnly &&
          [content.categoryId, prior?.categoryId].includes(c.id),
      ) ||
        (checkImages && (content.images?.length ?? 0) > 0))
    )
      throw new HandoverError("handover_denied");
  }
  async create(actor: string, input: CreateEntry): Promise<Entry> {
    exact(input, ["key", "content", "issue", "responsibleId"]);
    const key = text(input.key, 64, true),
      content = validContent(input.content, this.catalog),
      responsibleId = text(input.responsibleId, 64);
    if (typeof input.issue !== "boolean" || (!input.issue && responsibleId))
      throw new HandoverError("invalid_handover");
    const fingerprint = JSON.stringify({
      content,
      issue: input.issue,
      responsibleId,
    });
    return this.store.run(actor, "handover.contribute", async (tx) => {
      const prior = await tx.prior(key);
      if (prior) {
        if (prior.fingerprint !== fingerprint)
          throw new HandoverError("handover_conflict");
        return (await this.currentNames(tx, [prior.entry]))[0];
      }
      const people = await tx.people(),
        author = this.person(people, actor),
        at = this.now();
      if (
        !tx.coordinator &&
        content.date !== siteDate(at, this.catalog.timeZone)
      )
        throw new HandoverError("handover_today_only");
      this.requireContentPermission(tx, content);
      const mentionedPeople = (content.mentionIds ?? []).map((id) =>
        this.person(people, id),
      );
      await this.requireEquipment(tx, actor, content);
      const entry: Entry = {
        id: this.ids(),
        authorId: actor,
        authorName: author.name,
        createdAt: at,
        updatedAt: at,
        revision: 1,
        content,
        mentionedPeople,
        ...this.labels(content),
        equipmentReferenceId: await tx.reference(content),
        responsibleId,
        responsibleName: responsibleId
          ? this.person(people, responsibleId).name
          : "",
        issueState: input.issue ? "open" : "none",
        highlighted: false,
        highlightedAt: "",
      };
      await tx.save(
        entry,
        {
          entry,
          actorId: actor,
          actorName: author.name,
          action: "created",
          note: "",
          at,
        },
        { key, fingerprint },
      );
      return (await this.currentNames(tx, [entry]))[0];
    });
  }
  remove(actor: string, id: string, expectedRevision: number) {
    text(id, 64, true);
    return this.store.run(actor, "handover.contribute", async (tx) => {
      if (!tx.canDelete) throw new HandoverError("handover_denied");
      const entry = await this.existing(tx, id);
      requireRevision(entry, expectedRevision);
      if (entry.deleted) throw new HandoverError("handover_missing");
      entry.deleted = true;
      entry.revision++;
      entry.updatedAt = this.now();
      const author = this.person(await tx.people(), actor);
      await tx.save(entry, {
        entry,
        actorId: actor,
        actorName: author.name,
        action: "deleted",
        note: "Removed from active views; history retained.",
        at: entry.updatedAt,
      });
      return (await this.currentNames(tx, [entry]))[0];
    });
  }
  async change(actor: string, input: ChangeEntry): Promise<Entry> {
    const fields: Record<string, string[]> = {
      correct: ["content"],
      "follow-up": Object.hasOwn(input ?? {}, "state") ? ["state"] : [],
      state: ["state"],
      assign: ["responsibleId"],
      highlight: ["highlighted"],
    };
    if (!input || !Object.hasOwn(fields, input.action))
      throw new HandoverError("invalid_handover");
    exact(input, [
      "id",
      "expectedRevision",
      "action",
      "note",
      ...fields[input.action],
    ]);
    text(input.id, 64, true);
    const note = text(input.note, 4000, true);
    return this.store.run(actor, "handover.contribute", async (tx) => {
      const entry = await this.existing(tx, input.id);
      if (entry.deleted) throw new HandoverError("handover_missing");
      requireRevision(entry, input.expectedRevision);
      this.requireContentPermission(tx, entry.content, undefined, false);
      const people = await tx.people(),
        author = this.person(people, actor);
      if (input.action === "correct") {
        requireEditor(entry, actor, tx.coordinator);
        const content = validContent(input.content!, this.catalog);
        this.requireContentPermission(tx, content, entry.content);
        entry.mentionedPeople = (content.mentionIds ?? []).map((id) =>
          this.person(people, id),
        );
        if (!tx.coordinator && content.date !== entry.content.date)
          throw new HandoverError("handover_today_only");
        await this.requireEquipment(tx, actor, content, entry.content);
        entry.content = content;
        Object.assign(entry, this.labels(entry.content));
        entry.equipmentReferenceId = await tx.reference(entry.content);
      } else if (
        input.action === "state" ||
        (input.action === "follow-up" && input.state !== undefined)
      )
        changeIssue(entry, actor, tx.coordinator, input.state!, note);
      else if (input.action === "assign") {
        if (!tx.coordinator) throw new HandoverError("handover_denied");
        if (entry.issueState === "none")
          throw new HandoverError("invalid_handover");
        entry.responsibleId = text(input.responsibleId, 64);
        entry.responsibleName = entry.responsibleId
          ? this.person(people, entry.responsibleId).name
          : "";
      } else if (input.action === "highlight") {
        if (!tx.coordinator) throw new HandoverError("handover_denied");
        if (typeof input.highlighted !== "boolean")
          throw new HandoverError("invalid_handover");
        entry.highlighted = input.highlighted;
        entry.highlightedAt = input.highlighted ? this.now() : "";
      }
      entry.revision++;
      entry.updatedAt = this.now();
      if (input.action === "follow-up" || input.action === "state")
        entry.latestUpdate = {
          note,
          actorName: author.name,
          at: entry.updatedAt,
        };
      await tx.save(entry, {
        entry,
        actorId: actor,
        actorName: author.name,
        action: input.action,
        note,
        at: entry.updatedAt,
      });
      return (await this.currentNames(tx, [entry]))[0];
    });
  }
  private labels(content: Content) {
    return {
      departmentLabel:
        this.catalog.locations.find((l) => l.id === content.departmentId)
          ?.label ?? "",
      areaLabel:
        this.catalog.locations.find((l) => l.id === content.areaId)?.label ??
        "",
      categoryLabel: this.catalog.categories.find(
        (c) => c.id === content.categoryId,
      )!.label,
    };
  }
  private person(people: Person[], id: string): Person {
    const p = people.find((p) => p.id === id);
    if (!p) throw new HandoverError("handover_denied");
    return p;
  }
  private async existing(tx: Transaction, id: string): Promise<Entry> {
    const e = await tx.get(id);
    if (!e) throw new HandoverError("handover_missing");
    return e;
  }
}
