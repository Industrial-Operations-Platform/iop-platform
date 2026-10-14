import { t } from "../../../../localization/i18n";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Actions, Alert, Button } from '../../../../design/components';
import { identity, darkIdentity } from '../../../../design/identity';
import { useAppearance } from '../../../../design/useAppearance';
import type { Scene, Reference } from '../../domain/models';
import { createSceneRenderer, type CameraControls } from '../three/renderer';
import { referenceUrl } from '../http/gateway';
/** Area tiles are navigation cards, explicitly unrelated to physical adjacency. */
export function PlantOverview({ scenes, references, onScene }: {
  scenes: Scene[];
  references: Reference[];
  onScene: (id: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null), controls = useRef<CameraControls | null>(null), choose = useRef(onScene);
  choose.current = onScene;
  const [failed, setFailed] = useState(false);
  const { resolved } = useAppearance();
  const overview = useMemo(() => { const count = scenes.length, columns = Math.max(1, Math.ceil(Math.sqrt(count * 1.65))), rows = Math.max(1, Math.ceil(count / columns)); const scene: Scene = { id: 'uncalibrated-area-overview', revision: 0, authorId: '', createdAt: '', updatedAt: '', content: { name: 'Uncalibrated area tiles', group: '', locationId: '', referenceId: '', description: 'Tiles provide navigation, not physical plant placement.', calibration: 'pending', surveyNote: '', components: scenes.map((s, i) => ({ id: s.id, kind: 'cabinet', label: s.content.name, x: (i % columns + .5) / columns, y: (Math.floor(i / columns) + .5) / rows, elevation: null, rotation: 0, width: .9 / columns, depth: .9 / rows, height: .01, assetId: '', verification: 'provisional', note: 'Navigation tile; no physical adjacency implied.' })) } }; return { scene, tiles: scenes.map(s => { const ref = references.find(r => r.id === s.content.referenceId); return { scene: s, referenceUrl: ref ? referenceUrl(ref.id) : undefined, aspect: ref ? ref.width / ref.height : 1.65 }; }) }; }, [scenes, references]);
  useEffect(() => {
    if (!element.current || !scenes.length)
      return;
    setFailed(false);
    let view: CameraControls | null = null;
    try {
      view = createSceneRenderer(element.current, { ...overview, aspect: 1.65, palette: resolved === 'dark' ? darkIdentity : identity, selectedId: '', problemAssetIds: new Set(), onSelect: id => choose.current(id) });
      controls.current = view;
    }
    catch {
      setFailed(true);
      element.current.replaceChildren();
    }
    return () => { view?.dispose(); controls.current = null; };
  }, [overview, resolved, scenes.length]);
  if (!scenes.length)
    return null;
  return <div className="locator-viewer"><Actions><Button variant="secondary" onClick={() => controls.current?.reset()} disabled={failed}>{t("Reset overview")}</Button><Button variant="secondary" onClick={() => controls.current?.top()} disabled={failed}>{t("Top view")}</Button><Button variant="secondary" onClick={() => controls.current?.zoom(.85)} disabled={failed}>{t("Zoom in")}</Button><Button variant="secondary" onClick={() => controls.current?.zoom(1.15)} disabled={failed}>{t("Zoom out")}</Button></Actions><div ref={element} className="locator-canvas" hidden={failed} aria-hidden="true"/>{failed && <Alert>{t("3D overview is unavailable. Open the same area scenes using the cards below.")}</Alert>}<p className="locator-muted">{t("3D area tiles are arranged for navigation. They are not a plant floorplan and do not establish distance, alignment, levels or adjacency. Select a tile or use the labelled cards below.")}</p></div>;
}
