import { useState } from "react";
import { Actions, Button, Disclosure, Field, Panel, Select, Textarea, Input } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { ImprovementApplication } from "../../application/improvement";
import type { ActionView, Evidence } from "../../domain/models";
export function ImprovementEvidence({
  application,
  action,
  evidence,
  pending,
  onAdd
}: {
  application: ImprovementApplication;
  action: ActionView;
  evidence: Evidence[];
  pending: boolean;
  onAdd: (input: {
    id: string;
    actionId: string;
    expectedRevision: number;
    kind: "note" | "result";
    note: string;
    externalReference: string;
    supersedesId: string;
  }) => void;
}) {
  const [id] = useState(() => application.newId());
  const [kind, setKind] = useState<"note" | "result">("note");
  const [note, setNote] = useState("");
  const [externalReference, setReference] = useState("");
  const [supersedesId, setSupersedes] = useState("");
  return <Disclosure summary={t("Add note or observed result")} variant="panel"><Panel><form onSubmit={e => {
        e.preventDefault();
        onAdd({
          id,
          actionId: action.id,
          expectedRevision: action.revision,
          kind,
          note,
          externalReference,
          supersedesId
        });
      }}>
    <Field>{t("Evidence kind")}<Select value={kind} onChange={e => setKind(e.target.value as "note" | "result")}><option value="note">{t("Note")}</option><option value="result">{t("Observed result")}</option></Select></Field>
    <Field>{t("Evidence note")}<Textarea required maxLength={8000} value={note} onChange={e => setNote(e.target.value)} /></Field>
    <Field>{t("External evidence reference")}<Input maxLength={400} value={externalReference} onChange={e => setReference(e.target.value)} /></Field>
    <Field>{t("Correct earlier evidence")}<Select value={supersedesId} onChange={e => setSupersedes(e.target.value)}><option value="">{t("New evidence")}</option>{evidence.filter(item => !evidence.some(other => other.supersedesId === item.id)).map(item => <option key={item.id} value={item.id}>{item.at.slice(0, 10)} · {item.note.slice(0, 100)}</option>)}</Select></Field>
    <p>{t("Corrections append a new entry. Original evidence and authorship remain in history.")}</p><Actions className="iop-form-actions"><Button type="submit" variant="primary" disabled={pending}>{t("Add evidence")}</Button></Actions>
  </form></Panel></Disclosure>;
}
