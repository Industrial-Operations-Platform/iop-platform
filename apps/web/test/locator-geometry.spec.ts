import { componentColor, componentGeometry, thumbnailMatrix } from '../src/features/asset-locator/adapters/three/renderer';
import { darkIdentity, identity } from '../src/design/identity';
import type { Component } from '../src/features/asset-locator/domain/models';
import * as THREE from 'three';
jest.mock('three/addons/controls/OrbitControls.js', () => ({ OrbitControls: class {
  } }));
const base: Component = { id: 'part', kind: 'conveyor', label: 'Schematic conveyor', x: .75, y: .25, elevation: null, rotation: 90, width: .2, depth: .03, height: .02, assetId: '', verification: 'provisional', note: '' };
test('true 3D geometry uses image-local orientation and unknown schematic elevation', () => { const object = componentGeometry(base, identity, false, false, 60); expect(object.position.x).toBe(25); expect(object.position.z).toBe(-15); expect(object.rotation.y).toBe(-Math.PI / 2); const box = new THREE.Box3().setFromObject(object); expect(box.max.y - box.min.y).toBeGreaterThan(0); expect(box.max.x - box.min.x).toBeGreaterThan(0); expect(box.max.z - box.min.z).toBeGreaterThan(0); object.traverse(child => expect(child.userData.componentId).toBe('part')); });
test('every reusable primitive renders solid depth without any live-state inference', () => { for (const kind of ['conveyor', 'curve', 'junction', 'lift', 'motor', 'photoelectric-sensor', 'sensor', 'scanner', 'scale', 'cabinet'] as const) {
  const object = componentGeometry({ ...base, kind }, identity, false, false);
  const bounds = new THREE.Box3().setFromObject(object);
  expect(bounds.isEmpty()).toBe(false);
  expect(bounds.max.y - bounds.min.y).toBeGreaterThan(0);
  const mesh = object.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh;
  expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(new THREE.Color(kind === 'photoelectric-sensor' ? identity.chartTeal : kind === 'sensor' || kind === 'scanner' ? identity.primary : identity.chartDuration).getHexString());
} });

test('motor and photoelectric templates have separate solid geometry and selectable identities', () => {
  const motor = componentGeometry({...base, kind:'motor', id:'motor'}, identity, false, false);
  const sensor = componentGeometry({...base, kind:'photoelectric-sensor', id:'photoeye'}, identity, false, false);
  expect(motor.children.length).toBeGreaterThan(5); expect(sensor.children.length).toBeGreaterThan(3);
  motor.traverse(child => expect(child.userData.componentId).toBe('motor'));
  sensor.traverse(child => expect(child.userData.componentId).toBe('photoeye'));
  expect(motor.children.map(child=>child.type)).not.toEqual(sensor.children.map(child=>child.type));
});

test('a vertical thumbnail conveyor keeps its source-image endpoints when tile and reference aspects differ', () => {
  const part = {...base, width:.3, depth:.02}, tileWidth=8.18, tileDepth=7.79, aspect=1759/937;
  const matrix=thumbnailMatrix(part,tileWidth,tileDepth,aspect);
  const first=new THREE.Vector3(-.5,0,0).applyMatrix4(matrix),last=new THREE.Vector3(.5,0,0).applyMatrix4(matrix);
  expect(first.x).toBeCloseTo((part.x-.5)*tileWidth,12);
  expect(last.x).toBeCloseTo(first.x,12);
  expect(last.z-first.z).toBeCloseTo(part.width*aspect*tileDepth,12);
  expect((first.z+last.z)/2).toBeCloseTo((part.y-.5)*tileDepth,12);
});

test('diagonal thumbnail corners follow rotated source geometry before anisotropic tile scaling', () => {
  const part={...base, rotation:45, elevation:.2},tileWidth=9,tileDepth=7,aspect=1.88;
  const matrix=thumbnailMatrix(part,tileWidth,tileDepth,aspect),angle=Math.PI/4,sourceDepth=100/aspect;
  for(const point of [new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5),new THREE.Vector3(.5,-.5,-.5)]) {
    const result=point.clone().applyMatrix4(matrix);
    const x=point.x*part.width*100,z=point.z*part.depth*sourceDepth;
    const expectedX=((part.x-.5)*100+Math.cos(angle)*x-Math.sin(angle)*z)*tileWidth/100;
    const expectedZ=((part.y-.5)*sourceDepth+Math.sin(angle)*x+Math.cos(angle)*z)*tileDepth/sourceDepth;
    const expectedY=(part.elevation*30+part.height*15+1+point.y*part.height*30)*Math.min(tileWidth/100,tileDepth/sourceDepth);
    expect(result.x).toBeCloseTo(expectedX,12);expect(result.z).toBeCloseTo(expectedZ,12);expect(result.y).toBeCloseTo(expectedY,12);
  }
});

test.each([['light',identity],['dark',darkIdentity]] as const)('photoelectric identity uses the shared teal accent in %s with independent evidence and selection overrides', (_name,palette) => {
  expect(componentColor('photoelectric-sensor',palette)).toBe(palette.chartTeal);
  expect(componentColor('sensor',palette)).toBe(palette.primary);
  expect(componentColor('scanner',palette)).toBe(palette.primary);
  expect(componentColor('motor',palette)).toBe(palette.chartDuration);
  expect(palette.chartTeal).not.toBe(palette.primary);
  expect(palette.chartTeal).not.toBe(palette.errorInk);
  expect(palette.chartTeal).not.toBe(palette.focus);
  for(const [attention,selected,expected] of [[false,false,palette.chartTeal],[true,false,palette.errorInk],[false,true,palette.focus],[true,true,palette.focus]] as const) {
    const object=componentGeometry({...base,kind:'photoelectric-sensor'},palette,attention,selected);
    const body=object.children.find(child=>child instanceof THREE.Mesh) as THREE.Mesh;
    expect((body.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(new THREE.Color(expected).getHexString());
  }
});

test.each([{width:.4,depth:.001},{width:.001,depth:.2}])('narrow conveyor rails and supports stay proportional inside the belt footprint (%o)', dimensions => {
  const component={...base,...dimensions,x:.5,y:.5,rotation:0},depthScale=60;
  const object=componentGeometry(component,identity,false,false,depthScale),w=component.width*100,d=component.depth*depthScale;
  object.updateMatrixWorld(true);
  const solids=object.children.filter(child=>child instanceof THREE.Mesh) as THREE.Mesh[];
  expect(solids).toHaveLength(7);
  for(const mesh of solids) {
    const bounds=new THREE.Box3().setFromObject(mesh);
    expect(bounds.min.x).toBeGreaterThanOrEqual(-w/2-1e-8);expect(bounds.max.x).toBeLessThanOrEqual(w/2+1e-8);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-d/2-1e-8);expect(bounds.max.z).toBeLessThanOrEqual(d/2+1e-8);
  }
  for(const rail of solids.slice(1,3))
    expect((rail.geometry as THREE.BoxGeometry).parameters.depth).toBeCloseTo(Math.min(w,d)*.06,12);
  for(const support of solids.slice(3)) {
    expect((support.geometry as THREE.BoxGeometry).parameters.width).toBeLessThanOrEqual(Math.min(w,d)*.12);
    expect((support.geometry as THREE.BoxGeometry).parameters.depth).toBeLessThanOrEqual(Math.min(w,d)*.12);
  }
});
