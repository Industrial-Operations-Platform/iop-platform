import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IdentityRoot } from '../src/design/components';
import { setAppearance } from '../src/design/appearance';
import { LocatorApplication, type Gateway } from '../src/features/asset-locator/application/locator';
import { LocatorWorkspace } from '../src/features/asset-locator/adapters/react/LocatorWorkspace';
import { SceneViewport } from '../src/features/asset-locator/adapters/react/SceneViewport';
import { PlantOverview } from '../src/features/asset-locator/adapters/react/PlantOverview';
import { createSceneRenderer, type CameraControls, type CameraState } from '../src/features/asset-locator/adapters/three/renderer';
import type { Component, Context, Reference, Scene } from '../src/features/asset-locator/domain/models';

jest.mock('../src/features/asset-locator/adapters/three/renderer', () => ({ createSceneRenderer: jest.fn() }));

type RendererInput = Parameters<typeof createSceneRenderer>[1];
interface FakeView {
  input: RendererInput;
  controls: CameraControls;
  move(state: CameraState, notify?: boolean): void;
}
const views: FakeView[] = [];
let unavailable = false;
const copy = (state: CameraState): CameraState => ({ position: [...state.position], target: [...state.target] });
const offset = (state: CameraState) => state.position.map((value, index) => value - state.target[index]);
const camera: CameraState = { position: [52, 71, 94], target: [12, 4, -8] };
const component: Component = { id: 'sensor-a', kind: 'sensor', label: 'Sensor A', x: .4, y: .5, elevation: null, rotation: 0, width: .02, depth: .02, height: .04, assetId: 'asset-a', verification: 'provisional', note: 'Synthetic placement.' };
const reference: Reference = { id: 'a'.repeat(64), name: 'Private source A', group: 'Fixture', sourcePath: 'private/area-a.png', sha256: 'a'.repeat(64), width: 2000, height: 1000, bytes: 100, importedAt: '2026-10-14T12:00:00Z', kind: 'schematic' };
const scene: Scene = { id: 'scene-a', revision: 1, authorId: 'actor', createdAt: '2026-10-14T12:00:00Z', updatedAt: '2026-10-14T12:00:00Z', content: { name: 'Area A', group: 'Fixture', locationId: 'area', referenceId: reference.id, description: 'Synthetic lifecycle fixture.', calibration: 'pending', surveyNote: '', components: [component, { ...component, id: 'sensor-b', label: 'Sensor B', x: .7 }] } };
const second: Scene = { ...scene, id: 'scene-b', content: { ...scene.content, name: 'Area B' } };
const problems = new Set<string>();

function fakeRenderer(_container: HTMLElement, input: RendererInput): CameraControls {
  if (unavailable) throw new Error('WebGL unavailable in lifecycle fixture.');
  let state = copy(input.cameraState ?? { position: [80, 95, 105], target: [0, 0, 0] });
  const move = (next: CameraState, notify = true) => {
    state = copy(next);
    if (notify) input.onCameraChange?.(copy(state));
  };
  const controls: CameraControls = {
    snapshot: jest.fn(() => copy(state)),
    reset: jest.fn(() => move({ position: [80, 95, 105], target: [0, 0, 0] })),
    top: jest.fn(() => move({ position: [0, 140, .01], target: [0, 0, 0] })),
    zoom: jest.fn(factor => move({ position: state.position.map((value, index) => state.target[index] + (value - state.target[index]) * factor), target: state.target })),
    rotate: jest.fn(delta => {
      const distance = offset(state), cosine = Math.cos(delta), sine = Math.sin(delta);
      move({ position: [state.target[0] + distance[0] * cosine + distance[2] * sine, state.position[1], state.target[2] - distance[0] * sine + distance[2] * cosine], target: state.target });
    }),
    focus: jest.fn(id => {
      if (!input.scene.content.components.some(value => value.id === id)) return;
      move({ position: [30, 45, 60], target: [10, 0, 20] });
    }),
    select: jest.fn(id => { input.selectedId = id; }),
    dispose: jest.fn(),
  };
  views.push({ input, controls, move });
  return controls;
}
const latest = () => views.at(-1)!;
const focusCalls = () => views.flatMap(view => (view.controls.focus as jest.Mock).mock.calls.map(([id]) => id));
async function rendererReady(id: string, after = 0) {
  await waitFor(() => { expect(views.length).toBeGreaterThan(after); expect(latest().input.scene.id).toBe(id); });
  return latest();
}
beforeEach(() => {
  views.length = 0;
  unavailable = false;
  jest.clearAllMocks();
  setAppearance('light');
  jest.mocked(createSceneRenderer).mockImplementation(fakeRenderer);
});
afterEach(() => { cleanup(); setAppearance('light'); });

