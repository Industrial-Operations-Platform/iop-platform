import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import { Actions, AddButton, Alert, Badge, Button, DateField, DepartmentScope, Disclosure, Field, Panel, RefreshButton, Select, Textarea } from "../../../../design/components";
import type { FormalHandoverApplication } from "../../application/formal-records";
import type { FormalContext, FormalRecord, RecordContent, RecordHistory, RecordPage, ShiftReference, PreviousShift, EntryEvidence } from "../../domain/formal-models";
import { withinLocation } from "../../domain/models";
import { HandoverHeading } from "./HandoverHeading";
import { HandoverViewNavigation, type JournalView } from "./HandoverViewNavigation";
import { HandoverGuidance } from "./HandoverGuidance";
import { FormalEvidence } from "./FormalEvidence";
import { formalInstant, formalState } from "./formal-format";
import { FormalRecordForm } from "./FormalRecordForm";
import { today } from "./EntryForm";
import "./handover.css";
const emptyPage: RecordPage = { records: [], total: 0, nextCursor: "" };
export function FormalHandoverWorkspace({ application, departmentId = "", onEntry, onHome,initialRecordId="",homeVisit=0, onJournalView, dailyOverview = false }: {
  application: FormalHandoverApplication; initialRecordId?: string;homeVisit?:number;departmentId?: string; onEntry?: (id: string) => void; onHome?: () => void;
  onJournalView?: (view: JournalView) => void; dailyOverview?: boolean;
}) {
  const [context, setContext] = useState<FormalContext | null>(null), [from, setFrom] = useState(""), [to, setTo] = useState(""),
    [department, setDepartment] = useState(departmentId), [area, setArea] = useState(""), [page, setPage] = useState(emptyPage),
    [shifts, setShifts] = useState<ShiftReference[]>([]), [history, setHistory] = useState<RecordHistory | null>(null),
    [previous, setPrevious] = useState<PreviousShift | null>(null), [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(false), [note, setNote] = useState(""), [error, setError] = useState(""),
    [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    void application.context().then(async (settings) => {
      const day = today(settings.timeZone), query = { from: from || day, to: to || day, departmentId: department, areaId: area, cursor: "" };
      const [records, source] = await Promise.all([application.query(query), application.shifts(query)]);
      if (active) { setContext(settings); setPage(records); setShifts(source.shifts); if (!from) setFrom(day); if (!to) setTo(day); }
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Shift records are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [application, from, to, department, area, refresh]);
  useEffect(()=>{
    let active=true;
    setHistory(null);setPrevious(null);setEditing(false);setCreating(false);setNote('');
    if(initialRecordId)void Promise.all([application.history(initialRecordId),application.previous(initialRecordId)]).then(([detail,prior])=>{
      if(active){setHistory(detail);setPrevious(prior);}
    }).catch(error=>{if(active)setError(error.message);});
    return ()=>{active=false;};
  },[application,initialRecordId,homeVisit]);
  const perform = async (operation: () => Promise<void>) => {
    setBusy(true); setError("");
    try { await operation(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save the shift record."); }
    finally { setBusy(false); }
  };
  const open = async (id: string) => {
    const [detail, prior] = await Promise.all([application.history(id), application.previous(id)]);
    setHistory(detail); setPrevious(prior); setCreating(false); setEditing(false); setNote("");
  };
  const back = () => { setHistory(null); setPrevious(null); setEditing(false); setCreating(false); setNote(""); setRefresh((v) => v + 1); };
  const save = async (content: RecordContent, reason: string) => perform(async () => {
    const record = await application.save({ id: history?.record.id ?? "", expectedRevision: history?.record.revision ?? 0, content, note: reason });
    await open(record.id); setRefresh((v) => v + 1);
  });
  const transition = (action: "publish" | "close" | "acknowledge") => void perform(async () => {
    const record = await application.transition(history!.record, action, note);
    await open(record.id); setRefresh((v) => v + 1);
  });
  const record = history?.record;
  const evidence = (entries: EntryEvidence[]) => <FormalEvidence entries={entries} onEntry={onEntry} />;
  return <section aria-label={t("Formal shift Handover")}>
    <HandoverHeading onHome={onHome ?? back} viewLabel={t("Shift records")} onBack={record || creating ? back : undefined}
      trail={record ? [{ label: t("Shift records"), onSelect: back }, { label: record.content.title }] : creating ? [{ label: t("Shift records"), onSelect: back }, { label: t("New record") }] : undefined}
      actions={<RefreshButton busy={busy || loading} onClick={() => record ? void perform(() => open(record.id)) : setRefresh((v) => v + 1)} />} />
    {onJournalView && <><HandoverGuidance /><HandoverViewNavigation selected="records" dailyOverview={dailyOverview} includeRecords disabled={busy}
      onSelect={view => { if (view !== "records") onJournalView(view); }} /></>}
    <p>{t("Formal transfer records use planned Workforce intervals. Closing preserves evidence and does not resolve recorded issues.")}</p>
    {error && <Alert>{error}</Alert>}
    {loading && !context && <p role="status">{t("Loading shift records…")}</p>}
    {context && !record && !creating && <>
      <Panel><Actions><DateField label={t("From")} value={from} onChange={(e) => setFrom(e.target.value)} />
        <DateField label={t("Through")} value={to} onChange={(e) => setTo(e.target.value)} />
        <DepartmentScope value={department} choices={context.locations.filter((l) => l.role === "department")}
          onChange={(id) => { setDepartment(id); setArea(""); }} />
        <Field layout="inline">{t("Area")}<Select aria-label={t("Record area")} value={area} disabled={!department} onChange={(e) => setArea(e.target.value)}>
          <option value="">{t("Whole department")}</option>{context.locations.filter((l) => l.role === "area" && withinLocation(l.id, department, context.locations))
            .map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </Select></Field><AddButton label={t("New shift record")} disabled={busy || loading || !department || !shifts.length} onClick={() => setCreating(true)} /></Actions></Panel>
      {!department && <p>{t("Choose a department to create a shift record.")}</p>}
      {department && !shifts.length && !loading && <Panel variant="empty">{t("No planned Workforce shift exists in this period. Add actual assignments in Workforce before creating a record.")}</Panel>}
      <p>{t("{0} of {1} records shown.", [page.records.length, page.total])}</p>
      <div className="handover-summary-cards">{page.records.map((item) => <Button key={item.id} variant="secondary" className="handover-summary-card" onClick={() => void perform(() => open(item.id))}>
        <strong>{item.content.title}</strong><span className="handover-card-location">{item.departmentLabel}{item.areaLabel && ` · ${item.areaLabel}`}</span>
        <span>{item.shift.date} · {item.shift.label}</span><Badge tone={item.state === "closed" ? "success" : "neutral"}>{formalState(item.state)}</Badge>
      </Button>)}</div>
      {!page.records.length && !loading && <p>{t("No formal transfer records in the selected period.")}</p>}
      {page.nextCursor && <Button variant="secondary" disabled={busy} onClick={() => void perform(async () => {
        const next = await application.query({ from, to, departmentId: department, areaId: area, cursor: page.nextCursor });
        setPage({ ...next, records: [...page.records, ...next.records] });
      })}>{t("Load more records")}</Button>}
    </>}
    {context && (creating || editing) && <Panel><FormalRecordForm application={application} shifts={record ? [record.shift] : shifts}
      departmentId={department} areaId={area} record={editing ? record : undefined} timeZone={context.timeZone} busy={busy} onSave={save}
      onCancel={record ? () => setEditing(false) : back} /></Panel>}
    {record && !editing && <>
      <Panel><h2>{record.content.title}</h2><p>{record.departmentLabel}{record.areaLabel && ` · ${record.areaLabel}`}</p>
        <Badge tone={record.state === "closed" ? "success" : "info"}>{formalState(record.state)}</Badge>
        <p>{record.shift.date} · {record.shift.label} · {formalInstant(record.shift.startsAt, context!.timeZone)} – {formalInstant(record.shift.endsAt, context!.timeZone)} ({context!.timeZone})</p>
        <p className="handover-prose">{record.content.summary || t("No transfer summary added.")}</p>
        <p>{t("Recorded by {0} · revision {1}", [record.authorName, record.revision])}</p>
        {record.state !== "closed" && <><h3>{t("Reviewed reports ({0})", [record.entries.length])}</h3>{evidence(record.entries)}<p>{t("Changed report revisions require reviewing and saving the record again before publication or closure.")}</p></>}
        {record.state !== "closed" && <Actions><Button variant="secondary" disabled={busy} onClick={() => setEditing(true)}>{t("Edit record")}</Button></Actions>}
        {record.state === "closed" && <><h3>{t("Closed transfer")}</h3><p className="handover-prose">{record.outcome}</p><p>{t("Closed by {0} at {1}", [record.closedByName, formalInstant(record.closedAt, context!.timeZone)])}</p>
          <h3>{t("Selected report evidence")}</h3>{evidence(record.entries)}{!record.entries.length && <p>{t("No individual reports selected.")}</p>}
          <h3>{t("Pending at closure ({0})", [record.pending.length])}</h3>{evidence(record.pending)}{!record.pending.length && <p>{t("No pending reports were recorded at closure.")}</p>}
          <h3>{t("Receiving acknowledgements")}</h3>{record.acknowledgements.map((ack) => <p key={ack.actorId}>{ack.actorName} · {formalInstant(ack.at, context!.timeZone)} · {ack.note}</p>)}
          {!record.acknowledgements.length && <p>{t("Awaiting acknowledgement by an incoming manager.")}</p>}
        </>}
        {(record.state !== "closed" || (context?.actorId !== record.closedBy && !record.acknowledgements.some((ack) => ack.actorId === context?.actorId))) && <form onSubmit={(e) => {
          e.preventDefault(); transition(record.state === "draft" ? "publish" : record.state === "open" ? "close" : "acknowledge");
        }}><Field>{t(record.state === "draft" ? "Publication note" : record.state === "open" ? "Closing outcome" : "Receiving acknowledgement")}
          <Textarea required rows={3} maxLength={4000} disabled={busy} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Actions><Button type="submit" disabled={busy}>{t(record.state === "draft" ? "Publish record" : record.state === "open" ? "Close record" : "Acknowledge receipt")}</Button></Actions></form>}
      </Panel>
      {previous && <Disclosure variant="panel" summary={t("Previous shift and current pending reports")} open>
        {!previous.shift ? <p>{t("No earlier planned shift was found for this location in the previous 92 days.")}</p> : <>
          <p>{previous.shift.date} · {previous.shift.label} · {formalInstant(previous.shift.startsAt, context!.timeZone)} – {formalInstant(previous.shift.endsAt, context!.timeZone)}</p>
          {previous.overlaps && <p>{t("The planned shifts overlap; order follows their start times.")}</p>}
          {previous.record ? <><Badge>{formalState(previous.record.state)}</Badge><p>{previous.record.content.title}</p><p className="handover-prose">{previous.record.outcome || previous.record.content.summary}</p>
            <Button variant="text" onClick={() => void perform(() => open(previous.record!.id))}>{t("Open previous shift record")}</Button></> : <p>{t("The previous planned shift has no formal record.")}</p>}
        </>}
        <h3>{t("Current pending reports ({0})", [previous.pendingTotal])}</h3><p>{t("These are current journal issues through the selected shift date; they remain independent of transfer closure.")}</p>
        {evidence(previous.pending)}{previous.pendingTotal > previous.pending.length && <p>{t("{0} of {1} pending reports shown. Review the full journal.", [previous.pending.length, previous.pendingTotal])}</p>}
      </Disclosure>}
      <Disclosure variant="panel" summary={t("Retained record history")}>
        {history!.revisions.map((event) => <Panel key={event.record.revision}><strong>{t("Revision {0} · {1}", [event.record.revision, formalState(event.action)])}</strong>
          <p>{event.actorName} · {formalInstant(event.at, context!.timeZone)}</p><p>{event.note}</p><Disclosure summary={t("Recorded content")}><p>{event.record.content.summary}</p><p>{event.record.outcome}</p>
            {event.record.state === "closed" && evidence(event.record.entries)}</Disclosure></Panel>)}
        {!!history!.nextBefore && <Button variant="secondary" disabled={busy} onClick={() => void perform(async () => {
          const next = await application.history(record.id, history!.nextBefore);
          setHistory({ ...next, revisions: [...history!.revisions, ...next.revisions] });
        })}>{t("Load older revisions")}</Button>}
      </Disclosure>
    </>}
  </section>;
}
