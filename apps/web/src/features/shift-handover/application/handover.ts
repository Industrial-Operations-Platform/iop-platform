import {
  emptySelection,
  type EquipmentSelection,
  type EquipmentPage,
  type Context,
  type Entry,
  type Page,
  type History,
  type Selection,
  type CreateEntry,
  type ChangeEntry,
} from "../domain/models";
export interface Gateway {
  equipment(selection: EquipmentSelection): Promise<EquipmentPage>;
  context(): Promise<Context>;
  remove?(id:string,expectedRevision:number):Promise<Entry>;
  list(selection: Selection): Promise<Page>;
  history(id: string, before: number): Promise<History>;
  create(input: CreateEntry): Promise<Entry>;
  change(input: ChangeEntry): Promise<Entry>;
}
export class HandoverApplication {
  private attempts = new Map<string, string>();
  constructor(
    private readonly gateway: Gateway,
    private readonly newKey: () => string,
  ) {}
  equipment(selection: EquipmentSelection) {
    return this.gateway.equipment(selection);
  }
  async board(selection: Selection, carryForwardOnly = false) {
    const context = await this.context();
    const sections = await Promise.all(
      context.categories
        .filter((category) => !carryForwardOnly || category.carryForward)
        .map(async (category) => ({
          category,
          page: await this.list({ ...selection, categoryId: category.id }),
        })),
    );
    return { context, sections };
  }
  context() {
    return this.gateway.context();
  }
  list(selection: Partial<Selection> = {}) {
    return this.gateway.list({ ...emptySelection, ...selection });
  }
  history(id: string, before = 0) {
    return this.gateway.history(id, before);
  }
  remove(entry:Entry) {
    if(!this.gateway.remove) throw new Error("Entry deletion is unavailable.");
    return this.gateway.remove(entry.id,entry.revision);
  }
  change(input: ChangeEntry) {
    return this.gateway.change(input);
  }
  async publish(input: Omit<CreateEntry, "key">) {
    const fingerprint = JSON.stringify(input);
    const key = this.attempts.get(fingerprint) ?? this.newKey();
    this.attempts.set(fingerprint, key);
    const entry = await this.gateway.create({ ...input, key });
    this.attempts.delete(fingerprint);
    return entry;
  }
  async open(selection: Selection) {
    const [context, current] = await Promise.all([
      this.context(),
      this.list(selection),
    ]);
    return { context, current };
  }
}

/** Daily leadership review deliberately starts with all authors and departments. */
export function meetingSelection(
  date: string,
  departmentId: string,
  dailyOverview: boolean,
): Selection {
  return {
    ...emptySelection,
    from: date,
    to: date,
    departmentId: dailyOverview ? "" : departmentId,
  };
}
