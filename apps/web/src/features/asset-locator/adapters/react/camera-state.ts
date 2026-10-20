import type { CameraState } from '../three/renderer';

/** New schematic contexts share viewing angle/distance, with their own centered origin. */
export function recenterCamera(camera?: CameraState): CameraState | undefined {
  return camera ? { position: camera.position.map((value, index) => value - camera.target[index]), target: [0, 0, 0] } : undefined;
}
