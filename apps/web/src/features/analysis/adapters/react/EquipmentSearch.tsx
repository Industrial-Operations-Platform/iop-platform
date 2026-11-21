import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button, Dialog, Field, Input, monthSelectionSummary } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AnalysisWorkspace } from "../../application/workspace";
import type { EquipmentChoice, EquipmentSearchResult } from "../../domain/models";

/** Identifier lookup only; the current report changes after explicit selection. */
export function EquipmentSearch({ application, months, onSelect, onClose }: {
  application: AnalysisWorkspace;
  months: string[];
  onSelect: (equipment: EquipmentChoice) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const search = query.trim();
  const [response, setResponse] = useState<{ search: string; result: EquipmentSearchResult }>();
  const [failed, setFailed] = useState<string>();
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const current = response?.search === search ? response.result : undefined;
  const loading = !!search && !current && failed !== search;
  const choices = current?.values ?? [];
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (!search) return;
    let live = true;
    const timer = setTimeout(() => {
      void application.findEquipment(search).then(
        result => { if (live) setResponse({ search, result }); },
        () => { if (live) setFailed(search); },
      );
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [application, search, retry]);
  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, id]);
  return (
    <Dialog title={t("Find equipment")} onClose={onClose}>
      <p>{t("Search imported equipment by code, then open its existing Daily / monthly analysis.")}</p>
      <p className="analysis-footnote" id={`${id}-context`}>
        {t("Months: {0}. Other dimension filters will be replaced by the selected equipment.", [monthSelectionSummary(months)])}
      </p>
      <Field>
        {t("Equipment code")}
        <Input ref={input} type="text" role="combobox" autoComplete="off"
          maxLength={200} placeholder={t("Start typing an equipment code")}
          aria-autocomplete="list" aria-expanded={choices.length > 0}
          aria-controls={`${id}-list`} aria-describedby={`${id}-context`}
          aria-activedescendant={active >= 0 && choices[active] ? `${id}-${active}` : undefined}
          value={query} onChange={event => {
            const next = event.target.value;
            setQuery(next);
            if (next.trim() !== search) {
              setResponse(undefined);
              setFailed(undefined);
              setActive(-1);
            }
          }}
          onKeyDown={event => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setActive(index => {
                if (!choices.length) return -1;
                if (index < 0) return event.key === "ArrowDown" ? 0 : choices.length - 1;
                return (index + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length;
              });
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (active >= 0 && choices[active]) onSelect(choices[active]);
            }
          }} />
      </Field>
      <div role="status" aria-live="polite">
        {!search ? <p>{t("Search covers all imported months. Analysis uses the months selected above.")}</p> :
          loading ? <p>{t("Searching equipment…")}</p> :
          current && <p>{choices.length ? t("{0} matches. Select equipment to open its analysis.", [choices.length]) : t("No equipment matches this code.")}</p>}
      </div>
      {failed === search && !current && <Alert>
        {t("Equipment search could not be loaded. Try again.")}{" "}
        <Button variant="secondary" onClick={() => { setFailed(undefined); setRetry(value => value + 1); }}>{t("Retry")}</Button>
      </Alert>}
      <ul className="analysis-equipment-results" id={`${id}-list`} role="listbox" aria-label={t("Matching equipment")}>
        {choices.map((equipment, index) => <li key={JSON.stringify(equipment)}
          id={`${id}-${index}`} role="option" aria-selected={active === index}
          onMouseDown={event => event.preventDefault()}
          onMouseMove={() => setActive(index)} onClick={() => onSelect(equipment)}>
          <strong>{equipment.code}</strong>
          <span>{equipment.sector || t("Unclassified")} · {equipment.area || t("Unclassified")}</span>
        </li>)}
      </ul>
      {current?.more && <p>{t("Showing the first 20 matches. Type more of the code to narrow the search.")}</p>}
      <p className="analysis-footnote">{t("Use arrow keys to choose a match and Enter to open it. You can adjust the report filters afterwards.")}</p>
    </Dialog>
  );
}
