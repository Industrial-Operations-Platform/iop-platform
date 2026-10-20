import { t } from "../../../../localization/i18n";
import { useEffect, useRef, useState } from 'react';
import { Actions, Alert, Button } from '../../../../design/components';
import { identity, darkIdentity } from '../../../../design/identity';
import { useAppearance } from '../../../../design/useAppearance';
import type { Scene, ReferenceDimensions } from '../../domain/models';
import type { CameraControls } from '../three/renderer';
import { referenceUrl } from '../http/gateway';
export function SceneViewport({ scene, reference, showReference = false, selectedId, problemAssetIds, onSelect, onPlace }: {
  scene: Scene;
  reference?: ReferenceDimensions;
  showReference?: boolean;
  selectedId: string;
  problemAssetIds: Set<string>;
  onSelect: (id: string) => void;
  onPlace?: (point: {
    x: number;
    y: number;
  }) => void;
}) {
  const element = useRef<HTMLDivElement>(null), renderer = useRef<CameraControls | null>(null), camera = useRef<{
    position: number[];
    target: number[];
  } | undefined>(undefined);
  const [unavailable, setUnavailable] = useState(false), [imageError, setImageError] = useState(false);
  const { resolved } = useAppearance();
  const select = useRef(onSelect), place = useRef(onPlace), selection = useRef(selectedId);
  selection.current = selectedId;
  select.current = onSelect;
  place.current = onPlace;
  useEffect(() => {
    if (!element.current)
      return;
    setUnavailable(false);
    setImageError(false);
    let view: CameraControls | null = null;
    let active = true;
    const host = element.current;
    void import('../three/renderer').then(({createSceneRenderer}) => {
      if (!active) return;
      view = createSceneRenderer(host, { scene, aspect: reference ? reference.width / reference.height : 1.65, referenceUrl: showReference && reference ? referenceUrl(reference.id) : undefined, palette: resolved === 'dark' ? darkIdentity : identity, selectedId: selection.current, problemAssetIds, cameraState: camera.current, onSelect: id => select.current(id), onPlace: point => place.current?.(point), onReferenceError: () => {if (active) setImageError(true);}, onContextLost: () => { if (active) { view?.dispose(); renderer.current = null; setUnavailable(true); } } });
      renderer.current = view;
      view.select(selection.current);
    }).catch(() => {
      if (!active) return;
      setUnavailable(true);
      host.replaceChildren();
    });
    return () => {
      active = false;
      if (view) {
        camera.current = view.snapshot();
        view.dispose();
      }
      renderer.current = null;
    };
  }, [scene, reference, showReference, problemAssetIds, resolved]);
  useEffect(() => { renderer.current?.select(selectedId); }, [selectedId]);
  useEffect(() => { camera.current = undefined; renderer.current?.reset(); }, [scene.id]);
  const key = (event: React.KeyboardEvent) => {
    if (!renderer.current)
      return;
    const actions: Record<string, () => void> = { ArrowLeft: () => renderer.current?.rotate(-0.15), ArrowRight: () => renderer.current?.rotate(0.15), '+': () => renderer.current?.zoom(0.85), '=': () => renderer.current?.zoom(0.85), '-': () => renderer.current?.zoom(1.15), Home: () => renderer.current?.reset(), 't': () => renderer.current?.top() };
    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
    }
  };
  return <div className="locator-viewer"><Actions><Button variant="secondary" onClick={() => renderer.current?.reset()} disabled={unavailable}>{t("Reset view")}</Button><Button variant="secondary" onClick={() => renderer.current?.top()} disabled={unavailable}>{t("Top view")}</Button><Button variant="secondary" aria-label={t("Zoom in")} onClick={() => renderer.current?.zoom(0.85)} disabled={unavailable}>{t("+")}</Button><Button variant="secondary" aria-label={t("Zoom out")} onClick={() => renderer.current?.zoom(1.15)} disabled={unavailable}>{t("\u2212")}</Button><Button variant="secondary" onClick={() => renderer.current?.focus(selectedId)} disabled={unavailable || !selectedId}>{t("Focus selected component")}</Button></Actions>
  <div ref={element} className="locator-canvas" hidden={unavailable} role="region" tabIndex={0} aria-label={t("3D schematic scene. Arrow keys rotate; plus and minus zoom; Home resets; T shows top view.")} onKeyDown={key}/>
  {unavailable && <><Alert>{t("3D rendering is unavailable on this device. Use the component list below to inspect the model.")}</Alert>{showReference && reference && <img className="locator-reference" src={referenceUrl(reference.id)} alt={t("Private source schematic — historical reference only")}/>}</>}
  {showReference && imageError && <Alert>{t("The private source image could not be loaded. Reload after checking your current access.")}</Alert>}
  <p className="locator-muted">{t("Drag to orbit; right-drag to pan; scroll to zoom. Coordinates are schematic units.")}</p>
 </div>;
}
