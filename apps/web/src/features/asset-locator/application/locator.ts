import type { Context, Detail, Save, Scene, SearchResults, History, Component, ComponentKind } from '../domain/models';
export interface Gateway {
  context(): Promise<Context>;
  query(input: {
    search: string;
    group: string;
  }): Promise<{
    scenes: Scene[];
    total: number;
  }>;
  detail(id: string): Promise<Detail>;
  save(input: Save): Promise<Scene>;
  history(id: string, before?: number): Promise<History>;
  search(input: {
    search: string;
    unplacedOnly: boolean;
  }): Promise<SearchResults>;
  bootstrap(): Promise<{
    created: number;
    referenceCount: number;
  }>;
}
export class LocatorApplication {
  constructor(private readonly gateway: Gateway, private readonly ids: () => string) { }
  context() { return this.gateway.context(); }
  query(search = '', group = '') { return this.gateway.query({ search, group }); }
  detail(id: string) { return this.gateway.detail(id); }
  save(input: Save) { return this.gateway.save(input); }
  history(id: string, before?: number) { return this.gateway.history(id, before); }
  search(search: string, unplacedOnly = false) { return this.gateway.search({ search, unplacedOnly }); }
  bootstrap() { return this.gateway.bootstrap(); }
  component(kind: ComponentKind, catalog: Context['componentCatalog'], at?: {
    x: number;
    y: number;
  }): Component { const template = catalog.find(c => c.kind === kind); if (!template)
    throw new Error('Unknown reusable component.'); return { id: this.ids(), kind, label: kind.charAt(0).toUpperCase() + kind.slice(1), x: at?.x ?? 0.5, y: at?.y ?? 0.5, elevation: null, rotation: 0, width: template.width, depth: template.depth, height: template.height, assetId: '', verification: 'provisional', note: '' }; }
  newId() { return this.ids(); }
}
