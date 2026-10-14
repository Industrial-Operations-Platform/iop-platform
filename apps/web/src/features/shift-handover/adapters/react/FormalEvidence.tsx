import { t } from "../../../../localization/i18n";
import { issueLabel } from "./entry-labels";
import { useState } from "react";
import { Actions, Badge, Button, Panel } from "../../../../design/components";
import type { EntryEvidence } from "../../domain/formal-models";
import { EntrySummaryCards } from "./EntrySummaryCards";
/** A frozen transfer snapshot opens its retained content, independently of the live journal. */
export function FormalEvidence({ entries, onEntry }: { entries: EntryEvidence[]; onEntry?: (id: string) => void }) {
  const [selected, setSelected] = useState("");
  const entry = entries.find((value) => value.id === selected);
  return <>
    <EntrySummaryCards entries={entries} open={setSelected} expanded preview="original" />
    {entry && <Panel aria-label={t("Retained report evidence")}><h3>{entry.content.summary}</h3>
      <p>{t("Recorded revision {0} · {1} · {2}", [entry.revision, entry.authorName, entry.content.date])}</p>
      <Badge>{issueLabel(entry.issueState)}</Badge><p className="handover-prose">{entry.content.details || t("No additional details.")}</p>
      {entry.content.equipmentCode && <p>{t("Original unverified equipment reference: {0}", [entry.content.equipmentCode])}</p>}
      {entry.assetReference && <p>{t("Registered asset: {0} · {1} ({2})", [entry.assetReference.code, entry.assetReference.name, t(entry.assetReference.status)])}</p>}
      <dl>{Object.entries({ Challenge: entry.content.challenge, Cause: entry.content.cause, Measure: entry.content.measure,
        Responsible: entry.responsibleName || "Unassigned", "Due date": entry.content.dueDate, "Feedback due": entry.content.feedbackDueDate,
        "External work reference": entry.content.externalReference }).filter(([,value]) => value).map(([label,value]) => <div key={label}><dt>{t(label)}</dt><dd className="handover-prose">{(label === "Responsible" && value === "Unassigned" ? t(value) : value)}</dd></div>)}</dl>
      <Actions>{onEntry && <Button variant="secondary" onClick={() => onEntry(entry.id)}>{t("Open current journal report")}</Button>}
        <Button variant="text" onClick={() => setSelected("")}>{t("Close evidence")}</Button></Actions>
    </Panel>}
  </>;
}
