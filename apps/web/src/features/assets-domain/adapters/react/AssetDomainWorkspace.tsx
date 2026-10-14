import { useEffect, useRef, useState } from "react";
import { Actions, Alert, Badge, Button, Disclosure, Field, Input, Panel, RefreshButton, SectionHeading, Table, TableText, TableViewport, ViewNavigation } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { AssetDomainApplication } from "../../application/domain";
import type { Context, Detail, ReferencePage, ModelHistory, SaveEnrichment } from "../../domain/models";
import { TypeCatalogEditor } from "./TypeCatalogEditor";
import { EnrichmentEditor } from "./EnrichmentEditor";
import { MappingReview } from "./MappingReview";
import { CanonicalPareto } from "./CanonicalPareto";
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
  async function refresh() {
    const current = ++requestEpoch.current;
    setPending(true);
    setError("");
    try {
      const [config, results] = await Promise.all([application.catalog(), application.references({
        search,
        limit: 30
      })]);
      if (requestEpoch.current !== current) return false;
      setContext(config);
      setPage(results);
      setLoadedSearch(search);
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
  return <><SectionHeading section={t("Asset management")} view={detail ? detail.asset.code : t({
      inventory: "Inventory model",
      types: "Type catalog",
      mappings: "Source mappings",
      pareto: "Canonical Pareto"
    }[view])} onHome={home} description={t("Configure reusable identities, composition, metadata and explicit source reviews. Physical survey remains an operator task.")} actions={<Actions>{detail && context?.canManage && <Button disabled={pending || detail.asset.status === "retired"} onClick={() => setEditing(true)}>{t("Edit asset model")}</Button>}<RefreshButton label={t("Refresh asset management")} busy={pending} onClick={() => detail ? void open(detail.asset.id) : void refresh()} /></Actions>} />
  {error && <Alert>{error}</Alert>}{!detail && <ViewNavigation label={t("Asset management views")} selected={view} onSelect={value => {
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
   <Panel><p><Badge tone={detail.enrichment?.data.survey.status === "validated" ? "success" : detail.enrichment?.data.survey.status === "rejected" ? "warning" : "neutral"}>{t("Survey decision")}: {detail.enrichment?.data.survey.status ?? "pending"}</Badge> · {t("Registry lifecycle")}: {detail.asset.status}</p><p>{t("Configured asset type")}: {context.catalog.types.find(t => t.id === detail.enrichment?.data.typeId)?.label || t("Not recorded")}</p><p>{t("Manufacturer")}: {detail.enrichment?.data.manufacturer || t("Not recorded")} · {t("Model")}: {detail.enrichment?.data.model || t("Not recorded")} · {t("Serial number")}: {detail.enrichment?.data.serial || t("Not recorded")}</p>
   <p>{t("Composition parent")}: {detail.related.find(r => r.id === detail.enrichment?.data.parentId)?.code || t("Not linked")}</p>{detail.enrichment?.data.controllers.map((r, i) => <p key={i}>{t("Controlled by")}: {detail.related.find(a => a.id === r.targetId)?.code || t("Unavailable")} · {r.channel || t("Channel not recorded")}</p>)}
   <p>{detail.enrichment?.data.survey.note}</p><p>{t("Survey evidence reference")}: {detail.enrichment?.data.survey.evidenceReference || t("Not recorded")}</p>{detail.enrichment?.surveyReviewerName && <p>{t("Reviewed by")}: {detail.enrichment.surveyReviewerName} · {at(detail.enrichment.surveyReviewedAt)}</p>}<p>{t("Software review does not establish a completed physical plant survey.")}</p>{Object.entries(detail.enrichment?.data.metadata ?? {}).map(([key, value]) => <p key={key}>{context.catalog.types.find(t => t.id === detail.enrichment?.data.typeId)?.fields.find(f => f.key === key)?.label ?? key}: {String(value)}</p>)}{onOpenAsset && <Button onClick={() => onOpenAsset(detail.asset.id)}>{t("Open digital asset record")}</Button>}</Panel>
   <Disclosure summary={t("Asset model history")} open><TableViewport><Table aria-label={t("Asset model revisions")}><thead><tr><th>{t("Change reason")}</th><th>{t("Author")}</th><th>{t("Recorded")}</th><th>{t("Revision")}</th></tr></thead><tbody>{history?.revisions.map(r => <tr key={r.enrichment.revision}><td><TableText>{r.reason}</TableText></td><td>{r.actorName}</td><td>{at(r.at)}</td><td>{r.enrichment.revision}</td></tr>)}</tbody></Table></TableViewport>{history && history.nextBefore > 0 && <Button disabled={pending} onClick={() => void olderHistory()}>{t("Load older revisions")}</Button>}</Disclosure>
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
    }} /> : <p>{t("You can read the asset model but cannot configure types.")}</p> : view === "mappings" && context ? <MappingReview application={application} context={context} /> : view === "pareto" ? <CanonicalPareto application={application} /> : <>
   <Panel><form onSubmit={e => {
          e.preventDefault();
          void refresh();
        }}><Field>{t("Search asset inventory")}<Input value={search} maxLength={200} onChange={e => {
              invalidate();
              setSearch(e.target.value);
            }} /></Field><Actions className="iop-form-actions"><Button type="submit" disabled={pending}>{t("Search")}</Button></Actions></form></Panel>
   <TableViewport><Table aria-label={t("Asset model inventory")}><thead><tr><th>{t("Registered asset")}</th><th>{t("Configured type")}</th><th>{t("Survey decision")}</th><th>{t("Composition")}</th></tr></thead><tbody>{page.assets.map(asset => {
              const model = page.enrichments.find(e => e.assetId === asset.id);
              return <tr key={asset.id}><td><Button variant="text" onClick={() => void open(asset.id)}>{asset.code}</Button></td><td>{context?.catalog.types.find(t => t.id === model?.typeId)?.label || t("Not recorded")}</td><td>{model?.surveyStatus || "pending"}</td><td>{model?.parentId ? t("Has parent") : t("No parent")}</td></tr>;
            })}</tbody></Table></TableViewport><p>{page.assets.length} / {page.total} {t("registry matches")}</p>{page.nextCursor && <Button disabled={pending || search !== loadedSearch} onClick={() => void loadMore()}>{t("Load more assets")}</Button>}
  </>}
 </>;
}
