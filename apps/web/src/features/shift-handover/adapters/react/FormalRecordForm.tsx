import { t } from "../../../../localization/i18n";
import { issueLabel } from "./entry-labels";
import { formalInstant } from "./formal-format";
import { useEffect, useState } from "react";
import { Actions, Alert, Button, Field, Input, Select, Textarea } from "../../../../design/components";
import type { FormalHandoverApplication } from "../../application/formal-records";
import type { FormalRecord, RecordContent, ShiftReference, CandidatePage } from "../../domain/formal-models";
export function FormalRecordForm({ application, shifts, departmentId, areaId, record, timeZone, busy, onSave, onCancel }: {
  application: FormalHandoverApplication; shifts: ShiftReference[]; departmentId: string; areaId: string;
  record?: FormalRecord; timeZone: string; busy: boolean; onSave: (content: RecordContent, note: string) => Promise<void>; onCancel: () => void;
}) {
  const [content, setContent] = useState<RecordContent>(record?.content ?? { shiftId: shifts[0]?.id ?? "", shiftDate: shifts[0]?.date ?? "",
    departmentId, areaId, title: "", summary: "", entryIds: [] });
  const [note, setNote] = useState(""), [error, setError] = useState(""), [candidates, setCandidates] = useState<CandidatePage>({ entries: [], total: 0 });
  useEffect(() => {
    let active = true;
    if (!content.departmentId || !content.shiftDate) return;
    setError("");
    void application.candidates(content.departmentId, content.areaId, content.shiftDate).then((result) => {
      if (active) setCandidates(result);
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Entry selection is unavailable."); });
    return () => { active = false; };
  }, [application, content.departmentId, content.areaId, content.shiftDate]);
  const toggle = (id: string) => setContent((value) => ({ ...value,
    entryIds: value.entryIds.includes(id) ? value.entryIds.filter((key) => key !== id) : [...value.entryIds, id] }));
  return <form className="handover-formal-record-form" aria-label={t(record ? "Edit shift record" : "New shift record")} onSubmit={(event) => { event.preventDefault(); void onSave(content, note); }}>
    <fieldset className="handover-fields" disabled={busy}>
      <Field>{t("Planned Workforce shift")}<Select aria-label={t("Planned Workforce shift")} required disabled={!!record} value={content.shiftId} onChange={(e) => {
        const shift = shifts.find((s) => s.id === e.target.value);
        setContent((value) => ({ ...value, shiftId: shift?.id ?? "", shiftDate: shift?.date ?? "", entryIds: [] }));
      }}><option value="">{t("Choose a planned shift")}</option>{shifts.map((shift) => <option key={shift.id} value={shift.id}>
        {shift.date} · {shift.label} · {shift.targetLabel} · {formalInstant(shift.startsAt, timeZone)} – {formalInstant(shift.endsAt, timeZone)}
      </option>)}</Select></Field>
      <Field>{t("Title")}<Input autoFocus required maxLength={240} value={content.title} onChange={(e) => setContent((v) => ({ ...v, title: e.target.value }))} /></Field>
      <Field>{t("Transfer summary")}<Textarea rows={4} maxLength={4000} value={content.summary} onChange={(e) => setContent((v) => ({ ...v, summary: e.target.value }))} /></Field>
      <p>{t("Select the reports to transfer. Closing retains their recorded revisions and keeps pending issues open.")}</p>
      {error && <Alert>{error}</Alert>}
      <p>{t("{0} of {1} relevant reports shown · {2} selected.", [candidates.entries.length, candidates.total, content.entryIds.length])}</p>
      {candidates.total > candidates.entries.length && <p>{t("Narrow the area to inspect more reports before creating the transfer.")}</p>}
      {candidates.entries.map((entry) => <Field layout="inline" key={entry.id}><Input type="checkbox" checked={content.entryIds.includes(entry.id)} onChange={() => toggle(entry.id)} />
        <span>{entry.content.summary} · {entry.content.date} · {issueLabel(entry.issueState)}</span></Field>)}
      {content.entryIds.filter((id) => !candidates.entries.some((entry) => entry.id === id)).map((id) => <Field layout="inline" key={id}>
        <Input type="checkbox" checked onChange={() => toggle(id)} /><span>{t("Retained selection: {0}", [id])}</span></Field>)}
      {record && <Field>{t("Reason for correction")}<Textarea required rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>}
    </fieldset>
    <Actions><Button type="submit" disabled={busy || !content.shiftId || !content.departmentId || content.entryIds.length > 100}>{t(record ? "Save changes" : "Save draft")}</Button>
      <Button variant="secondary" disabled={busy} onClick={onCancel}>{t("Cancel")}</Button></Actions>
  </form>;
}
