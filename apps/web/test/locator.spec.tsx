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
beforeEach(() => { jest.clearAllMocks(); (createSceneRenderer as jest.Mock).mockImplementation(() => { throw new Error('No WebGL'); }); });
function harness(canManage = true) { const gateway: Gateway = { context: jest.fn(async () => ({ ...context, canManage, references: canManage ? context.references : [] })), query: jest.fn(async () => ({ scenes: [scene], total: 1 })), detail: jest.fn(async () => ({ scene, assets: [{ id: 'asset-a', code: 'A', name: 'Sensor A', locationId: 'area', status: 'unverified' }], problems: { items: [{ assetId: 'asset-a', kind: 'handover' as const, id: 'report-a', title: 'Reported blockage', status: 'open', recordedAt: '2026-10-14T10:00:00Z' }], coverage: [{ kind: 'handover' as const, status: 'available' as const }, { kind: 'maintenance' as const, status: 'not-authorized' as const }] } })), save: jest.fn(async (input) => ({ ...scene, revision: 2, content: input.content })), history: jest.fn(async () => ({ revisions: [], nextBefore: 0 })), search: jest.fn(async () => ({ results: [{ asset: { id: 'asset-a', code: 'A', name: 'Sensor A', locationId: 'area', status: 'unverified' }, placements: [{ sceneId: 'scene-a', sceneName: 'Test area', componentId: 'sensor-a', label: 'Source sensor A', verification: 'provisional' as const }] }], problems: { items: [], coverage: [] }, total: 1, limit: 200 })), classification: jest.fn(async assetId => ({assetId,coverage:'unmapped' as const,totalSources:0,sources:[],suggestedKind:'' as const,matchedMessages:0})), bootstrap: jest.fn(async () => ({ created: 0, referenceCount: 0 })), locate: jest.fn(async () => ({ results: [{ asset: { id: 'asset-a', code: 'A', name: 'Sensor A', locationId: 'area', status: 'unverified' }, placements: [{ sceneId: 'scene-a', sceneName: 'Test area', componentId: 'sensor-a', label: 'Source sensor A', verification: 'provisional' as const }] }], problems: { items: [], coverage: [] }, total: 1, limit: 1 })), modelPreview: jest.fn(async () => ({ models: [] })), applyModel: jest.fn(async ({ id, expectedRevision }) => ({ sceneId: id, revision: expectedRevision + 1, status: 'applied' as const })) }; return { gateway, application: new LocatorApplication(gateway, () => 'new-component') }; }
test('no-WebGL fallback retains selection, explicit source evidence, editing and revision save', async () => { const { application, gateway } = harness(), onProblem = jest.fn(); render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a" onProblem={onProblem}/></IdentityRoot>); await screen.findByText(/3D rendering is unavailable/); fireEvent.click(await screen.findByRole('button', {name:'Edit model'})); fireEvent.click(screen.getByRole('button', { name: 'Source sensor A — sensor' })); await screen.findByRole('button', { name: 'Reported blockage' }); fireEvent.click(screen.getByRole('button', { name: 'Reported blockage' })); expect(onProblem).toHaveBeenCalledWith('handover', 'report-a'); fireEvent.click(screen.getByRole('button', { name: 'Move right' })); fireEvent.change(screen.getByLabelText('Revision note'), { target: { value: 'Adjusted provisional image-local position' } }); fireEvent.click(screen.getByRole('button', { name: 'Save scene revision' })); await waitFor(() => expect(gateway.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'scene-a', expectedRevision: 1, note: 'Adjusted provisional image-local position', content: expect.objectContaining({ components: [expect.objectContaining({ x: expect.any(Number), verification: 'provisional' as const, elevation: null })] }) }))); expect((gateway.save as jest.Mock).mock.calls[0][0].content.components[0].x).toBeCloseTo(.41, 6); });
test('asset search shows placement navigation and finite result context', async () => { const { application, gateway } = harness(); render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application}/></IdentityRoot>); await screen.findByRole('button', { name: 'Asset search' }); fireEvent.click(screen.getByRole('button', { name: 'Asset search' })); fireEvent.change(screen.getByLabelText('Registered asset code or name'), { target: { value: 'A' } }); await screen.findByRole('button', { name: 'Test area / Source sensor A — provisional' }); fireEvent.click(screen.getByLabelText('Unplaced assets only')); await waitFor(() => expect(gateway.search).toHaveBeenCalledWith({ search: 'A', unplacedOnly: true })); expect(screen.getByText(/Up to 200 matches/)).toBeInTheDocument(); });
test('duplication separates physical links and movement cannot claim surveyed placement', () => { const surveyed = { ...component, verification: 'surveyed' as const, elevation: .2, note: 'Survey evidence' }; expect(duplicateComponent(surveyed, 'copy')).toMatchObject({ id: 'copy', assetId: '', verification: 'provisional' as const, note: '' }); expect(moveComponent(surveyed, -2, 2)).toMatchObject({ x: 0, y: 1, verification: 'provisional' as const }); });

