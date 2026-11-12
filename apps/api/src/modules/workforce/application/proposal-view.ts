import type { Transaction } from "./workforce";
import type { RecordEntry } from "../domain/workforce";

/** Read-only validation of a final proposal over one authorized transaction. */
export function proposalView(tx: Transaction, records: RecordEntry[], hiddenIds: ReadonlySet<string>) {
  const entries = new Map(records.map(record => [`${record.kind}/${record.id}`, record]));
  for (const record of records) if (record.kind === "assignment" && hiddenIds.has(record.id))
    entries.set(`assignment/${record.id}`, { ...record, deleted: true });
  const view: Transaction = {
    canPlan: tx.canPlan,
    canAdminister: tx.canAdminister,
    people: () => tx.people(),
    names: ids => tx.names(ids),
    get: async (kind, id) => entries.get(`${kind}/${id}`) ?? tx.get(kind, id),
    records: async (from, to) => [...entries.values()].filter(record =>
      !("date" in record.data) || (record.data.date >= from && record.data.date <= to)),
    history: (kind, id) => tx.history(kind, id),
    save: async () => { throw new Error("A proposal validation view cannot write."); },
  };
  return { transaction: view, stage: (record: RecordEntry) => entries.set(`${record.kind}/${record.id}`, record) };
}
