import { useEffect, useRef, useState } from "react";
import { Actions, Button, DateField, Field, FieldRow, Input, PageStack, Panel, Select, Textarea } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { ImprovementApplication } from "../../application/improvement";
import { emptyAction, statuses, type ActionData, type ActionView, type Catalog, type IssueReference, type SaveAction } from "../../domain/models";
import { statusLabel } from "./labels";
export function ImprovementForm({
  application,
  catalog,
  action,
  pending,
  onSave,
  onCancel
}: {
  application: ImprovementApplication;
  catalog: Catalog;
  action?: ActionView;
  pending: boolean;
  onSave: (input: SaveAction) => void;
  onCancel: () => void;
}) {
  const [id] = useState(() => action?.id ?? application.newId());
  const [data, setData] = useState<ActionData>(() => action?.data ?? emptyAction(catalog.locations[0]?.id));
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState<IssueReference[]>([]);
  const [cursor, setCursor] = useState("");
  const [issueError, setIssueError] = useState("");
  const [assetSearch,setAssetSearch] = useState('');
  const [assetOptions,setAssetOptions] = useState(catalog.assets);
  const [assetCursor,setAssetCursor] = useState('');
  const [assetTotal,setAssetTotal] = useState(catalog.assets.length);
  const [assetError,setAssetError] = useState('');
  const [assetLoading,setAssetLoading] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [assetRetry, setAssetRetry] = useState(0);
  const [issueRetry, setIssueRetry] = useState(0);
  const assetEpoch = useRef(0);
  const issueEpoch = useRef(0);
  const assetRequest = useRef<number | null>(null);
  const issueRequest = useRef<number | null>(null);
  useEffect(() => {
    const token = ++assetEpoch.current;
    assetRequest.current = token;
    setAssetLoading(true);
    setAssetOptions([]);
    setAssetCursor('');
    setAssetError('');
    application.assetChoices(assetSearch,'',catalog.assets).then(page => {
      if (assetEpoch.current !== token) return;
      setAssetOptions(page.assets);setAssetCursor(page.nextCursor);setAssetTotal(page.total);setAssetError('');
    }).catch(error => {if(assetEpoch.current === token)setAssetError(error.message);}).finally(()=>{
      if(assetEpoch.current === token) { assetRequest.current = null; setAssetLoading(false); }
    });
    return () => {assetEpoch.current++; assetRequest.current = null;};
  },[application,assetSearch,catalog.assets,assetRetry]);
  useEffect(() => {
    const token = ++issueEpoch.current;
    issueRequest.current = token;
    setIssueLoading(true);
    setIssues([]);
    setCursor('');
    setIssueError('');
    application.issues(search).then(r => {
      if (issueEpoch.current === token) {
        setIssues(r.issues);
        setCursor(r.nextCursor);
        setIssueError("");
      }
    }).catch(e => {
      if (issueEpoch.current === token) setIssueError(e.message);
    }).finally(() => {
      if (issueEpoch.current === token) { issueRequest.current = null; setIssueLoading(false); }
    });
    return () => {
      issueEpoch.current++;
      issueRequest.current = null;
    };
  }, [application, search, issueRetry]);
  async function loadAssets() {
    if (!assetCursor || assetRequest.current !== null) return;
    const token = ++assetEpoch.current;
    assetRequest.current = token;
    setAssetLoading(true);
    setAssetError('');
    try {
      const page = await application.assetChoices(assetSearch, assetCursor, catalog.assets);
      if (assetEpoch.current !== token) return;
      setAssetOptions(current => [...new Map([...current, ...page.assets].map(asset => [asset.id, asset])).values()]);
      setAssetCursor(page.nextCursor);
      setAssetTotal(page.total);
    } catch (reason) {
      if (assetEpoch.current === token) setAssetError((reason as Error).message);
    } finally {
      if (assetEpoch.current === token) { assetRequest.current = null; setAssetLoading(false); }
    }
  }
  async function loadIssues() {
    if (!cursor || issueRequest.current !== null) return;
    const token = ++issueEpoch.current;
    issueRequest.current = token;
    setIssueLoading(true);
    setIssueError('');
    try {
      const page = await application.issues(search, cursor);
      if (issueEpoch.current !== token) return;
      setIssues(current => [...new Map([...current, ...page.issues].map(issue => [issue.id, issue])).values()]);
      setCursor(page.nextCursor);
    } catch (reason) {
      if (issueEpoch.current === token) setIssueError((reason as Error).message);
    } finally {
      if (issueEpoch.current === token) { issueRequest.current = null; setIssueLoading(false); }
    }
  }
  const change = <K extends keyof ActionData,>(key: K, value: ActionData[K]) => setData(d => ({
    ...d,
    [key]: value
  }));
  return <Panel><form onSubmit={e => {
      e.preventDefault();
      onSave({
        id,
        expectedRevision: action?.revision ?? 0,
        reason,
        data
      });
    }}><fieldset className="iop-improvement-fields" disabled={pending}><PageStack>
    <Field>{t("Action title")}<Input required maxLength={160} value={data.title} onChange={e => change("title", e.target.value)} /></Field>
    <Field>{t("Hypothesis and context")}<Textarea maxLength={8000} value={data.hypothesis} onChange={e => change("hypothesis", e.target.value)} /></Field>
    <FieldRow><Field>{t("Location")}<Select required value={data.locationId} onChange={e => change("locationId", e.target.value)}>{catalog.locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</Select></Field>
      <Field>{t("Owner")}<Select value={data.ownerId} disabled={!catalog.canCoordinate} onChange={e => change("ownerId", e.target.value)}><option value="">{t("Unassigned")}</option>{catalog.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}{data.ownerId && !catalog.people.some(p => p.id === data.ownerId) && <option value={data.ownerId}>{action?.ownerName || data.ownerId} ({t("Inactive")})</option>}</Select></Field>
      <DateField label={t("Target date")} value={data.dueDate} onChange={e => change("dueDate", e.target.value)} /></FieldRow>
    <Field>{t('Find registered asset')}<Input value={assetSearch} maxLength={160} onChange={event=>{ assetEpoch.current++; setAssetSearch(event.target.value); }}/></Field>
    <p>{assetOptions.length} {t('of')} {assetTotal} {t('registered assets')}. {t('Refine the search to find other assets.')}</p>
    {assetLoading && <p role="status">{t("Loading asset choices…")}</p>}
    {assetError&&<><p role="alert">{assetError}</p><Button variant="secondary" disabled={assetLoading} onClick={() => setAssetRetry(value => value + 1)}>{t("Retry asset choices")}</Button></>}
    {assetCursor&&<Button variant="secondary" disabled={pending||assetLoading} onClick={() => void loadAssets()}>{t('Load more assets')}</Button>}
    <FieldRow><Field>{t("Linked asset")}<Select value={data.assetId} onChange={e => change("assetId", e.target.value)}><option value="">{t("No linked asset")}</option>{assetOptions.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}{data.assetId && !assetOptions.some(a => a.id === data.assetId) && <option value={data.assetId}>{action?.assetName || data.assetId} ({t("Historical reference")})</option>}</Select></Field>
      <Field>{t("Find reported issue")}<Input value={search} maxLength={200} onChange={e => { issueEpoch.current++; setSearch(e.target.value); }} /></Field>
      <Field>{t("Linked issue")}<Select value={data.issueId} onChange={e => change("issueId", e.target.value)}><option value="">{t("No linked issue")}</option>{issues.map(i => <option key={i.id} value={i.id}>{i.title} · {i.equipmentCode}</option>)}{data.issueId && !issues.some(i => i.id === data.issueId) && <option value={data.issueId}>{action?.issueTitle || data.issueId}</option>}</Select></Field></FieldRow>
    {issueLoading && <p role="status">{t("Loading issue choices…")}</p>}
    {issueError && <><p role="alert">{issueError}</p><Button variant="secondary" disabled={issueLoading} onClick={() => setIssueRetry(value => value + 1)}>{t("Retry issue choices")}</Button></>}
    {cursor && <Button variant="secondary" disabled={pending || issueLoading} onClick={() => void loadIssues()}>{t("Load more issues")}</Button>}
    <Field>{t("Improvement objective")}<Textarea required maxLength={2000} value={data.target.objective} onChange={e => change("target", {
          ...data.target,
          objective: e.target.value
        })} /></Field>
    <FieldRow><Field>{t("Target metric")}<Select value={data.target.metric} onChange={e => change("target", {
            ...data.target,
            metric: e.target.value as ActionData["target"]["metric"]
          })}><option value="frequency">{t("Reported frequency")}</option><option value="alarm-seconds">{t("Accumulated alarm seconds")}</option></Select></Field>
      <Field>{t("Target reduction (%)")}<Input type="number" min={0} max={100} step="any" value={data.target.reductionPercent ?? ""} onChange={e => change("target", {
            ...data.target,
            reductionPercent: e.target.value === "" ? null : Number(e.target.value)
          })} /></Field></FieldRow>
    <p>{t("The target is a hypothesis. Analytical comparisons show observed change per imported reporting date, with unknown production exposure.")}</p>
    <FieldRow><Field>{t("Status")}<Select value={data.status} onChange={e => change("status", e.target.value as ActionData["status"])}>{(action ? statuses : ["planned"] as const).map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><DateField label={t("Implemented date")} required={["implemented", "evaluated"].includes(data.status)} value={data.implementedDate} onChange={e => change("implementedDate", e.target.value)} /></FieldRow>
    {data.status === "blocked" && <Field>{t("Blocked reason")}<Textarea required maxLength={2000} value={data.blockedReason} onChange={e => change("blockedReason", e.target.value)} /></Field>}
    {data.status === "cancelled" && <Field>{t("Cancellation reason")}<Textarea required maxLength={2000} value={data.cancellationReason} onChange={e => change("cancellationReason", e.target.value)} /></Field>}
    <Field>{t("Observed result")}<Textarea required={data.status === "evaluated"} maxLength={8000} value={data.result} onChange={e => change("result", e.target.value)} /></Field>
    {action && <Field>{t("Change reason")}<Textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></Field>}
    <Actions className="iop-form-actions"><Button disabled={pending} onClick={onCancel}>{t("Cancel")}</Button><Button type="submit" variant="primary" disabled={pending}>{t("Save action")}</Button></Actions>
  </PageStack></fieldset></form></Panel>;
}
