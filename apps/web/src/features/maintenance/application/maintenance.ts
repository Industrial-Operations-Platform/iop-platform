import type {
  Catalog,
  History,
  MaintenanceRecord,
  Page,
  SaveInput,
  Selection,
  Settings,
  Priority,
} from "../domain/models";

export interface Gateway {
  catalog(): Promise<Catalog>;
  query(selection: Selection): Promise<Page>;
  save(input: SaveInput): Promise<MaintenanceRecord>;
  history(id: string, before?: number): Promise<History>;
  settings(expectedRevision: number, priorities: Priority[]): Promise<Settings>;
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
}
