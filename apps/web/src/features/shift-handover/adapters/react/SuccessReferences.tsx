import { useEffect, useRef, useState } from "react";
import { Alert, Button, Field, Input, Select } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { HandoverApplication } from "../../application/handover";
import type { CompletionPage, ResolutionReference } from "../../domain/models";

export function SuccessReferences({ application, value, onChange }: {
  application: HandoverApplication;
  value: ResolutionReference[];
  onChange: (references: ResolutionReference[]) => void;
}) {
  const currentQuery = useRef("");
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [source, setSource] = useState<"handover" | "maintenance">("handover");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState<CompletionPage>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const queryKey = JSON.stringify([source, search]);
  currentQuery.current = queryKey;
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    setPage(undefined);
    void application.targets(source, search).then((result) => { if (active) setPage(result); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [application, source, search]);
  return <div>
    <h3>{t("Records completed by this Success")}</h3>
    <p>{t("Publishing closes the selected records with your summary or details as the outcome. Maintenance must already have a complete, current repair review.")}</p>
    <Field>{t("Reference type")}<Select aria-label={t("Reference type")} value={source} onChange={(event) => {
      setSource(event.target.value as typeof source); onChange([]); setTitles({}); setConfirmed(false);
    }}><option value="handover">{t("Performance / Problems")}</option><option value="maintenance">{t("Maintenance")}</option></Select></Field>
    <Field>{t("Find a record")}<Input value={search} maxLength={200} onChange={(event) => { setSearch(event.target.value); setConfirmed(false); }} /></Field>
    {error && <Alert>{error}</Alert>}
    {busy && <p role="status">{t("Loading references…")}</p>}
    {page?.targets.map((target) => <Field key={target.id} layout="inline">
      <Input type="checkbox" disabled={!target.canComplete || (!value.some((reference) => reference.id === target.id) && value.length >= 20)}
        checked={value.some((reference) => reference.id === target.id)} onChange={(event) => {
          setTitles((current) => ({ ...current, [target.id]: target.title }));
          onChange(event.target.checked ? [...value, { source: target.source, id: target.id, expectedRevision: target.expectedRevision }]
            : value.filter((reference) => reference.id !== target.id)); setConfirmed(false);
        }} />
      {target.title}{target.location ? ` · ${target.location}` : ""}
      {!target.canComplete && ` · ${t("Completion unavailable")}`}
    </Field>)}
    {page && !page.targets.length && <p>{t("No matching records.")}</p>}
    {page?.nextCursor && <Button variant="text" disabled={busy} onClick={() => {
      setBusy(true);
      const requestedQuery = queryKey;
      void application.targets(source, search, page.nextCursor).then((next) => {
        if (currentQuery.current === requestedQuery) setPage({ ...next, targets: [...page.targets, ...next.targets] });
      }).catch((reason) => { if (currentQuery.current === requestedQuery) setError(reason.message); })
        .finally(() => { if (currentQuery.current === requestedQuery) setBusy(false); });
    }}>{t("More references")}</Button>}
    <p>{t("{0} selected records", [value.length])}</p>
    {value.map((reference) => <p key={reference.id}>
      <strong>{titles[reference.id] ?? reference.id}</strong>{" "}
      <Button variant="text" onClick={() => { onChange(value.filter((selected) => selected.id !== reference.id)); setConfirmed(false); }}>
        {t("Remove reference {0}", [titles[reference.id] ?? reference.id])}
      </Button>
    </p>)}
    <Field layout="inline"><Input type="checkbox" required checked={confirmed && value.length > 0} onChange={(event) => setConfirmed(event.target.checked)} />
      {t("I confirm the selected work is complete and the outcome describes what was done.")}</Field>
  </div>;
}
