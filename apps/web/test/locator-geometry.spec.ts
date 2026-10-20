import { boundReferenceTexture, componentGeometry } from '../src/features/asset-locator/adapters/three/renderer';
import { identity } from '../src/design/identity';
import type { Component } from '../src/features/asset-locator/domain/models';
import * as THREE from 'three';
jest.mock('three/addons/controls/OrbitControls.js', () => ({ OrbitControls: class {
  } }));
const base: Component = { id: 'part', kind: 'conveyor', label: 'Schematic conveyor', x: .75, y: .25, elevation: null, rotation: 90, width: .2, depth: .03, height: .02, assetId: '', verification: 'provisional', note: '' };
test('true 3D geometry uses image-local orientation and unknown schematic elevation', () => { const object = componentGeometry(base, identity, false, false, 60); expect(object.position.x).toBe(25); expect(object.position.z).toBe(-15); expect(object.rotation.y).toBe(-Math.PI / 2); const box = new THREE.Box3().setFromObject(object); expect(box.max.y - box.min.y).toBeGreaterThan(0); expect(box.max.x - box.min.x).toBeGreaterThan(0); expect(box.max.z - box.min.z).toBeGreaterThan(0); object.traverse(child => expect(child.userData.componentId).toBe('part')); });
test('every reusable primitive renders solid depth without any live-state inference', () => { for (const kind of ['conveyor', 'curve', 'junction', 'lift', 'sensor', 'scanner', 'scale', 'cabinet'] as const) {
  const object = componentGeometry({ ...base, kind }, identity, false, false);
  const bounds = new THREE.Box3().setFromObject(object);
  expect(bounds.isEmpty()).toBe(false);
  expect(bounds.max.y - bounds.min.y).toBeGreaterThan(0);
  const mesh = object.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh;
  expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(new THREE.Color(kind === 'sensor' || kind === 'scanner' ? identity.primary : identity.chartDuration).getHexString());
} });

test('large schematic references have a bounded GPU texture without mipmap copies', () => {
  const drawImage = jest.fn();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const image = document.createElement('img');
  image.width = 8192;
  image.height = 4096;
  const texture = new THREE.Texture(image);
  boundReferenceTexture(texture, 2048);
  expect(texture.image.width).toBe(2048);
  expect(texture.image.height).toBe(1024);
  expect(texture.generateMipmaps).toBe(false);
  expect(texture.minFilter).toBe(THREE.LinearFilter);
  expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 2048, 1024);
  jest.restoreAllMocks();
});