test('ordinary selection and same-scene revision redraw preserve the entire off-center camera without implicit focus', async () => {
  const onSelect = jest.fn();
  const props = { scene, reference, selectedId: '', problemAssetIds: problems, onSelect };
  const view = render(<SceneViewport {...props}/>);
  const first = await rendererReady(scene.id);
  first.move(camera, false);
  view.rerender(<SceneViewport {...props} selectedId="sensor-a"/>);
  await waitFor(() => expect(first.controls.select).toHaveBeenLastCalledWith('sensor-a'));
  expect(views).toHaveLength(1);
  await waitFor(() => expect(latest().controls.snapshot()).toEqual(camera));
  expect(focusCalls()).toEqual([]);
  expect(views.every(value => !(value.controls.reset as jest.Mock).mock.calls.length)).toBe(true);
  latest().move(camera, false);
  view.rerender(<SceneViewport {...props} scene={{ ...scene, revision: 2, content: { ...scene.content, description: 'A new attributed revision.' } }} selectedId="sensor-b"/>);
  await waitFor(() => expect(latest().input.scene.revision).toBe(2));
  await waitFor(() => expect(latest().controls.snapshot()).toEqual(camera));
  expect(focusCalls()).toEqual([]);
  expect(views.filter(value => value !== latest()).every(value => (value.controls.dispose as jest.Mock).mock.calls.length === 1)).toBe(true);
});

test('camera changes reach the parent and late callbacks from a disposed or unmounted renderer are ignored', async () => {
  const onCameraChange = jest.fn(), props = { scene, reference, selectedId: '', problemAssetIds: problems, onSelect: jest.fn(), onCameraChange };
  const view = render(<SceneViewport {...props}/>), first = await rendererReady(scene.id);
  act(() => first.move(camera));
  expect(onCameraChange).toHaveBeenLastCalledWith(camera);
  const count = views.length;
  view.rerender(<SceneViewport {...props} problemAssetIds={new Set(['asset-a'])}/>);
  await rendererReady(scene.id, count);
  expect(first.controls.dispose).toHaveBeenCalledTimes(1);
  expect(latest().controls.snapshot()).toEqual(camera);
  onCameraChange.mockClear();
  act(() => first.move({ position: [999, 999, 999], target: [1, 2, 3] }));
  expect(onCameraChange).not.toHaveBeenCalled();
  const last = latest();
  view.unmount();
  onCameraChange.mockClear();
  act(() => last.move({ position: [888, 888, 888], target: [0, 0, 0] }));
  expect(onCameraChange).not.toHaveBeenCalled();
  expect(last.controls.dispose).toHaveBeenCalledTimes(1);
});

test('a reused viewport recenters a different area while preserving the latest orbit offset and zoom', async () => {
  const props = { scene, reference, selectedId: '', problemAssetIds: problems, onSelect: jest.fn(), cameraState: camera };
  const view = render(<SceneViewport {...props}/>), first = await rendererReady(scene.id);
  expect(first.controls.snapshot()).toEqual(camera);
  const moved: CameraState = { position: [-25, 40, 70], target: [5, 3, -10] };
  act(() => first.move(moved));
  const count = views.length;
  view.rerender(<SceneViewport {...props} scene={second}/>);
  await rendererReady(second.id, count);
  expect(latest().controls.snapshot().target).toEqual([0, 0, 0]);
  expect(offset(latest().controls.snapshot())).toEqual(offset(moved));
  expect(focusCalls()).toEqual([]);
  expect(views.every(value => !(value.controls.reset as jest.Mock).mock.calls.length)).toBe(true);
});

