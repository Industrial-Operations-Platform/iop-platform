import { useEffect, useRef, useState } from "react";
import { Actions, Alert, Button, DetailFacts, Disclosure, Field, FieldRow, Input, PageStack, Panel, RefreshButton, SectionHeading, SortableHeader, Table, TableText, TableViewport, ViewNavigation } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { AssetDomainApplication } from "../../application/domain";
import type { Context, Detail, ReferencePage, RegistryReference, ModelHistory, SaveEnrichment } from "../../domain/models";
import { TypeCatalogEditor } from "./TypeCatalogEditor";
import { EnrichmentEditor } from "./EnrichmentEditor";
import { MappingReview } from "./MappingReview";
import { CanonicalPareto } from "./CanonicalPareto";
import { AssetStateBadge, assetStateLabel } from "./AssetStateBadge";
import "./asset-domain.css";
export function AssetDomainWorkspace({
  application,
  timeZone,
  homeVisit = 0,
  initialAssetId = "",
  onOpenAsset
}: {
  application: AssetDomainApplication;
  timeZone: string;
  homeVisit?: number;
  initialAssetId?: string;
  onOpenAsset?: (id: string) => void;
}) {
  const [context, setContext] = useState<Context | null>(null),
    [page, setPage] = useState<ReferencePage>({
      assets: [],
      enrichments: [],
      total: 0,
      nextCursor: ""
    }),
    [search, setSearch] = useState(""),
    [view, setView] = useState<"inventory" | "types" | "mappings" | "pareto">("inventory"),
    [detail, setDetail] = useState<Detail | null>(null),
    [history, setHistory] = useState<ModelHistory | null>(null),
    [editing, setEditing] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const at = (date: string) => new Intl.DateTimeFormat(locale(), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(new Date(date));
  const requestEpoch = useRef(0);
  const [loadedSearch, setLoadedSearch] = useState("");
  function invalidate() {
    requestEpoch.current += 1;
    setPending(false);
  }
  async function refresh(query = search) {
    const current = ++requestEpoch.current;
    setPending(true);
    setError("");
    try {
      const [config, results] = await Promise.all([application.catalog(), application.references({
        search: query,
        limit: 30
      })]);
      if (requestEpoch.current !== current) return false;
      setContext(config);
      setPage(results);
      setLoadedSearch(query);
      return true;
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
      return false;
    } finally {
      if (requestEpoch.current === current) setPending(false);
    }
  }
  async function open(id: string) {
    const current = ++requestEpoch.current;
    setPending(true);
    setError("");
    try {
      const [asset, revisions] = await Promise.all([application.detail(id), application.history(id)]);
      if (requestEpoch.current !== current) return;
      setDetail(asset);
      setHistory(revisions);
      setEditing(false);
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setPending(false);
    }
  }
  useEffect(() => {
    setDetail(null);
    setHistory(null);
    setContext(null);
    setPage({
      assets: [],
      enrichments: [],
      total: 0,
      nextCursor: ""
    });
    setEditing(false);
    setView("inventory");
    void refresh().then(current => {
      if (current && initialAssetId) void open(initialAssetId);
    });
    return () => {
      requestEpoch.current += 1;
    };
  }, [application, homeVisit, initialAssetId]);
  async function save(input: SaveEnrichment) {
    const current = ++requestEpoch.current;
    setPending(true);
    setError("");
    try {
      await application.save(input);
      if (requestEpoch.current !== current) return;
      const [asset, revisions, config, results] = await Promise.all([application.detail(input.assetId), application.history(input.assetId), application.catalog(), application.references({
        search,
        limit: 30
      })]);
      if (requestEpoch.current !== current) return;
      setDetail(asset);
      setHistory(revisions);
      setContext(config);
      setPage(results);
      setLoadedSearch(search);
      setEditing(false);
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setPending(false);
    }
  }
  async function loadMore() {
    const current = ++requestEpoch.current;
    setPending(true);
    setError("");
    try {
      const next = await application.references({
        search: loadedSearch,
        cursor: page.nextCursor,
        limit: 30
      });
      if (requestEpoch.current === current) setPage(p => ({
        ...next,
        assets: [...p.assets, ...next.assets],
        enrichments: [...p.enrichments, ...next.enrichments]
      }));
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setPending(false);
    }
  }
  async function olderHistory() {
    if (!detail || !history) return;
    const current = ++requestEpoch.current;
    setPending(true);
    setError("");
    try {
      const next = await application.history(detail.asset.id, history.nextBefore);
      if (requestEpoch.current === current) setHistory(h => h ? {
        ...next,
        revisions: [...h.revisions, ...next.revisions]
      } : next);
    } catch (e) {
      if (requestEpoch.current === current) setError((e as Error).message);
    } finally {
      if (requestEpoch.current === current) setPending(false);
    }
  }
  function home() {
    invalidate();
    setDetail(null);
    setHistory(null);
    setEditing(false);
    setView("inventory");
    void refresh();
  }
  const [ordering, setOrdering] = useState<{ key: "code" | "type" | "survey" | "parent"; direction: "asc" | "desc" }>({ key: "code", direction: "asc" });
  const complete = !pending && search === loadedSearch && !page.nextCursor && page.assets.length === page.total;
  const modelsByAsset = new Map(page.enrichments.map(model => [model.assetId, model]));
  const cellValue = (asset: RegistryReference, key: typeof ordering.key) => {
    const model = modelsByAsset.get(asset.id);
    if (key === "code") return asset.code;
    if (key === "type") return context?.catalog.types.find(t => t.id === model?.typeId)?.label || t("Not recorded");
    if (key === "survey") return assetStateLabel(model?.surveyStatus ?? "pending");
    return t(model?.parentId ? "Has parent" : "No parent");
  };
  const inventory = complete ? [...page.assets].sort((a, b) => cellValue(a, ordering.key).localeCompare(cellValue(b, ordering.key), locale(), { numeric: true }) * (ordering.direction === "asc" ? 1 : -1)) : page.assets;
  return <PageStack><SectionHeading section={t("Asset management")} view={detail ? detail.asset.code : t({
      inventory: "Inventory model",
      types: "Type catalog",
      mappings: "Source mappings",
      pareto: "Canonical Pareto"
    }[view])} onHome={home} description={t("Configure reusable identities, composition, metadata and explicit source reviews. Physical survey remains an operator task.")} actions={<Actions>{detail && context?.canManage && <Button disabled={pending || detail.asset.status === "retired"} onClick={() => setEditing(true)}>{t("Edit asset model")}</Button>}<RefreshButton label={t("Refresh asset management")} busy={pending} onClick={() => detail ? void open(detail.asset.id) : void refresh()} /></Actions>} />
  {error && <Alert>{error}</Alert>}{pending && <p role="status">{t("Loading asset management…")}</p>}{!detail && <ViewNavigation label={t("Asset management views")} selected={view} onSelect={value => {
      invalidate();
      setView(value);
      setError("");
      if (!context) void refresh();
    }} placement="tabs" items={[{
      id: "inventory",
      label: t("Inventory model")
    }, {
      id: "types",
      label: t("Type catalog")
    }, {
      id: "mappings",
      label: t("Source mappings")
    }, {
      id: "pareto",
      label: t("Canonical Pareto")
    }]} />}
  {detail && context ? editing ? <EnrichmentEditor key={detail.asset.id + ":" + (detail.enrichment?.revision ?? 0)} application={application} context={context} detail={detail} pending={pending} onSave={input => void save(input)} onCancel={() => {
      invalidate();
      setEditing(false);
    }} /> : <>
   <Panel>
    <DetailFacts items={[
      { label: t("Survey decision"), value: <AssetStateBadge state={detail.enrichment?.data.survey.status ?? "pending"} /> },
      { label: t("Registry lifecycle"), value: <AssetStateBadge state={detail.asset.status} /> },
      { label: t("Configured asset type"), value: context.catalog.types.find(t => t.id === detail.enrichment?.data.typeId)?.label || t("Not recorded") },
      { label: t("Manufacturer"), value: detail.enrichment?.data.manufacturer || t("Not recorded") },
      { label: t("Model"), value: detail.enrichment?.data.model || t("Not recorded") },
      { label: t("Serial number"), value: detail.enrichment?.data.serial || t("Not recorded") },
      { label: t("Composition parent"), value: detail.related.find(r => r.id === detail.enrichment?.data.parentId)?.code || t("Not linked") },
      ...Object.entries(detail.enrichment?.data.metadata ?? {}).map(([key, value]) => ({ label: context.catalog.types.find(t => t.id === detail.enrichment?.data.typeId)?.fields.find(f => f.key === key)?.label ?? key, value: typeof value === "boolean" ? t(value ? "Yes" : "No") : String(value) })),
      ...((detail.enrichment?.data.controllers ?? []).map(r => ({ label: t("Controlled by"), value: (detail.related.find(a => a.id === r.targetId)?.code || t("Unavailable")) + " · " + (r.channel || t("Channel not recorded")) }))),
      { label: t("Survey evidence reference"), value: detail.enrichment?.data.survey.evidenceReference || t("Not recorded") },
      ...(detail.enrichment?.surveyReviewerName ? [{ label: t("Reviewed by"), value: detail.enrichment.surveyReviewerName + (detail.enrichment.surveyReviewedAt ? " · " + at(detail.enrichment.surveyReviewedAt) : "") }] : []),
    ]} />
    {detail.enrichment?.data.survey.note && <p className="iop-asset-domain-prose">{detail.enrichment.data.survey.note}</p>}
    <p className="iop-asset-domain-prose">{t("Software review does not establish a completed physical plant survey.")}</p>
    {onOpenAsset && <Button variant="secondary" onClick={() => onOpenAsset(detail.asset.id)}>{t("Open digital asset record")}</Button>}
   </Panel>
   <Disclosure summary={t("Asset model history")} variant="panel" open><TableViewport><Table variant="records" aria-label={t("Asset model revisions")}><thead><tr><th data-align="text">{t("Change reason")}</th><th data-align="text">{t("Author")}</th><th>{t("Recorded")}</th><th data-align="number">{t("Revision")}</th></tr></thead><tbody>{!pending && !history?.revisions.length && <tr><td colSpan={4}>{t("No asset model revisions recorded.")}</td></tr>}{history?.revisions.map(r => <tr key={r.enrichment.revision}><td data-align="text"><TableText>{r.reason}</TableText></td><td data-align="text">{r.actorName}</td><td>{at(r.at)}</td><td data-align="number">{r.enrichment.revision}</td></tr>)}</tbody></Table></TableViewport>{history && history.nextBefore > 0 && <Button disabled={pending} onClick={() => void olderHistory()}>{t("Load older revisions")}</Button>}</Disclosure>
  </> : view === "types" && context ? context.canManage ? <TypeCatalogEditor key={context.catalog.revision} catalog={context.catalog} pending={pending} onSave={async types => {
      const current = ++requestEpoch.current;
      setPending(true);
      setError("");
      try {
        await application.configure(context.catalog.revision, types);
        if (requestEpoch.current === current) await refresh();
      } catch (e) {
        if (requestEpoch.current === current) setError((e as Error).message);
      } finally {
        if (requestEpoch.current === current) setPending(false);
      }
    }} /> : <p>{t("You can read the asset model but cannot configure types.")}</p> : view === "mappings" && context ? <MappingReview application={application} context={context} timeZone={timeZone} /> : view === "pareto" ? <CanonicalPareto application={application} /> : <>
   <Panel><form onSubmit={e => { e.preventDefault(); void refresh(); }}>
     <FieldRow><Field>{t("Search asset inventory")}<Input value={search} maxLength={200} onChange={e => { invalidate(); setSearch(e.target.value); }} /></Field>
       <Actions><Button type="submit" disabled={pending}>{t("Search")}</Button><Button variant="secondary" disabled={pending || (!search && !loadedSearch)} onClick={() => { setSearch(""); void refresh(""); }}>{t("Clear inventory search")}</Button></Actions>
     </FieldRow>
   </form></Panel>
   <TableViewport><Table variant="records" aria-label={t("Asset model inventory")}><thead><tr>{([
     ["code", "Registered asset", "text"], ["type", "Configured type", "text"], ["survey", "Survey decision", "status"], ["parent", "Composition", "text"]
   ] as const).map(([key, label, align]) => complete
     ? <SortableHeader key={key} align={align} direction={ordering.key === key ? ordering.direction : undefined} onClick={() => setOrdering(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }))}>{t(label)}</SortableHeader>
     : <th key={key} scope="col" data-align={align}>{t(label)}</th>)}</tr></thead><tbody>{inventory.map(asset => {
     const model = modelsByAsset.get(asset.id);
     return <tr key={asset.id}><td data-align="text"><Button variant="text" onClick={() => void open(asset.id)}>{asset.code}</Button></td><td data-align="text">{context?.catalog.types.find(t => t.id === model?.typeId)?.label || t("Not recorded")}</td><td data-align="status"><AssetStateBadge state={model?.surveyStatus ?? "pending"} /></td><td data-align="text">{t(model?.parentId ? "Has parent" : "No parent")}</td></tr>;
   })}{context && !pending && !inventory.length && <tr><td colSpan={4}>{t("No assets match this inventory search.")}</td></tr>}</tbody></Table></TableViewport>
   <p aria-live="polite">{page.assets.length} / {page.total} {t("registry matches")}</p>
   {page.nextCursor && <p className="iop-asset-domain-muted">{t("Load all matches to enable column ordering, or refine the search.")}</p>}
   {page.nextCursor && <Button disabled={pending || search !== loadedSearch} onClick={() => void loadMore()}>{t("Load more assets")}</Button>}

  </>}
 </PageStack>;
}
