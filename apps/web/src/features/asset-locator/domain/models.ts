export const componentKinds = ['conveyor', 'curve', 'junction', 'lift', 'sensor', 'scanner', 'scale', 'cabinet'] as const;
export type ComponentKind = typeof componentKinds[number];
export interface Component {
  id: string;
  kind: ComponentKind;
  label: string;
  x: number;
  y: number;
  elevation: number | null;
  rotation: number;
  width: number;
  depth: number;
  height: number;
  assetId: string;
  verification: 'provisional' | 'surveyed';
  note: string;
}
export interface Content {
  name: string;
  group: string;
  locationId: string;
  referenceId: string;
  description: string;
  calibration: 'pending' | 'surveyed';
  surveyNote: string;
  components: Component[];
}
export interface Scene {
  id: string;
  revision: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  content: Content;
}
export interface Reference {
  id: string;
  name: string;
  group: string;
  sourcePath: string;
  sha256: string;
  width: number;
  height: number;
  bytes: number;
  importedAt: string;
  kind: 'schematic' | 'legend';
}
export interface Asset {
  id: string;
  code: string;
  name: string;
  locationId: string;
  status: string;
}
export interface Problem {
  assetId: string;
  kind: 'handover' | 'maintenance';
  id: string;
  title: string;
  status: string;
  recordedAt: string;
}
export interface Problems {
  items: Problem[];
  coverage: {
    kind: 'handover' | 'maintenance';
    status: 'available' | 'not-authorized' | 'unavailable';
  }[];
}
export interface Context {
  canManage: boolean;
  references: Reference[];
  locations: {
    id: string;
    label: string;
    parentId: string;
  }[];
  componentCatalog: {
    kind: ComponentKind;
    width: number;
    depth: number;
    height: number;
  }[];
  coordinateSystem: string;
  globalCalibration: 'pending';
}
export interface Detail {
  scene: Scene;
  assets: Asset[];
  problems: Problems;
}
export interface Save {
  id: string;
  expectedRevision: number;
  note: string;
  content: Content;
}
export interface Placement {
  sceneId: string;
  sceneName: string;
  componentId: string;
  label: string;
  verification: 'provisional' | 'surveyed';
}
export interface SearchResults {
  results: {
    asset: Asset;
    placements: Placement[];
  }[];
  problems: Problems;
  total: number;
  limit: number;
}
export interface History {
  revisions: {
    scene: Scene;
    actorId: string;
    note: string;
    at: string;
  }[];
  nextBefore: number;
}
export function emptyContent(): Content { return { name: 'New scene', group: '', locationId: '', referenceId: '', description: '', calibration: 'pending', surveyNote: '', components: [] }; }
/** Duplication creates a new provisional identity and does not duplicate a physical asset link. */
export function duplicateComponent(component: Component, id: string): Component { return { ...component, id, label: component.label + ' copy', x: Math.min(1, component.x + 0.04), y: Math.min(1, component.y + 0.04), assetId: '', elevation: null, verification: 'provisional', note: '' }; }
export function moveComponent(component: Component, dx: number, dy: number): Component { return { ...component, x: Math.max(0, Math.min(1, component.x + dx)), y: Math.max(0, Math.min(1, component.y + dy)), verification: 'provisional' }; }
