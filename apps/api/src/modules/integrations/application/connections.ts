import {ConnectionError, configuration, emptyConnection, integrationKinds, readiness,
  type Connection, type ConnectionConfiguration, type IntegrationKind} from "../domain/connections";
export interface ConnectionTransaction {
  get(kind: IntegrationKind): Promise<Connection | null>;
  save(connection: Connection): Promise<void>;
  history(kind: IntegrationKind): Promise<Connection[]>;
}
export interface ConnectionStore {
  run<T>(actor: string, write: boolean, work: (transaction: ConnectionTransaction) => Promise<T>): Promise<T>;
}
export class Connections {
  constructor(private readonly store: ConnectionStore, private readonly now: () => string) {}
  query(actor: string) {
    return this.store.run(actor, false, async tx => ({connections: await Promise.all(integrationKinds.map(async kind =>
      readiness(await tx.get(kind) ?? emptyConnection(kind))))}));
  }
  save(actor: string, input: {expectedRevision: number; configuration: ConnectionConfiguration}) {
    if (!input || Object.keys(input).length !== 2 || !Object.hasOwn(input, "expectedRevision") ||
      !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) throw new ConnectionError("invalid_integration");
    const content = configuration(input.configuration);
    return this.store.run(actor, true, async tx => {
      const current = await tx.get(content.kind) ?? emptyConnection(content.kind);
      if (current.revision !== input.expectedRevision) throw new ConnectionError("integration_conflict");
      const connection: Connection = {configuration: content, revision: current.revision + 1, updatedAt: this.now(), updatedBy: actor};
      await tx.save(connection);
      return readiness(connection);
    });
  }
  history(actor: string, kind: IntegrationKind) {
    if (!integrationKinds.includes(kind)) throw new ConnectionError("invalid_integration");
    return this.store.run(actor, false, async tx => ({revisions: await tx.history(kind)}));
  }
}