test('reader exact asset navigation selects its reported problem without exposing mutation controls', async () => {
  const { application, gateway } = harness(), create = jest.fn();
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialAssetId="asset-a" readOnly onCreateAsset={create}/></IdentityRoot>);
  await screen.findByText('Reported blockage');
  expect(gateway.locate).toHaveBeenCalledWith('asset-a');
  expect(screen.getByRole('button', {name: 'Source sensor A — sensor'})).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByLabelText('Registered asset search')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Label')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Revision note')).not.toBeInTheDocument();
  for (const name of ['Move right', 'Add reusable component at center', 'Save scene revision', 'Register a new asset'])
    expect(screen.queryByRole('button', {name})).not.toBeInTheDocument();
  expect(gateway.search).not.toHaveBeenCalled(); expect(gateway.save).not.toHaveBeenCalled();
});
test('administrator can register a new identifier from a selected scene without inferring its link', async () => {
  const { application, gateway } = harness(), create = jest.fn();
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a" onCreateAsset={create}/></IdentityRoot>);
  fireEvent.click(await screen.findByRole('button', {name:'Edit model'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Register a new asset'}));
  expect(create).toHaveBeenCalledTimes(1); expect(gateway.save).not.toHaveBeenCalled();
});
test('unplaced exact identity remains explicitly pending and never opens a guessed component', async () => {
  const { application, gateway } = harness();
  (gateway.locate as jest.Mock).mockResolvedValue({results: [{asset:{id:'unplaced',code:'NEW',name:'New sensor'},placements:[]}],problems:{items:[],coverage:[]},total:1,limit:1});
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialAssetId="unplaced" readOnly/></IdentityRoot>);
  await screen.findByText('Placement pending'); expect(gateway.detail).not.toHaveBeenCalled();
});
test('administrator reviews imported message provenance and explicitly changes only the selected draft type', async () => {
  const {application, gateway} = harness();
  (gateway.classification as jest.Mock).mockResolvedValue({assetId:'asset-a',coverage:'limited',totalSources:1,suggestedKind:'photoelectric-sensor',matchedMessages:1,sources:[{sourceId:'source',area:'Original area',code:'Original code',origin:'exact-alias',mappingId:'',mappingRevision:0,total:400,evidence:[{importId:'source-import',sourceRecordNumber:42,reportingDate:'2026-10-14',message:'Lichtschranke zu lange belegt'}]}]});
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a"/></IdentityRoot>);
  fireEvent.click(await screen.findByRole('button',{name:'Edit model'}));
  fireEvent.click(await screen.findByRole('button',{name:'Source sensor A — sensor'}));
  fireEvent.click(screen.getByRole('button',{name:'Check imported alarm evidence'}));
  await screen.findByText('Lichtschranke zu lange belegt');
  expect(screen.getByText(/Evidence is a bounded sample/)).toBeInTheDocument();
  expect(screen.getByText(/source-import/)).toHaveTextContent('Source record 42');
  expect(screen.getByLabelText('Reusable component')).toHaveValue('sensor');
  fireEvent.click(screen.getByRole('button',{name:'Apply suggestion to draft'}));
  expect(screen.getByLabelText('Reusable component')).toHaveValue('photoelectric-sensor');
  expect(screen.getByLabelText('Registered asset link')).toHaveValue('asset-a');
  expect(gateway.save).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Revision note')).toHaveValue('Reviewed provisional component classification against exact imported source-message evidence.');
});
test('prepared models are reviewed first and only ready revisions are submitted', async () => {
  const {application,gateway} = harness();
  const ready={referenceId:'a'.repeat(64),referenceName:'Source ready',sceneId:'ready',expectedRevision:4,status:'ready',componentCount:3,motors:1,photoelectricSensors:1,conveyors:1};
  (gateway.modelPreview as jest.Mock).mockResolvedValue({models:[ready,{...ready,referenceId:'b'.repeat(64),referenceName:'Operator adjusted',sceneId:'manual',status:'manual-edits-preserved'}]});
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application}/></IdentityRoot>);
  fireEvent.click(await screen.findByRole('button',{name:'Review prepared models'}));
  await screen.findByText('Manual edits preserved');
  expect(gateway.applyModel).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Apply ready models (1)'}));
  await waitFor(()=>expect(gateway.applyModel).toHaveBeenCalledTimes(1));
  expect(gateway.applyModel).toHaveBeenCalledWith({id:'ready',expectedRevision:4});
  await screen.findByText(/Prepared scenes: 1 \/ 1/);
});

