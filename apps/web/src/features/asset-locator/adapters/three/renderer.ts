import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Component, Scene } from '../../domain/models';
import type { Identity } from '../../../../design/identity';
export interface CameraState {
  position: number[];
  target: number[];
}
export interface HoverTarget {
  id: string;
  x: number;
  y: number;
}
export interface CameraControls {
  snapshot(): CameraState;
  reset(): void;
  top(): void;
  zoom(factor: number): void;
  rotate(delta: number): void;
  focus(id: string): void;
  select(id: string): void;
  dispose(): void;
}
const SCALE = 100;
/** Component identity accents are independent of reported evidence and selection. */
export function componentColor(kind: Component['kind'], palette: Identity, attention = false, selected = false): string {
  return selected ? palette.focus : attention ? palette.errorInk : kind === 'photoelectric-sensor' ? palette.chartTeal : kind === 'sensor' || kind === 'scanner' ? palette.primary : palette.chartDuration;
}
/** Rotate in source coordinates before stretching the complete shape into its tile. */
export function thumbnailMatrix(component: Component, tileWidth: number, tileDepth: number, sourceAspect: number): THREE.Matrix4 {
  const sourceDepth = SCALE / Math.max(0.5, sourceAspect);
  const heightScale = Math.min(tileWidth / SCALE, tileDepth / sourceDepth);
  const source = new THREE.Object3D();
  source.position.set((component.x - .5) * SCALE, (component.elevation ?? 0) * 30 + component.height * 15 + 1, (component.y - .5) * sourceDepth);
  source.rotation.y = -component.rotation * Math.PI / 180;
  source.scale.set(component.width * SCALE, component.height * 30, component.depth * sourceDepth);
  source.updateMatrix();
  return new THREE.Matrix4().makeScale(tileWidth / SCALE, heightScale, tileDepth / sourceDepth).multiply(source.matrix);
}
/** Reusable geometry templates render normalized schematic units, never plant meters. */
export function componentGeometry(component: Component, palette: Identity, attention: boolean, selected: boolean, depthScale = 60): THREE.Group {
  const group = new THREE.Group();
  group.userData.componentId = component.id;
  const color = componentColor(component.kind, palette, attention, selected);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.12 });
  material.userData.selectionBaseColor = componentColor(component.kind, palette, attention);
  const frame = new THREE.MeshStandardMaterial({ color: palette.muted, roughness: 0.85 });
  const w = component.width * SCALE, d = component.depth * depthScale, h = component.height * 30;
  const box = (width: number, height: number, depth: number, x = 0, y = 0, z = 0, mat = material) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat); mesh.position.set(x, y, z); group.add(mesh); return mesh; };
  if (component.kind === 'curve') {
    // The footprint is centered like every other template. Independent radii
    // preserve the traced image's aspect ratio and the full configured extent.
    const band = Math.min(w, d) * 0.5, shape = new THREE.Shape();
    const cx = -w / 2, cy = -d / 2;
    shape.absellipse(cx, cy, w, d, 0, Math.PI / 2, false, 0);
    shape.lineTo(cx, cy + d - band);
    shape.absellipse(cx, cy, w - band, d - band, Math.PI / 2, 0, true, 0);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 64 }), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -h / 2;
    group.add(mesh);
  }
  else if (component.kind === 's-curve') {
    const band = Math.min(w, d) * 0.4;
    const path = new THREE.CubicBezierCurve(
      new THREE.Vector2(-w / 2, -(d - band) / 2),
      new THREE.Vector2(-w / 6, -(d - band) / 2),
      new THREE.Vector2(w / 6, (d - band) / 2),
      new THREE.Vector2(w / 2, (d - band) / 2)
    );
    const left: THREE.Vector2[] = [], right: THREE.Vector2[] = [];
    for (let step = 0; step <= 96; step++) {
      const point = path.getPoint(step / 96), tangent = path.getTangent(step / 96);
      const normal = new THREE.Vector2(-tangent.y, tangent.x).multiplyScalar(band / 2);
      left.push(point.clone().add(normal));
      right.push(point.clone().sub(normal));
    }
    const shape = new THREE.Shape([...left, ...right.reverse()]);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    // Extreme configurable aspect ratios still keep the declared footprint.
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, 0);
    geometry.scale(w / size.x, d / size.y, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -h / 2;
    group.add(mesh);
  }
  else if (component.kind === 'motor') {
    const radius = Math.max(Math.min(d, h) * 0.45, 0.08);
    const cylinder = (r: number, length: number, x: number, mat = material) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, length, 16), mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = x;
      group.add(mesh);
    };
    cylinder(radius, w * 0.72, 0);
    for (const fraction of [-0.25, -0.1, 0.05, 0.2])
      cylinder(radius * 1.12, Math.max(w * 0.04, 0.025), w * fraction, frame);
    cylinder(radius * 0.3, w * 0.28, w * 0.48, frame);
    box(w * 0.6, h * 0.16, d, 0, -radius, 0, frame);
    box(w * 0.3, h * 0.25, d * 0.35, 0, radius, 0);
  }
  else if (component.kind === 'photoelectric-sensor') {
    const post = Math.min(w * 0.15, d);
    for (const x of [-w * 0.43, w * 0.43]) {
      box(post, h, d, x);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(Math.max(post * 0.3, 0.025), 10, 6), new THREE.MeshStandardMaterial({ color: palette.onPrimary }));
      lens.position.set(x, h * 0.15, 0);
      group.add(lens);
    }
    // An illustrative optical path identifies the component; it is not a live beam state.
    box(w * 0.72, Math.max(h * 0.08, 0.02), Math.max(d * 0.15, 0.02), 0, h * 0.15);
  }
  else if (component.kind === 'sensor' || component.kind === 'scanner') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 12), material);
    group.add(body);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(w * 0.27, 12, 8), new THREE.MeshStandardMaterial({ color: palette.onPrimary }));
    lens.position.set(0, h / 2, w * 0.3);
    group.add(lens);
  }
  else if (component.kind === 'junction') {
    box(w, h, d);
    box(d, h, w);
  }
  else {
    box(w, h, d);
    if (component.kind === 'conveyor') {
      const railThickness = Math.min(w, d) * 0.06, supportThickness = Math.min(0.7, Math.min(w, d) * 0.12);
      for (const z of [-(d - railThickness) / 2, (d - railThickness) / 2])
        box(w, h * 0.28, railThickness, 0, h * 0.65, z, frame);
      for (const x of [-w * 0.35, w * 0.35])
        for (const z of [-d * 0.35, d * 0.35])
          box(supportThickness, 2, supportThickness, x, -h / 2 - 1, z, frame);
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-w * 0.2, h / 2 + 0.15, 0), w * 0.4, palette.onPrimary, Math.min(2, w * 0.12), Math.min(d * 0.6, 1, w * 0.08));
      group.add(arrow);
    }
    if (component.kind === 'lift') {
      box(w * 0.8, 0.8, d * 0.8, 0, h * 0.32, 0, frame);
      box(w * 0.8, 0.8, d * 0.8, 0, -h * 0.32, 0, frame);
    }
  }
  group.position.set((component.x - 0.5) * SCALE, (component.elevation ?? 0) * 30 + h / 2 + 1, (component.y - 0.5) * depthScale);
  group.rotation.y = -component.rotation * Math.PI / 180;
  group.traverse(object => { object.userData.componentId = component.id; });
  return group;
}
/** Bound GPU memory independently from the original private image's dimensions. */
export function boundReferenceTexture(texture: THREE.Texture, maxDimension: number): void {
  const image = texture.image as HTMLImageElement;
  const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
  if (ratio < 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The schematic texture could not be resized.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    texture.image = canvas;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
}
export function createSceneRenderer(container: HTMLElement, input: {
  scene: Scene;
  aspect: number;
  referenceUrl?: string;
  palette: Identity;
  selectedId: string;
  problemAssetIds: Set<string>;
  onSelect: (id: string) => void;
  onHover?: (target: HoverTarget | null) => void;
  onPlace?: (point: {
    x: number;
    y: number;
  }) => void;
  onReferenceError?: () => void;
  onContextLost?: () => void;
  cameraState?: CameraState;
  onCameraChange?: (camera: CameraState) => void;
  tiles?: {
    scene: Scene;
    referenceUrl?: string;
    aspect: number;
  }[];
}): CameraControls {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(input.palette.canvas);
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene(), depth = SCALE / Math.max(0.5, input.aspect);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1500);
  camera.position.set(80, 95, 105);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = false;
  controls.minDistance = 8;
  controls.maxDistance = 500;
  controls.maxPolarAngle = Math.PI / 2 - 0.01;
  if (input.cameraState) {
    camera.position.fromArray(input.cameraState.position);
    controls.target.fromArray(input.cameraState.target);
    controls.update();
  }
  scene.add(new THREE.HemisphereLight(input.palette.onPrimary, input.palette.muted, 2));
  const light = new THREE.DirectionalLight(input.palette.onPrimary, 2.5);
  light.position.set(30, 90, 40);
  scene.add(light);
  let disposed = false;
  const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) { input.onHover?.(null); input.onContextLost?.(); } };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const prepareTexture = (texture: THREE.Texture, maxDimension = 2048) => {
    try { boundReferenceTexture(texture, Math.min(maxDimension, renderer.capabilities.maxTextureSize)); return true; }
    catch { texture.dispose(); input.onReferenceError?.(); return false; }
  };
  const render = () => {
    if (disposed) return;
    input.onHover?.(null);
    renderer.render(scene, camera);
    input.onCameraChange?.({ position: camera.position.toArray(), target: controls.target.toArray() });
  };
  const tileSurfaces: THREE.Object3D[] = [];
  const objects = input.scene.content.components.map((c, index) => {
    const tile = input.tiles?.[index];
    if (!tile)
      return componentGeometry(c, input.palette, !!c.assetId && input.problemAssetIds.has(c.assetId), c.id === input.selectedId, depth);
    const group = new THREE.Group();
    group.position.set((c.x - 0.5) * SCALE, 0, (c.y - 0.5) * depth);
    const tileWidth = c.width * SCALE, tileDepth = c.depth * depth;
    const material = new THREE.MeshBasicMaterial({ color: input.palette.surface, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(tileWidth, tileDepth), material);
    plane.rotation.x = -Math.PI / 2;
    group.add(plane);
    tileSurfaces.push(plane);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(tileWidth, 0.25, tileDepth)), new THREE.LineBasicMaterial({ color: input.palette.line }));
    group.add(edge);
    // Overview thumbnails batch simplified solids. Opening a scene retains the full templates.
    for (const kind of new Set(tile.scene.content.components.map(c => c.kind))) {
      const parts = tile.scene.content.components.filter(c => c.kind === kind);
      const geometry = kind === 'motor' ? new THREE.CylinderGeometry(.5, .5, 1, 8).rotateZ(Math.PI / 2) : new THREE.BoxGeometry(1, 1, 1);
      const color = componentColor(kind, input.palette);
      const instances = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .8 }), parts.length);
      parts.forEach((part, i) => {
        instances.setMatrixAt(i, thumbnailMatrix(part, tileWidth, tileDepth, tile.aspect));
      });
      instances.instanceMatrix.needsUpdate = true;
      group.add(instances);
    }
    group.traverse(o => { o.userData.componentId = tile.scene.id; });
    if (tile.referenceUrl)
      new THREE.TextureLoader().load(tile.referenceUrl, texture => { if (disposed) {
        texture.dispose();
        return;
      } if (!prepareTexture(texture, 512)) return; material.map = texture; material.color.set(input.palette.onPrimary); material.needsUpdate = true; render(); }, undefined, () => { if (!disposed)
        input.onReferenceError?.(); });
    return group;
  });
  objects.forEach(o => scene.add(o));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SCALE, depth), new THREE.MeshStandardMaterial({ color: input.palette.surface, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.15;
  scene.add(floor);
  const grid = new THREE.GridHelper(SCALE, 20, input.palette.line, input.palette.line);
  grid.position.y = -0.1;
  scene.add(grid);
  if (input.referenceUrl)
    new THREE.TextureLoader().load(input.referenceUrl, texture => { if (disposed) {
      texture.dispose();
      return;
    } if (!prepareTexture(texture)) return; const mat = floor.material as THREE.MeshStandardMaterial; mat.map = texture; mat.color.set(input.palette.onPrimary); mat.needsUpdate = true; grid.visible = false; render(); }, undefined, () => { if (!disposed)
      input.onReferenceError?.(); });
  const resize = () => { const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); render(); };
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  observer?.observe(container);
  window.addEventListener('resize', resize);
  controls.addEventListener('change', render);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let down = { x: 0, y: 0 };
  const clearHover = () => input.onHover?.(null);
  const hitsAt = (event: PointerEvent, targets: THREE.Object3D[] = objects) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(targets, true);
  };
  const hover = (event: PointerEvent) => {
    if (!input.onHover) return;
    if (event.buttons || event.pointerType === 'touch') { clearHover(); return; }
    // Tile surfaces cover the whole area without testing every thumbnail or edge.
    const hit = hitsAt(event, input.tiles ? tileSurfaces : objects).find(hit => (hit.object as THREE.Mesh).isMesh);
    const bounds = container.getBoundingClientRect();
    input.onHover(hit ? { id: hit.object.userData.componentId as string, x: event.clientX - bounds.left, y: event.clientY - bounds.top } : null);
  };
  const press = (event: PointerEvent) => { clearHover(); down = { x: event.clientX, y: event.clientY }; };
  const select = (event: PointerEvent) => { if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5)
    return; const hit = hitsAt(event)[0]; if (hit) {
    input.onSelect(hit.object.userData.componentId as string);
    return;
  } const point = raycaster.intersectObject(floor)[0]?.point; if (point && input.onPlace)
    input.onPlace({ x: Math.max(0, Math.min(1, point.x / SCALE + 0.5)), y: Math.max(0, Math.min(1, point.z / depth + 0.5)) }); };
  renderer.domElement.addEventListener('pointerdown', press);
  renderer.domElement.addEventListener('pointerup', select);
  renderer.domElement.addEventListener('pointermove', hover);
  renderer.domElement.addEventListener('pointerleave', clearHover);
  renderer.domElement.addEventListener('pointercancel', clearHover);
  resize();
  const result: CameraControls = { snapshot() { return { position: camera.position.toArray(), target: controls.target.toArray() }; }, reset() { camera.position.set(80, 95, 105); controls.target.set(0, 0, 0); controls.update(); render(); }, top() { camera.position.set(0, 140, 0.01); controls.target.set(0, 0, 0); controls.update(); render(); }, zoom(factor) { camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target); controls.update(); render(); }, rotate(delta) { const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta); camera.position.copy(controls.target).add(offset); controls.update(); render(); }, focus(id) { const object = objects.find(o => o.userData.componentId === id); if (!object)
      return; const offset = camera.position.clone().sub(controls.target).normalize().multiplyScalar(45); controls.target.copy(object.position); camera.position.copy(object.position).add(offset); controls.update(); render(); }, select(id) {
    objects.forEach(object => object.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
        const base = material.userData.selectionBaseColor;
        if (typeof base === 'string') (material as THREE.MeshStandardMaterial).color.set(object.userData.componentId === id ? input.palette.focus : base);
      });
    }));
    render();
  }, dispose() { if (disposed) return; disposed = true; clearHover(); renderer.domElement.removeEventListener('webglcontextlost', contextLost); observer?.disconnect(); window.removeEventListener('resize', resize); controls.removeEventListener('change', render); renderer.domElement.removeEventListener('pointerdown', press); renderer.domElement.removeEventListener('pointerup', select); renderer.domElement.removeEventListener('pointermove', hover); renderer.domElement.removeEventListener('pointerleave', clearHover); renderer.domElement.removeEventListener('pointercancel', clearHover); controls.dispose(); const materials = new Set<THREE.Material>(), geometries = new Set<THREE.BufferGeometry>(); scene.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.geometry)
      geometries.add(mesh.geometry); if (mesh.material)
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => materials.add(m)); }); geometries.forEach(g => g.dispose()); materials.forEach(m => { const material = m as THREE.MeshStandardMaterial; material.map?.dispose(); m.dispose(); }); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); } };
  return result;
}
