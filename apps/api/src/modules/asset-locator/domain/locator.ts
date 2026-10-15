export class LocatorError extends Error {
  constructor(readonly code: 'invalid_locator' | 'locator_denied' | 'locator_missing' | 'locator_conflict' | 'locator_capacity' | 'locator_reference_unavailable') { super(code); }
}
export const locatorLimits = { scenes: 250, sceneBytes: 1048576, siteSceneBytes: 16777216 } as const;
export const componentKinds = ['conveyor', 'curve', 'junction', 'lift', 'motor', 'photoelectric-sensor', 'sensor', 'scanner', 'scale', 'cabinet'] as const;
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
export interface SceneContent {
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
  content: SceneContent;
}
export interface Revision {
  scene: Scene;
  actorId: string;
  note: string;
  at: string;
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
export interface SaveScene {
  id: string;
  expectedRevision: number;
  note: string;
  content: SceneContent;
}
export function exact(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || Object.keys(value).some(k => !keys.includes(k)))
    throw new LocatorError('invalid_locator');
}
export function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b-\u001f\u007f]/.test(value) || (required && !value.trim()))
    throw new LocatorError('invalid_locator');
  return value.trim();
}
export function identifier(value: unknown, required = false): string {
  const result = text(value, 100, required);
  if (result && !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(result))
    throw new LocatorError('invalid_locator');
  return result;
}
function bounded(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new LocatorError('invalid_locator');
  return value;
}
export function validComponent(value: unknown): Component {
  exact(value, ['id', 'kind', 'label', 'x', 'y', 'elevation', 'rotation', 'width', 'depth', 'height', 'assetId', 'verification', 'note']);
  if (!componentKinds.includes(value.kind as ComponentKind) || !['provisional', 'surveyed'].includes(value.verification as string))
    throw new LocatorError('invalid_locator');
  const result: Component = { id: identifier(value.id, true), kind: value.kind as ComponentKind, label: text(value.label, 160, true), x: bounded(value.x, 0, 1), y: bounded(value.y, 0, 1), elevation: value.elevation === null ? null : bounded(value.elevation, 0, 1), rotation: bounded(value.rotation, -360, 360), width: bounded(value.width, 0.001, 1), depth: bounded(value.depth, 0.001, 1), height: bounded(value.height, 0.001, 1), assetId: identifier(value.assetId), verification: value.verification as Component['verification'], note: text(value.note, 2000) };
  if (result.verification === 'surveyed' && (!result.note || result.elevation === null || !result.assetId))
    throw new LocatorError('invalid_locator');
  return result;
}
export function validContent(value: unknown): SceneContent {
  exact(value, ['name', 'group', 'locationId', 'referenceId', 'description', 'calibration', 'surveyNote', 'components']);
  if (!Array.isArray(value.components) || value.components.length > 1000 || !['pending', 'surveyed'].includes(value.calibration as string))
    throw new LocatorError('invalid_locator');
  const result: SceneContent = { name: text(value.name, 160, true), group: text(value.group, 160), locationId: identifier(value.locationId), referenceId: identifier(value.referenceId), description: text(value.description, 4000), calibration: value.calibration as SceneContent['calibration'], surveyNote: text(value.surveyNote, 2000), components: value.components.map(validComponent) };
  if (new Set(result.components.map(c => c.id)).size !== result.components.length || (result.calibration === 'surveyed' && !result.surveyNote))
    throw new LocatorError('invalid_locator');
  return result;
}
export const componentCatalog = componentKinds.map(kind => ({ kind, width: kind === 'conveyor' ? 0.25 : kind === 'curve' ? 0.12 : kind === 'motor' ? 0.025 : kind === 'photoelectric-sensor' ? 0.035 : 0.04, depth: kind === 'conveyor' ? 0.035 : kind === 'curve' ? 0.12 : kind === 'motor' ? 0.025 : kind === 'photoelectric-sensor' ? 0.008 : 0.04, height: kind === 'lift' ? 0.24 : kind === 'cabinet' ? 0.09 : kind === 'motor' ? 0.04 : 0.025 }));
export function demonstration(): SceneContent {
  const make = (id: string, kind: ComponentKind, label: string, x: number, y: number, rotation = 0): Component => ({ id, kind, label, x, y, rotation, elevation: null, width: kind === 'conveyor' ? 0.34 : kind === 'curve' ? 0.13 : 0.035, depth: kind === 'conveyor' ? 0.045 : kind === 'curve' ? 0.13 : 0.035, height: kind === 'lift' ? 0.2 : 0.035, assetId: '', verification: 'provisional', note: 'Synthetic reusable component example; no plant identity or position.' });
  return { name: 'Component demonstration', group: 'Examples', locationId: '', referenceId: '', description: 'Synthetic scene demonstrating reusable geometry. It does not represent the plant.', calibration: 'pending', surveyNote: '', components: [make('example-belt-1', 'conveyor', 'Example conveyor', 0.35, 0.4), make('example-bend', 'curve', 'Example curve', 0.58, 0.42), make('example-belt-2', 'conveyor', 'Example outgoing conveyor', 0.6, 0.65, 90), make('example-sensor', 'sensor', 'Example sensor', 0.35, 0.45), make('example-scanner', 'scanner', 'Example scanner', 0.6, 0.58), make('example-lift', 'lift', 'Example lift', 0.78, 0.65)] };
}
