import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocatorWorkspace } from '../src/features/asset-locator/adapters/react/LocatorWorkspace';
import { LocatorApplication, type Gateway } from '../src/features/asset-locator/application/locator';
import { duplicateComponent, moveComponent, type Component, type Content, type Context, type Scene, type Reference } from '../src/features/asset-locator/domain/models';
import { SceneViewport } from '../src/features/asset-locator/adapters/react/SceneViewport';
import { createSceneRenderer } from '../src/features/asset-locator/adapters/three/renderer';
import { IdentityRoot } from '../src/design/components';
jest.mock('../src/features/asset-locator/adapters/three/renderer', () => ({ createSceneRenderer: jest.fn(() => { throw new Error('No WebGL'); }) }));
const component: Component = { id: 'sensor-a', kind: 'sensor', label: 'Source sensor A', x: .4, y: .5, elevation: null, rotation: 0, width: .02, depth: .02, height: .04, assetId: 'asset-a', verification: 'provisional' as const, note: 'Source reference only.' };
const reference: Reference = { id: 'private-reference', name: 'Private drawing', group: 'Fixture group', sourcePath: 'private/drawing.png', sha256: 'a'.repeat(64), width: 1600, height: 800, bytes: 24, importedAt: '2026-10-20T12:00:00Z', kind: 'schematic' };
const content: Content = { name: 'Test area', group: 'Fixture group', locationId: 'area', referenceId: reference.id, description: 'Synthetic test fixture', calibration: 'pending', surveyNote: '', components: [component] };
const scene: Scene = { id: 'scene-a', revision: 1, authorId: 'actor', createdAt: '2026-10-14T12:00:00Z', updatedAt: '2026-10-14T12:00:00Z', content };
const context: Context = { canManage: true, references: [reference], referenceDimensions: [{ id: reference.id, width: reference.width, height: reference.height }], locations: [{ id: 'area', label: 'Test area', parentId: '' }], componentCatalog: [{ kind: 'conveyor', width: .2, depth: .04, height: .025 }, { kind: 'sensor', width: .02, depth: .02, height: .04 }], coordinateSystem: 'Image-local normalized', globalCalibration: 'pending' };
beforeEach(() => { (createSceneRenderer as jest.Mock).mockImplementation(() => { throw new Error('No WebGL'); }); });
function harness(canManage = true) { const gateway: Gateway = { context: jest.fn(async () => ({ ...context, canManage, references: canManage ? context.references : [] })), query: jest.fn(async () => ({ scenes: [scene], total: 1 })), detail: jest.fn(async () => ({ scene, assets: [{ id: 'asset-a', code: 'A', name: 'Sensor A', locationId: 'area', status: 'unverified' }], problems: { items: [{ assetId: 'asset-a', kind: 'handover' as const, id: 'report-a', title: 'Reported blockage', status: 'open', recordedAt: '2026-10-14T10:00:00Z' }], coverage: [{ kind: 'handover' as const, status: 'available' as const }, { kind: 'maintenance' as const, status: 'not-authorized' as const }] } })), save: jest.fn(async (input) => ({ ...scene, revision: 2, content: input.content })), history: jest.fn(async () => ({ revisions: [], nextBefore: 0 })), search: jest.fn(async () => ({ results: [{ asset: { id: 'asset-a', code: 'A', name: 'Sensor A', locationId: 'area', status: 'unverified' }, placements: [{ sceneId: 'scene-a', sceneName: 'Test area', componentId: 'sensor-a', label: 'Source sensor A', verification: 'provisional' as const }] }], problems: { items: [], coverage: [] }, total: 1, limit: 200 })), bootstrap: jest.fn(async () => ({ created: 0, referenceCount: 0 })) }; return { gateway, application: new LocatorApplication(gateway, () => 'new-component') }; }
test('no-WebGL fallback retains selection, explicit source evidence, editing and revision save', async () => { const { application, gateway } = harness(), onProblem = jest.fn(); render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a" onProblem={onProblem}/></IdentityRoot>); await screen.findByText(/3D rendering is unavailable/); expect(document.querySelector('img')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Source sensor A — sensor' })); await screen.findByRole('button', { name: 'Reported blockage' }); fireEvent.click(screen.getByRole('button', { name: 'Reported blockage' })); expect(onProblem).toHaveBeenCalledWith('handover', 'report-a'); fireEvent.click(screen.getByRole('button', { name: 'Configure scenes' })); await screen.findByRole('button', { name: 'Move right' }); fireEvent.click(screen.getByRole('button', { name: 'Move right' })); fireEvent.change(screen.getByLabelText('Revision note'), { target: { value: 'Adjusted provisional image-local position' } }); fireEvent.click(screen.getByRole('button', { name: 'Save scene revision' })); await waitFor(() => expect(gateway.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'scene-a', expectedRevision: 1, note: 'Adjusted provisional image-local position', content: expect.objectContaining({ components: [expect.objectContaining({ x: expect.any(Number), verification: 'provisional' as const, elevation: null })] }) }))); expect((gateway.save as jest.Mock).mock.calls[0][0].content.components[0].x).toBeCloseTo(.41, 6); });
test('asset search shows placement navigation and finite result context', async () => { const { application, gateway } = harness(); render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application}/></IdentityRoot>); await screen.findByRole('button', { name: 'Asset search' }); fireEvent.click(screen.getByRole('button', { name: 'Asset search' })); fireEvent.change(screen.getByLabelText('Registered asset code or name'), { target: { value: 'A' } }); await screen.findByRole('button', { name: 'Test area / Source sensor A — provisional' }); fireEvent.click(screen.getByLabelText('Unplaced assets only')); await waitFor(() => expect(gateway.search).toHaveBeenCalledWith({ search: 'A', unplacedOnly: true })); expect(screen.getByText(/Up to 200 matches/)).toBeInTheDocument(); });
test('duplication separates physical links and movement cannot claim surveyed placement', () => { const surveyed = { ...component, verification: 'surveyed' as const, elevation: .2, note: 'Survey evidence' }; expect(duplicateComponent(surveyed, 'copy')).toMatchObject({ id: 'copy', assetId: '', verification: 'provisional' as const, note: '' }); expect(moveComponent(surveyed, -2, 2)).toMatchObject({ x: 0, y: 1, verification: 'provisional' as const }); });

