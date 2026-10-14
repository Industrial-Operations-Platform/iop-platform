import { t } from "../../../../localization/i18n";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Actions, AddButton, Alert, Badge, Button, Disclosure, Field, FieldRow, Input, Panel, RefreshButton, SectionHeading, Select, Textarea, ViewNavigation } from '../../../../design/components';
import type { LocatorApplication } from '../../application/locator';
import { componentKinds, duplicateComponent, emptyContent, moveComponent, type Component, type ComponentKind, type Context, type Detail, type Scene, type Content, type SearchResults, type History, type Asset } from '../../domain/models';
import { referenceUrl } from '../http/gateway';
import { SceneViewport } from './SceneViewport';
import { ComponentEditor } from './ComponentEditor';
import { PlantOverview } from './PlantOverview';
import './locator.css';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Asset Locator is unavailable.';
export function LocatorWorkspace({ application, onAsset, onProblem, initialSceneId = '', homeVisit = 0 }: {
  application: LocatorApplication;
  onAsset?: (id: string) => void;
  onProblem?: (kind: 'handover' | 'maintenance', id: string) => void;
  initialSceneId?: string;
  homeVisit?: number;
}) {
  const [context, setContext] = useState<Context>(), [scenes, setScenes] = useState<Scene[]>([]), [detail, setDetail] = useState<Detail>(), [draft, setDraft] = useState<Content>(), [selected, setSelected] = useState(''), [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [tab, setTab] = useState('overview'), [group, setGroup] = useState(''), [sceneSearch, setSceneSearch] = useState(''), [assetSearch, setAssetSearch] = useState(''), [unplaced, setUnplaced] = useState(false), [results, setResults] = useState<SearchResults>(), [assetOptions, setAssetOptions] = useState<Asset[]>([]), [assetLookup, setAssetLookup] = useState('');
  const [history, setHistory] = useState<History>(), [note, setNote] = useState(''), [kind, setKind] = useState<ComponentKind>('conveyor'), [placing, setPlacing] = useState<ComponentKind | ''>(''), [trace, setTrace] = useState(false), [traceStart, setTraceStart] = useState<{
    x: number;
    y: number;
  }>();
  const requestNumber = useRef(0), mounted = useRef(true);
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ctx, page] = await Promise.all([application.context(), application.query()]);
      if (!mounted.current)
        return;
      setContext(ctx);
      setScenes(page.scenes);
    }
    catch (e) {
      if (mounted.current)
        setError(errorMessage(e));
    }
    finally {
      if (mounted.current)
        setLoading(false);
    }
  };
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; requestNumber.current++; }; }, [application, homeVisit]);
  const open = async (id: string, componentId = '') => {
    const token = ++requestNumber.current;
    setLoading(true);
    setError('');
    setHistory(undefined);
    try {
      const result = await application.detail(id);
      if (!mounted.current || token !== requestNumber.current)
        return;
      setDetail(result);
      setDraft({ ...result.scene.content, components: result.scene.content.components.map(c => ({ ...c })) });
      setSelected(componentId);
      setDirty(false);
      setNote('');
      setPlacing('');
      setTrace(false);
      setTraceStart(undefined);
    }
    catch (e) {
      if (token === requestNumber.current)
        setError(errorMessage(e));
    }
    finally {
      if (token === requestNumber.current)
        setLoading(false);
    }
  };
  useEffect(() => {
    if (initialSceneId)
      void open(initialSceneId);
  }, [initialSceneId, homeVisit]);
  useEffect(() => {
    if (!context)
      return;
    let active = true;
    const timer = setTimeout(() => {
      application.search(assetLookup).then(r => {
        if (active)
          setAssetOptions(r.results.map(v => v.asset));
      }).catch(e => {
        if (active)
          setError(errorMessage(e));
      });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [application, context, assetLookup]);
  useEffect(() => {
    if (tab !== 'search')
      return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      application.search(assetSearch, unplaced).then(r => {
        if (active)
          setResults(r);
      }).catch(e => {
        if (active)
          setError(errorMessage(e));
      }).finally(() => {
        if (active)
          setLoading(false);
      });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [application, tab, assetSearch, unplaced]);
  const update = (content: Content) => { setDraft(content); setDirty(true); setMessage(''); };
  const home = () => { requestNumber.current++; setDetail(undefined); setDraft(undefined); setHistory(undefined); setSelected(''); setDirty(false); setPlacing(''); setTrace(false); setTraceStart(undefined); setLoading(false); };
  const act = async (work: () => Promise<void>) => {
    setPending(true);
    setError('');
    setMessage('');
    try {
      await work();
    }
    catch (e) {
      setError(errorMessage(e));
    }
    finally {
      if (mounted.current)
        setPending(false);
    }
  };
  const initialize = () => act(async () => { const result = await application.bootstrap(); await load(); setMessage(`${result.created} ${t('provisional scenes created. Existing scene edits were preserved.')}`); });
  const newScene = () => { home(); const scene: Scene = { id: 'draft-' + application.newId(), revision: 0, authorId: '', createdAt: '', updatedAt: '', content: emptyContent() }; setDetail({ scene, assets: [], problems: { items: [], coverage: [] } }); setDraft(scene.content); setDirty(true); };
  const add = (at?: {
    x: number;
    y: number;
  }, componentKind = kind) => {
    if (!draft || !context)
      return;
    const component = application.component(componentKind, context.componentCatalog, at);
    update({ ...draft, components: [...draft.components, component] });
    setSelected(component.id);
    setPlacing('');
  };
  const place = (point: {
    x: number;
    y: number;
  }) => {
    if (!draft || !context || !context.canManage)
      return;
    if (trace) {
      if (!traceStart) {
        setTraceStart(point);
        return;
      }
      const reference = context.references.find(r => r.id === draft.referenceId), aspect = reference ? reference.width / reference.height : 1.65, dx = point.x - traceStart.x, dy = (point.y - traceStart.y) / aspect, length = Math.hypot(dx, dy);
      if (length < 0.001) {
        setError('Choose two distinct conveyor endpoints.');
        return;
      }
      const component = application.component('conveyor', context.componentCatalog, { x: (point.x + traceStart.x) / 2, y: (point.y + traceStart.y) / 2 });
      component.width = Math.min(1, length);
      component.rotation = Math.atan2(dy, dx) * 180 / Math.PI;
      component.note = 'Manually traced from the schematic reference; physical dimensions and position pending.';
      update({ ...draft, components: [...draft.components, component] });
      setSelected(component.id);
      setTraceStart(undefined);
      return;
    }
    if (placing)
      add(point, placing);
  };
  const modify = (component: Component) => {
    if (draft)
      update({ ...draft, components: draft.components.map(c => c.id === component.id ? component : c) });
  };
  const component = draft?.components.find(c => c.id === selected);
  const linkedAssets = useMemo(() => [...new Map([...assetOptions, ...(detail?.assets ?? [])].map(a => [a.id, a])).values()], [assetOptions, detail?.assets]);
  const problemAssets = useMemo(() => new Set(detail?.problems.items.map(p => p.assetId) ?? []), [detail?.problems]);
  const visibleScenes = useMemo(() => scenes.filter(s => (!group || s.content.group === group) && (!sceneSearch || [s.content.name, s.content.group].some(v => v.toLowerCase().includes(sceneSearch.toLowerCase())))), [scenes, group, sceneSearch]);
  const preview = useMemo(() => detail && draft ? { ...detail.scene, content: draft } : undefined, [detail?.scene, draft]);
  return <div className="locator-fields">
  <SectionHeading section="Asset Locator" view={detail ? detail.scene.content.name : tab === 'search' ? 'Asset search' : 'Plant overview'} onHome={home} description="Versioned 3D schematic layouts and explicitly registered asset placements." actions={<Actions><RefreshButton busy={loading || pending} onClick={() => detail ? void open(detail.scene.id, selected) : void load()}/>{!detail && context?.canManage && <AddButton label={t("Create scene")} onClick={newScene} disabled={pending}/>}</Actions>}/>
  {error && <Alert>{error}</Alert>}{message && <p role="status">{message}</p>}{loading && <p role="status">{t("Loading locator\u2026")}</p>}
  <div className="locator-readiness"><strong>{t("Physical calibration pending.")}</strong>{t(" Area references are WinCC schematics, including independent sections. Whole-plant alignment, dimensions, elevations and exact sensor positions still require survey. Problem markers show reported evidence, never live health.")}</div>
  {!detail && <><ViewNavigation items={[{ id: 'overview', label: 'Plant overview' }, { id: 'search', label: 'Asset search' }]} label={t("Asset Locator views")} selected={tab} onSelect={id => setTab(String(id))}/>
   {tab === 'overview' && <><div className="locator-toolbar"><Field>{t("Scene search")}<Input value={sceneSearch} onChange={e => setSceneSearch(e.target.value)} maxLength={160}/></Field><Field>{t("Source group")}<Select value={group} onChange={e => setGroup(e.target.value)}><option value="">{t("All groups")}</option>{[...new Set(scenes.map(s => s.content.group))].filter(Boolean).sort().map(g => <option key={g}>{g}</option>)}</Select></Field>{context?.canManage && <Button variant="secondary" onClick={initialize} disabled={pending || loading}>{t(scenes.length ? 'Synchronize imported reference scenes' : 'Initialize reference and example scenes')}</Button>}</div>
  <p className="locator-muted">{t("Uncalibrated area tiles \u2014 ordering does not represent physical adjacency.")}{visibleScenes.length}{t(" scenes.")}</p>
  {!loading && !scenes.length && <Panel variant="empty">{t("No scenes are initialized. Import private source diagrams and initialize the reference scenes, or create a scene.")}</Panel>}
  <PlantOverview scenes={visibleScenes} references={context?.references ?? []} onScene={id => void open(id)}/><div className="locator-scene-grid">{visibleScenes.map(s => { const ref = context?.references.find(r => r.id === s.content.referenceId); return <button className="locator-scene-card" key={s.id} onClick={() => void open(s.id)}><span className="locator-scene-name">{s.content.name}</span>{ref && <img src={referenceUrl(ref.id)} alt={t('Private schematic reference:') + ' ' + ref.name} loading="lazy"/>}<span>{s.content.group || t('Unassigned group')}</span><span className="locator-muted">{s.content.components.length}{t(" components \u00B7 revision ")}{s.revision}{t(" \u00B7 ")}{t(s.content.calibration === 'pending' ? 'calibration pending' : 'survey evidence recorded')}</span></button>; })}</div>
  <Disclosure summary={`${t('Private source catalog')} (${context?.references.length ?? 0})`}><p className="locator-muted">{t("Original external filenames and hashes preserve provenance. Reference colors remain historical.")}</p><ul>{context?.references.map(r => <li key={r.id}>{r.group}{t(" / ")}{r.name}{t(" \u2014 ")}{r.width}{t(" \u00D7 ")}{r.height}{t(";")}{t(r.kind)}</li>)}</ul></Disclosure>
   </>}
   {tab === 'search' && <Panel><div className="locator-toolbar"><Field>{t("Registered asset code or name")}<Input value={assetSearch} onChange={e => setAssetSearch(e.target.value)} maxLength={160}/></Field><label><input type="checkbox" checked={unplaced} onChange={e => setUnplaced(e.target.checked)}/>{t("Unplaced assets only")}</label></div><p className="locator-muted">{t("Up to 200 matches. Refine the search to find other assets. An unlinked source symbol is not a registered asset.")}</p><ul className="locator-list">{results?.results.map(r => <li key={r.asset.id}><strong>{r.asset.code}</strong>{t(" \u2014 ")}{r.asset.name}{onAsset && <Button variant="text" onClick={() => onAsset(r.asset.id)}>{t("Asset record")}</Button>}{!r.placements.length ? <Badge>{t("Placement pending")}</Badge> : r.placements.map(p => <Button key={p.sceneId + ':' + p.componentId} variant="secondary" onClick={() => void open(p.sceneId, p.componentId)}>{p.sceneName}{t(" / ")}{p.label}{t(" \u2014 ")}{t(p.verification)}</Button>)}</li>)}</ul>{results && !results.results.length && !loading && <p>{t("No registered assets match this selection.")}</p>}</Panel>}
  </>}
  {detail && draft && preview && context && <>
   <div className="locator-layout"><Panel><SceneViewport scene={preview} reference={context.references.find(r => r.id === draft.referenceId)} selectedId={selected} problemAssetIds={problemAssets} onSelect={setSelected} onPlace={place}/>
  {context.canManage && <div className="locator-toolbar"><Field>{t("Component template")}<Select value={kind} onChange={e => setKind(e.target.value as ComponentKind)}>{componentKinds.map(k => <option key={k}>{t(k)}</option>)}</Select></Field><AddButton label={t("Add reusable component at center")} onClick={() => add()} disabled={pending || draft.components.length >= 1000}/><Button variant="secondary" onClick={() => { setPlacing(kind); setTrace(false); setTraceStart(undefined); }} disabled={pending}>{t("Place on reference")}</Button><Button variant="secondary" onClick={() => { setTrace(!trace); setPlacing(''); setTraceStart(undefined); }} aria-pressed={trace} disabled={pending}>{t("Trace conveyor")}</Button></div>}
  {(placing || trace) && <p role="status">{trace ? t(traceStart ? 'Select the second conveyor endpoint.' : 'Select the first conveyor endpoint.') : (t('Select a point on the reference plane to place') + ' ' + t(placing) + '.')}{t("Positions stay provisional.")}<Button variant="text" onClick={() => { setPlacing(''); setTrace(false); setTraceStart(undefined); }}>{t("Cancel placement")}</Button></p>}
  <h2>{t("Components (")}{draft.components.length}{t(")")}</h2><p className="locator-muted">{t("The list is an accessible alternative to selecting objects in 3D.")}</p><ul className="locator-list">{draft.components.map(c => <li key={c.id} className="locator-component-row"><Button variant={selected === c.id ? 'primary' : 'secondary'} aria-pressed={selected === c.id} onClick={() => setSelected(c.id)}>{c.label}{t(" \u2014 ")}{t(c.kind)}</Button>{c.assetId && problemAssets.has(c.assetId) && <Badge>{t("Reported problem")}</Badge>}<Badge>{t(c.verification === 'provisional' ? 'Position pending' : 'Surveyed')}</Badge></li>)}</ul>
  {!draft.components.length && <p>{t("No geometry is traced yet. Add components using the reference and keep physical positions pending.")}</p>}
   </Panel><Panel>
  <Field>{t("Registered asset search")}<Input value={assetLookup} onChange={e => setAssetLookup(e.target.value)} maxLength={160} placeholder={t("Find an exact registered asset")}/></Field>
  {component && context.canManage ? <><ComponentEditor component={component} assets={linkedAssets} pending={pending} change={modify} duplicate={() => { const copy = duplicateComponent(component, application.newId()); update({ ...draft, components: [...draft.components, copy] }); setSelected(copy.id); }} remove={() => { update({ ...draft, components: draft.components.filter(c => c.id !== component.id) }); setSelected(''); }}/><Actions><Button variant="secondary" onClick={() => modify(moveComponent(component, -0.01, 0))}>{t("Move left")}</Button><Button variant="secondary" onClick={() => modify(moveComponent(component, 0.01, 0))}>{t("Move right")}</Button><Button variant="secondary" onClick={() => modify(moveComponent(component, 0, -0.01))}>{t("Move up")}</Button><Button variant="secondary" onClick={() => modify(moveComponent(component, 0, 0.01))}>{t("Move down")}</Button></Actions></> : <p>{t("Select a component to inspect its identity and placement.")}</p>}
  {component && <><p>{t("Linked asset: ")}{linkedAssets.find(a => a.id === component.assetId)?.code || t('Unlinked schematic component')}</p>{component.assetId && onAsset && <Button variant="secondary" onClick={() => onAsset(component.assetId)}>{t("Open asset record")}</Button>}<h3>{t("Reported problems")}</h3><div className="locator-problems">{detail.problems.items.filter(p => p.assetId === component.assetId).map(p => <div className="locator-problem" key={p.kind + ':' + p.id}>{onProblem ? <Button variant="text" onClick={() => onProblem(p.kind, p.id)}>{p.title}</Button> : <strong>{p.title}</strong>}<p className="locator-muted">{t(p.kind)}{t(" \u00B7 ")}{t(p.status)}{t(" \u00B7 ")}{p.recordedAt}</p></div>)}</div>{!detail.problems.items.some(p => p.assetId === component.assetId) && <p className="locator-muted">{t("No reported problem in the available source evidence. This does not establish equipment health.")}</p>}</>}
  {detail.problems.coverage.map(c => <p key={t(c.kind)} className="locator-muted">{t(c.kind)}{t(" evidence: ")}{t(c.status)}</p>)}
   </Panel></div>
   <Disclosure summary="Scene details and private reference" open={detail.scene.revision === 0}><Panel><fieldset disabled={pending || !context.canManage} className="locator-fields"><FieldRow><Field>{t("Scene name")}<Input value={draft.name} maxLength={160} onChange={e => update({ ...draft, name: e.target.value })}/></Field><Field>{t("Group")}<Input value={draft.group} maxLength={160} onChange={e => update({ ...draft, group: e.target.value })}/></Field></FieldRow><Field>{t("Configured location")}<Select value={draft.locationId} onChange={e => update({ ...draft, locationId: e.target.value })}><option value="">{t("Mapping pending")}</option>{context.locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</Select></Field><Field>{t("Private reference")}<Select value={draft.referenceId} onChange={e => update({ ...draft, referenceId: e.target.value, calibration: 'pending', surveyNote: '', components: [] })}><option value="">{t("No reference \u2014 synthetic / manually authored")}</option>{context.references.filter(r => r.kind === 'schematic').map(r => <option key={r.id} value={r.id}>{r.group}{t(" / ")}{r.name}</option>)}</Select></Field><Field>{t("Description")}<Textarea value={draft.description} maxLength={4000} onChange={e => update({ ...draft, description: e.target.value })}/></Field><Field>{t("Calibration evidence")}<Textarea value={draft.surveyNote} maxLength={2000} onChange={e => update({ ...draft, surveyNote: e.target.value })}/></Field><Field>{t("Calibration state")}<Select value={draft.calibration} onChange={e => update({ ...draft, calibration: e.target.value as Content['calibration'] })}><option value="pending">{t("Pending physical calibration")}</option><option value="surveyed" disabled={!draft.surveyNote.trim()}>{t("Survey evidence recorded")}</option></Select></Field></fieldset>{draft.referenceId && <img className="locator-reference" src={referenceUrl(draft.referenceId)} alt="Original private schematic reference"/>}</Panel></Disclosure>
   <Panel><Field>{t("Revision note")}<Input value={note} maxLength={2000} onChange={e => setNote(e.target.value)} placeholder={t("Describe the geometry, mapping or survey change")} disabled={pending || !context.canManage}/></Field><Actions>{context.canManage && <Button disabled={pending || !dirty || !note.trim()} onClick={() => act(async () => { const saved = await application.save({ id: detail.scene.revision === 0 ? '' : detail.scene.id, expectedRevision: detail.scene.revision, note, content: draft }); await open(saved.id, selected); const page = await application.query(); setScenes(page.scenes); setMessage(t('Scene revision saved.')); })}>{t("Save scene revision")}</Button>}<Button variant="secondary" onClick={home} disabled={pending}>{t("Back to overview")}{dirty ? ' ' + t('(discard draft)') : ''}</Button>{detail.scene.revision > 0 && <Button variant="secondary" disabled={pending} onClick={() => act(async () => setHistory(await application.history(detail.scene.id)))}>{t("Revision history")}</Button>}</Actions>{dirty && <p className="locator-muted">{t("Unsaved draft changes.")}</p>}</Panel>
   {history && <Panel><h2>{t("Immutable revision history")}</h2><ul>{history.revisions.map(r => <li key={r.scene.revision}>{t("Revision ")}{r.scene.revision}{t(" \u2014 ")}{r.at}{t(" \u2014 ")}{r.note}{t("(")}{r.actorId}{t(")")}</li>)}</ul>{history.nextBefore > 0 && <Button variant="secondary" onClick={() => act(async () => { const next = await application.history(detail.scene.id, history.nextBefore); setHistory({ revisions: [...history.revisions, ...next.revisions], nextBefore: next.nextBefore }); })}>{t("Load earlier revisions")}</Button>}</Panel>}
  </>}
 </div>;
}