test('guide images are absent from normal cards, fallback and details; administrator authoring explicitly controls visibility', async () => {
  const {application,gateway} = harness();
  const reference={id:'a'.repeat(64),sha256:'a'.repeat(64),name:'Private drawing',group:'Fixture group',sourcePath:'Private/drawing.png',width:1600,height:900,bytes:100,kind:'schematic' as const,importedAt:'2026-10-14T12:00:00Z'};
  const sourced={...scene,content:{...scene.content,referenceId:reference.id}};
  (gateway.context as jest.Mock).mockResolvedValue({...context,references:[reference],referenceDimensions:[{id:reference.id,width:reference.width,height:reference.height}]});
  (gateway.query as jest.Mock).mockResolvedValue({scenes:[sourced],total:1});
  const original=await gateway.detail(scene.id);
  (gateway.detail as jest.Mock).mockResolvedValue({...original,scene:sourced});
  const view=render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application}/></IdentityRoot>);
  fireEvent.click(await screen.findByRole('button',{name:/Test area Fixture group/}));
  await screen.findByText(/3D rendering is unavailable/);
  expect(view.container.querySelectorAll('img')).toHaveLength(0);
  expect(screen.queryByLabelText('Registered asset search')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Edit model'}));
  expect(view.container.querySelectorAll('img').length).toBeGreaterThan(0);
  expect(screen.getByLabelText('Show guide image')).toBeChecked();
  fireEvent.click(screen.getByLabelText('Show guide image'));
  expect(view.container.querySelectorAll('img')).toHaveLength(0);
  fireEvent.click(screen.getByLabelText('Show guide image'));
  fireEvent.click(screen.getByRole('button',{name:'Finish editing'}));
  expect(view.container.querySelectorAll('img')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button',{name:'Edit model'}));
  view.rerender(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} readOnly/></IdentityRoot>);
  expect(view.container.querySelectorAll('img')).toHaveLength(0);
  expect(screen.queryByRole('button',{name:'Finish editing'})).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Show guide image')).not.toBeInTheDocument();
  expect(gateway.save).not.toHaveBeenCalled();
});

test('read-only users inspect an area without configuration or disabled editor fields', async () => {
  const { application, gateway } = harness(false);
  render(<IdentityRoot><LocatorWorkspace profile="administrator" application={application} initialSceneId="scene-a"/></IdentityRoot>);
  await screen.findByText(/3D rendering is unavailable/);
  expect(screen.queryByRole('button', { name: 'Edit model' })).toBeNull();
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
  fireEvent.click(screen.getByRole('button', { name: 'Edit model' }));
  await screen.findByAltText('Private source schematic — historical reference only');
  fireEvent.click(screen.getByRole('button', { name: 'Finish editing' }));
  await waitFor(() => expect(document.querySelector('img')).toBeNull());
});

test.each(['team-leader', 'task-force'])('%s cannot expose reference images even with stale browser management context', async profile => {
  const { application } = harness(true);
  render(<IdentityRoot><LocatorWorkspace profile={profile} application={application} initialSceneId="scene-a"/></IdentityRoot>);
  await screen.findByText(/3D rendering is unavailable/);
  expect(screen.queryByRole('button', { name: 'Edit model' })).toBeNull();
  expect(document.querySelector('img')).toBeNull();
});

test('viewer keeps the reference aspect ratio without passing an image URL to the renderer', async () => {
  const controls = { snapshot: jest.fn(() => ({ position: [1, 2, 3], target: [0, 0, 0] })), reset: jest.fn(), top: jest.fn(), zoom: jest.fn(), rotate: jest.fn(), focus: jest.fn(), select: jest.fn(), dispose: jest.fn() };
  (createSceneRenderer as jest.Mock).mockReturnValue(controls);
  const props = { scene, reference, selectedId: '', problemAssetIds: new Set<string>(), onSelect: jest.fn() };
  const view = render(<IdentityRoot><SceneViewport {...props}/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(1));
  expect((createSceneRenderer as jest.Mock).mock.calls[0][1]).toMatchObject({ aspect: 2, referenceUrl: undefined });
  view.rerender(<IdentityRoot><SceneViewport {...props} showGuide/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(2));
  expect((createSceneRenderer as jest.Mock).mock.calls[1][1].referenceUrl).toContain('/references/private-reference');
  view.rerender(<IdentityRoot><SceneViewport {...props}/></IdentityRoot>);
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalledTimes(3));
  expect((createSceneRenderer as jest.Mock).mock.calls[2][1].referenceUrl).toBeUndefined();
  expect(controls.dispose).toHaveBeenCalledTimes(2);
});


test('reader overview uses geometry-only tiles without private catalog, image previews or editor searches', async () => {
  const { application, gateway } = harness();
  render(<IdentityRoot><LocatorWorkspace profile="team-leader" application={application}/></IdentityRoot>);
  await screen.findByRole('button', { name: /Test area.*Fixture group/ });
  await waitFor(() => expect(createSceneRenderer).toHaveBeenCalled());
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
  for (const [, input] of (createSceneRenderer as jest.Mock).mock.calls) {
    expect(input.referenceUrl).toBeUndefined();
    expect(input.tiles?.every((tile: { referenceUrl?: string }) => !tile.referenceUrl)).toBe(true);
    expect(input.tiles?.[0].aspect).toBe(2);
  }
  expect(document.querySelector('img')).toBeNull();
  expect(gateway.search).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Create scene' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Synchronize imported reference scenes' })).toBeNull();
  expect(screen.queryByText(/Private source catalog/)).toBeNull();
});