test('operational overview loads no WebGL, private image previews or editor searches', async () => {
  const { application, gateway } = harness();
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application}/></IdentityRoot>);
  await screen.findByRole('button', { name: /Test area.*Fixture group/ });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
  expect(createSceneRenderer).not.toHaveBeenCalled();
  expect(document.querySelector('img')).toBeNull();
  expect(gateway.search).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Create scene' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Synchronize imported reference scenes' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Configure scenes' }));
  expect(screen.getByRole('button', { name: 'Create scene' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Synchronize imported reference scenes' })).toBeInTheDocument();
});

test('read-only users inspect an area without configuration or disabled editor fields', async () => {
  const { application, gateway } = harness(false);
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a"/></IdentityRoot>);
  await screen.findByText(/3D rendering is unavailable/);
  expect(screen.queryByRole('button', { name: 'Configure scenes' })).toBeNull();
  expect(screen.queryByLabelText('Registered asset search')).toBeNull();
  expect(screen.queryByLabelText('Revision note')).toBeNull();
  expect(screen.queryByText('Scene details and private reference')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Source sensor A — sensor' }));
  expect(screen.getByRole('button', { name: 'Source sensor A — sensor' })).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelector('img')).toBeNull();
  expect(gateway.save).not.toHaveBeenCalled();
  expect(gateway.search).not.toHaveBeenCalled();
});

test('component selection reuses the renderer and context loss switches to the accessible fallback', async () => {
  const controls = { snapshot: jest.fn(() => ({ position: [1, 2, 3], target: [0, 0, 0] })), reset: jest.fn(), top: jest.fn(), zoom: jest.fn(), rotate: jest.fn(), focus: jest.fn(), select: jest.fn(), dispose: jest.fn() };
  (createSceneRenderer as jest.Mock).mockReturnValue(controls);
  const problems = new Set<string>();
  const props = { scene, problemAssetIds: problems, onSelect: jest.fn() };
  const view = render(<IdentityRoot><SceneViewport {...props} selectedId=""/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(1));
  view.rerender(<IdentityRoot><SceneViewport {...props} selectedId="sensor-a"/></IdentityRoot>);
  expect(createSceneRenderer).toHaveBeenCalledTimes(1);
  expect(controls.select).toHaveBeenLastCalledWith('sensor-a');
  const input = (createSceneRenderer as jest.Mock).mock.calls[0][1];
  act(() => input.onContextLost());
  expect(screen.getByText(/3D rendering is unavailable/)).toBeInTheDocument();
  expect(controls.dispose).toHaveBeenCalledTimes(1);
  view.unmount();
});


test('private fallback previews appear only during Administrator editing and disappear on exit', async () => {
  const { application } = harness();
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a"/></IdentityRoot>);
  await screen.findByText(/3D rendering is unavailable/);
  expect(document.querySelector('img')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Configure scenes' }));
  await screen.findByAltText('Private source schematic — historical reference only');
  fireEvent.click(screen.getByRole('button', { name: 'Exit configuration' }));
  await waitFor(() => expect(document.querySelector('img')).toBeNull());
});

test.each(['team-leader', 'task-force'])('%s cannot expose reference images even with stale browser management context', async profile => {
  const { application } = harness(true);
  render(<IdentityRoot><LocatorWorkspace profile={profile} application={application} initialSceneId="scene-a"/></IdentityRoot>);
  await screen.findByText(/3D rendering is unavailable/);
  expect(screen.queryByRole('button', { name: 'Configure scenes' })).toBeNull();
  expect(document.querySelector('img')).toBeNull();
});

test('viewer keeps the reference aspect ratio without passing an image URL to the renderer', async () => {
  const controls = { snapshot: jest.fn(() => ({ position: [1, 2, 3], target: [0, 0, 0] })), reset: jest.fn(), top: jest.fn(), zoom: jest.fn(), rotate: jest.fn(), focus: jest.fn(), select: jest.fn(), dispose: jest.fn() };
  (createSceneRenderer as jest.Mock).mockReturnValue(controls);
  const props = { scene, reference, selectedId: '', problemAssetIds: new Set<string>(), onSelect: jest.fn() };
  const view = render(<IdentityRoot><SceneViewport {...props}/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(1));
  expect((createSceneRenderer as jest.Mock).mock.calls[0][1]).toMatchObject({ aspect: 2, referenceUrl: undefined });
  view.rerender(<IdentityRoot><SceneViewport {...props} showReference/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(2));
  expect((createSceneRenderer as jest.Mock).mock.calls[1][1].referenceUrl).toContain('/references/private-reference');
  view.rerender(<IdentityRoot><SceneViewport {...props}/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(3));
  expect((createSceneRenderer as jest.Mock).mock.calls[2][1].referenceUrl).toBeUndefined();
  expect(controls.dispose).toHaveBeenCalledTimes(2);
});
