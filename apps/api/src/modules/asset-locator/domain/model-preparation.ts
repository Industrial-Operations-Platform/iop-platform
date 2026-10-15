import { LocatorError, locatorLimits, validComponent, type Component, type Scene } from './locator';

export interface ModelCandidate {
  referenceId: string;
  previousComponents: Component[];
  components: Component[];
}
export const modelStates = ['ready', 'current', 'manual-edits-preserved', 'not-initialized', 'manual-review-required'] as const;
export type ModelState = typeof modelStates[number];
export interface ModelPreview {
  referenceId: string;
  referenceName: string;
  sceneId: string;
  expectedRevision: number;
  status: ModelState;
  componentCount: number;
  motors: number;
  photoelectricSensors: number;
  conveyors: number;
}

/** Complete normalized values, including labels and notes, protect operator work. */
function sameComponents(left: Component[], right: Component[]): boolean {
  if (left.length !== right.length) return false;
  const normalized = (values: Component[]) => [...values].sort((a, b) => a.id.localeCompare(b.id)).map(validComponent);
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

export function modelState(scene: Scene | null, model: ModelCandidate): ModelState {
  if (!scene) return 'not-initialized';
  if (!model.components.length) return 'manual-review-required';
  const prepared = { ...scene, revision: scene.revision + 1, content: { ...scene.content, components: model.components } };
  if (new TextEncoder().encode(JSON.stringify(prepared)).byteLength > locatorLimits.sceneBytes) return 'manual-review-required';
  if (scene.content.referenceId !== model.referenceId || scene.content.calibration !== 'pending' || scene.content.surveyNote.trim() ||
    scene.content.components.some(c => c.assetId || c.verification !== 'provisional' || c.elevation !== null)) return 'manual-edits-preserved';
  if (sameComponents(scene.content.components, model.components)) return 'current';
  if (scene.revision === 1 && !scene.content.components.length) return 'ready';
  if (model.previousComponents.length && sameComponents(scene.content.components, model.previousComponents)) return 'ready';
  return 'manual-edits-preserved';
}

export function validModelCandidate(value: unknown): ModelCandidate {
  if (!value || typeof value !== 'object') throw new LocatorError('locator_reference_unavailable');
  const input = value as Record<string, unknown>;
  if (typeof input.referenceId !== 'string' || !/^[a-f0-9]{64}$/.test(input.referenceId)) throw new LocatorError('locator_reference_unavailable');
  const components = (raw: unknown) => {
    if (!Array.isArray(raw) || raw.length > 1000) throw new LocatorError('locator_reference_unavailable');
    const result = raw.map(validComponent);
    if (new Set(result.map(c => c.id)).size !== result.length || result.some(c => c.assetId || c.elevation !== null || c.verification !== 'provisional'))
      throw new LocatorError('locator_reference_unavailable');
    return result;
  };
  return { referenceId: input.referenceId, previousComponents: components(input.previousComponents), components: components(input.components) };
}
