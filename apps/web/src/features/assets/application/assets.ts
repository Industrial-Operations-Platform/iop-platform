import type {
  Asset,
  Context,
  History,
  Page,
  SaveInput,
  Selection,
  Timeline,
  TimelineSelection,
} from "../domain/models";
export interface Gateway {
  context(): Promise<Context>;
  query(selection: Selection): Promise<Page>;
  save(input: SaveInput): Promise<Asset>;
  detail(id: string): Promise<Asset>;
  history(id: string, before?: number): Promise<History>;
  timeline(selection: TimelineSelection): Promise<Timeline>;
}
export class AssetsApplication {
  constructor(
    private readonly gateway: Gateway,
    private readonly ids: () => string,
  ) {}
  newKey() {
    return this.ids();
  }
  context() {
    return this.gateway.context();
  }
  query(selection: Selection) {
    return this.gateway.query(selection);
  }
  save(input: SaveInput) {
    return this.gateway.save(input);
  }
  detail(id: string) {
    return this.gateway.detail(id);
  }
  history(id: string, before?: number) {
    return this.gateway.history(id, before);
  }
  timeline(selection: TimelineSelection) {
    return this.gateway.timeline(selection);
  }
}
