import {
  HandoverError,
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
export interface Transaction {
  coordinator: boolean;
  people(): Promise<Person[]>;
  get(id: string): Promise<Entry | null>;
  prior(key: string): Promise<{ fingerprint: string; entry: Entry } | null>;
  reference(content: Content): Promise<string>;
  save(
    entry: Entry,
    revision: Revision,
    request?: { key: string; fingerprint: string },
  ): Promise<void>;
  list(selection: Selection): Promise<Page>;
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
      actorId: actor,
    }));
  }
  async list(actor: string, input: Selection) {
    const selection = validSelection(input);
    return this.store.run(actor, "handover.read", (tx) => tx.list(selection));
  }
  async history(actor: string, id: string, before = 0) {
    text(id, 64, true);
    if (!Number.isSafeInteger(before) || before < 0)
      throw new HandoverError("invalid_handover");
    return this.store.run(actor, "handover.read", async (tx) =>
      tx.history(await this.existing(tx, id), before),
    );
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
        return prior.entry;
      }
      const people = await tx.people(),
        author = this.person(people, actor),
        at = this.now();
      const entry: Entry = {
        id: this.ids(),
        authorId: actor,
        authorName: author.name,
        createdAt: at,
        updatedAt: at,
        revision: 1,
        content,
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
      return entry;
    });
  }
  async change(actor: string, input: ChangeEntry): Promise<Entry> {
    const fields: Record<string, string[]> = {
      correct: ["content"],
      "follow-up": [],
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
      requireRevision(entry, input.expectedRevision);
      const people = await tx.people(),
        author = this.person(people, actor);
      if (input.action === "correct") {
        requireEditor(entry, actor, tx.coordinator);
        entry.content = validContent(input.content!, this.catalog);
        Object.assign(entry, this.labels(entry.content));
        entry.equipmentReferenceId = await tx.reference(entry.content);
      } else if (input.action === "state")
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
      await tx.save(entry, {
        entry,
        actorId: actor,
        actorName: author.name,
        action: input.action,
        note,
        at: entry.updatedAt,
      });
      return entry;
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
