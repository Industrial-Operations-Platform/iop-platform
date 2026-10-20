import { t } from "../../../../localization/i18n";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Actions, Alert, Button } from '../../../../design/components';
import { identity, darkIdentity } from '../../../../design/identity';
import { useAppearance } from '../../../../design/useAppearance';
import type { Scene, ReferenceDimensions } from '../../domain/models';
import type { CameraControls, CameraState, HoverTarget } from '../three/renderer';
/** Area tiles are navigation cards, explicitly unrelated to physical adjacency. */
export function PlantOverview({ scenes, references, onScene, cameraState, onCameraChange }: {
  scenes: Scene[];
  references: ReferenceDimensions[];
  onScene: (id: string) => void;
  cameraState?: CameraState;
  onCameraChange?: (camera: CameraState) => void;
}) {
  const element = useRef<HTMLDivElement>(null), controls = useRef<CameraControls | null>(null), choose = useRef(onScene);
  choose.current = onScene;
  const camera = useRef<CameraState | undefined>(cameraState), cameraChanged = useRef(onCameraChange);
  cameraChanged.current = onCameraChange;
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState<HoverTarget | null>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const { resolved } = useAppearance();
  useLayoutEffect(() => {
    if (!hovered || !tooltip.current || !element.current) return;
    const label = tooltip.current, host = element.current;
    label.style.left = `${Math.max(8, Math.min(hovered.x + 12, host.clientWidth - label.offsetWidth - 8))}px`;
    label.style.top = `${Math.max(8, Math.min(hovered.y + 12, host.clientHeight - label.offsetHeight - 8))}px`;
  }, [hovered]);
  const overview = useMemo(() => { const count = scenes.length, columns = Math.max(1, Math.ceil(Math.sqrt(count * 1.65))), rows = Math.max(1, Math.ceil(count / columns)); const scene: Scene = { id: 'uncalibrated-area-overview', revision: 0, authorId: '', createdAt: '', updatedAt: '', content: { name: 'Uncalibrated area tiles', group: '', locationId: '', referenceId: '', description: 'Tiles provide navigation, not physical plant placement.', calibration: 'pending', surveyNote: '', components: scenes.map((s, i) => ({ id: s.id, kind: 'cabinet', label: s.content.name, x: (i % columns + .5) / columns, y: (Math.floor(i / columns) + .5) / rows, elevation: null, rotation: 0, width: .9 / columns, depth: .9 / rows, height: .01, assetId: '', verification: 'provisional', note: 'Navigation tile; no physical adjacency implied.' })) } }; return { scene, tiles: scenes.map(s => { const ref = references.find(r => r.id === s.content.referenceId); return { scene: s, aspect: ref ? ref.width / ref.height : 1.65 }; }) }; }, [scenes, references]);
  useEffect(() => {
    setHovered(null);
    if (!element.current || !scenes.length)
      return;
    setFailed(false);
    let view: CameraControls | null = null;
    let active = true;
    const host = element.current;
    void import('../three/renderer').then(({createSceneRenderer}) => {
      if (!active) return;
      view = createSceneRenderer(host, { ...overview, aspect: 1.65, palette: resolved === 'dark' ? darkIdentity : identity, selectedId: '', problemAssetIds: new Set(), cameraState: camera.current, onCameraChange: value => { if (active) { setHovered(null); camera.current = value; cameraChanged.current?.(value); } }, onSelect: id => choose.current(id), onHover: target => { if (active) setHovered(target); } });
      controls.current = view;
    }).catch(() => {
      if (!active) return;
      setFailed(true);
      setHovered(null);
      host.replaceChildren();
    });
    return () => { active = false; if (view) { camera.current = view.snapshot(); cameraChanged.current?.(camera.current); view.dispose(); } controls.current = null; };
  }, [overview, resolved, scenes.length]);
  if (!scenes.length)
    return null;
  const hoveredScene = scenes.find(scene => scene.id === hovered?.id);
  return <div className="locator-viewer">
    <Actions>
      <Button variant="secondary" onClick={() => controls.current?.reset()} disabled={failed}>{t("Reset overview")}</Button>
      <Button variant="secondary" onClick={() => controls.current?.top()} disabled={failed}>{t("Top view")}</Button>
      <Button variant="secondary" onClick={() => controls.current?.zoom(.85)} disabled={failed}>{t("Zoom in")}</Button>
      <Button variant="secondary" onClick={() => controls.current?.zoom(1.15)} disabled={failed}>{t("Zoom out")}</Button>
    </Actions>
    <div className="locator-overview-canvas" hidden={failed}>
      <div ref={element} className="locator-canvas" aria-hidden="true"/>
      {hoveredScene && <div ref={tooltip} className="locator-area-tooltip" role="tooltip">{hoveredScene.content.name}</div>}
    </div>
    {failed && <Alert>{t("3D overview is unavailable. Open the same area scenes using the cards below.")}</Alert>}
    <p className="locator-muted">{t("3D area tiles are arranged for navigation. They are not a plant floorplan and do not establish distance, alignment, levels or adjacency. Select a tile or use the labelled cards below.")}</p>
  </div>;
}