test('only an explicit focus visit or the focus control centers a selected component', async () => {
  const props = { scene, selectedId: 'sensor-a', problemAssetIds: problems, onSelect: jest.fn() };
  const view = render(<SceneViewport {...props}/>);
  await rendererReady(scene.id);
  expect(focusCalls()).toEqual([]);
  view.rerender(<SceneViewport {...props} focusRequest={{ componentId: 'sensor-a', visit: 1 }}/>);
  await waitFor(() => expect(focusCalls()).toEqual(['sensor-a']));
  view.rerender(<SceneViewport {...props} selectedId="sensor-b" focusRequest={{ componentId: 'sensor-a', visit: 1 }}/>);
  await waitFor(() => expect(latest().input.selectedId).toBe('sensor-b'));
  expect(focusCalls()).toEqual(['sensor-a']);
  view.rerender(<SceneViewport {...props} scene={{ ...scene, revision: 2 }} focusRequest={{ componentId: 'sensor-a', visit: 1 }}/>);
  await waitFor(() => expect(latest().input.scene.revision).toBe(2));
  expect(focusCalls()).toEqual(['sensor-a']);
  view.rerender(<SceneViewport {...props} focusRequest={{ componentId: 'sensor-a', visit: 2 }}/>);
  await waitFor(() => expect(focusCalls()).toEqual(['sensor-a', 'sensor-a']));
  fireEvent.click(screen.getByRole('button', { name: 'Focus selected component' }));
  expect(focusCalls()).toEqual(['sensor-a', 'sensor-a', 'sensor-a']);
});

test('reference metadata sets aspect without supplying an image until the explicit guide flag is enabled', async () => {
  const props = { scene, reference, selectedId: '', problemAssetIds: problems, onSelect: jest.fn() };
  const view = render(<SceneViewport {...props}/>);
  await rendererReady(scene.id);
  expect(latest().input).toMatchObject({ aspect: 2, referenceUrl: undefined });
  expect(view.container.querySelector('img')).toBeNull();
  const count = views.length;
  view.rerender(<SceneViewport {...props} showGuide/>);
  await rendererReady(scene.id, count);
  expect(latest().input.referenceUrl).toContain(reference.id);
  view.rerender(<SceneViewport {...props} showGuide={false}/>);
  await waitFor(() => expect(latest().input.referenceUrl).toBeUndefined());
});

test('no-WebGL fallback never requests a normal reference image and remains usable when the guide is explicitly shown', async () => {
  unavailable = true;
  const props = { scene, reference, selectedId: 'sensor-a', problemAssetIds: problems, onSelect: jest.fn() };
  const view = render(<SceneViewport {...props}/>);
  await screen.findByText(/3D rendering is unavailable/);
  expect(view.container.querySelector('img')).toBeNull();
  expect(screen.getByRole('button', { name: 'Top view' })).toBeDisabled();
  view.rerender(<SceneViewport {...props} showGuide/>);
  const image = await screen.findByRole('img', { name: /Private source schematic/ });
  expect(image.getAttribute('src')).toContain(reference.id);
  view.rerender(<SceneViewport {...props} showGuide={false}/>);
  await waitFor(() => expect(view.container.querySelector('img')).toBeNull());
});

