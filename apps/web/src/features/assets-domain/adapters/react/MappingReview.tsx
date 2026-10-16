import { useEffect, useRef, useState } from "react";
import { Actions, Alert, Button, Disclosure, Field, FieldRow, Input, PageStack, Panel, Select, Table, TableText, TableViewport, Textarea } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { AssetDomainApplication } from "../../application/domain";
import { mappingState, type Context, type Mapping, type MappingData, type MappingPage, type MappingHistory, type RegistryReference, type SourceCandidate } from "../../domain/models";
import { AssetReferencePicker } from "./AssetReferencePicker";
import { AssetStateBadge } from "./AssetStateBadge";
export function MappingReview({
  application,
  context,
  timeZone = "UTC"
}: {
  application: AssetDomainApplication;
  context: Context;
  timeZone?: string;
}) {
  const [page, setPage] = useState<MappingPage>({
      mappings: [],
      total: 0,
      nextCursor: ""
    }),
    [search, setSearch] = useState(""),
    [sourceSearch, setSourceSearch] = useState(""),
    [sources, setSources] = useState<{
      candidates: SourceCandidate[];
      nextCursor: string;
    }>({
      candidates: [],
      nextCursor: ""
    }),
    [selected, setSelected] = useState<Mapping | null>(null),
    [source, setSource] = useState<SourceCandidate | null>(null),
    [history, setHistory] = useState<MappingHistory | null>(null),
    [error, setError] = useState("");
  const requestEpoch = useRef(0);
  const [busy, setBusy] = useState(false),
    [loadedSearch, setLoadedSearch] = useState(""),
    [loadedSourceSearch, setLoadedSourceSearch] = useState("");
  function invalidate() {
    requestEpoch.current += 1;
    setBusy(false);
  }
  async function refresh() {
    const current = ++requestEpoch.current;
    setBusy(true);
    setError("");
    try {
      await Promise.all([application.mappingQuery({
        search,
        limit: 30
      }).then(results => {
        if (requestEpoch.current === current) {
          setPage(results);
          setLoadedSearch(search);
        }
      }), application.candidates(sourceSearch).then(results => {
        if (requestEpoch.current === current) {
          setSources(results);
          setLoadedSourceSearch(sourceSearch);
        }
      })]);
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setBusy(false);
    }
  }
  useEffect(() => {
    setSelected(null);
    setSource(null);
    setHistory(null);
    return () => {
      requestEpoch.current += 1;
    };
  }, [application]);
  useEffect(() => {
    void refresh();
    return () => {
      requestEpoch.current += 1;
    };
  }, [application, search, sourceSearch]);
  async function selectSource(candidate: SourceCandidate) {
    const current = ++requestEpoch.current;
    setBusy(true);
    setError("");
    try {
      const existing = await application.mappingForSource({
        sourceId: candidate.sourceId,
        namespace: candidate.namespace,
        area: candidate.area,
        code: candidate.code
      });
      if (requestEpoch.current === current) {
        setSelected(existing);
        setSource(candidate);
        setHistory(null);
      }
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setBusy(false);
    }
  }
  async function loadHistory(older = false) {
    if (!selected) return;
    const current = ++requestEpoch.current;
    setBusy(true);
    setError("");
    try {
      const next = await application.mappingHistory(selected.id, older ? history?.nextBefore : undefined);
      if (requestEpoch.current === current) setHistory(h => older && h ? {
        ...next,
        revisions: [...h.revisions, ...next.revisions]
      } : next);
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setBusy(false);
    }
  }
  async function loadMore(kind: "mapping" | "source") {
    const current = ++requestEpoch.current;
    setBusy(true);
    setError("");
    try {
      if (kind === "mapping") {
        const next = await application.mappingQuery({
          search: loadedSearch,
          cursor: page.nextCursor,
          limit: 30
        });
        if (requestEpoch.current === current) setPage(p => ({
          ...next,
          mappings: [...p.mappings, ...next.mappings]
        }));
      } else {
        const next = await application.candidates(loadedSourceSearch, sources.nextCursor);
        if (requestEpoch.current === current) setSources(p => ({
          ...next,
          candidates: [...p.candidates, ...next.candidates]
        }));
      }
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setBusy(false);
    }
  }
  function cancel() {
    invalidate();
    setSelected(null);
    setSource(null);
    setHistory(null);
    setError("");
  }
  const at = (value: string) => new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(value));
  return <PageStack>{error && <Alert>{error}</Alert>}{busy && <p role="status">{t("Loading source mappings…")}</p>}{selected || source ? <><MappingEditor key={selected ? selected.id + ":" + selected.revision : JSON.stringify(source)} application={application} mapping={selected ?? undefined} source={source ?? undefined} canManage={context.canManage} onSaved={() => {
        cancel();
        void refresh();
      }} onCancel={() => {
        cancel();
        void refresh();
      }} />{selected && <Disclosure summary={t("Mapping revision history")} variant="panel"><Button disabled={busy} onClick={() => void loadHistory()}>{t("Load mapping history")}</Button>{history?.revisions.map(r => <Panel key={r.mapping.revision}><p>{r.actorName} · {at(r.at)} · {t("Revision")}: {r.mapping.revision}</p><p><AssetStateBadge state={mappingState(r.mapping)} /></p><p className="iop-prose">{r.mapping.data.note}</p><p>{r.reason}</p></Panel>)}{history && history.nextBefore > 0 && <Button disabled={busy} onClick={() => void loadHistory(true)}>{t("Load older revisions")}</Button>}</Disclosure>}</> : <>
  <Panel><PageStack><FieldRow><Field>{t("Find reviewed source mappings")}<Input value={search} maxLength={200} onChange={e => {
            invalidate();
            setSearch(e.target.value);
          }} /></Field><Button variant="secondary" disabled={!search} onClick={() => { invalidate(); setSearch(""); }}>{t("Clear mapping search")}</Button></FieldRow><TableViewport><Table variant="records" aria-label={t("Reviewed canonical mappings")}><thead><tr><th data-align="text">{t("Source tuple")}</th><th data-align="status">{t("Mapping state")}</th><th data-align="number">{t("Candidate count")}</th><th data-align="number">{t("Revision")}</th></tr></thead><tbody>{page.mappings.map(m => <tr key={m.id}><td data-align="text"><Button variant="text" onClick={() => {
                    invalidate();
                    setError("");
                    setSelected(m);
                    setSource(null);
                    setHistory(null);
                  }}>{m.data.source.area} / {m.data.source.code}</Button><TableText>{m.data.note}</TableText></td><td data-align="status"><AssetStateBadge state={mappingState(m)} /></td><td data-align="number">{m.data.candidateIds.length}</td><td data-align="number">{m.revision}</td></tr>)}{!busy && !page.mappings.length && <tr><td colSpan={4}>{t("No reviewed mappings match this search.")}</td></tr>}</tbody></Table></TableViewport><p aria-live="polite">{page.mappings.length} / {page.total} {t("reviewed mappings")}</p>{page.nextCursor && <Button disabled={busy || search !== loadedSearch} onClick={() => void loadMore("mapping")}>{t("Load more mappings")}</Button>}</PageStack></Panel>
  <Panel><PageStack><FieldRow><Field>{t("Find imported source identifiers")}<Input value={sourceSearch} maxLength={200} onChange={e => {
            invalidate();
            setSourceSearch(e.target.value);
          }} /></Field><Button variant="secondary" disabled={!sourceSearch} onClick={() => { invalidate(); setSourceSearch(""); }}>{t("Clear source search")}</Button></FieldRow><p className="iop-prose">{t("An imported identifier is evidence, not proof of a physical asset. Select a tuple to review explicit candidates.")}</p><TableViewport><Table variant="records" aria-label={t("Imported source identifiers")}><thead><tr><th data-align="text">{t("Source tuple")}</th><th data-align="number">{t("Source records")}</th></tr></thead><tbody>{sources.candidates.map((c, i) => <tr key={i}><td data-align="text"><Button variant="text" onClick={() => {
                    void selectSource(c);
                  }}>{c.area} / {c.code}</Button></td><td data-align="number">{c.records}</td></tr>)}{!busy && !sources.candidates.length && <tr><td colSpan={2}>{t("No imported source identifiers match this search.")}</td></tr>}</tbody></Table></TableViewport><p aria-live="polite">{t("{0} source identifiers shown", [sources.candidates.length])}</p>{sources.nextCursor && <Button disabled={busy || sourceSearch !== loadedSourceSearch} onClick={() => void loadMore("source")}>{t("Load more source identifiers")}</Button>}</PageStack></Panel>
 </>}</PageStack>;
}
function MappingEditor({
  application,
  mapping,
  source,
  canManage,
  onSaved,
  onCancel
}: {
  application: AssetDomainApplication;
  mapping?: Mapping;
  source?: SourceCandidate;
  canManage: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [id] = useState(() => mapping?.id ?? application.newId()),
    [data, setData] = useState<MappingData>(() => mapping?.data ?? {
      source: {
        sourceId: source!.sourceId,
        namespace: source!.namespace,
        area: source!.area,
        code: source!.code
      },
      status: "pending",
      candidateIds: [],
      note: ""
    }),
    [reason, setReason] = useState(""),
    [candidate, setCandidate] = useState<RegistryReference | null>(null),
    [names, setNames] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const saveEpoch = useRef(0);
  useEffect(() => () => {
    saveEpoch.current += 1;
  }, [application]);
  useEffect(() => {
    let active = true;
    for (const target of data.candidateIds) application.detail(target).then(d => {
      if (active) setNames(n => ({
        ...n,
        [target]: d.asset.code
      }));
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [application, mapping]);
  return <Panel><form className="iop-asset-domain-form" onSubmit={async e => {
      e.preventDefault();
      const current = ++saveEpoch.current;
      setBusy(true);
      setError("");
      try {
        await application.saveMapping({
          id,
          expectedRevision: mapping?.revision ?? 0,
          reason,
          data
        });
        if (saveEpoch.current === current) onSaved();
      } catch (e) {
        if (saveEpoch.current === current) setError((e as Error).message);
      } finally {
        if (saveEpoch.current === current) setBusy(false);
      }
    }}>
  <h2>{data.source.area} / {data.source.code}</h2><p>{t("Source namespace")}: {data.source.namespace} · {data.source.sourceId}</p><p>{t("Approved mappings require exactly one validated registry identity. Multiple pending candidates remain ambiguous. Source facts are never rewritten.")}</p>
  {error && <Alert>{error}</Alert>}<Field>{t("Mapping review decision")}<Select disabled={!canManage || busy} value={data.status} onChange={e => setData(d => ({
          ...d,
          status: e.target.value as MappingData["status"]
        }))}><option value="pending">{t("Pending")}</option><option value="approved">{t("Approved")}</option><option value="rejected">{t("Rejected")}</option></Select></Field>
  <AssetReferencePicker application={application} label={t("Canonical asset candidate")} value={candidate?.id ?? ""} currentLabel={candidate?.code} disabled={!canManage || busy} onChange={setCandidate} /><Button disabled={!canManage || busy || !candidate || data.candidateIds.includes(candidate.id)} onClick={() => {
        if (candidate) {
          setData(d => ({
            ...d,
            candidateIds: [...d.candidateIds, candidate.id]
          }));
          setNames(n => ({
            ...n,
            [candidate.id]: candidate.code
          }));
          setCandidate(null);
        }
      }}>{t("Add canonical candidate")}</Button>
  {data.candidateIds.map(target => <p key={target}>{names[target] || t("Loading candidate")} <Button disabled={!canManage || busy} variant="text" onClick={() => setData(d => ({
          ...d,
          candidateIds: d.candidateIds.filter(id => id !== target)
        }))}>{t("Remove candidate")}</Button></p>)}
  <Field>{t("Mapping review notes")}<Textarea disabled={!canManage || busy} required maxLength={4000} value={data.note} onChange={e => setData(d => ({
          ...d,
          note: e.target.value
        }))} /></Field><Field>{t("Change reason")}<Textarea disabled={!canManage || busy} required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></Field><Actions className="iop-form-actions"><Button variant="secondary" onClick={() => {
          saveEpoch.current += 1;
          onCancel();
        }}>{t("Back")}</Button>{canManage && <Button type="submit" disabled={busy}>{t("Save mapping review")}</Button>}</Actions>
 </form></Panel>;
}
