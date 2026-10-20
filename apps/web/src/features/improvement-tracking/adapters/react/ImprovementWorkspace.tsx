import "./improvement.css";
import { useEffect, useRef, useState } from "react";
import {
  Actions, AddButton, Alert, Badge, Button, DepartmentScope, DetailFacts,
  Disclosure, Field, FieldRow, FilterForm, PageStack, Panel, RefreshButton,
  SearchControl, SectionHeading, Select, Table, TableText, TableViewport,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { ImprovementApplication } from "../../application/improvement";
import {
  statuses, type Catalog, type History, type EvidencePage, type ComparisonPage,
  type Page, type Selection, type SaveAction, type AddEvidence,
} from "../../domain/models";
import { ImprovementForm } from "./ImprovementForm";
import { ImprovementComparison } from "./ImprovementComparison";
import { ComparisonResult } from "./ComparisonResult";
import { ImprovementEvidence } from "./ImprovementEvidence";
import { statusLabel } from "./labels";

type PageKind = "actions" | "evidence" | "comparisons" | "revisions";
const emptyEvidence = (): EvidencePage => ({ evidence: [], nextCursor: "" });
const emptyComparisons = (): ComparisonPage => ({ comparisons: [], nextCursor: "" });
function appendUnique<T>(current: T[], next: T[], key: (item: T) => string | number) {
  return [...new Map([...current, ...next].map(item => [key(item), item])).values()];
}

export function ImprovementWorkspace({
  application, timeZone, homeVisit = 0, initialActionId = "", onOpenAsset, onOpenIssue,
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
  const [evidence, setEvidence] = useState<EvidencePage>(emptyEvidence);
  const [comparisons, setComparisons] = useState<ComparisonPage>(emptyComparisons);
  const [view, setView] = useState<"collection" | "details" | "new" | "edit">("collection");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState<PageKind | null>(null);
  const generation = useRef(0);
  const pageRequest = useRef<string | null>(null);
  const mutation = useRef(false);
  const pending = loading || paging !== null;
  const date = (at: string) => new Intl.DateTimeFormat(locale(), {
    dateStyle: "medium", timeStyle: "short", timeZone,
  }).format(new Date(at));

  function invalidate() {
    generation.current += 1;
    pageRequest.current = null;
    mutation.current = false;
    setPaging(null);
    setLoading(false);
    return generation.current;
  }

  async function collection(next = selection) {
    const token = invalidate();
    setLoading(true);
    setError("");
    setPage(null);
    try {
      const [context, list] = await Promise.all([application.catalog(), application.query(next)]);
      if (token !== generation.current) return false;
      setCatalog(context);
      setPage(list);
      return true;
    } catch (reason) {
      if (token === generation.current) {
        setCatalog(null);
        setError((reason as Error).message);
      }
      return false;
    } finally {
      if (token === generation.current) setLoading(false);
    }
  }

  async function details(id: string) {
    const token = invalidate();
    setView("details");
    setSelectedId(id);
    setHistory(null);
    setEvidence(emptyEvidence());
    setComparisons(emptyComparisons());
    setLoading(true);
    setError("");
    try {
      const result = await application.details(id);
      if (token !== generation.current) return;
      setHistory(result.history);
      setEvidence(result.evidence);
      setComparisons(result.comparisons);
    } catch (reason) {
      if (token === generation.current) setError((reason as Error).message);
    } finally {
      if (token === generation.current) setLoading(false);
    }
  }

  function home() {
    setView("collection");
    setSelectedId("");
    setHistory(null);
    void collection();
  }

  useEffect(() => {
    setView("collection");
    setHistory(null);
    setCatalog(null);
    setSelectedId("");
    setSelection({});
    setSearch("");
    void collection({}).then(current => {
      if (current && initialActionId) void details(initialActionId);
    });
    return () => {
      generation.current += 1;
      pageRequest.current = null;
    };
  }, [application, homeVisit, initialActionId]);

  async function save(input: SaveAction) {
    if (mutation.current) return;
    const token = invalidate();
    mutation.current = true;
    setLoading(true);
    setError("");
    try {
      const saved = await application.save(input);
      if (token === generation.current) await details(saved.id);
    } catch (reason) {
      if (token === generation.current) setError((reason as Error).message);
    } finally {
      if (token === generation.current) {
        mutation.current = false;
        setLoading(false);
      }
    }
  }

  async function addEvidence(input: AddEvidence) {
    if (mutation.current) return;
    const token = invalidate();
    mutation.current = true;
    setLoading(true);
    setError("");
    try {
      await application.addEvidence(input);
      if (token === generation.current) await details(input.actionId);
    } catch (reason) {
      if (token === generation.current) setError((reason as Error).message);
    } finally {
      if (token === generation.current) {
        mutation.current = false;
        setLoading(false);
      }
    }
  }

  async function loadMore(kind: PageKind) {
    if (pageRequest.current || loading) return;
    const action = history?.action;
    const cursor = kind === "actions" ? page?.nextCursor
      : kind === "evidence" ? evidence.nextCursor
        : kind === "comparisons" ? comparisons.nextCursor : history?.nextBefore;
    if (!cursor || (kind !== "actions" && !action)) return;
    const token = generation.current;
    const key = `${token}:${kind}:${cursor}`;
    pageRequest.current = key;
    setPaging(kind);
    setError("");
    try {
      if (kind === "actions") {
        const next = await application.query({ ...selection, cursor: String(cursor) });
        if (token === generation.current) setPage(current => current ? {
          ...next, actions: appendUnique(current.actions, next.actions, item => item.id),
        } : next);
      } else if (kind === "evidence") {
        const next = await application.evidence(action!.id, String(cursor));
        if (token === generation.current) setEvidence(current => ({
          ...next, evidence: appendUnique(current.evidence, next.evidence, item => item.id),
        }));
      } else if (kind === "comparisons") {
        const next = await application.comparisons(action!.id, String(cursor));
        if (token === generation.current) setComparisons(current => ({
          ...next, comparisons: appendUnique(current.comparisons, next.comparisons, item => item.id),
        }));
      } else {
        const next = await application.history(action!.id, Number(cursor));
        if (token === generation.current) setHistory(current => current ? {
          ...current, nextBefore: next.nextBefore,
          revisions: appendUnique(current.revisions, next.revisions, item => item.action.revision),
        } : next);
      }
    } catch (reason) {
      if (token === generation.current) setError((reason as Error).message);
    } finally {
      if (pageRequest.current === key) {
        pageRequest.current = null;
        setPaging(null);
      }
    }
  }

  function apply(next: Selection) {
    setSelection(next);
    void collection(next);
  }
  const action = history?.action;
  const count = (value: number) => new Intl.NumberFormat(locale()).format(value);
  return <PageStack>
    <SectionHeading
      section={t("Improvement Tracking")}
      view={t(view === "collection" ? "Actions" : view === "new" ? "New action" : view === "edit" ? "Edit action" : "Details")}
      onHome={home}
      trail={view === "details" && action ? [{ label: t("Actions"), onSelect: home }, { label: action.data.title }] : undefined}
      description={view === "collection" ? t("Own improvement actions, record evidence and compare observed source measures.") : undefined}
      actions={<Actions>
        {view === "collection" && catalog?.canContribute && <AddButton label={t("New action")} disabled={pending} onClick={() => {
          invalidate(); setError(""); setView("new");
        }} />}
        {view === "details" && action?.canEdit && <Button disabled={pending} onClick={() => {
          invalidate(); setView("edit");
        }}>{t("Edit action")}</Button>}
        <RefreshButton label={t("Refresh improvements")} busy={pending} onClick={() => view === "details" && selectedId ? void details(selectedId) : void collection()} />
      </Actions>}
    />
    {error && <Alert>{error}</Alert>}
    {(view === "new" || view === "edit") && catalog ? <ImprovementForm
      key={view === "new" ? "new" : action?.id}
      application={application} catalog={catalog} action={view === "edit" ? action : undefined}
      pending={pending} onSave={input => void save(input)}
      onCancel={() => { invalidate(); if (action) setView("details"); else home(); }}
    /> : view === "details" ? action && history ? <>
      <Panel className="iop-improvement-details">
        <PageStack>
          <DetailFacts items={[
            { label: t("Status"), value: <Badge tone={action.data.status === "evaluated" ? "success" : action.data.status === "blocked" ? "warning" : "neutral"}>{statusLabel(action.data.status)}</Badge> },
            { label: t("Owner"), value: action.ownerName || t("Unassigned") },
            { label: t("Location"), value: action.locationLabel },
            { label: t("Target date"), value: action.data.dueDate || t("Not set") },
            { label: t("Implemented date"), value: action.data.implementedDate || t("Not set") },
          ]} />
          <div><h2>{t("Hypothesis and context")}</h2><p className="iop-prose">{action.data.hypothesis || t("Not recorded")}</p></div>
          <div><h2>{t("Target and hypothesis")}</h2><p className="iop-prose">{action.data.target.objective}</p></div>
          <DetailFacts items={[
            { label: t("Target reduction"), value: action.data.target.reductionPercent === null ? t("Not quantified") : action.data.target.reductionPercent + "%" },
            { label: t("Target metric"), value: t(action.data.target.metric === "frequency" ? "Reported frequency" : "Accumulated alarm seconds") },
          ]} />
          {action.data.blockedReason && <div><h2>{t("Blocked reason")}</h2><p className="iop-prose">{action.data.blockedReason}</p></div>}
          {action.data.cancellationReason && <div><h2>{t("Cancellation reason")}</h2><p className="iop-prose">{action.data.cancellationReason}</p></div>}
          {action.data.result && <div><h2>{t("Observed result")}</h2><p className="iop-prose">{action.data.result}</p></div>}
          <Actions>
            {action.data.assetId && <Button variant="secondary" onClick={() => onOpenAsset?.(action.data.assetId)} disabled={!onOpenAsset}>{t("Open linked asset")}: {action.assetName}</Button>}
            {action.data.issueId && <Button variant="secondary" onClick={() => onOpenIssue?.(action.data.issueId)} disabled={!onOpenIssue}>{t("Open linked issue")}: {action.issueTitle}</Button>}
          </Actions>
          <DetailFacts items={[
            { label: t("Created by"), value: action.authorName },
            { label: t("Recorded"), value: date(action.createdAt) },
            { label: t("Revision"), value: action.revision },
          ]} />
        </PageStack>
      </Panel>
      {action.canEdit && <ImprovementEvidence key={`${action.id}:evidence:${action.revision}`} application={application} action={action} evidence={evidence.evidence} pending={pending} onAdd={input => void addEvidence(input)} />}
      <Disclosure summary={t("Evidence history") + " (" + count(action.evidenceCount) + ")"} variant="panel" open>
        <TableViewport aria-busy={paging === "evidence"}>
          <Table aria-label={t("Improvement evidence")} variant="records">
            <thead><tr><th scope="col" data-align="text">{t("Note or result")}</th><th scope="col" data-align="text">{t("Author")}</th><th scope="col">{t("Recorded")}</th><th scope="col" data-align="text">{t("Reference")}</th></tr></thead>
            <tbody>{evidence.evidence.map(item => <tr key={item.id}>
              <td data-align="text"><TableText>{item.note}</TableText>{item.supersedesId && <small>{t("Correction of")}: {item.supersedesId}</small>}{evidence.evidence.some(other => other.supersedesId === item.id) && <Badge tone="neutral">{t("Superseded")}</Badge>}</td>
              <td data-align="text">{item.actorName}</td><td>{date(item.at)}</td><td data-align="text">{item.externalReference || "—"}</td>
            </tr>)}{!evidence.evidence.length && <tr><td colSpan={4}>{t("No evidence recorded yet.")}</td></tr>}</tbody>
          </Table>
        </TableViewport>
        {evidence.nextCursor && <Button variant="secondary" disabled={pending} onClick={() => void loadMore("evidence")}>{t("Load more evidence")}</Button>}
      </Disclosure>
      <ImprovementComparison key={`${action.id}:comparison:${action.revision}`} application={application} action={action} pending={pending} onSaved={() => void details(action.id)} />
      <Disclosure summary={t("Saved comparison evidence") + " (" + count(action.comparisonCount) + ")"} variant="panel">
        <PageStack>{comparisons.comparisons.map(saved => <PageStack key={saved.id}>
          <DetailFacts items={[
            { label: t("Author"), value: saved.actorName }, { label: t("Recorded"), value: date(saved.at) },
            { label: t("Action revision"), value: saved.actionRevision },
          ]} />
          {saved.note && <p>{saved.note}</p>}<ComparisonResult comparison={saved.comparison} />
        </PageStack>)}{!comparisons.comparisons.length && <p>{t("No comparison evidence saved yet.")}</p>}
        {comparisons.nextCursor && <Button variant="secondary" disabled={pending} onClick={() => void loadMore("comparisons")}>{t("Load more comparisons")}</Button>}</PageStack>
      </Disclosure>
      <Disclosure summary={t("Action revision history")} variant="panel">
        <TableViewport aria-busy={paging === "revisions"}><Table aria-label={t("Improvement revisions")} variant="records">
          <thead><tr><th scope="col" data-align="text">{t("Change")}</th><th scope="col" data-align="text">{t("Author")}</th><th scope="col">{t("Recorded")}</th><th scope="col" data-align="number">{t("Revision")}</th></tr></thead>
          <tbody>{history.revisions.map(revision => <tr key={revision.action.revision}>
            <td data-align="text">{t({ created: "Created", updated: "Updated", "status-changed": "Status changed", "evidence-added": "Evidence added", "comparison-saved": "Comparison saved" }[revision.change])}<TableText>{revision.reason}</TableText></td>
            <td data-align="text">{revision.actorName}</td><td>{date(revision.at)}</td><td data-align="number">{revision.action.revision}</td>
          </tr>)}{!history.revisions.length && <tr><td colSpan={4}>{t("No revision history recorded yet.")}</td></tr>}</tbody>
        </Table></TableViewport>
        {history.nextBefore > 0 && <Button variant="secondary" disabled={pending} onClick={() => void loadMore("revisions")}>{t("Load older revisions")}</Button>}
      </Disclosure>
    </> : <Panel><p role="status">{t(loading ? "Loading improvement details…" : "Improvement details are unavailable.")}</p>{!loading && <Button variant="secondary" onClick={() => void details(selectedId)}>{t("Retry")}</Button>}</Panel> : <>
      {catalog && <FilterForm onSubmit={event => {
        event.preventDefault(); apply({ ...selection, search, cursor: "" });
      }}>
        <FieldRow>
          <DepartmentScope value={selection.locationId ?? ""} onChange={locationId => apply({ ...selection, locationId, cursor: "" })} choices={catalog.locations} />
          <Field layout="inline" className="iop-context-field"><span>{t("Status")}</span><Select value={selection.status ?? ""} onChange={event => apply({ ...selection, status: event.target.value as Selection["status"], cursor: "" })}>
            <option value="">{t("All statuses")}</option>{statuses.map(status => <option key={status} value={status}>{statusLabel(status)} ({count(page?.statusCounts[status] ?? 0)})</option>)}
          </Select></Field>
          <Field layout="inline" className="iop-context-field"><span>{t("Owner")}</span><Select value={selection.ownerId ?? ""} onChange={event => apply({ ...selection, ownerId: event.target.value, cursor: "" })}>
            <option value="">{t("All owners")}</option>{catalog.people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </Select></Field>
          <SearchControl label={t("Search improvements")} placeholder={t("Title, goal or linked equipment")} value={search} onChange={setSearch} />
          <Button type="submit" disabled={loading}>{t("Apply filters")}</Button>
          <Button variant="secondary" onClick={() => { setSearch(""); apply({}); }}>{t("Clear filters")}</Button>
        </FieldRow>
        {search !== (selection.search ?? "") && <p role="status">{t("Search changes are pending. Apply filters to update the table.")}</p>}
      </FilterForm>}
      <Panel>
        {loading ? <p role="status">{t("Loading improvement actions…")}</p> : page ? <>
          <TableViewport aria-busy={paging === "actions"}><Table aria-label={t("Improvement actions")} variant="records" className="iop-improvement-collection">
            <thead><tr><th scope="col" data-align="text">{t("Action")}</th><th scope="col" data-align="status">{t("Status")}</th><th scope="col" data-align="text">{t("Owner")}</th><th scope="col">{t("Target date")}</th><th scope="col" data-align="number">{t("Evidence")}</th></tr></thead>
            <tbody>{page.actions.map(item => <tr key={item.id}>
              <th scope="row" data-align="text"><Button variant="text" className="iop-improvement-title" onClick={() => void details(item.id)}><TableText>{item.data.title}</TableText></Button><small>{[item.locationLabel, item.assetName || item.issueTitle].filter(Boolean).join(" · ")}</small></th>
              <td data-align="status"><Badge tone={item.data.status === "blocked" ? "warning" : item.data.status === "evaluated" ? "success" : "neutral"}>{statusLabel(item.data.status)}</Badge></td>
              <td data-align="text">{item.ownerName || t("Unassigned")}</td><td>{item.data.dueDate || "—"}</td><td data-align="number">{count(item.evidenceCount)} / {count(item.comparisonCount)}</td>
            </tr>)}{!page.actions.length && <tr><td colSpan={5}>{t("No matching improvement actions.")}</td></tr>}</tbody>
          </Table></TableViewport>
          <Actions><p role="status">{t("Showing {0} of {1} actions.", [count(page.actions.length), count(page.total)])}</p>
            {page.nextCursor && <Button variant="secondary" disabled={pending || search !== (selection.search ?? "")} onClick={() => void loadMore("actions")}>{t("Load more actions")}</Button>}
          </Actions>
        </> : <><p>{t("Improvement actions are unavailable.")}</p><Button variant="secondary" onClick={() => void collection()}>{t("Retry")}</Button></>}
      </Panel>
    </>}
    {paging && <p role="status">{t("Loading more records…")}</p>}
  </PageStack>;
}