test('geometry-only overview retains its off-center camera across filtering and appearance redraws', async () => {
  const onCameraChange = jest.fn(), props = { scenes: [scene, second], references: [reference], onScene: jest.fn(), onCameraChange };
  const view = render(<PlantOverview {...props}/>), first = await rendererReady('uncalibrated-area-overview');
  expect(first.input.tiles?.map(tile => tile.referenceUrl)).toEqual([undefined, undefined]);
  expect(first.input.tiles?.map(tile => tile.aspect)).toEqual([2, 2]);
  act(() => first.move(camera));
  expect(onCameraChange).toHaveBeenLastCalledWith(camera);
  let count = views.length;
  view.rerender(<PlantOverview {...props} scenes={[second]}/>);
  await rendererReady('uncalibrated-area-overview', count);
  expect(latest().controls.snapshot()).toEqual(camera);
  expect(latest().input.tiles?.every(tile => !tile.referenceUrl)).toBe(true);
  count = views.length;
  act(() => setAppearance('dark'));
  await rendererReady('uncalibrated-area-overview', count);
  expect(latest().controls.snapshot()).toEqual(camera);
  expect(focusCalls()).toEqual([]);
  expect(views.every(value => !(value.controls.reset as jest.Mock).mock.calls.length)).toBe(true);
});

function application() {
  const context: Context = { canManage: false, references: [], referenceDimensions: [{ id: reference.id, width: reference.width, height: reference.height }], locations: [{ id: 'area', label: 'Area', parentId: '' }], componentCatalog: [], coordinateSystem: 'Image-local normalized', globalCalibration: 'pending' };
  const gateway: Gateway = {
    context: jest.fn(async () => context), query: jest.fn(async () => ({ scenes: [scene, second], total: 2 })),
    detail: jest.fn(async id => ({ scene: id === second.id ? second : scene, assets: [], problems: { items: [], coverage: [] } })),
    search: jest.fn(async () => ({ results: [], total: 0, limit: 200, problems: { items: [], coverage: [] } })),
    save: jest.fn(), history: jest.fn(async () => ({ revisions: [], nextBefore: 0 })), bootstrap: jest.fn(),
    classification: jest.fn(), locate: jest.fn(), modelPreview: jest.fn(async () => ({ models: [] })), applyModel: jest.fn(),
  };
  return { gateway, app: new LocatorApplication(gateway, () => 'synthetic-component') };
}
test('actual workspace carries top/zoom and latest orbit offset across overview and area contexts without restoring an older area pose', async () => {
  const fixture = application();
  render(<IdentityRoot><LocatorWorkspace application={fixture.app} readOnly/></IdentityRoot>);
  let overview = await rendererReady('uncalibrated-area-overview');
  fireEvent.click(screen.getByRole('button', { name: 'Top view' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  const top = overview.controls.snapshot(), count = views.length;
  act(() => overview.input.onSelect(scene.id));
  let area = await rendererReady(scene.id, count);
  expect(area.controls.snapshot().target).toEqual([0, 0, 0]);
  expect(offset(area.controls.snapshot())).toEqual(offset(top));
  expect(focusCalls()).toEqual([]);
  act(() => area.move(camera));
  fireEvent.click(screen.getByRole('button', { name: 'Sensor B — sensor' }));
  await waitFor(() => expect(latest().input.selectedId).toBe('sensor-b'));
  await waitFor(() => expect(latest().controls.snapshot()).toEqual(camera));
  expect(focusCalls()).toEqual([]);
  const beforeHome = views.length;
  fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
  overview = await rendererReady('uncalibrated-area-overview', beforeHome);
  expect(overview.controls.snapshot().target).toEqual([0, 0, 0]);
  expect(offset(overview.controls.snapshot())).toEqual(offset(camera));
  fireEvent.click(screen.getByRole('button', { name: 'Top view' }));
  const newTop = overview.controls.snapshot(), beforeArea = views.length;
  act(() => overview.input.onSelect(second.id));
  area = await rendererReady(second.id, beforeArea);
  expect(offset(area.controls.snapshot())).toEqual(offset(newTop));
  expect(area.controls.snapshot().target).toEqual([0, 0, 0]);
  expect(focusCalls()).toEqual([]);
  expect(fixture.gateway.save).not.toHaveBeenCalled();
  expect(fixture.gateway.search).not.toHaveBeenCalled();
});
