import "./improvement.css";
import { useEffect, useRef, useState } from "react";
import { Actions, AddButton, Alert, Badge, Button, CompactSelect, DepartmentScope, Disclosure, FilterForm, Panel, RefreshButton, SearchControl, SectionHeading, Table, TableText, TableViewport } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { ImprovementApplication } from "../../application/improvement";
import { statuses, type Catalog, type History, type EvidencePage, type ComparisonPage, type Page, type Selection, type SaveAction, type AddEvidence } from "../../domain/models";
import { ImprovementForm } from "./ImprovementForm";
import { ImprovementComparison } from "./ImprovementComparison";
import { ComparisonResult } from "./ComparisonResult";
import { ImprovementEvidence } from "./ImprovementEvidence";
import { statusLabel } from "./labels";
export function ImprovementWorkspace({
  application,
  timeZone,
  homeVisit = 0,
  initialActionId = "",
  onOpenAsset,
  onOpenIssue
}: {
  application: ImprovementApplication;
  timeZone: string;
  homeVisit?: number;
  initialActionId?: string;
  onOpenAsset?: (id: string) => void;
  onOpenIssue?: (id: string) => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  const [evidence, setEvidence] = useState<EvidencePage>({
    evidence: [],
    nextCursor: ""
  });
  const [comparisons, setComparisons] = useState<ComparisonPage>({
    comparisons: [],
    nextCursor: ""
  });
  const [view, setView] = useState<"collection" | "details" | "new" | "edit">("collection");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const generation = useRef(0);
  const date = (at: string) => new Intl.DateTimeFormat(locale(), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(new Date(at));
  async function collection(next = selection) {
    const token = ++generation.current;
    setPending(true);
    setError("");
    try {
      const [context, list] = await Promise.all([application.catalog(), application.query(next)]);
      if (token !== generation.current) return;
      setCatalog(context);
      setPage(list);
    } catch (e) {
      if (token === generation.current) setError((e as Error).message);
    } finally {
      if (token === generation.current) setPending(false);
    }
  }
  async function details(id: string) {
    const token = ++generation.current;
    setPending(true);
    setError("");
    try {
      const result = await application.details(id);
      if (token !== generation.current) return;
      setHistory(result.history);
      setEvidence(result.evidence);
      setComparisons(result.comparisons);
      setView("details");
    } catch (e) {
      if (token === generation.current) setError((e as Error).message);
    } finally {
      if (token === generation.current) setPending(false);
    }
  }
  function home() {
    setView("collection");
    setHistory(null);
    void collection();
  }
  useEffect(() => {
    setView("collection");
    setHistory(null);
    void collection().then(() => {
      if (initialActionId) void details(initialActionId);
    });
    return () => {
      generation.current++;
    };
  }, [application, homeVisit, initialActionId]);
  async function save(input: SaveAction) {
    setPending(true);
    setError("");
    try {
      const action = await application.save(input);
      await details(action.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function addEvidence(input: AddEvidence) {
    setPending(true);
    setError("");
    try {
      await application.addEvidence(input);
      await details(input.actionId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  const action = history?.action;
  return <>
    <SectionHeading section={t("Improvement Tracking")} view={t(view === "collection" ? "Actions" : view === "new" ? "New action" : view === "edit" ? "Edit action" : "Details")} onHome={home} trail={view === "details" && action ? [{
      label: t("Actions"),
      onSelect: home
    }, {
      label: action.data.title
    }] : undefined} description={view === "collection" ? t("Own improvement actions, record evidence and compare observed source measures.") : undefined} actions={<Actions>{view === "collection" && catalog?.canContribute && <AddButton label={t("New action")} disabled={pending} onClick={() => {
        setError("");
        setView("new");
      }} />}{view === "details" && action?.canEdit && <Button disabled={pending} onClick={() => setView("edit")}>{t("Edit action")}</Button>}<RefreshButton label={t("Refresh improvements")} busy={pending} onClick={() => view === "details" && action ? void details(action.id) : void collection()} /></Actions>} />
    {error && <Alert>{error}</Alert>}
    {(view === "new" || view === "edit") && catalog ? <ImprovementForm key={view === "new" ? "new" : action?.id} application={application} catalog={catalog} action={view === "edit" ? action : undefined} pending={pending} onSave={input => void save(input)} onCancel={() => action ? setView("details") : home()} /> : view === "details" && action && history ? <>
      <Panel className="iop-improvement-details"><p><Badge tone={action.data.status === "evaluated" ? "success" : action.data.status === "blocked" ? "warning" : "info"}>{statusLabel(action.data.status)}</Badge> · {action.ownerName || t("Unassigned")} · {action.locationLabel}</p><p>{action.data.hypothesis}</p>
        <h2>{t("Target and hypothesis")}</h2><p>{action.data.target.objective}</p><p>{t("Target reduction")}: {action.data.target.reductionPercent === null ? t("Not quantified") : action.data.target.reductionPercent + "%"} · {t(action.data.target.metric === "frequency" ? "Reported frequency" : "Accumulated alarm seconds")}</p>
        <p>{t("Target date")}: {action.data.dueDate || t("Not set")} · {t("Implemented date")}: {action.data.implementedDate || t("Not set")}</p>
        {action.data.blockedReason && <p>{t("Blocked reason")}: {action.data.blockedReason}</p>}{action.data.cancellationReason && <p>{t("Cancellation reason")}: {action.data.cancellationReason}</p>}{action.data.result && <><h2>{t("Observed result")}</h2><p>{action.data.result}</p></>}
        <Actions>{action.data.assetId && <Button onClick={() => onOpenAsset?.(action.data.assetId)} disabled={!onOpenAsset}>{t("Open linked asset")}: {action.assetName}</Button>}{action.data.issueId && <Button onClick={() => onOpenIssue?.(action.data.issueId)} disabled={!onOpenIssue}>{t("Open linked issue")}: {action.issueTitle}</Button>}</Actions><p>{t("Created by")}: {action.authorName} · {date(action.createdAt)} · {t("Revision")}: {action.revision}</p>
      </Panel>
      {action.canEdit && <ImprovementEvidence key={"evidence-" + action.revision} application={application} action={action} evidence={evidence.evidence} pending={pending} onAdd={input => void addEvidence(input)} />}
      <Disclosure summary={t("Evidence history") + " (" + action.evidenceCount + ")"} variant="panel" open><TableViewport><Table aria-label={t("Improvement evidence")}><thead><tr><th>{t("Note or result")}</th><th>{t("Author")}</th><th>{t("Recorded")}</th><th>{t("Reference")}</th></tr></thead><tbody>{evidence.evidence.map(e => <tr key={e.id}><td><TableText>{e.note}</TableText>{e.supersedesId && <small>{t("Correction of")}: {e.supersedesId}</small>}{evidence.evidence.some(other => other.supersedesId === e.id) && <Badge tone="neutral">{t("Superseded")}</Badge>}</td><td>{e.actorName}</td><td>{date(e.at)}</td><td>{e.externalReference || "—"}</td></tr>)}{!evidence.evidence.length && <tr><td colSpan={4}>{t("No evidence recorded yet.")}</td></tr>}</tbody></Table></TableViewport>{evidence.nextCursor && <Button onClick={() => application.evidence(action.id, evidence.nextCursor).then(next => setEvidence(current => ({
          ...next,
          evidence: [...current.evidence, ...next.evidence]
        }))).catch(e => setError(e.message))}>{t("Load more evidence")}</Button>}</Disclosure>
      <ImprovementComparison key={"comparison-" + action.revision} application={application} action={action} pending={pending} onSaved={() => void details(action.id)} />
      <Disclosure summary={t("Saved comparison evidence") + " (" + action.comparisonCount + ")"} variant="panel">{comparisons.comparisons.map(saved => <div key={saved.id}><p>{saved.actorName} · {date(saved.at)} · {t("Action revision")}: {saved.actionRevision}</p>{saved.note && <p>{saved.note}</p>}<ComparisonResult comparison={saved.comparison} /></div>)}{!comparisons.comparisons.length && <p>{t("No comparison evidence saved yet.")}</p>}{comparisons.nextCursor && <Button onClick={() => application.comparisons(action.id, comparisons.nextCursor).then(next => setComparisons(current => ({
          ...next,
          comparisons: [...current.comparisons, ...next.comparisons]
        }))).catch(e => setError(e.message))}>{t("Load more comparisons")}</Button>}</Disclosure>
      <Disclosure summary={t("Action revision history")} variant="panel"><TableViewport><Table aria-label={t("Improvement revisions")}><thead><tr><th>{t("Change")}</th><th>{t("Author")}</th><th>{t("Recorded")}</th><th>{t("Revision")}</th></tr></thead><tbody>{history.revisions.map(r => <tr key={r.action.revision}><td>{r.change}<TableText>{r.reason}</TableText></td><td>{r.actorName}</td><td>{date(r.at)}</td><td>{r.action.revision}</td></tr>)}</tbody></Table></TableViewport>{history.nextBefore > 0 && <Button onClick={() => application.history(action.id, history.nextBefore).then(next => setHistory(current => current ? {
          ...next,
          revisions: [...current.revisions, ...next.revisions]
        } : next)).catch(e => setError(e.message))}>{t("Load older revisions")}</Button>}</Disclosure>
    </> : <>
      {catalog && <FilterForm variant="plain" onSubmit={e => {
        e.preventDefault();
        const next = {
          ...selection,
          search,
          cursor: ""
        };
        setSelection(next);
        void collection(next);
      }}><div className="iop-scope-toolbar"><DepartmentScope value={selection.locationId ?? ""} onChange={locationId => {
            const next = {
              ...selection,
              locationId,
              cursor: ""
            };
            setSelection(next);
            void collection(next);
          }} choices={catalog.locations} /><CompactSelect caption="Status" value={selection.status ?? ""} emptyLabel="All statuses"
            choices={statuses.map(status => ({ id: status, label: `${statusLabel(status)} (${page?.statusCounts[status] ?? 0})` }))} onChange={status => {
              const next = {
                ...selection,
                status: status as Selection["status"],
                cursor: ""
              };
              setSelection(next);
              void collection(next);
            }} /><CompactSelect caption="Owner" value={selection.ownerId ?? ""} emptyLabel="All owners" choices={catalog.people.map(person => ({ id: person.id, label: person.name }))} onChange={ownerId => {
              const next = {
                ...selection,
                ownerId,
                cursor: ""
              };
              setSelection(next);
              void collection(next);
            }} /><SearchControl caption="Search" label={t("Search improvements")} placeholder={t("Title, goal or linked equipment")} value={search} onChange={setSearch} /><Button type="submit" disabled={pending}>{t("Apply filters")}</Button></div></FilterForm>}
      <TableViewport><Table aria-label={t("Improvement actions")}><thead><tr><th>{t("Action")}</th><th>{t("Status")}</th><th>{t("Owner")}</th><th>{t("Target date")}</th><th>{t("Evidence")}</th></tr></thead><tbody>{page?.actions.map(a => <tr key={a.id}><td><Button variant="text" className="iop-improvement-title" onClick={() => void details(a.id)}><TableText>{a.data.title}</TableText></Button><small>{a.locationLabel} · {a.assetName || a.issueTitle}</small></td><td><Badge tone={a.data.status === "blocked" ? "warning" : a.data.status === "evaluated" ? "success" : "neutral"}>{statusLabel(a.data.status)}</Badge></td><td>{a.ownerName || t("Unassigned")}</td><td>{a.data.dueDate || "—"}</td><td>{a.evidenceCount} / {a.comparisonCount}</td></tr>)}{page && !page.actions.length && <tr><td colSpan={5}>{t("No matching improvement actions.")}</td></tr>}</tbody></Table></TableViewport>
      {page && <p>{page.total} {t("matching actions")}</p>}{page?.nextCursor && <Button disabled={pending} onClick={() => {
        setPending(true);
        application.query({
          ...selection,
          search,
          cursor: page.nextCursor
        }).then(next => setPage(current => current ? {
          ...next,
          actions: [...current.actions, ...next.actions]
        } : next)).catch(e => setError(e.message)).finally(() => setPending(false));
      }}>{t("Load more actions")}</Button>}
    </>}
  </>;
}
