import { t } from '../../../../localization/i18n';
import { useEffect, useRef, useState } from 'react';
import { Actions, Alert, Button } from '../../../../design/components';
import { identity, darkIdentity } from '../../../../design/identity';
import { useAppearance } from '../../../../design/useAppearance';
import type { Scene, ReferenceDimensions } from '../../domain/models';
import type { CameraControls, CameraState } from '../three/renderer';
import { referenceUrl } from '../http/gateway';
import { recenterCamera } from './camera-state';

export function SceneViewport({ scene, reference, selectedId, problemAssetIds, onSelect, onPlace, showGuide = false, cameraState, onCameraChange, focusRequest }: {
  scene: Scene;
  reference?: ReferenceDimensions;
  selectedId: string;
  problemAssetIds: Set<string>;
  onSelect: (id: string) => void;
  onPlace?: (point: { x: number; y: number }) => void;
  showGuide?: boolean;
  cameraState?: CameraState;
  onCameraChange?: (camera: CameraState) => void;
  focusRequest?: { componentId: string; visit: number };
}) {
  const element = useRef<HTMLDivElement>(null), renderer = useRef<CameraControls | null>(null);
  const camera = useRef<CameraState | undefined>(cameraState), sceneId = useRef(scene.id), focused = useRef('');
  const select = useRef(onSelect), place = useRef(onPlace), cameraChanged = useRef(onCameraChange), selection = useRef(selectedId), focus = useRef(focusRequest);
  select.current = onSelect; place.current = onPlace; cameraChanged.current = onCameraChange; selection.current = selectedId; focus.current = focusRequest;
  const [unavailable, setUnavailable] = useState(false), [imageError, setImageError] = useState(false);
  const { resolved } = useAppearance();
  const applyFocus = (view: CameraControls) => {
    const request = focus.current, key = request ? `${scene.id}:${request.componentId}:${request.visit}` : '';
    if (request && focused.current !== key) { view.focus(request.componentId); focused.current = key; }
  };
  useEffect(() => {
    if (!element.current) return;
    setUnavailable(false); setImageError(false);
    let view: CameraControls | null = null, active = true;
    const host = element.current;
    void import('../three/renderer').then(({ createSceneRenderer }) => {
      if (!active) return;
      if (sceneId.current !== scene.id) { camera.current = recenterCamera(camera.current); sceneId.current = scene.id; }
      view = createSceneRenderer(host, {
        scene, aspect: reference ? reference.width / reference.height : 1.65,
        referenceUrl: showGuide && reference ? referenceUrl(reference.id) : undefined,
        palette: resolved === 'dark' ? darkIdentity : identity, selectedId: selection.current, problemAssetIds, cameraState: camera.current,
        onCameraChange: value => { if (active) { camera.current = value; cameraChanged.current?.(value); } },
        onSelect: id => select.current(id), onPlace: point => place.current?.(point),
        onReferenceError: () => { if (active) setImageError(true); },
        onContextLost: () => {
          if (!active) return;
          if (view) { camera.current = view.snapshot(); cameraChanged.current?.(camera.current); view.dispose(); view = null; }
          renderer.current = null;
          setUnavailable(true);
        },
      });
      renderer.current = view;
      view.select(selection.current);
      applyFocus(view);
    }).catch(() => { if (active) { setUnavailable(true); host.replaceChildren(); } });
    return () => {
      active = false;
      if (view) { camera.current = view.snapshot(); cameraChanged.current?.(camera.current); view.dispose(); }
      renderer.current = null;
    };
  }, [scene, reference, problemAssetIds, resolved, showGuide]);
  useEffect(() => { renderer.current?.select(selectedId); }, [selectedId]);
  useEffect(() => { if (renderer.current) applyFocus(renderer.current); }, [scene.id, focusRequest?.componentId, focusRequest?.visit]);
  const key = (event: React.KeyboardEvent) => {
    if (!renderer.current) return;
    const actions: Record<string, () => void> = { ArrowLeft: () => renderer.current?.rotate(-0.15), ArrowRight: () => renderer.current?.rotate(0.15), '+': () => renderer.current?.zoom(0.85), '=': () => renderer.current?.zoom(0.85), '-': () => renderer.current?.zoom(1.15), Home: () => renderer.current?.reset(), t: () => renderer.current?.top() };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  };
  return <div className="locator-viewer"><Actions>
    <Button variant="secondary" onClick={() => renderer.current?.reset()} disabled={unavailable}>{t('Reset view')}</Button>
    <Button variant="secondary" onClick={() => renderer.current?.top()} disabled={unavailable}>{t('Top view')}</Button>
    <Button variant="secondary" aria-label={t('Zoom in')} onClick={() => renderer.current?.zoom(0.85)} disabled={unavailable}>{t('+')}</Button>
    <Button variant="secondary" aria-label={t('Zoom out')} onClick={() => renderer.current?.zoom(1.15)} disabled={unavailable}>{t('−')}</Button>
    <Button variant="secondary" onClick={() => renderer.current?.focus(selectedId)} disabled={unavailable || !selectedId}>{t('Focus selected component')}</Button>
  </Actions>
    <div ref={element} className="locator-canvas" hidden={unavailable} role="region" tabIndex={0} aria-label={t('3D schematic scene. Arrow keys rotate; plus and minus zoom; Home resets; T shows top view.')} onKeyDown={key}/>
    {unavailable && <><Alert>{t('3D rendering is unavailable on this device. Use the component list below to inspect the model.')}</Alert>{showGuide && reference && <img className="locator-reference" src={referenceUrl(reference.id)} alt={t('Private source schematic — historical reference only')}/>}</>}
    {showGuide && imageError && <Alert>{t('The private source image could not be loaded. Reload after checking your current access.')}</Alert>}
    <p className="locator-muted">{t('Drag to orbit; right-drag to pan; scroll to zoom. Schematic positions remain provisional.')}</p>
  </div>;
}
